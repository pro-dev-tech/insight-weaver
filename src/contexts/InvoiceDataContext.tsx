import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Invoice, Customer, DashboardStats } from "@/types";
import { mapInvoice, mapCustomer } from "@/types";

interface InvoiceDataContextType {
  invoices: Invoice[];
  customers: Customer[];
  hasData: boolean;
  loading: boolean;
  fileName: string | null;
  datasets: never[];
  activeDatasetId: string | null;
  setInvoicesFromUpload: (rows: any[], fileName: string) => void;
  addManualInvoice: (inv: Partial<Invoice>) => Promise<void>;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteDataset: () => void;
  deleteDatasetById: (id: string) => void;
  switchDataset: (id: string) => void;
  getStats: () => DashboardStats;
  connectGoogleSheet: (sheetId: string, accessToken: string) => void;
  disconnectGoogleSheet: () => void;
  googleSheetConnected: boolean;
  googleSheetId: string | null;
  syncGoogleSheet: () => Promise<void>;
}

const InvoiceDataContext = createContext<InvoiceDataContextType | null>(null);

// ---- helpers ----

function computeCustomerStats(customers: Customer[], invoices: Invoice[]): Customer[] {
  const map = new Map<string, Invoice[]>();
  invoices.forEach((inv) => {
    if (!inv.customerId) return;
    if (!map.has(inv.customerId)) map.set(inv.customerId, []);
    map.get(inv.customerId)!.push(inv);
  });

  return customers.map((c) => {
    const invs = map.get(c.id) || [];
    const totalOutstanding = invs.reduce((s, i) => s + Math.max(0, i.amount - (i.paidAmount || 0)), 0);
    const totalPaid = invs.reduce((s, i) => s + (i.paidAmount || 0), 0);
    const overdueInvs = invs.filter((i) => i.status === "overdue" || i.status === "partial");
    const avgDelay = overdueInvs.length > 0
      ? Math.round(overdueInvs.reduce((s, i) => {
          const due = new Date(i.dueDate).getTime();
          return s + Math.max(0, (Date.now() - due) / 86400000);
        }, 0) / overdueInvs.length)
      : 0;

    const outstandingRatio = totalOutstanding / Math.max(1, totalOutstanding + totalPaid);
    const delayFactor = Math.min(avgDelay / 90, 1);
    const overdueRatio = overdueInvs.length / Math.max(1, invs.length);
    const riskScore = Math.min(1, outstandingRatio * 0.4 + delayFactor * 0.35 + overdueRatio * 0.25);
    const riskLevel: "low" | "medium" | "high" = riskScore < 0.3 ? "low" : riskScore < 0.6 ? "medium" : "high";

    return {
      ...c,
      totalInvoices: invs.length,
      totalOutstanding,
      totalPaid,
      avgPaymentDelay: avgDelay,
      riskScore: parseFloat(riskScore.toFixed(2)),
      riskLevel,
    };
  });
}

function getDashboardStats(invoices: Invoice[]): DashboardStats {
  const totalReceivables = invoices.reduce((s, i) => s + (i.amount - (i.paidAmount || 0)), 0);
  const overdueInvoices = invoices.filter((i) => i.status === "overdue").length;
  const paidInvoices = invoices.filter((i) => i.status === "paid").length;
  const totalInvoices = invoices.length;
  const recoveryRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;

  const aging: Record<string, number> = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  const now = Date.now();
  invoices.forEach((inv) => {
    if (inv.status === "paid") return;
    const due = new Date(inv.dueDate).getTime();
    const daysOverdue = Math.max(0, Math.floor((now - due) / 86400000));
    const outstanding = inv.amount - (inv.paidAmount || 0);
    if (daysOverdue <= 30) aging["0-30"] += outstanding;
    else if (daysOverdue <= 60) aging["31-60"] += outstanding;
    else if (daysOverdue <= 90) aging["61-90"] += outstanding;
    else aging["90+"] += outstanding;
  });

  return { totalReceivables, overdueInvoices, paidInvoices, totalInvoices, recoveryRate, aging: aging as DashboardStats["aging"] };
}

// ---- parse upload rows to insert into supabase ----

function parseUploadRow(row: any, index: number) {
  const get = (keys: string[]): string => {
    for (const k of keys) {
      const found = Object.keys(row).find(
        (rk) => rk.toLowerCase().replace(/[^a-z0-9]/g, "") === k.toLowerCase().replace(/[^a-z0-9]/g, "")
      );
      if (found && row[found] != null && row[found] !== "") return String(row[found]).trim();
    }
    return "";
  };

  const customerName = get(["name", "customername", "customer_name", "customer", "clientname", "client_name", "client", "partyname", "party_name", "party"]);
  const amount = parseFloat(get(["amount", "total", "invoiceamount", "invoice_amount", "totalamount", "total_amount", "amt", "value", "grandtotal"])) || 0;
  const invoiceNumber = get(["invoicenumber", "invoice_number", "invoiceno", "invoice_no", "invoice", "invno", "billno", "bill_no"]) || `INV-AUTO-${index + 1}`;
  const dueDate = get(["duedate", "due_date", "paymentdue", "payment_due"]) || "";
  const phone = get(["phone", "mobile", "mobilenumber", "mobile_number", "phonenumber", "contact", "tel"]);
  const email = get(["email", "emailid", "email_id", "emailaddress", "mail"]);
  const status = get(["status", "paymentstatus", "payment_status"]).toLowerCase();

  if (!customerName && !amount) return null;

  let resolvedStatus: Invoice["status"] = "pending";
  if (status === "paid" || status === "completed") resolvedStatus = "paid";
  else if (status === "overdue" || status === "due" || status === "late") resolvedStatus = "overdue";
  else if (status === "cancelled" || status === "canceled") resolvedStatus = "cancelled";
  else if (dueDate && new Date(dueDate) < new Date()) resolvedStatus = "overdue";

  return { customerName, amount, invoiceNumber, dueDate, phone, email, status: resolvedStatus };
}

export function InvoiceDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  // Google Sheets (kept as-is for compat)
  const [googleSheetId, setGoogleSheetId] = useState<string | null>(null);
  const [googleSheetConnected, setGoogleSheetConnected] = useState(false);

  const userId = user?.id;

  // ---- Fetch invoices and customers from Supabase ----
  const fetchData = useCallback(async () => {
    if (!userId) { setInvoices([]); setCustomers([]); return; }
    setLoading(true);
    try {
      const [invRes, custRes] = await Promise.all([
        supabase.from("invoices").select("*, customers(name, phone, email)").eq("user_id", userId),
        supabase.from("customers").select("*").eq("user_id", userId),
      ]);

      const mappedInvoices = (invRes.data || []).map((row: any) => {
        const inv = mapInvoice(row);
        if (row.customers) {
          inv.customerName = row.customers.name;
          inv.customerPhone = row.customers.phone;
          inv.customerEmail = row.customers.email;
        }
        return inv;
      });

      const mappedCustomers = (custRes.data || []).map(mapCustomer);
      const enrichedCustomers = computeCustomerStats(mappedCustomers, mappedInvoices);

      setInvoices(mappedInvoices);
      setCustomers(enrichedCustomers);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ---- Upload: parse rows, upsert customers, insert invoices ----
  const setInvoicesFromUpload = useCallback(async (rows: any[], _fileName: string) => {
    if (!userId) return;
    const parsed = rows.map((r, i) => parseUploadRow(r, i)).filter(Boolean) as NonNullable<ReturnType<typeof parseUploadRow>>[];
    if (parsed.length === 0) return;

    // Collect unique customers
    const custMap = new Map<string, { name: string; phone: string; email: string }>();
    parsed.forEach((p) => {
      const key = p.customerName.toLowerCase();
      if (!custMap.has(key)) custMap.set(key, { name: p.customerName, phone: p.phone, email: p.email });
    });

    // Upsert customers
    for (const cust of custMap.values()) {
      // Check if customer exists
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", cust.name)
        .maybeSingle();

      if (!existing) {
        await supabase.from("customers").insert({
          user_id: userId,
          name: cust.name,
          phone: cust.phone || null,
          email: cust.email || null,
        });
      }
    }

    // Re-fetch customers to get IDs
    const { data: allCustomers } = await supabase.from("customers").select("id, name").eq("user_id", userId);
    const custIdMap = new Map<string, string>();
    (allCustomers || []).forEach((c: any) => custIdMap.set(c.name.toLowerCase(), c.id));

    // Insert invoices
    const invoiceRows = parsed.map((p) => ({
      user_id: userId,
      customer_id: custIdMap.get(p.customerName.toLowerCase()) || null,
      invoice_number: p.invoiceNumber,
      amount: p.amount,
      due_date: p.dueDate || null,
      status: p.status,
    }));

    await supabase.from("invoices").insert(invoiceRows);
    await fetchData();
  }, [userId, fetchData]);

  const addManualInvoice = useCallback(async (inv: Partial<Invoice>) => {
    if (!userId) return;

    // Ensure customer exists
    let customerId = inv.customerId;
    if (!customerId && inv.customerName) {
      const { data: existing } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", userId)
        .ilike("name", inv.customerName)
        .maybeSingle();

      if (existing) {
        customerId = existing.id;
      } else {
        const { data: newCust } = await supabase
          .from("customers")
          .insert({ user_id: userId, name: inv.customerName, phone: inv.customerPhone || null, email: inv.customerEmail || null })
          .select("id")
          .single();
        customerId = newCust?.id;
      }
    }

    await supabase.from("invoices").insert({
      user_id: userId,
      customer_id: customerId || null,
      invoice_number: inv.invoiceNumber || `INV-${Date.now()}`,
      amount: inv.amount || 0,
      due_date: inv.dueDate || null,
      status: inv.status || "pending",
      payment_link: inv.paymentLink || null,
      upi_id: inv.upiId || null,
    });

    await fetchData();
  }, [userId, fetchData]);

  const updateInvoice = useCallback(async (id: string, updates: Partial<Invoice>) => {
    const dbUpdates: any = {};
    if (updates.invoiceNumber !== undefined) dbUpdates.invoice_number = updates.invoiceNumber;
    if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
    if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.paymentLink !== undefined) dbUpdates.payment_link = updates.paymentLink;
    if (updates.upiId !== undefined) dbUpdates.upi_id = updates.upiId;
    if (updates.paidAmount !== undefined) dbUpdates.paid_amount = updates.paidAmount;
    if (updates.remindersSent !== undefined) dbUpdates.reminders_sent = updates.remindersSent;
    if (updates.lastReminderDate !== undefined) dbUpdates.last_reminder_date = updates.lastReminderDate;
    dbUpdates.updated_at = new Date().toISOString();

    await supabase.from("invoices").update(dbUpdates).eq("id", id);

    // If customer details changed, update the customer record too
    if (updates.customerName || updates.customerPhone || updates.customerEmail) {
      const invoice = invoices.find(i => i.id === id);
      if (invoice?.customerId) {
        const custUpdates: any = {};
        if (updates.customerName) custUpdates.name = updates.customerName;
        if (updates.customerPhone) custUpdates.phone = updates.customerPhone;
        if (updates.customerEmail) custUpdates.email = updates.customerEmail;
        custUpdates.updated_at = new Date().toISOString();
        await supabase.from("customers").update(custUpdates).eq("id", invoice.customerId);
      }
    }

    await fetchData();
  }, [fetchData, invoices]);

  const deleteDataset = useCallback(async () => {
    if (!userId) return;
    await supabase.from("invoices").delete().eq("user_id", userId);
    await fetchData();
  }, [userId, fetchData]);

  const deleteDatasetById = useCallback(async (id: string) => {
    await supabase.from("invoices").delete().eq("id", id);
    await fetchData();
  }, [fetchData]);

  const switchDataset = useCallback((_id: string) => { /* no-op with Supabase */ }, []);

  const getStats = useCallback(() => getDashboardStats(invoices), [invoices]);

  // Google Sheets compat
  const connectGoogleSheet = useCallback((sheetId: string, _accessToken: string) => {
    setGoogleSheetId(sheetId);
    setGoogleSheetConnected(true);
  }, []);
  const disconnectGoogleSheet = useCallback(() => {
    setGoogleSheetId(null);
    setGoogleSheetConnected(false);
  }, []);
  const syncGoogleSheet = useCallback(async () => {
    if (!googleSheetId || !userId) throw new Error("No Google Sheet connected");
    const accessToken = localStorage.getItem("payrecovery_gsheet_token") || "";
    const existingHashes: string[] = JSON.parse(localStorage.getItem("payrecovery_gsheet_hashes") || "[]");

    const res = await fetch("http://localhost:3001/api/gsheet/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sheetId: googleSheetId, accessToken, existingHashes }),
    });

    if (!res.ok) throw new Error("Sync failed");
    const data = await res.json();

    // Store hashes for next diff
    localStorage.setItem("payrecovery_gsheet_hashes", JSON.stringify(data.allHashes || []));

    if (data.newRows && data.newRows.length > 0) {
      await setInvoicesFromUpload(data.newRows, `GSheet-${googleSheetId}`);
    }

    return { newCount: data.newCount, removedCount: data.removedCount };
  }, [googleSheetId, userId, setInvoicesFromUpload]);

  return (
    <InvoiceDataContext.Provider
      value={{
        invoices, customers, hasData: invoices.length > 0, loading,
        fileName: null, datasets: [] as never[], activeDatasetId: null,
        setInvoicesFromUpload, addManualInvoice, updateInvoice,
        deleteDataset, deleteDatasetById, switchDataset, getStats,
        connectGoogleSheet, disconnectGoogleSheet, googleSheetConnected, googleSheetId, syncGoogleSheet,
      }}
    >
      {children}
    </InvoiceDataContext.Provider>
  );
}

export function useInvoiceData() {
  const ctx = useContext(InvoiceDataContext);
  if (!ctx) throw new Error("useInvoiceData must be used within InvoiceDataProvider");
  return ctx;
}
