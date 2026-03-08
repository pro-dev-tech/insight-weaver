import { useState } from "react";
import { useInvoiceData } from "@/contexts/InvoiceDataContext";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  MessageCircle, Mail, Phone, Send, Save, ExternalLink,
  FileText, AlertTriangle,
} from "lucide-react";

// WhatsApp template
const DEFAULT_WA_TEMPLATE = `Dear {{name}},

Your invoice {{invoiceNumber}} of Rs {{amount}} is overdue.

Pay instantly here:
{{upiLink}}

or scan the QR to pay:
{{payLink}}

Thank you.
{{businessName}}`;

// Email template
const DEFAULT_EMAIL_TEMPLATE = `Dear {{name}},

This is a reminder from {{businessName}} regarding invoice {{invoiceNumber}}.

Amount: ₹{{amount}}

Please pay at your earliest.

Click here to pay now
{{payLink}}
{{upiLink}}

Thank you.

{{businessName}}`;

// SMS template
const DEFAULT_SMS_TEMPLATE = `Dear {{name}}, your invoice {{invoiceNumber}} of Rs {{amount}} is pending. Due: {{dueDate}}. Please pay at your earliest. - {{businessName}}`;

interface SmtpConfig {
  senderEmail: string;
  smtpServer: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  useTls: boolean;
}

export default function Notifications() {
  const { invoices, hasData, updateInvoice } = useInvoiceData();

  // WhatsApp config
  const [waMode, setWaMode] = useState<"link" | "api">(() =>
    localStorage.getItem("payrecovery_wa_mode") as any || "link"
  );
  const [waSenderNumber, setWaSenderNumber] = useState(() => localStorage.getItem("payrecovery_wa_sender") || "");
  const [waTemplate, setWaTemplate] = useState(() => localStorage.getItem("payrecovery_wa_template") || DEFAULT_WA_TEMPLATE);
  const [waApiDialog, setWaApiDialog] = useState(false);
  const [waBusinessName, setWaBusinessName] = useState("");
  const [_waBusinessDoc, setWaBusinessDoc] = useState<File | null>(null);

  // SMS config
  const [smsSenderNumber, setSmsSenderNumber] = useState(() => localStorage.getItem("payrecovery_sms_sender") || "");
  const [smsTemplate, setSmsTemplate] = useState(() => localStorage.getItem("payrecovery_sms_template") || DEFAULT_SMS_TEMPLATE);

  // Email config
  const [emailMode, setEmailMode] = useState<"smtp" | "mailto">(() =>
    localStorage.getItem("payrecovery_email_mode") as any || "mailto"
  );
  const [emailTemplate, setEmailTemplate] = useState(() => localStorage.getItem("payrecovery_email_template") || DEFAULT_EMAIL_TEMPLATE);
  const [smtp, setSmtp] = useState<SmtpConfig>(() => {
    try {
      return JSON.parse(localStorage.getItem("payrecovery_smtp") || "{}") as SmtpConfig;
    } catch { return { senderEmail: "", smtpServer: "smtp.gmail.com", smtpPort: "587", smtpUsername: "", smtpPassword: "", useTls: true }; }
  });

  // Send targets
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
    const upiLink = upiId
      ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName || businessName)}&am=${inv.amount}&cu=INR&tn=Invoice%20${encodeURIComponent(inv.invoiceNumber)}`
      : "";
    const payLink = `${window.location.origin}/pay/${inv.id}`;
    return template
      .replace(/\{\{name\}\}/g, inv.customerName)
      .replace(/\{\{invoiceNumber\}\}/g, inv.invoiceNumber)
      .replace(/\{\{amount\}\}/g, amount)
      .replace(/\{\{dueDate\}\}/g, inv.dueDate)
      .replace(/\{\{upiLink\}\}/g, upiLink)
      .replace(/\{\{payLink\}\}/g, payLink)
      .replace(/\{\{businessName\}\}/g, businessName);
  };

  const getTargetInvoices = () =>
    sendTarget === "all" ? unpaidInvoices : unpaidInvoices.filter((i) => selectedInvoices.includes(i.id));

  // ---- WhatsApp ----
  const handleSaveWaConfig = () => {
    localStorage.setItem("payrecovery_wa_mode", waMode);
    localStorage.setItem("payrecovery_wa_sender", waSenderNumber);
    localStorage.setItem("payrecovery_wa_template", waTemplate);
    toast.success("WhatsApp config saved");
  };

  const handleSendWhatsApp = (inv: Invoice) => {
    const phone = inv.customerPhone.replace(/[^0-9]/g, "");
    if (!phone) { toast.error(`No phone for ${inv.customerName}`); return; }
    const msg = fillTemplate(waTemplate, inv);
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    updateInvoice(inv.id, { remindersSent: inv.remindersSent + 1, lastReminderDate: new Date().toISOString().split("T")[0] });
    toast.success(`WhatsApp opened for ${inv.customerName}`);
  };

  const handleBulkWhatsApp = () => {
    const targets = getTargetInvoices();
    if (!targets.length) { toast.error("No invoices to send"); return; }
    targets.forEach((inv, idx) => setTimeout(() => handleSendWhatsApp(inv), idx * 1500));
    toast.success(`Opening ${targets.length} WhatsApp chats...`);
  };

  // ---- SMS ----
  const handleSaveSmsConfig = () => {
    localStorage.setItem("payrecovery_sms_sender", smsSenderNumber);
    localStorage.setItem("payrecovery_sms_template", smsTemplate);
    toast.success("SMS config saved");
  };

  const handleSendSms = (inv: Invoice) => {
    const phone = inv.customerPhone.replace(/[^0-9]/g, "");
    if (!phone) { toast.error(`No phone for ${inv.customerName}`); return; }
    const msg = fillTemplate(smsTemplate, inv);
    window.open(`sms:${phone}?body=${encodeURIComponent(msg)}`, "_blank");
    updateInvoice(inv.id, { remindersSent: inv.remindersSent + 1, lastReminderDate: new Date().toISOString().split("T")[0] });
    toast.success(`SMS opened for ${inv.customerName}`);
  };

  const handleBulkSms = () => {
    const targets = getTargetInvoices();
    if (!targets.length) { toast.error("No invoices to send"); return; }
    targets.forEach((inv, idx) => setTimeout(() => handleSendSms(inv), idx * 1000));
    toast.success(`Opening ${targets.length} SMS...`);
  };

  // ---- Email ----
  const handleSaveEmailConfig = () => {
    localStorage.setItem("payrecovery_email_mode", emailMode);
    localStorage.setItem("payrecovery_email_template", emailTemplate);
    localStorage.setItem("payrecovery_smtp", JSON.stringify(smtp));
    toast.success("Email config saved");
  };

  const handleSendEmailMailto = (inv: Invoice) => {
    if (!inv.customerEmail) { toast.error(`No email for ${inv.customerName}`); return; }
    const body = fillTemplate(emailTemplate, inv);
    const subject = `Payment Reminder - Invoice ${inv.invoiceNumber}`;
    window.open(`mailto:${inv.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
    updateInvoice(inv.id, { remindersSent: inv.remindersSent + 1, lastReminderDate: new Date().toISOString().split("T")[0] });
    toast.success(`Email opened for ${inv.customerName}`);
  };

  const handleSendEmailSmtp = async (inv: Invoice) => {
    if (!inv.customerEmail) { toast.error(`No email for ${inv.customerName}`); return; }
    try {
      const body = fillTemplate(emailTemplate, inv);
      const res = await fetch("http://localhost:3001/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp: { host: smtp.smtpServer, port: parseInt(smtp.smtpPort), email: smtp.senderEmail || smtp.smtpUsername, username: smtp.smtpUsername, password: smtp.smtpPassword, tls: smtp.useTls },
          to: inv.customerEmail,
          subject: `Payment Reminder - Invoice ${inv.invoiceNumber}`,
          message: body,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      updateInvoice(inv.id, { remindersSent: inv.remindersSent + 1, lastReminderDate: new Date().toISOString().split("T")[0] });
      toast.success(`Email sent to ${inv.customerName}`);
    } catch {
      toast.error(`SMTP failed for ${inv.customerName}, opening mailto fallback...`);
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

  const handleSubmitWaApi = () => {
    toast.success("WhatsApp Business API application submitted (demo). You'll receive approval via email.");
    setWaApiDialog(false);
  };

  const toggleInvoice = (id: string) => {
    setSelectedInvoices((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
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

        {/* ====== WhatsApp ====== */}
        <TabsContent value="whatsapp" className="mt-4 space-y-4">
          <Card className="p-4 bg-card border-border/50 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">WhatsApp Mode</h3>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={waMode === "link"} onChange={() => setWaMode("link")} className="accent-[hsl(var(--primary))]" />
                <span className="text-sm text-foreground">Click-to-Chat Link</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={waMode === "api"} onChange={() => setWaMode("api")} className="accent-[hsl(var(--primary))]" />
                <span className="text-sm text-foreground">WhatsApp Business API</span>
              </label>
            </div>

            {waMode === "api" && (
              <div className="space-y-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-chart-4" />
                  <p className="text-xs text-muted-foreground">WhatsApp Business API requires approval from Meta.</p>
                </div>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setWaApiDialog(true)}>
                  <ExternalLink className="w-3 h-3" /> Apply for WhatsApp Business API
                </Button>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Sender Number (with country code)</Label>
                <Input placeholder="919876543210" value={waSenderNumber} onChange={(e) => setWaSenderNumber(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Message Template</Label>
                <Textarea rows={10} value={waTemplate} onChange={(e) => setWaTemplate(e.target.value)} className="font-mono text-xs" />
                <p className="text-[10px] text-muted-foreground">Variables: {"{{name}}, {{invoiceNumber}}, {{amount}}, {{dueDate}}, {{upiLink}}, {{payLink}}, {{businessName}}"}</p>
              </div>
            </div>
            <Button size="sm" className="gap-2" onClick={handleSaveWaConfig}><Save className="w-4 h-4" /> Save WhatsApp Config</Button>
          </Card>
        </TabsContent>

        {/* ====== SMS ====== */}
        <TabsContent value="sms" className="mt-4 space-y-4">
          <Card className="p-4 bg-card border-border/50 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">SMS Configuration</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Sender Mobile Number</Label>
                <Input placeholder="919876543210" value={smsSenderNumber} onChange={(e) => setSmsSenderNumber(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Message Template</Label>
                <Textarea rows={4} value={smsTemplate} onChange={(e) => setSmsTemplate(e.target.value)} className="font-mono text-xs" />
                <p className="text-[10px] text-muted-foreground">Variables: {"{{name}}, {{invoiceNumber}}, {{amount}}, {{dueDate}}, {{businessName}}"}</p>
              </div>
            </div>
            <Button size="sm" className="gap-2" onClick={handleSaveSmsConfig}><Save className="w-4 h-4" /> Save SMS Config</Button>
          </Card>
        </TabsContent>

        {/* ====== Email ====== */}
        <TabsContent value="email" className="mt-4 space-y-4">
          <Card className="p-4 bg-card border-border/50 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Email Mode</h3>
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
                <h4 className="text-xs font-semibold text-foreground">SMTP Configuration</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">Sender Email</Label>
                    <Input placeholder="store@gmail.com" value={smtp.senderEmail} onChange={(e) => setSmtp({ ...smtp, senderEmail: e.target.value })} />
                  </div>
                  <div className="space-y-1"><Label className="text-xs">SMTP Server</Label>
                    <Input placeholder="smtp.gmail.com" value={smtp.smtpServer} onChange={(e) => setSmtp({ ...smtp, smtpServer: e.target.value })} />
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Port</Label>
                    <Input placeholder="587" value={smtp.smtpPort} onChange={(e) => setSmtp({ ...smtp, smtpPort: e.target.value })} />
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Username</Label>
                    <Input placeholder="store@gmail.com" value={smtp.smtpUsername} onChange={(e) => setSmtp({ ...smtp, smtpUsername: e.target.value })} />
                  </div>
                  <div className="space-y-1"><Label className="text-xs">App Password</Label>
                    <Input type="password" placeholder="xxxx xxxx xxxx xxxx" value={smtp.smtpPassword} onChange={(e) => setSmtp({ ...smtp, smtpPassword: e.target.value })} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <Switch checked={smtp.useTls} onCheckedChange={(v) => setSmtp({ ...smtp, useTls: v })} />
                    <Label className="text-xs">Use TLS</Label>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Email Template</Label>
              <Textarea rows={12} value={emailTemplate} onChange={(e) => setEmailTemplate(e.target.value)} className="font-mono text-xs" />
              <p className="text-[10px] text-muted-foreground">Variables: {"{{name}}, {{invoiceNumber}}, {{amount}}, {{dueDate}}, {{upiLink}}, {{payLink}}, {{businessName}}"}</p>
            </div>
            <Button size="sm" className="gap-2" onClick={handleSaveEmailConfig}><Save className="w-4 h-4" /> Save Email Config</Button>
          </Card>
        </TabsContent>

        {/* ====== Send Tab ====== */}
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
                <MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp ({sendTarget === "all" ? unpaidInvoices.filter(i => i.customerPhone).length : selectedInvoices.length})
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={handleBulkSms}>
                <Phone className="w-4 h-4 text-blue-500" /> SMS ({sendTarget === "all" ? unpaidInvoices.filter(i => i.customerPhone).length : selectedInvoices.length})
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={handleBulkEmail}>
                <Mail className="w-4 h-4 text-orange-500" /> Email ({sendTarget === "all" ? unpaidInvoices.filter(i => i.customerEmail).length : selectedInvoices.length})
              </Button>
            </div>

            {sendTarget === "selected" && (
              <div className="max-h-64 overflow-y-auto space-y-1 border border-border/50 rounded-lg p-2">
                {unpaidInvoices.map((inv) => (
                  <label key={inv.id} className="flex items-center gap-3 p-2 rounded hover:bg-secondary/30 cursor-pointer">
                    <Checkbox
                      checked={selectedInvoices.includes(inv.id)}
                      onCheckedChange={() => toggleInvoice(inv.id)}
                    />
                    <div className="flex-1 flex items-center gap-3 text-xs">
                      <span className="font-mono text-foreground">{inv.invoiceNumber}</span>
                      <span className="text-foreground">{inv.customerName}</span>
                      <span className="text-muted-foreground">₹{inv.amount.toLocaleString("en-IN")}</span>
                      <div className="flex gap-1 ml-auto">
                        {inv.customerPhone && <Badge variant="outline" className="text-[9px]"><Phone className="w-2 h-2 mr-0.5" />{inv.customerPhone}</Badge>}
                        {inv.customerEmail && <Badge variant="outline" className="text-[9px]"><Mail className="w-2 h-2 mr-0.5" />{inv.customerEmail}</Badge>}
                      </div>
                    </div>
                  </label>
                ))}
                {unpaidInvoices.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No unpaid invoices</p>}
              </div>
            )}

            {/* Individual send */}
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
                          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => handleSendWhatsApp(inv)}>
                            <MessageCircle className="w-3 h-3 text-green-500" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => handleSendSms(inv)}>
                            <Phone className="w-3 h-3 text-blue-500" />
                          </Button>
                        </>
                      )}
                      {inv.customerEmail && (
                        <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => handleSendEmail(inv)}>
                          <Mail className="w-3 h-3 text-orange-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* WhatsApp Business API Dialog */}
      <Dialog open={waApiDialog} onOpenChange={setWaApiDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>WhatsApp Business API Application</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Submit your business details for WhatsApp Business API approval. Once approved, you can send messages programmatically.
            </p>
            <div className="space-y-1">
              <Label className="text-xs">Business Phone Number (with country code)</Label>
              <Input placeholder="919876543210" value={waSenderNumber} onChange={(e) => setWaSenderNumber(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Business Name</Label>
              <Input placeholder="Kumar Stores" value={waBusinessName} onChange={(e) => setWaBusinessName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Business Documents (GST / PAN / Incorporation Certificate)</Label>
              <Input type="file" onChange={(e) => setWaBusinessDoc(e.target.files?.[0] || null)} accept=".pdf,.jpg,.png" />
            </div>
            <Button className="w-full gap-2" onClick={handleSubmitWaApi}>
              <Send className="w-4 h-4" /> Submit Application
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
