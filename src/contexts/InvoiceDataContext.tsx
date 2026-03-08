import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Invoice, Customer, DashboardStats } from "@/types";

interface Dataset {
  id: string;
  name: string;
  invoices: Invoice[];
  customers: Customer[];
  createdAt: string;
}

interface InvoiceDataContextType {
  invoices: Invoice[];
  customers: Customer[];
  fileName: string | null;
  hasData: boolean;
  datasets: Dataset[];
  activeDatasetId: string | null;
  setInvoicesFromUpload: (rows: any[], fileName: string) => void;
  addManualInvoice: (inv: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteDataset: () => void;
  deleteDatasetById: (id: string) => void;
  switchDataset: (id: string) => void;
  getStats: () => DashboardStats;
  // Google Sheets sync
  connectGoogleSheet: (sheetId: string, accessToken: string) => void;
  disconnectGoogleSheet: () => void;
  googleSheetConnected: boolean;
  googleSheetId: string | null;
  syncGoogleSheet: () => Promise<void>;
}

const InvoiceDataContext = createContext<InvoiceDataContextType | null>(null);

const STORAGE_DATASETS_KEY = "payrecovery_datasets";
const STORAGE_ACTIVE_KEY = "payrecovery_active_dataset";
const STORAGE_GSHEET_KEY = "payrecovery_gsheet";

// ---- Parsing helpers ----

function parseInvoiceRow(row: any, index: number): Invoice | null {
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
      name, email, phone,
      totalInvoices: invs.length,
      totalOutstanding, totalPaid,
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

// ---- Load datasets from localStorage ----
function loadDatasets(): Dataset[] {
  try {
    const saved = localStorage.getItem(STORAGE_DATASETS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveDatasets(datasets: Dataset[]) {
  localStorage.setItem(STORAGE_DATASETS_KEY, JSON.stringify(datasets));
}

// ---- Migrate legacy data ----
function migrateLegacyData(): Dataset[] {
  const legacyInvoices = localStorage.getItem("payrecovery_invoices");
  const legacyFilename = localStorage.getItem("payrecovery_filename");
  if (legacyInvoices) {
    try {
      const invs: Invoice[] = JSON.parse(legacyInvoices);
      if (invs.length > 0) {
        const ds: Dataset = {
          id: `ds-legacy-${Date.now()}`,
          name: legacyFilename || "Legacy Dataset",
          invoices: invs,
          customers: buildCustomersFromInvoices(invs),
          createdAt: new Date().toISOString(),
        };
        localStorage.removeItem("payrecovery_invoices");
        localStorage.removeItem("payrecovery_customers");
        localStorage.removeItem("payrecovery_filename");
        return [ds];
      }
    } catch {}
  }
  return [];
}

export function InvoiceDataProvider({ children }: { children: ReactNode }) {
  const [datasets, setDatasets] = useState<Dataset[]>(() => {
    const existing = loadDatasets();
    if (existing.length > 0) return existing;
    return migrateLegacyData();
  });

  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_ACTIVE_KEY);
    if (saved) return saved;
    const ds = loadDatasets();
    return ds.length > 0 ? ds[0].id : null;
  });

  // Google Sheets
  const [googleSheetId, setGoogleSheetId] = useState<string | null>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_GSHEET_KEY) || "null")?.sheetId || null; } catch { return null; }
  });
  const [googleSheetConnected, setGoogleSheetConnected] = useState(() => !!googleSheetId);

  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || null;
  const invoices = activeDataset?.invoices || [];
  const customers = activeDataset?.customers || [];
  const fileName = activeDataset?.name || null;

  const persistAll = useCallback((newDatasets: Dataset[], activeId: string | null) => {
    saveDatasets(newDatasets);
    if (activeId) localStorage.setItem(STORAGE_ACTIVE_KEY, activeId);
    else localStorage.removeItem(STORAGE_ACTIVE_KEY);
  }, []);

  const setInvoicesFromUpload = useCallback((rows: any[], fname: string) => {
    const parsed = rows.map((r, i) => parseInvoiceRow(r, i)).filter(Boolean) as Invoice[];
    const custs = buildCustomersFromInvoices(parsed);
    const newDs: Dataset = {
      id: `ds-${Date.now()}`,
      name: fname,
      invoices: parsed,
      customers: custs,
      createdAt: new Date().toISOString(),
    };
    setDatasets((prev) => {
      const next = [...prev, newDs];
      persistAll(next, newDs.id);
      return next;
    });
    setActiveDatasetId(newDs.id);
  }, [persistAll]);

  const addManualInvoice = useCallback((inv: Invoice) => {
    setDatasets((prev) => {
      if (!activeDatasetId) {
        // Create a new "Manual" dataset
        const newDs: Dataset = {
          id: `ds-manual-${Date.now()}`,
          name: "Manual Entries",
          invoices: [inv],
          customers: buildCustomersFromInvoices([inv]),
          createdAt: new Date().toISOString(),
        };
        const next = [...prev, newDs];
        persistAll(next, newDs.id);
        setActiveDatasetId(newDs.id);
        return next;
      }
      const next = prev.map((d) => {
        if (d.id !== activeDatasetId) return d;
        const newInvs = [inv, ...d.invoices];
        return { ...d, invoices: newInvs, customers: buildCustomersFromInvoices(newInvs) };
      });
      persistAll(next, activeDatasetId);
      return next;
    });
  }, [activeDatasetId, persistAll]);

  const updateInvoice = useCallback((id: string, updates: Partial<Invoice>) => {
    setDatasets((prev) => {
      const next = prev.map((d) => {
        if (d.id !== activeDatasetId) return d;
        const newInvs = d.invoices.map((i) => (i.id === id ? { ...i, ...updates } : i));
        return { ...d, invoices: newInvs, customers: buildCustomersFromInvoices(newInvs) };
      });
      persistAll(next, activeDatasetId);
      return next;
    });
  }, [activeDatasetId, persistAll]);

  const deleteDataset = useCallback(() => {
    setDatasets((prev) => {
      const next = prev.filter((d) => d.id !== activeDatasetId);
      const newActive = next.length > 0 ? next[0].id : null;
      setActiveDatasetId(newActive);
      persistAll(next, newActive);
      return next;
    });
  }, [activeDatasetId, persistAll]);

  const deleteDatasetById = useCallback((id: string) => {
    setDatasets((prev) => {
      const next = prev.filter((d) => d.id !== id);
      if (activeDatasetId === id) {
        const newActive = next.length > 0 ? next[0].id : null;
        setActiveDatasetId(newActive);
        persistAll(next, newActive);
      } else {
        persistAll(next, activeDatasetId);
      }
      return next;
    });
  }, [activeDatasetId, persistAll]);

  const switchDataset = useCallback((id: string) => {
    setActiveDatasetId(id);
    localStorage.setItem(STORAGE_ACTIVE_KEY, id);
  }, []);

  const getStats = useCallback(() => getDashboardStats(invoices), [invoices]);

  // Google Sheets
  const connectGoogleSheet = useCallback((sheetId: string, accessToken: string) => {
    localStorage.setItem(STORAGE_GSHEET_KEY, JSON.stringify({ sheetId, accessToken }));
    setGoogleSheetId(sheetId);
    setGoogleSheetConnected(true);
  }, []);

  const disconnectGoogleSheet = useCallback(() => {
    localStorage.removeItem(STORAGE_GSHEET_KEY);
    setGoogleSheetId(null);
    setGoogleSheetConnected(false);
  }, []);

  const syncGoogleSheet = useCallback(async () => {
    try {
      const config = JSON.parse(localStorage.getItem(STORAGE_GSHEET_KEY) || "null");
      if (!config?.sheetId || !config?.accessToken) throw new Error("Not connected");

      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${config.sheetId}/values/Sheet1?key=&access_token=${config.accessToken}`
      );
      if (!res.ok) {
        // Try with API route on backend
        const backendRes = await fetch(`http://localhost:3001/api/gsheet/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId: config.sheetId, accessToken: config.accessToken }),
        });
        if (!backendRes.ok) throw new Error("Sync failed");
        const data = await backendRes.json();
        if (data.rows) {
          const parsed = data.rows.map((r: any, i: number) => parseInvoiceRow(r, i)).filter(Boolean) as Invoice[];
          const custs = buildCustomersFromInvoices(parsed);
          setDatasets((prev) => {
            const existingIdx = prev.findIndex((d) => d.name === `GSheet: ${config.sheetId}`);
            const ds: Dataset = {
              id: existingIdx >= 0 ? prev[existingIdx].id : `ds-gsheet-${Date.now()}`,
              name: `GSheet: ${config.sheetId}`,
              invoices: parsed,
              customers: custs,
              createdAt: new Date().toISOString(),
            };
            const next = existingIdx >= 0 ? prev.map((d, i) => i === existingIdx ? ds : d) : [...prev, ds];
            persistAll(next, ds.id);
            setActiveDatasetId(ds.id);
            return next;
          });
        }
        return;
      }

      const data = await res.json();
      if (data.values && data.values.length > 1) {
        const headers = data.values[0] as string[];
        const rows = data.values.slice(1).map((row: string[]) => {
          const obj: any = {};
          headers.forEach((h, i) => { obj[h] = row[i] || ""; });
          return obj;
        });
        const parsed = rows.map((r: any, i: number) => parseInvoiceRow(r, i)).filter(Boolean) as Invoice[];
        const custs = buildCustomersFromInvoices(parsed);
        setDatasets((prev) => {
          const existingIdx = prev.findIndex((d) => d.name === `GSheet: ${config.sheetId}`);
          const ds: Dataset = {
            id: existingIdx >= 0 ? prev[existingIdx].id : `ds-gsheet-${Date.now()}`,
            name: `GSheet: ${config.sheetId}`,
            invoices: parsed,
            customers: custs,
            createdAt: new Date().toISOString(),
          };
          const next = existingIdx >= 0 ? prev.map((d, i) => i === existingIdx ? ds : d) : [...prev, ds];
          persistAll(next, ds.id);
          setActiveDatasetId(ds.id);
          return next;
        });
      }
    } catch (err: any) {
      console.error("Google Sheet sync error:", err);
      throw err;
    }
  }, [persistAll]);

  return (
    <InvoiceDataContext.Provider
      value={{
        invoices, customers, fileName, hasData: invoices.length > 0,
        datasets, activeDatasetId,
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
