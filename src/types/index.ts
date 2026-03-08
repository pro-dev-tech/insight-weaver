// ===== Core Types aligned with Supabase schema =====

export interface User {
  id: string;              // auth.users.id (uuid) — used as user_id FK everywhere
  email: string;
  name: string;
  phone: string;
  companyName: string;
  companyLocation?: string;
  cinNumber?: string;
  role?: "admin" | "staff";
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  companyName: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  // Computed (client-side)
  totalInvoices?: number;
  totalOutstanding?: number;
  totalPaid?: number;
  avgPaymentDelay?: number;
  riskScore?: number;
  riskLevel?: "low" | "medium" | "high";
  notificationPreference?: "whatsapp" | "sms" | "email" | "multi" | null;
  lastPaymentDate?: string;
}

export type InvoiceStatus = "pending" | "paid" | "overdue" | "cancelled" | "unpaid" | "partial";

export interface Invoice {
  id: string;
  userId?: string;
  customerId?: string;
  invoiceNumber: string;
  amount: number;
  currency?: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentLink?: string;
  upiId?: string;
  createdAt: string;
  updatedAt?: string;
  // Joined / legacy fields
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  invoiceDate?: string;
  paidAmount?: number;
  source?: string;
  remindersSent?: number;
  lastReminderDate?: string;
}

export interface ReminderLog {
  id: string;
  userId: string;
  invoiceId: string;
  customerId: string;
  channel: "whatsapp" | "sms" | "email";
  recipient: string;
  message: string;
  status: "sent" | "failed" | "pending";
  providerResponse?: string;
  sentAt: string;
}

export interface NotificationPreference {
  id: string;
  userId: string;
  sendEmail: boolean;
  sendSms: boolean;
  sendWhatsapp: boolean;
  reminderDaysBefore: number;
  reminderDaysAfter: number;
  createdAt: string;
  updatedAt: string;
}

export interface SmtpSettings {
  id: string;
  userId: string;
  smtpHost: string;
  smtpPort: number;
  smtpEmail: string;
  smtpPasswordEncrypted: string;
  securityPasswordHash: string;
  vaultUnlockedUntil?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyVault {
  id: string;
  userId: string;
  provider: string;
  keyName: string;
  keyValueEncrypted: string;
  createdAt: string;
}

export interface NotificationTemplate {
  id: string;
  userId: string;
  channel: string;
  templateName: string;
  templateBody: string;
  createdAt: string;
}

export interface PaymentQrCode {
  id: string;
  userId: string;
  invoiceId: string;
  upiId: string;
  qrImageUrl: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  description: string;
  ipAddress?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalReceivables: number;
  overdueInvoices: number;
  paidInvoices: number;
  totalInvoices: number;
  recoveryRate: number;
  aging: {
    "0-30": number;
    "31-60": number;
    "61-90": number;
    "90+": number;
  };
}

export interface MSMESettings {
  defaultNotificationMode: "whatsapp" | "sms" | "email" | "multi";
  fallbackEnabled: boolean;
  hasWhatsappAPI: boolean;
  whatsappProvider: "twilio" | "gupshup" | "interakt" | null;
  smsEnabled: boolean;
  emailEnabled: boolean;
  razorpayEnabled: boolean;
  autoReminders: boolean;
  reminderSchedule: {
    firstReminder: number;
    secondReminder: number;
    thirdReminder: number;
    escalation: number;
  };
  aiProvider: "gemini" | "openrouter" | "groq";
}

export interface NotificationResult {
  resolvedMode: "whatsapp" | "sms" | "email" | "multi";
  whatsapp: "sent" | "skipped" | "failed";
  sms: "sent" | "skipped" | "failed";
  email: "sent" | "skipped" | "failed";
  clickToChatLink?: string;
}

// mapUser removed — User is now built directly from auth.users session

export function mapCustomer(row: any): Customer {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    phone: row.phone || "",
    email: row.email || "",
    companyName: row.company_name || "",
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapInvoice(row: any): Invoice {
  return {
    id: row.id,
    userId: row.user_id,
    customerId: row.customer_id,
    invoiceNumber: row.invoice_number,
    amount: parseFloat(row.amount) || 0,
    currency: row.currency || "INR",
    dueDate: row.due_date || "",
    status: row.status || "pending",
    paymentLink: row.payment_link,
    upiId: row.upi_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    invoiceDate: row.created_at,
    paidAmount: row.status === "paid" ? (parseFloat(row.amount) || 0) : (parseFloat(row.paid_amount) || 0),
    source: "upload",
    remindersSent: row.reminders_sent || 0,
    customerName: "",
    customerPhone: "",
    customerEmail: "",
  };
}

export function mapReminderLog(row: any): ReminderLog {
  return {
    id: row.id,
    userId: row.user_id,
    invoiceId: row.invoice_id,
    customerId: row.customer_id,
    channel: row.channel,
    recipient: row.recipient || "",
    message: row.message || "",
    status: row.status || "pending",
    providerResponse: row.provider_response,
    sentAt: row.sent_at,
  };
}
