import { useState } from "react";
import { useInvoiceData } from "@/contexts/InvoiceDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAutomationScheduler } from "@/hooks/useAutomationScheduler";
import type { Invoice } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import WhatsAppApiWizard from "@/components/WhatsAppApiWizard";
import { toast } from "sonner";
import {
  MessageCircle, Mail, Phone, Send, Save,
  FileText, PenLine, X, Clock, Zap, CheckCircle2, Loader2, Key, StopCircle,
} from "lucide-react";

const DEFAULT_WA_TEMPLATE = `Dear {{name}},\n\nYour invoice {{invoiceNumber}} of Rs {{amount}} is overdue.\n\nPay instantly here:\n{{upiLink}}\n\nor scan the QR to pay:\n{{payLink}}\n\nThank you.\n{{businessName}}`;
const DEFAULT_EMAIL_TEMPLATE = `Dear {{name}},\n\nThis is a reminder from {{businessName}} regarding invoice {{invoiceNumber}}.\n\nAmount: ₹{{amount}}\n\nPlease pay at your earliest.\n\nClick here to pay now\n{{payLink}}\n{{upiLink}}\n\nThank you.\n\n{{businessName}}`;
const DEFAULT_SMS_TEMPLATE = `Dear {{name}}, your invoice {{invoiceNumber}} of Rs {{amount}} is pending. Due: {{dueDate}}. Please pay at your earliest. - {{businessName}}`;

interface SmtpConfig {
  senderEmail: string; smtpServer: string; smtpPort: string; smtpUsername: string; smtpPassword: string; useTls: boolean;
}

export default function Notifications() {
  const { invoices, hasData, updateInvoice } = useInvoiceData();
  const { user } = useAuth();
  const { runAutomation, stopAutomation, isRunning } = useAutomationScheduler();

  const [waEditMode, setWaEditMode] = useState(false);
  const [smsEditMode, setSmsEditMode] = useState(false);
  const [emailEditMode, setEmailEditMode] = useState(false);

  const [waMode, setWaMode] = useState<"link" | "api">(() => localStorage.getItem("payrecovery_wa_mode") as any || "link");
  const [waSenderNumber, setWaSenderNumber] = useState(() => localStorage.getItem("payrecovery_wa_sender") || "");
  const [waTemplate, setWaTemplate] = useState(() => localStorage.getItem("payrecovery_wa_template") || DEFAULT_WA_TEMPLATE);
  const [showWaWizard, setShowWaWizard] = useState(false);
  const [waApiConfigured, setWaApiConfigured] = useState(() => !!localStorage.getItem("payrecovery_wa_api_key"));

  const [smsSenderNumber, setSmsSenderNumber] = useState(() => localStorage.getItem("payrecovery_sms_sender") || "");
  const [smsTemplate, setSmsTemplate] = useState(() => localStorage.getItem("payrecovery_sms_template") || DEFAULT_SMS_TEMPLATE);

  const [emailMode, setEmailMode] = useState<"smtp" | "mailto">(() => localStorage.getItem("payrecovery_email_mode") as any || "mailto");
  const [emailTemplate, setEmailTemplate] = useState(() => localStorage.getItem("payrecovery_email_template") || DEFAULT_EMAIL_TEMPLATE);
  const [smtp, setSmtp] = useState<SmtpConfig>(() => {
    try { return JSON.parse(localStorage.getItem("payrecovery_smtp") || "{}") as SmtpConfig; }
    catch { return { senderEmail: "", smtpServer: "smtp.gmail.com", smtpPort: "587", smtpUsername: "", smtpPassword: "", useTls: true }; }
  });

  const [autoFrequency, setAutoFrequency] = useState(() => localStorage.getItem("payrecovery_auto_freq") || "weekly");
  const [autoTime, setAutoTime] = useState(() => localStorage.getItem("payrecovery_auto_time") || "09:00");
  const [autoChannel, setAutoChannel] = useState(() => localStorage.getItem("payrecovery_auto_channel") || "email");
  const [autoEscalation, setAutoEscalation] = useState(() => localStorage.getItem("payrecovery_auto_escalation") === "true");
  const [autoEnabled, setAutoEnabled] = useState(() => localStorage.getItem("payrecovery_auto_enabled") === "true");
  const [autoEditMode, setAutoEditMode] = useState(false);

  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [sendTarget, setSendTarget] = useState<"all" | "selected">("all");

  const upiId = localStorage.getItem("payrecovery_upi_id") || "";
  const upiName = localStorage.getItem("payrecovery_upi_name") || "";
  const businessName = (() => {
    try { return JSON.parse(localStorage.getItem("payrecovery_user") || "{}").companyName || upiName || "Our Company"; }
    catch { return upiName || "Our Company"; }
  })();

  const unpaidInvoices = invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled");

  const fillTemplate = (template: string, inv: Invoice) => {
    const amount = inv.amount.toLocaleString("en-IN");
    const upiLink = upiId ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName || businessName)}&am=${inv.amount}&cu=INR&tn=Invoice%20${encodeURIComponent(inv.invoiceNumber)}` : "";
    const payLink = `${window.location.origin}/pay/${inv.id}`;
    return template
      .replace(/\{\{name\}\}/g, inv.customerName || "")
      .replace(/\{\{invoiceNumber\}\}/g, inv.invoiceNumber)
      .replace(/\{\{amount\}\}/g, amount)
      .replace(/\{\{dueDate\}\}/g, inv.dueDate)
      .replace(/\{\{upiLink\}\}/g, upiLink)
      .replace(/\{\{payLink\}\}/g, payLink)
      .replace(/\{\{businessName\}\}/g, businessName);
  };

  const getTargetInvoices = () => sendTarget === "all" ? unpaidInvoices : unpaidInvoices.filter((i) => selectedInvoices.includes(i.id));

  const handleSaveWaConfig = () => {
    localStorage.setItem("payrecovery_wa_mode", waMode);
    localStorage.setItem("payrecovery_wa_sender", waSenderNumber);
    localStorage.setItem("payrecovery_wa_template", waTemplate);
    toast.success("WhatsApp config saved");
    setWaEditMode(false);
  };

  const handleSendWhatsApp = (inv: Invoice) => {
    const phone = (inv.customerPhone || "").replace(/[^0-9]/g, "");
    if (!phone) { toast.error(`No phone for ${inv.customerName}`); return; }
    const msg = fillTemplate(waTemplate, inv);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
    updateInvoice(inv.id, { remindersSent: (inv.remindersSent || 0) + 1, lastReminderDate: new Date().toISOString().split("T")[0] });
    toast.success(`WhatsApp opened for ${inv.customerName}`);
  };

  const handleBulkWhatsApp = () => {
    const targets = getTargetInvoices();
    if (!targets.length) { toast.error("No invoices to send"); return; }
    targets.forEach((inv, idx) => setTimeout(() => handleSendWhatsApp(inv), idx * 1500));
    toast.success(`Sending ${targets.length} WhatsApp messages...`);
  };

  const handleSaveSmsConfig = () => {
    localStorage.setItem("payrecovery_sms_sender", smsSenderNumber);
    localStorage.setItem("payrecovery_sms_template", smsTemplate);
    toast.success("SMS config saved");
    setSmsEditMode(false);
  };

  const handleSendSms = (inv: Invoice) => {
    const phone = (inv.customerPhone || "").replace(/[^0-9]/g, "");
    if (!phone) { toast.error(`No phone for ${inv.customerName}`); return; }
    const msg = fillTemplate(smsTemplate, inv);
    window.open(`sms:${phone}?body=${encodeURIComponent(msg)}`, "_blank");
    updateInvoice(inv.id, { remindersSent: (inv.remindersSent || 0) + 1, lastReminderDate: new Date().toISOString().split("T")[0] });
    toast.success(`SMS opened for ${inv.customerName}`);
  };

  const handleBulkSms = () => {
    const targets = getTargetInvoices();
    if (!targets.length) { toast.error("No invoices to send"); return; }
    targets.forEach((inv, idx) => setTimeout(() => handleSendSms(inv), idx * 1000));
    toast.success(`Opening ${targets.length} SMS...`);
  };

  const handleSaveEmailConfig = () => {
    localStorage.setItem("payrecovery_email_mode", emailMode);
    localStorage.setItem("payrecovery_email_template", emailTemplate);
    localStorage.setItem("payrecovery_smtp", JSON.stringify(smtp));
    toast.success("Email config saved");
    setEmailEditMode(false);
  };

  const handleSendEmailMailto = (inv: Invoice) => {
    if (!inv.customerEmail) { toast.error(`No email for ${inv.customerName}`); return; }
    const body = fillTemplate(emailTemplate, inv);
    const subject = `Payment Reminder - Invoice ${inv.invoiceNumber}`;
    window.open(`mailto:${inv.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
    updateInvoice(inv.id, { remindersSent: (inv.remindersSent || 0) + 1, lastReminderDate: new Date().toISOString().split("T")[0] });
    toast.success(`Email opened for ${inv.customerName}`);
  };

  const handleSendEmailSmtp = async (inv: Invoice) => {
    if (!inv.customerEmail) { toast.error(`No email for ${inv.customerName}`); return; }
    if (!smtp.smtpServer || !smtp.smtpPassword) {
      toast.error("SMTP not configured. Please set up SMTP in the Email tab first.");
      return;
    }
    try {
      const body = fillTemplate(emailTemplate, inv);
      const res = await fetch("http://localhost:3001/api/email/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp: { host: smtp.smtpServer, port: parseInt(smtp.smtpPort), email: smtp.senderEmail || smtp.smtpUsername, username: smtp.smtpUsername, password: smtp.smtpPassword, tls: smtp.useTls },
          to: inv.customerEmail, subject: `Payment Reminder - Invoice ${inv.invoiceNumber}`, message: body,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const hint = data.hint ? `\n${data.hint}` : "";
        throw new Error(data.error + hint);
      }
      updateInvoice(inv.id, { remindersSent: (inv.remindersSent || 0) + 1, lastReminderDate: new Date().toISOString().split("T")[0] });
      toast.success(`Email sent to ${inv.customerName}`);
    } catch (err: any) {
      toast.error(`SMTP failed: ${err.message || "Unknown error"}`, { duration: 6000 });
      handleSendEmailMailto(inv);
    }
  };

  const handleSendEmail = (inv: Invoice) => {
    if (emailMode === "smtp") handleSendEmailSmtp(inv);
    else handleSendEmailMailto(inv);
  };

  const handleBulkEmail = () => {
    const targets = getTargetInvoices();
    if (!targets.length) { toast.error("No invoices to send"); return; }
    targets.forEach((inv, idx) => setTimeout(() => handleSendEmail(inv), idx * 800));
    toast.success(`Sending ${targets.length} emails...`);
  };

  const toggleInvoice = (id: string) => {
    setSelectedInvoices((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const handleSaveAutomation = () => {
    localStorage.setItem("payrecovery_auto_freq", autoFrequency);
    localStorage.setItem("payrecovery_auto_time", autoTime);
    localStorage.setItem("payrecovery_auto_channel", autoChannel);
    localStorage.setItem("payrecovery_auto_escalation", String(autoEscalation));
    localStorage.setItem("payrecovery_auto_enabled", String(autoEnabled));
    toast.success("Automation settings saved" + (autoEnabled ? " — scheduler is active" : ""));
    setAutoEditMode(false);
  };

  const handleRunNow = async () => {
    await runAutomation();
  };

  if (!hasData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center space-y-4 max-w-md bg-card border-border/50">
          <Mail className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h2 className="text-lg font-bold text-foreground">No Data</h2>
          <p className="text-sm text-muted-foreground">Upload invoice data first to configure and send notifications.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Notifications</h1>
        <p className="text-sm text-muted-foreground">Configure and send WhatsApp, SMS & Email reminders</p>
      </div>

      <Tabs defaultValue="whatsapp">
        <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="whatsapp" className="text-xs gap-1"><MessageCircle className="w-3 h-3" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="sms" className="text-xs gap-1"><Phone className="w-3 h-3" /> SMS</TabsTrigger>
          <TabsTrigger value="email" className="text-xs gap-1"><Mail className="w-3 h-3" /> Email</TabsTrigger>
          <TabsTrigger value="send" className="text-xs gap-1"><Send className="w-3 h-3" /> Send</TabsTrigger>
        </TabsList>

        {/* WhatsApp */}
        <TabsContent value="whatsapp" className="mt-4 space-y-4">
          {showWaWizard ? (
            <WhatsAppApiWizard
              onClose={() => setShowWaWizard(false)}
              onComplete={() => {
                setWaApiConfigured(true);
                setWaMode("api");
                toast.success("WhatsApp API configured!");
              }}
            />
          ) : (
            <Card className="p-4 bg-card border-border/50 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">WhatsApp Configuration</h3>
                  {waApiConfigured && <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-[10px]">API Connected</Badge>}
                </div>
                {!waEditMode ? (
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setWaEditMode(true)}><PenLine className="w-3 h-3" /> Edit</Button>
                ) : (
                  <Button size="sm" variant="ghost" onClick={() => setWaEditMode(false)}><X className="w-3 h-3" /></Button>
                )}
              </div>
              {waEditMode ? (
                <>
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold text-foreground">Choose WhatsApp Method</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button onClick={() => setWaMode("link")} className={`p-3 rounded-lg border text-left transition-all ${waMode === "link" ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <MessageCircle className="w-4 h-4 text-accent" />
                          <span className="text-xs font-semibold text-foreground">Click-to-Chat Link</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Opens WhatsApp web/app with pre-filled message. No API key needed.</p>
                      </button>
                      <button onClick={() => setWaMode("api")} className={`p-3 rounded-lg border text-left transition-all ${waMode === "api" ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Key className="w-4 h-4 text-primary" />
                          <span className="text-xs font-semibold text-foreground">WhatsApp Business API</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Fully automated sending via Meta's official API.</p>
                      </button>
                    </div>
                  </div>
                  {waMode === "api" && !waApiConfigured && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                      <p className="text-xs text-foreground font-semibold">Do you have your own WhatsApp Business API key?</p>
                      <div className="flex gap-2">
                        <Button size="sm" className="gap-1" onClick={() => setShowWaWizard(true)}><Key className="w-3 h-3" /> Yes, Set Up API Key</Button>
                        <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowWaWizard(true)}>No, Help Me Get One</Button>
                      </div>
                    </div>
                  )}
                  {waMode === "api" && waApiConfigured && (
                    <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        <p className="text-xs text-foreground font-semibold">API Connected</p>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowWaWizard(true)}>
                        <Key className="w-3 h-3" /> Reconfigure
                      </Button>
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="space-y-1"><Label className="text-xs">Sender Number</Label><Input placeholder="919876543210" value={waSenderNumber} onChange={(e) => setWaSenderNumber(e.target.value)} /></div>
                    <div className="space-y-1">
                      <Label className="text-xs">Message Template</Label>
                      <Textarea rows={8} value={waTemplate} onChange={(e) => setWaTemplate(e.target.value)} className="font-mono text-xs" />
                    </div>
                  </div>
                  <Button size="sm" className="gap-2" onClick={handleSaveWaConfig}><Save className="w-4 h-4" /> Save</Button>
                </>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground text-xs">Mode</span><span className="text-xs text-foreground capitalize">{waMode === "api" && waApiConfigured ? "API (Automated)" : "Click-to-Chat (wa.me)"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground text-xs">Sender</span><span className="text-xs text-foreground">{waSenderNumber || "—"}</span></div>
                </div>
              )}
            </Card>
          )}
        </TabsContent>

        {/* SMS */}
        <TabsContent value="sms" className="mt-4 space-y-4">
          <Card className="p-4 bg-card border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">SMS Configuration</h3>
              {!smsEditMode ? (
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setSmsEditMode(true)}><PenLine className="w-3 h-3" /> Edit</Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setSmsEditMode(false)}><X className="w-3 h-3" /></Button>
              )}
            </div>
            {smsEditMode ? (
              <>
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-xs">Sender Number</Label><Input placeholder="919876543210" value={smsSenderNumber} onChange={(e) => setSmsSenderNumber(e.target.value)} /></div>
                  <div className="space-y-1">
                    <Label className="text-xs">Message Template</Label>
                    <Textarea rows={4} value={smsTemplate} onChange={(e) => setSmsTemplate(e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
                <Button size="sm" className="gap-2" onClick={handleSaveSmsConfig}><Save className="w-4 h-4" /> Save</Button>
              </>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground text-xs">Sender</span><span className="text-xs text-foreground">{smsSenderNumber || "—"}</span></div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Email */}
        <TabsContent value="email" className="mt-4 space-y-4">
          <Card className="p-4 bg-card border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Email Configuration</h3>
              {!emailEditMode ? (
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setEmailEditMode(true)}><PenLine className="w-3 h-3" /> Edit</Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setEmailEditMode(false)}><X className="w-3 h-3" /></Button>
              )}
            </div>
            {emailEditMode ? (
              <>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={emailMode === "smtp"} onChange={() => setEmailMode("smtp")} className="accent-[hsl(var(--primary))]" />
                    <span className="text-sm text-foreground">SMTP Server</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={emailMode === "mailto"} onChange={() => setEmailMode("mailto")} className="accent-[hsl(var(--primary))]" />
                    <span className="text-sm text-foreground">Mailto (fallback)</span>
                  </label>
                </div>
                {emailMode === "smtp" && (
                  <div className="space-y-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <h4 className="text-xs font-semibold text-foreground">SMTP Config</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-xs">Sender Email</Label><Input placeholder="store@gmail.com" value={smtp.senderEmail} onChange={(e) => setSmtp({ ...smtp, senderEmail: e.target.value })} /></div>
                      <div className="space-y-1"><Label className="text-xs">SMTP Server</Label><Input placeholder="smtp.gmail.com" value={smtp.smtpServer} onChange={(e) => setSmtp({ ...smtp, smtpServer: e.target.value })} /></div>
                      <div className="space-y-1"><Label className="text-xs">Port</Label><Input placeholder="587" value={smtp.smtpPort} onChange={(e) => setSmtp({ ...smtp, smtpPort: e.target.value })} /></div>
                      <div className="space-y-1"><Label className="text-xs">Username</Label><Input placeholder="store@gmail.com" value={smtp.smtpUsername} onChange={(e) => setSmtp({ ...smtp, smtpUsername: e.target.value })} /></div>
                      <div className="space-y-1">
                        <Label className="text-xs">App Password</Label>
                        <Input type="password" placeholder="abcd efgh ijkl mnop" value={smtp.smtpPassword} onChange={(e) => setSmtp({ ...smtp, smtpPassword: e.target.value })} onCopy={(e) => e.preventDefault()} />
                        <p className="text-[10px] text-muted-foreground mt-1">
                          For Gmail: Use a 16-character <strong>App Password</strong> (with spaces, e.g. "abcd efgh ijkl mnop"). Generate one at{" "}
                          <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google App Passwords</a>.
                          Enter it exactly as shown — <strong>with spaces</strong>.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-5"><Switch checked={smtp.useTls} onCheckedChange={(v) => setSmtp({ ...smtp, useTls: v })} /><Label className="text-xs">Use TLS</Label></div>
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <Label className="text-xs">Email Template</Label>
                  <Textarea rows={10} value={emailTemplate} onChange={(e) => setEmailTemplate(e.target.value)} className="font-mono text-xs" />
                </div>
                <Button size="sm" className="gap-2" onClick={handleSaveEmailConfig}><Save className="w-4 h-4" /> Save</Button>
              </>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground text-xs">Mode</span><span className="text-xs text-foreground capitalize">{emailMode}</span></div>
                {emailMode === "smtp" && <div className="flex justify-between"><span className="text-muted-foreground text-xs">SMTP Server</span><span className="text-xs text-foreground">{smtp.smtpServer || "—"}</span></div>}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Send Tab */}
        <TabsContent value="send" className="mt-4 space-y-4">
          <Card className="p-4 bg-card border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Send Reminders</h3>
              <Select value={sendTarget} onValueChange={(v: any) => setSendTarget(v)}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Unpaid</SelectItem>
                  <SelectItem value="selected">Selected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="gap-2" onClick={handleBulkWhatsApp}>
                <MessageCircle className="w-4 h-4 text-accent" /> WhatsApp ({sendTarget === "all" ? unpaidInvoices.filter(i => i.customerPhone).length : selectedInvoices.length})
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={handleBulkSms}>
                <Phone className="w-4 h-4 text-primary" /> SMS ({sendTarget === "all" ? unpaidInvoices.filter(i => i.customerPhone).length : selectedInvoices.length})
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={handleBulkEmail}>
                <Mail className="w-4 h-4 text-chart-4" /> Email ({sendTarget === "all" ? unpaidInvoices.filter(i => i.customerEmail).length : selectedInvoices.length})
              </Button>
            </div>
            {sendTarget === "selected" && (
              <div className="max-h-64 overflow-y-auto space-y-1 border border-border/50 rounded-lg p-2">
                {unpaidInvoices.map((inv) => (
                  <label key={inv.id} className="flex items-center gap-3 p-2 rounded hover:bg-secondary/30 cursor-pointer">
                    <Checkbox checked={selectedInvoices.includes(inv.id)} onCheckedChange={() => toggleInvoice(inv.id)} />
                    <div className="flex-1 flex items-center gap-3 text-xs">
                      <span className="font-mono text-foreground">{inv.invoiceNumber}</span>
                      <span className="text-foreground">{inv.customerName}</span>
                      <span className="text-muted-foreground">₹{inv.amount.toLocaleString("en-IN")}</span>
                    </div>
                  </label>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Individual Send</h4>
              <div className="max-h-80 overflow-y-auto space-y-1">
                {unpaidInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-2 rounded border border-border/30 hover:bg-secondary/20">
                    <div className="flex items-center gap-2 text-xs">
                      <FileText className="w-3 h-3 text-muted-foreground" />
                      <span className="font-mono text-foreground">{inv.invoiceNumber}</span>
                      <span className="text-foreground">{inv.customerName}</span>
                      <span className="text-muted-foreground">₹{inv.amount.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex gap-1">
                      {inv.customerPhone && (
                        <>
                          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => handleSendWhatsApp(inv)}><MessageCircle className="w-3 h-3 text-accent" /></Button>
                          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => handleSendSms(inv)}><Phone className="w-3 h-3 text-primary" /></Button>
                        </>
                      )}
                      {inv.customerEmail && (
                        <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => handleSendEmail(inv)}><Mail className="w-3 h-3 text-chart-4" /></Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Automation Card */}
      <Card className="p-4 bg-card border-border/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Automation Settings</h3>
            <Badge variant={autoEnabled ? "default" : "outline"} className={autoEnabled ? "bg-accent/20 text-accent border-accent/30 text-[10px]" : "text-[10px]"}>
              {autoEnabled ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {!autoEditMode && (
              <>
                {isRunning ? (
                  <Button size="sm" variant="destructive" className="gap-1 text-xs" onClick={stopAutomation}>
                    <StopCircle className="w-3 h-3" /> Stop (Ctrl+C)
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={handleRunNow} disabled={unpaidInvoices.length === 0}>
                    <Send className="w-3 h-3" /> Run Now
                  </Button>
                )}
              </>
            )}
            {!autoEditMode ? (
              <Button size="sm" variant="outline" className="gap-1" onClick={() => setAutoEditMode(true)}><PenLine className="w-3 h-3" /> Edit</Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setAutoEditMode(false)}><X className="w-3 h-3" /></Button>
            )}
          </div>
        </div>
        {autoEditMode ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
              <Switch checked={autoEnabled} onCheckedChange={setAutoEnabled} />
              <div>
                <Label className="text-xs font-semibold">Enable Automatic Sending</Label>
                <p className="text-[10px] text-muted-foreground">Notifications sent automatically at scheduled time</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Frequency</Label>
                <Select value={autoFrequency} onValueChange={setAutoFrequency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Send Time</Label><Input type="time" value={autoTime} onChange={(e) => setAutoTime(e.target.value)} /></div>
              <div className="space-y-1">
                <Label className="text-xs">Primary Channel</Label>
                <Select value={autoChannel} onValueChange={setAutoChannel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email (via SMTP)</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp (wa.me link)</SelectItem>
                    <SelectItem value="sms">SMS (sms: link)</SelectItem>
                    <SelectItem value="multi">Multi-channel (All)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={autoEscalation} onCheckedChange={setAutoEscalation} />
                <Label className="text-xs">Auto-escalation</Label>
              </div>
            </div>
            <Button size="sm" className="gap-2" onClick={handleSaveAutomation}><Save className="w-4 h-4" /> Save Automation</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="bg-secondary/30 rounded-lg p-2.5">
                <p className="text-muted-foreground text-[10px]">Status</p>
                <p className={`font-semibold ${autoEnabled ? "text-accent" : "text-muted-foreground"}`}>{autoEnabled ? "Enabled" : "Disabled"}</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2.5">
                <p className="text-muted-foreground text-[10px]">Frequency</p>
                <p className="font-semibold text-foreground capitalize">{autoFrequency}</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2.5">
                <p className="text-muted-foreground text-[10px]">Time</p>
                <p className="font-semibold text-foreground">{autoTime}</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2.5">
                <p className="text-muted-foreground text-[10px]">Channel</p>
                <p className="font-semibold text-foreground capitalize">{autoChannel}</p>
              </div>
              <div className="bg-secondary/30 rounded-lg p-2.5">
                <p className="text-muted-foreground text-[10px]">Escalation</p>
                <p className="font-semibold text-foreground">{autoEscalation ? "Enabled" : "Disabled"}</p>
              </div>
            </div>
            {localStorage.getItem("payrecovery_auto_last_run") && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> Last run: {new Date(localStorage.getItem("payrecovery_auto_last_run")!).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
