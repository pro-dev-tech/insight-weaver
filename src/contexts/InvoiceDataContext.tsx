import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Invoice, Customer, DashboardStats } from "@/types";

interface InvoiceDataContextType {
  invoices: Invoice[];
  customers: Customer[];
  fileName: string | null;
  hasData: boolean;
  setInvoicesFromUpload: (rows: any[], fileName: string) => void;
  addManualInvoice: (inv: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteDataset: () => void;
  getStats: () => DashboardStats;
}

const InvoiceDataContext = createContext<InvoiceDataContextType | null>(null);

const STORAGE_KEY = "payrecovery_invoices";
const STORAGE_CUSTOMERS_KEY = "payrecovery_customers";
const STORAGE_FILENAME_KEY = "payrecovery_filename";

function parseInvoiceRow(row: any, index: number): Invoice | null {
  // Flexible field mapping — try common column name variations
  const get = (keys: string[]): string => {
    for (const k of keys) {
      const found = Object.keys(row).find(
        (rk) => rk.toLowerCase().replace(/[^a-z0-9]/g, "") === k.toLowerCase().replace(/[^a-z0-9]/g, "")
      );
      if (found && row[found] !== null && row[found] !== undefined && row[found] !== "") {
        return String(row[found]).trim();
      }
    }
    return "";
  };

  const customerName = get(["name", "customername", "customer_name", "customer", "clientname", "client_name", "client", "partyname", "party_name", "party"]);
  const amount = parseFloat(get(["amount", "total", "invoiceamount", "invoice_amount", "totalamount", "total_amount", "amt", "value", "grandtotal", "grand_total"])) || 0;
  const invoiceNumber = get(["invoicenumber", "invoice_number", "invoiceno", "invoice_no", "invoice", "invno", "inv_no", "billno", "bill_no", "billnumber", "bill_number"]) || `INV-AUTO-${index + 1}`;
  const invoiceDate = get(["invoicedate", "invoice_date", "date", "billdate", "bill_date", "invdate", "inv_date"]) || new Date().toISOString().split("T")[0];
  const dueDate = get(["duedate", "due_date", "paymentdue", "payment_due", "duedt"]) || "";
  const phone = get(["phone", "mobile", "mobilenumber", "mobile_number", "phonenumber", "phone_number", "contact", "contactnumber", "contact_number", "mob", "tel"]);
  const email = get(["email", "emailid", "email_id", "emailaddress", "email_address", "mail"]);
  const status = get(["status", "paymentstatus", "payment_status", "invoicestatus", "invoice_status"]).toLowerCase();
  const paidAmount = parseFloat(get(["paidamount", "paid_amount", "paid", "amountpaid", "amount_paid", "received"])) || 0;

  if (!customerName && !amount) return null;

  let resolvedStatus: Invoice["status"] = "unpaid";
  if (status === "paid" || status === "completed" || status === "received") resolvedStatus = "paid";
  else if (status === "overdue" || status === "due" || status === "late") resolvedStatus = "overdue";
  else if (status === "partial" || status === "partially paid") resolvedStatus = "partial";
  else if (status === "cancelled" || status === "canceled") resolvedStatus = "cancelled";
  else if (paidAmount >= amount && amount > 0) resolvedStatus = "paid";
  else if (paidAmount > 0 && paidAmount < amount) resolvedStatus = "partial";
  else if (dueDate && new Date(dueDate) < new Date()) resolvedStatus = "overdue";

  return {
    id: `INV-${Date.now()}-${index}`,
    invoiceNumber,
    customerName,
    customerPhone: phone,
    customerEmail: email,
    invoiceDate,
    dueDate: dueDate || invoiceDate,
    amount,
    paidAmount,
    status: resolvedStatus,
    source: "upload",
    remindersSent: 0,
    createdAt: new Date().toISOString(),
  };
}

function buildCustomersFromInvoices(invoices: Invoice[]): Customer[] {
  const map = new Map<string, Invoice[]>();
  invoices.forEach((inv) => {
    const key = inv.customerName.toLowerCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(inv);
  });

  return Array.from(map.entries()).map(([, invs], idx) => {
    const name = invs[0].customerName;
    const email = invs.find((i) => i.customerEmail)?.customerEmail || "";
    const phone = invs.find((i) => i.customerPhone)?.customerPhone || "";
    const totalOutstanding = invs.reduce((s, i) => s + Math.max(0, i.amount - i.paidAmount), 0);
    const totalPaid = invs.reduce((s, i) => s + i.paidAmount, 0);
    const overdueInvs = invs.filter((i) => i.status === "overdue" || i.status === "partial");
    const avgDelay = overdueInvs.length > 0
      ? Math.round(overdueInvs.reduce((s, i) => {
          const due = new Date(i.dueDate).getTime();
          const now = Date.now();
          return s + Math.max(0, (now - due) / 86400000);
        }, 0) / overdueInvs.length)
      : 0;

    // Simple risk scoring
    const outstandingRatio = totalOutstanding / Math.max(1, totalOutstanding + totalPaid);
    const delayFactor = Math.min(avgDelay / 90, 1);
    const overdueRatio = overdueInvs.length / Math.max(1, invs.length);
    const riskScore = Math.min(1, (outstandingRatio * 0.4 + delayFactor * 0.35 + overdueRatio * 0.25));
    const riskLevel: Customer["riskLevel"] = riskScore < 0.3 ? "low" : riskScore < 0.6 ? "medium" : "high";

    const paidInvs = invs.filter((i) => i.status === "paid");
    const lastPaymentDate = paidInvs.length > 0
      ? paidInvs.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())[0].invoiceDate
      : undefined;

    return {
      id: `CUST-${idx + 1}`,
      name,
      email,
      phone,
      totalInvoices: invs.length,
      totalOutstanding,
      totalPaid,
      avgPaymentDelay: avgDelay,
      riskScore: parseFloat(riskScore.toFixed(2)),
      riskLevel,
      notificationPreference: null,
      lastPaymentDate,
      createdAt: invs[0].createdAt,
    };
  });
}

function getDashboardStats(invoices: Invoice[]): DashboardStats {
  const totalReceivables = invoices.reduce((s, i) => s + (i.amount - i.paidAmount), 0);
  const overdueInvoices = invoices.filter((i) => i.status === "overdue").length;
  const paidInvoices = invoices.filter((i) => i.status === "paid").length;
  const totalInvoices = invoices.length;
  const recoveryRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;

  const aging = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  const now = Date.now();
  invoices.forEach((inv) => {
    if (inv.status === "paid") return;
    const due = new Date(inv.dueDate).getTime();
    const daysOverdue = Math.max(0, Math.floor((now - due) / 86400000));
    const outstanding = inv.amount - inv.paidAmount;
    if (daysOverdue <= 30) aging["0-30"] += outstanding;
    else if (daysOverdue <= 60) aging["31-60"] += outstanding;
    else if (daysOverdue <= 90) aging["61-90"] += outstanding;
    else aging["90+"] += outstanding;
  });

  return { totalReceivables, overdueInvoices, paidInvoices, totalInvoices, recoveryRate, aging };
}

export function InvoiceDataProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CUSTOMERS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [fileName, setFileName] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_FILENAME_KEY);
  });

  const persist = (invs: Invoice[], custs: Customer[], fname: string | null) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invs));
    localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(custs));
    if (fname) localStorage.setItem(STORAGE_FILENAME_KEY, fname);
    else localStorage.removeItem(STORAGE_FILENAME_KEY);
  };

  const setInvoicesFromUpload = useCallback((rows: any[], fname: string) => {
    const parsed = rows.map((r, i) => parseInvoiceRow(r, i)).filter(Boolean) as Invoice[];
    const custs = buildCustomersFromInvoices(parsed);
    setInvoices(parsed);
    setCustomers(custs);
    setFileName(fname);
    persist(parsed, custs, fname);
  }, []);

  const addManualInvoice = useCallback((inv: Invoice) => {
    setInvoices((prev) => {
      const next = [inv, ...prev];
      const custs = buildCustomersFromInvoices(next);
      setCustomers(custs);
      persist(next, custs, fileName);
      return next;
    });
  }, [fileName]);

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    setInvoices((prev) => {
      const next = prev.map((i) => (i.id === id ? { ...i, ...updates } : i));
      const custs = buildCustomersFromInvoices(next);
      setCustomers(custs);
      persist(next, custs, fileName);
      return next;
    });
  }, [fileName]);

  const deleteDataset = useCallback(() => {
    setInvoices([]);
    setCustomers([]);
    setFileName(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_CUSTOMERS_KEY);
    localStorage.removeItem(STORAGE_FILENAME_KEY);
  }, []);

  const getStats = useCallback(() => getDashboardStats(invoices), [invoices]);

  return (
    <InvoiceDataContext.Provider
      value={{ invoices, customers, fileName, hasData: invoices.length > 0, setInvoicesFromUpload, addManualInvoice, updateInvoice, deleteDataset, getStats }}
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
