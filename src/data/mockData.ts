import type { MSMESettings } from "@/types";

// No more mock invoices/customers — all data comes from uploads via InvoiceDataContext

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
