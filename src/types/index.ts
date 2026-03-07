// ===== Core Types for AI-Powered Payment Recovery System =====

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  companyLocation: string;
  cinNumber?: string;
  role: "admin" | "staff";
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: "paid" | "unpaid" | "overdue" | "partial" | "cancelled";
  source: "upload" | "google_drive" | "google_sheets" | "email" | "api" | "manual";
  remindersSent: number;
  lastReminderDate?: string;
  paymentLink?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalInvoices: number;
  totalOutstanding: number;
  totalPaid: number;
  avgPaymentDelay: number;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  notificationPreference: "whatsapp" | "sms" | "email" | "multi" | null;
  lastPaymentDate?: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  invoiceId: string;
  customerId: string;
  customerName: string;
  type: "friendly" | "professional" | "firm" | "escalation";
  channel: "whatsapp" | "sms" | "email";
  status: "sent" | "failed" | "pending" | "skipped";
  message: string;
  scheduledAt: string;
  sentAt?: string;
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
    firstReminder: number; // days before due
    secondReminder: number; // days after due
    thirdReminder: number;
    escalation: number;
  };
  aiProvider: "gemini" | "openrouter" | "groq";
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

export interface NotificationResult {
  resolvedMode: "whatsapp" | "sms" | "email" | "multi";
  whatsapp: "sent" | "skipped" | "failed";
  sms: "sent" | "skipped" | "failed";
  email: "sent" | "skipped" | "failed";
  clickToChatLink?: string;
}
