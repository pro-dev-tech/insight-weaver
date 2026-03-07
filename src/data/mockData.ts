import type { Invoice, Customer, DashboardStats, MSMESettings } from "@/types";

// ===== DEMO DATA =====
const TODAY = new Date();
const daysAgo = (d: number) => {
  const dt = new Date(TODAY);
  dt.setDate(dt.getDate() - d);
  return dt.toISOString().split("T")[0];
};
const daysFromNow = (d: number) => {
  const dt = new Date(TODAY);
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().split("T")[0];
};

export const DEMO_INVOICES: Invoice[] = [
  { id: "INV-001", invoiceNumber: "INV-2025-001", customerName: "Sharma Textiles", customerPhone: "+919812345001", customerEmail: "sharma@textiles.in", invoiceDate: daysAgo(45), dueDate: daysAgo(15), amount: 125000, paidAmount: 0, status: "overdue", source: "upload", remindersSent: 2, lastReminderDate: daysAgo(3), createdAt: daysAgo(45) },
  { id: "INV-002", invoiceNumber: "INV-2025-002", customerName: "Patel Hardware", customerPhone: "+919812345002", customerEmail: "patel@hardware.in", invoiceDate: daysAgo(30), dueDate: daysAgo(0), amount: 78500, paidAmount: 78500, status: "paid", source: "upload", remindersSent: 1, createdAt: daysAgo(30) },
  { id: "INV-003", invoiceNumber: "INV-2025-003", customerName: "Gupta Electronics", customerPhone: "+919812345003", customerEmail: "gupta@electronics.in", invoiceDate: daysAgo(60), dueDate: daysAgo(30), amount: 245000, paidAmount: 100000, status: "partial", source: "manual", remindersSent: 3, lastReminderDate: daysAgo(1), createdAt: daysAgo(60) },
  { id: "INV-004", invoiceNumber: "INV-2025-004", customerName: "Singh Auto Parts", customerPhone: "+919812345004", customerEmail: "singh@autoparts.in", invoiceDate: daysAgo(10), dueDate: daysFromNow(20), amount: 56000, paidAmount: 0, status: "unpaid", source: "google_sheets", remindersSent: 0, createdAt: daysAgo(10) },
  { id: "INV-005", invoiceNumber: "INV-2025-005", customerName: "Mehta Chemicals", customerPhone: "+919812345005", customerEmail: "mehta@chemicals.in", invoiceDate: daysAgo(90), dueDate: daysAgo(60), amount: 312000, paidAmount: 0, status: "overdue", source: "email", remindersSent: 4, lastReminderDate: daysAgo(2), createdAt: daysAgo(90) },
  { id: "INV-006", invoiceNumber: "INV-2025-006", customerName: "Reddy Pharma", customerPhone: "+919812345006", customerEmail: "reddy@pharma.in", invoiceDate: daysAgo(20), dueDate: daysFromNow(10), amount: 89000, paidAmount: 0, status: "unpaid", source: "upload", remindersSent: 0, createdAt: daysAgo(20) },
  { id: "INV-007", invoiceNumber: "INV-2025-007", customerName: "Sharma Textiles", customerPhone: "+919812345001", customerEmail: "sharma@textiles.in", invoiceDate: daysAgo(120), dueDate: daysAgo(90), amount: 95000, paidAmount: 95000, status: "paid", source: "upload", remindersSent: 2, createdAt: daysAgo(120) },
  { id: "INV-008", invoiceNumber: "INV-2025-008", customerName: "Kumar Steel", customerPhone: "+919812345007", customerEmail: "kumar@steel.in", invoiceDate: daysAgo(15), dueDate: daysAgo(5), amount: 178000, paidAmount: 0, status: "overdue", source: "api", remindersSent: 1, lastReminderDate: daysAgo(2), createdAt: daysAgo(15) },
  { id: "INV-009", invoiceNumber: "INV-2025-009", customerName: "Joshi Fabrics", customerPhone: "+919812345008", customerEmail: "joshi@fabrics.in", invoiceDate: daysAgo(5), dueDate: daysFromNow(25), amount: 42000, paidAmount: 0, status: "unpaid", source: "manual", remindersSent: 0, createdAt: daysAgo(5) },
  { id: "INV-010", invoiceNumber: "INV-2025-010", customerName: "Patel Hardware", customerPhone: "+919812345002", customerEmail: "patel@hardware.in", invoiceDate: daysAgo(50), dueDate: daysAgo(20), amount: 134000, paidAmount: 134000, status: "paid", source: "upload", remindersSent: 1, createdAt: daysAgo(50) },
];

export const DEMO_CUSTOMERS: Customer[] = [
  { id: "CUST-001", name: "Sharma Textiles", email: "sharma@textiles.in", phone: "+919812345001", totalInvoices: 5, totalOutstanding: 125000, totalPaid: 280000, avgPaymentDelay: 18, riskScore: 0.65, riskLevel: "medium", notificationPreference: "whatsapp", lastPaymentDate: daysAgo(30), createdAt: daysAgo(200) },
  { id: "CUST-002", name: "Patel Hardware", email: "patel@hardware.in", phone: "+919812345002", totalInvoices: 8, totalOutstanding: 0, totalPaid: 520000, avgPaymentDelay: 3, riskScore: 0.12, riskLevel: "low", notificationPreference: "email", lastPaymentDate: daysAgo(5), createdAt: daysAgo(300) },
  { id: "CUST-003", name: "Gupta Electronics", email: "gupta@electronics.in", phone: "+919812345003", totalInvoices: 3, totalOutstanding: 145000, totalPaid: 180000, avgPaymentDelay: 25, riskScore: 0.72, riskLevel: "high", notificationPreference: "multi", lastPaymentDate: daysAgo(15), createdAt: daysAgo(150) },
  { id: "CUST-004", name: "Singh Auto Parts", email: "singh@autoparts.in", phone: "+919812345004", totalInvoices: 2, totalOutstanding: 56000, totalPaid: 45000, avgPaymentDelay: 5, riskScore: 0.25, riskLevel: "low", notificationPreference: null, lastPaymentDate: daysAgo(40), createdAt: daysAgo(100) },
  { id: "CUST-005", name: "Mehta Chemicals", email: "mehta@chemicals.in", phone: "+919812345005", totalInvoices: 4, totalOutstanding: 312000, totalPaid: 150000, avgPaymentDelay: 42, riskScore: 0.88, riskLevel: "high", notificationPreference: "sms", lastPaymentDate: daysAgo(90), createdAt: daysAgo(250) },
  { id: "CUST-006", name: "Reddy Pharma", email: "reddy@pharma.in", phone: "+919812345006", totalInvoices: 1, totalOutstanding: 89000, totalPaid: 0, avgPaymentDelay: 0, riskScore: 0.35, riskLevel: "medium", notificationPreference: null, createdAt: daysAgo(20) },
  { id: "CUST-007", name: "Kumar Steel", email: "kumar@steel.in", phone: "+919812345007", totalInvoices: 3, totalOutstanding: 178000, totalPaid: 220000, avgPaymentDelay: 12, riskScore: 0.45, riskLevel: "medium", notificationPreference: "whatsapp", lastPaymentDate: daysAgo(25), createdAt: daysAgo(180) },
  { id: "CUST-008", name: "Joshi Fabrics", email: "joshi@fabrics.in", phone: "+919812345008", totalInvoices: 1, totalOutstanding: 42000, totalPaid: 0, avgPaymentDelay: 0, riskScore: 0.2, riskLevel: "low", notificationPreference: null, createdAt: daysAgo(5) },
];

export function getDashboardStats(invoices: Invoice[]): DashboardStats {
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
    if (daysOverdue <= 30) aging["0-30"] += inv.amount - inv.paidAmount;
    else if (daysOverdue <= 60) aging["31-60"] += inv.amount - inv.paidAmount;
    else if (daysOverdue <= 90) aging["61-90"] += inv.amount - inv.paidAmount;
    else aging["90+"] += inv.amount - inv.paidAmount;
  });

  return { totalReceivables, overdueInvoices, paidInvoices, totalInvoices, recoveryRate, aging };
}

export const DEFAULT_SETTINGS: MSMESettings = {
  defaultNotificationMode: "multi",
  fallbackEnabled: true,
  hasWhatsappAPI: false,
  whatsappProvider: null,
  smsEnabled: true,
  emailEnabled: true,
  razorpayEnabled: false,
  autoReminders: true,
  reminderSchedule: {
    firstReminder: 3,
    secondReminder: 7,
    thirdReminder: 15,
    escalation: 30,
  },
  aiProvider: "gemini",
};
