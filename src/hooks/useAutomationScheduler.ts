import { useEffect, useRef, useCallback } from "react";
import { useInvoiceData } from "@/contexts/InvoiceDataContext";
import { toast } from "sonner";
import type { Invoice } from "@/types";

interface AutomationConfig {
  frequency: string; // daily, weekly, biweekly, monthly
  time: string; // HH:mm
  channel: string; // email, whatsapp, sms, multi
  escalation: boolean;
  enabled: boolean;
}

function getConfig(): AutomationConfig {
  return {
    frequency: localStorage.getItem("payrecovery_auto_freq") || "weekly",
    time: localStorage.getItem("payrecovery_auto_time") || "09:00",
    channel: localStorage.getItem("payrecovery_auto_channel") || "email",
    escalation: localStorage.getItem("payrecovery_auto_escalation") === "true",
    enabled: localStorage.getItem("payrecovery_auto_enabled") === "true",
  };
}

function getLastRunDate(): string | null {
  return localStorage.getItem("payrecovery_auto_last_run");
}

function setLastRunDate(date: string) {
  localStorage.setItem("payrecovery_auto_last_run", date);
}

function shouldRunToday(config: AutomationConfig): boolean {
  const lastRun = getLastRunDate();
  if (!lastRun) return true;

  const last = new Date(lastRun);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - last.getTime()) / 86400000);

  switch (config.frequency) {
    case "daily": return diffDays >= 1;
    case "weekly": return diffDays >= 7;
    case "biweekly": return diffDays >= 14;
    case "monthly": return diffDays >= 30;
    default: return diffDays >= 7;
  }
}

function isTimeToRun(config: AutomationConfig): boolean {
  const now = new Date();
  const [hours, minutes] = config.time.split(":").map(Number);
  return now.getHours() === hours && now.getMinutes() === minutes;
}

function getSmtpConfig() {
  try {
    return JSON.parse(localStorage.getItem("payrecovery_smtp") || "{}");
  } catch {
    return {};
  }
}

function fillTemplate(template: string, inv: Invoice, businessName: string) {
  const upiId = localStorage.getItem("payrecovery_upi_id") || "";
  const upiName = localStorage.getItem("payrecovery_upi_name") || "";
  const amount = inv.amount.toLocaleString("en-IN");
  const upiLink = upiId
    ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName || businessName)}&am=${inv.amount}&cu=INR&tn=Invoice%20${encodeURIComponent(inv.invoiceNumber)}`
    : "";
  const payLink = `${window.location.origin}/pay/${inv.id}`;
  return template
    .replace(/\{\{name\}\}/g, inv.customerName || "")
    .replace(/\{\{invoiceNumber\}\}/g, inv.invoiceNumber)
    .replace(/\{\{amount\}\}/g, amount)
    .replace(/\{\{dueDate\}\}/g, inv.dueDate)
    .replace(/\{\{upiLink\}\}/g, upiLink)
    .replace(/\{\{payLink\}\}/g, payLink)
    .replace(/\{\{businessName\}\}/g, businessName);
}

export function useAutomationScheduler() {
  const { invoices, updateInvoice } = useInvoiceData();
  const runningRef = useRef(false);

  const getBusinessName = useCallback(() => {
    try {
      const upiName = localStorage.getItem("payrecovery_upi_name") || "";
      return JSON.parse(localStorage.getItem("payrecovery_user") || "{}").companyName || upiName || "Our Company";
    } catch {
      return localStorage.getItem("payrecovery_upi_name") || "Our Company";
    }
  }, []);

  const sendEmailSmtp = useCallback(async (inv: Invoice, businessName: string) => {
    const smtpConfig = getSmtpConfig();
    if (!smtpConfig.smtpServer || !smtpConfig.smtpPassword) return false;
    if (!inv.customerEmail) return false;

    const emailTemplate = localStorage.getItem("payrecovery_email_template") ||
      `Dear {{name}},\n\nThis is a reminder from {{businessName}} regarding invoice {{invoiceNumber}}.\n\nAmount: ₹{{amount}}\n\nPlease pay at your earliest.\n\n{{payLink}}\n{{upiLink}}\n\nThank you.\n\n{{businessName}}`;
    const body = fillTemplate(emailTemplate, inv, businessName);

    try {
      const res = await fetch("http://localhost:3001/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp: {
            host: smtpConfig.smtpServer,
            port: parseInt(smtpConfig.smtpPort || "587"),
            email: smtpConfig.senderEmail || smtpConfig.smtpUsername,
            username: smtpConfig.smtpUsername,
            password: smtpConfig.smtpPassword,
            tls: smtpConfig.useTls !== false,
          },
          to: inv.customerEmail,
          subject: `Payment Reminder - Invoice ${inv.invoiceNumber}`,
          message: body,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const sendWhatsApp = useCallback(async (inv: Invoice, businessName: string) => {
    const phone = (inv.customerPhone || "").replace(/[^0-9]/g, "");
    if (!phone) return false;
    const waTemplate = localStorage.getItem("payrecovery_wa_template") ||
      `Dear {{name}},\n\nYour invoice {{invoiceNumber}} of Rs {{amount}} is overdue.\n\nPay instantly here:\n{{upiLink}}\n\nor scan the QR to pay:\n{{payLink}}\n\nThank you.\n{{businessName}}`;
    const msg = fillTemplate(waTemplate, inv, businessName);

    // Try API first if configured
    const waApiKey = localStorage.getItem("payrecovery_wa_api_key");
    const waPhoneId = localStorage.getItem("payrecovery_wa_phone_id");
    if (waApiKey && waPhoneId) {
      try {
        const res = await fetch("http://localhost:3001/api/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: phone, message: msg, apiKey: waApiKey, phoneNumberId: waPhoneId }),
        });
        const data = await res.json();
        if (data.success) return true;
      } catch {
        // Fall through to link method
      }
    }

    // Fallback to wa.me link
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    return true;
  }, []);

  const sendSms = useCallback((inv: Invoice, businessName: string) => {
    const phone = (inv.customerPhone || "").replace(/[^0-9]/g, "");
    if (!phone) return false;
    const smsTemplate = localStorage.getItem("payrecovery_sms_template") ||
      `Dear {{name}}, your invoice {{invoiceNumber}} of Rs {{amount}} is pending. Due: {{dueDate}}. Please pay at your earliest. - {{businessName}}`;
    const msg = fillTemplate(smsTemplate, inv, businessName);
    window.open(`sms:${phone}?body=${encodeURIComponent(msg)}`, "_blank");
    return true;
  }, []);

  const runAutomation = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;

    const config = getConfig();
    const businessName = getBusinessName();
    const unpaid = invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled");

    if (unpaid.length === 0) {
      runningRef.current = false;
      return;
    }

    let emailSent = 0, waSent = 0, smsSent = 0, failed = 0;

    for (const inv of unpaid) {
      const channels = config.channel === "multi"
        ? ["email", "whatsapp", "sms"]
        : [config.channel];

      for (const ch of channels) {
        try {
          let success = false;
          if (ch === "email" && inv.customerEmail) {
            success = await sendEmailSmtp(inv, businessName);
            if (success) emailSent++;
          } else if (ch === "whatsapp" && inv.customerPhone) {
            success = sendWhatsApp(inv, businessName);
            if (success) waSent++;
          } else if (ch === "sms" && inv.customerPhone) {
            success = sendSms(inv, businessName);
            if (success) smsSent++;
          }
          if (!success) failed++;
        } catch {
          failed++;
        }

        // Small delay between sends
        await new Promise((r) => setTimeout(r, 1500));
      }

      // Update reminder count
      updateInvoice(inv.id, {
        remindersSent: (inv.remindersSent || 0) + 1,
        lastReminderDate: new Date().toISOString().split("T")[0],
      });
    }

    setLastRunDate(new Date().toISOString());

    const parts: string[] = [];
    if (emailSent) parts.push(`${emailSent} emails`);
    if (waSent) parts.push(`${waSent} WhatsApp`);
    if (smsSent) parts.push(`${smsSent} SMS`);
    toast.success(`Automation complete: Sent ${parts.join(", ")}${failed ? ` (${failed} failed)` : ""}`);

    runningRef.current = false;
  }, [invoices, updateInvoice, getBusinessName, sendEmailSmtp, sendWhatsApp, sendSms]);

  // Check every minute if it's time to run
  useEffect(() => {
    const interval = setInterval(() => {
      const config = getConfig();
      if (!config.enabled) return;
      if (isTimeToRun(config) && shouldRunToday(config)) {
        runAutomation();
      }
    }, 60000); // check every minute

    return () => clearInterval(interval);
  }, [runAutomation]);

  return { runAutomation, getConfig };
}
