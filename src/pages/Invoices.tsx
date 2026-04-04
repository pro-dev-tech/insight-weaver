import { useState, useCallback, useRef, useEffect } from "react";
import { useInvoiceData } from "@/contexts/InvoiceDataContext";
import type { Invoice } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Plus, Search, Send, FileText, Filter, MessageCircle, Mail, Phone, Upload, Pencil, Copy, Trash2, Zap } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-accent/10 text-accent border-accent/20",
  unpaid: "bg-primary/10 text-primary border-primary/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  partial: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  cancelled: "bg-muted text-muted-foreground border-border",
  pending: "bg-chart-4/10 text-chart-4 border-chart-4/20",
};

export default function Invoices() {
  const { invoices, hasData, addManualInvoice, updateInvoice, deleteDatasetById } = useInvoiceData();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editInv, setEditInv] = useState<Invoice | null>(null);
  const [reminderDialog, setReminderDialog] = useState<Invoice | null>(null);
  const [dupDialog, setDupDialog] = useState(false);
  const [sendAllRunning, setSendAllRunning] = useState(false);
  const stopRef = useRef(false);
  const [newInv, setNewInv] = useState({
    customerName: "", customerEmail: "", customerPhone: "",
    invoiceNumber: "", amount: "", dueDate: "",
  });

  // Keyboard shortcut: Ctrl+C to stop
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "c" && sendAllRunning) {
        e.preventDefault();
        stopRef.current = true;
        toast.info("Stopping send-all...");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sendAllRunning]);

  if (!hasData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center space-y-4 max-w-md bg-card border-border/50">
          <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h2 className="text-lg font-bold text-foreground">No Invoices</h2>
          <p className="text-sm text-muted-foreground">Upload a file to see your invoices here, or add one manually.</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => navigate("/upload")} variant="outline" className="gap-2"><Upload className="w-4 h-4" /> Upload File</Button>
            <Button onClick={() => setAddOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Add Manually</Button>
          </div>
        </Card>
      </div>
    );
  }

  const filtered = invoices.filter((inv) => {
    const matchesSearch = (inv.customerName || "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.invoiceNumber || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  // Duplicate detection
  const findDuplicates = () => {
    const seen = new Map<string, string[]>();
    invoices.forEach((inv) => {
      const key = `${(inv.customerName || "").toLowerCase()}|${inv.amount}|${inv.invoiceNumber}|${inv.dueDate}|${inv.status}`;
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key)!.push(inv.id);
    });
    return Array.from(seen.values()).filter((ids) => ids.length > 1);
  };

  const duplicateGroups = findDuplicates();
  const duplicateIds = new Set(duplicateGroups.flatMap((g) => g.slice(1)));

  const removeDuplicates = () => {
    duplicateIds.forEach((id) => deleteDatasetById(id));
    toast.success(`Removed ${duplicateIds.size} duplicate entries`);
    setDupDialog(false);
  };

  const handleAddInvoice = () => {
    if (!newInv.customerName || !newInv.invoiceNumber || !newInv.amount || !newInv.dueDate) {
      toast.error("Fill all required fields"); return;
    }
    addManualInvoice({
      invoiceNumber: newInv.invoiceNumber,
      customerName: newInv.customerName,
      customerPhone: newInv.customerPhone,
      customerEmail: newInv.customerEmail,
      dueDate: newInv.dueDate,
      amount: parseFloat(newInv.amount),
      status: "pending",
    });
    setAddOpen(false);
    setNewInv({ customerName: "", customerEmail: "", customerPhone: "", invoiceNumber: "", amount: "", dueDate: "" });
    toast.success("Invoice added");
  };

  const handleEditInvoice = () => {
    if (!editInv) return;
    updateInvoice(editInv.id, {
      customerName: editInv.customerName,
      customerEmail: editInv.customerEmail,
      customerPhone: editInv.customerPhone,
      invoiceNumber: editInv.invoiceNumber,
      amount: editInv.amount,
      paidAmount: editInv.paidAmount,
      dueDate: editInv.dueDate,
      status: editInv.status,
    });
    setEditOpen(false);
    setEditInv(null);
    toast.success("Invoice updated — synced across the system");
  };

  const openEdit = (inv: Invoice) => {
    setEditInv({ ...inv });
    setEditOpen(true);
  };

  const handleSendReminder = (inv: Invoice, channel: "whatsapp" | "sms" | "email", emailMethod?: "mailto" | "smtp") => {
    updateInvoice(inv.id, { remindersSent: (inv.remindersSent || 0) + 1, lastReminderDate: new Date().toISOString().split("T")[0] });
    const upiId = localStorage.getItem("payrecovery_upi_id") || "merchant@upi";
    const companyName = (() => { try { return JSON.parse(localStorage.getItem("payrecovery_user") || "{}").companyName || "Our Company"; } catch { return "Our Company"; } })();

    if (channel === "whatsapp") {
      const phone = (inv.customerPhone || "").replace(/[^0-9]/g, "");
      const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyName)}&am=${inv.amount}&cu=INR&tn=Invoice%20${encodeURIComponent(inv.invoiceNumber)}`;
      const payPageUrl = `${window.location.origin}/pay/${inv.id}`;
      const msg = `Dear ${inv.customerName},\n\nYour invoice ${inv.invoiceNumber} of Rs ${inv.amount.toLocaleString("en-IN")} is overdue.\n\nPay instantly here:\n${upiLink}\n\nor scan the QR to pay:\n${payPageUrl}\n\nThank you.\n${companyName}`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
      toast.success(`WhatsApp reminder opened for ${inv.customerName}`);
    } else if (channel === "sms") {
      const phone = (inv.customerPhone || "").replace(/[^0-9]/g, "");
      const msg = `Dear ${inv.customerName}, your invoice ${inv.invoiceNumber} of Rs ${inv.amount.toLocaleString("en-IN")} is pending. Please pay at your earliest. - ${companyName}`;
      window.open(`sms:${phone}?body=${encodeURIComponent(msg)}`, "_blank");
      toast.success(`SMS reminder opened for ${inv.customerName}`);
    } else {
      const subject = `Payment Reminder - Invoice ${inv.invoiceNumber}`;
      const body = `Dear ${inv.customerName},\n\nThis is a reminder from ${companyName} regarding invoice ${inv.invoiceNumber}.\n\nAmount: ₹${inv.amount.toLocaleString("en-IN")}\n\nPlease pay at your earliest convenience.\n\nThank you.\n${companyName}`;
      if (emailMethod === "smtp") {
        const smtpConfig = (() => { try { return JSON.parse(localStorage.getItem("payrecovery_smtp") || "{}"); } catch { return {}; } })();
        if (smtpConfig.smtpServer && smtpConfig.smtpPassword && inv.customerEmail) {
          fetch("http://localhost:3001/api/email/send", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              smtp: { host: smtpConfig.smtpServer, port: parseInt(smtpConfig.smtpPort || "587"), email: smtpConfig.senderEmail || smtpConfig.smtpUsername, username: smtpConfig.smtpUsername, password: smtpConfig.smtpPassword, tls: smtpConfig.useTls !== false },
              to: inv.customerEmail, subject, message: body,
            }),
          }).then(r => r.ok ? toast.success(`SMTP email sent to ${inv.customerName}`) : toast.error("SMTP failed, try mailto"))
            .catch(() => toast.error("SMTP backend offline"));
        } else {
          toast.error("SMTP not configured — use mailto instead");
        }
      } else {
        window.open(`mailto:${inv.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
        toast.success(`Email reminder opened for ${inv.customerName}`);
      }
    }
    setReminderDialog(null);
  };

  // Send all channels for a single customer: SMS → Email → WhatsApp
  const handleSendAll = async (inv: Invoice) => {
    setSendAllRunning(true);
    stopRef.current = false;
    const steps: { channel: "sms" | "email" | "whatsapp"; label: string }[] = [];
    if (inv.customerPhone) steps.push({ channel: "sms", label: "SMS" });
    if (inv.customerEmail) steps.push({ channel: "email", label: "Email" });
    if (inv.customerPhone) steps.push({ channel: "whatsapp", label: "WhatsApp" });

    for (const s of steps) {
      if (stopRef.current) { toast.info("Send-all stopped"); break; }
      toast.info(`Sending ${s.label} to ${inv.customerName}...`);
      handleSendReminder(inv, s.channel, s.channel === "email" ? "mailto" : undefined);
      await new Promise((r) => setTimeout(r, 2000));
    }
    setSendAllRunning(false);
    setReminderDialog(null);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">{invoices.length} total invoices{duplicateGroups.length > 0 && ` · ${duplicateIds.size} duplicates found`}</p>
        </div>
        <div className="flex gap-2">
          {duplicateGroups.length > 0 && (
            <Button size="sm" variant="outline" className="gap-2 text-destructive" onClick={() => setDupDialog(true)}>
              <Copy className="w-4 h-4" /> {duplicateIds.size} Duplicates
            </Button>
          )}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> Add Invoice</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Invoice</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="space-y-1"><Label className="text-xs">Customer Name *</Label><Input value={newInv.customerName} onChange={(e) => setNewInv({ ...newInv, customerName: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Invoice # *</Label><Input value={newInv.invoiceNumber} onChange={(e) => setNewInv({ ...newInv, invoiceNumber: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Email</Label><Input value={newInv.customerEmail} onChange={(e) => setNewInv({ ...newInv, customerEmail: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Phone</Label><Input value={newInv.customerPhone} onChange={(e) => setNewInv({ ...newInv, customerPhone: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Amount (₹) *</Label><Input type="number" value={newInv.amount} onChange={(e) => setNewInv({ ...newInv, amount: e.target.value })} /></div>
                <div className="space-y-1"><Label className="text-xs">Due Date *</Label><Input type="date" value={newInv.dueDate} onChange={(e) => setNewInv({ ...newInv, dueDate: e.target.value })} /></div>
              </div>
              <Button onClick={handleAddInvoice} className="w-full mt-3">Create Invoice</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><Filter className="w-3 h-3 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card border-border/50 overflow-hidden">
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="max-h-[calc(100vh-280px)] overflow-y-auto">
            <table className="w-full text-sm min-w-[1100px]">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-border/50 bg-secondary/50 backdrop-blur-sm">
                  {["Invoice #", "Customer", "Phone", "Email", "Amount", "Paid", "Due Date", "Status", "Reminders", "Actions"].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className={`border-b border-border/30 hover:bg-secondary/20 transition-colors ${duplicateIds.has(inv.id) ? "bg-destructive/5" : ""}`}>
                    <td className="py-2.5 px-3 font-mono text-xs text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3 h-3 text-muted-foreground" />{inv.invoiceNumber}
                        {duplicateIds.has(inv.id) && <Badge variant="outline" className="text-[8px] text-destructive border-destructive/30 ml-1">DUP</Badge>}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-foreground whitespace-nowrap">{inv.customerName || "—"}</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">{inv.customerPhone || "—"}</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap max-w-[200px] truncate">{inv.customerEmail || "—"}</td>
                    <td className="py-2.5 px-3 font-mono text-foreground whitespace-nowrap">{formatINR(inv.amount)}</td>
                    <td className="py-2.5 px-3 font-mono text-foreground whitespace-nowrap">{formatINR(inv.paidAmount || 0)}</td>
                    <td className="py-2.5 px-3 text-xs text-foreground whitespace-nowrap">{inv.dueDate || "—"}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[inv.status] || ""}`}>{inv.status}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">{inv.remindersSent || 0}</td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(inv)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        {inv.status !== "paid" && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setReminderDialog(inv)}>
                            <Send className="w-3 h-3" /> Remind
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="py-8 text-center text-sm text-muted-foreground">No invoices found</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Invoice</DialogTitle></DialogHeader>
          {editInv && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="space-y-1"><Label className="text-xs">Customer Name</Label><Input value={editInv.customerName || ""} onChange={(e) => setEditInv({ ...editInv, customerName: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Invoice #</Label><Input value={editInv.invoiceNumber} onChange={(e) => setEditInv({ ...editInv, invoiceNumber: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Email</Label><Input value={editInv.customerEmail || ""} onChange={(e) => setEditInv({ ...editInv, customerEmail: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Phone</Label><Input value={editInv.customerPhone || ""} onChange={(e) => setEditInv({ ...editInv, customerPhone: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Amount (₹)</Label><Input type="number" value={editInv.amount} onChange={(e) => setEditInv({ ...editInv, amount: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1"><Label className="text-xs">Paid Amount (₹)</Label><Input type="number" value={editInv.paidAmount || 0} onChange={(e) => setEditInv({ ...editInv, paidAmount: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1"><Label className="text-xs">Due Date</Label><Input type="date" value={editInv.dueDate} onChange={(e) => setEditInv({ ...editInv, dueDate: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Status</Label>
                <Select value={editInv.status} onValueChange={(v: any) => setEditInv({ ...editInv, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">Changes are saved to the database and reflected across the entire system.</p>
          <Button onClick={handleEditInvoice} className="w-full mt-3">Save Changes</Button>
        </DialogContent>
      </Dialog>

      {/* Reminder channel dialog */}
      <Dialog open={!!reminderDialog} onOpenChange={() => { if (!sendAllRunning) setReminderDialog(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Send Reminder to {reminderDialog?.customerName}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Invoice {reminderDialog?.invoiceNumber} — {reminderDialog && formatINR(reminderDialog.amount)}</p>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {reminderDialog?.customerEmail && (
              <>
                <Button variant="outline" className="gap-2 justify-start" onClick={() => reminderDialog && handleSendReminder(reminderDialog, "email", "mailto")}>
                  <Mail className="w-4 h-4 text-chart-4" /> Email (mailto)
                </Button>
                <Button variant="outline" className="gap-2 justify-start" onClick={() => reminderDialog && handleSendReminder(reminderDialog, "email", "smtp")}>
                  <Mail className="w-4 h-4 text-primary" /> Email (SMTP)
                </Button>
              </>
            )}
            {reminderDialog?.customerPhone && (
              <>
                <Button variant="outline" className="gap-2 justify-start" onClick={() => reminderDialog && handleSendReminder(reminderDialog, "sms")}>
                  <Phone className="w-4 h-4 text-primary" /> Text Message (SMS)
                </Button>
                <Button variant="outline" className="gap-2 justify-start" onClick={() => reminderDialog && handleSendReminder(reminderDialog, "whatsapp")}>
                  <MessageCircle className="w-4 h-4 text-accent" /> WhatsApp (wa.me)
                </Button>
              </>
            )}
            {(reminderDialog?.customerPhone || reminderDialog?.customerEmail) && (
              <>
                <div className="border-t border-border/50 my-1" />
                <Button
                  variant="default"
                  className="gap-2 justify-start"
                  onClick={() => reminderDialog && handleSendAll(reminderDialog)}
                  disabled={sendAllRunning}
                >
                  <Zap className="w-4 h-4" />
                  {sendAllRunning ? "Sending..." : "Send All (SMS → Email → WhatsApp)"}
                </Button>
                {sendAllRunning && (
                  <Button variant="destructive" size="sm" onClick={() => { stopRef.current = true; }}>
                    Stop (or Ctrl+C)
                  </Button>
                )}
              </>
            )}
            {!reminderDialog?.customerPhone && !reminderDialog?.customerEmail && (
              <p className="text-sm text-destructive">No contact info available for this customer.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={dupDialog} onOpenChange={setDupDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Copy className="w-5 h-5" /> Duplicate Entries ({duplicateIds.size})
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Found {duplicateGroups.length} groups of duplicate invoices where all fields (name, amount, invoice number, due date, status) match exactly.
          </p>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {duplicateGroups.map((group, gi) => {
              const inv = invoices.find((i) => i.id === group[0]);
              return (
                <div key={gi} className="p-2 rounded border border-border/50 bg-secondary/20 text-xs">
                  <span className="font-semibold text-foreground">{inv?.customerName}</span> · {inv?.invoiceNumber} · {formatINR(inv?.amount || 0)} · <span className="text-destructive">{group.length} copies</span>
                </div>
              );
            })}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDupDialog(false)}>Cancel</Button>
            <Button variant="destructive" className="gap-2" onClick={removeDuplicates}>
              <Trash2 className="w-4 h-4" /> Remove {duplicateIds.size} Duplicates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
