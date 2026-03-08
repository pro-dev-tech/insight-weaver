import { useState } from "react";
import { useInvoiceData } from "@/contexts/InvoiceDataContext";
import type { Invoice } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Send, FileText, Filter, MessageCircle, Mail, Phone, Upload, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-accent/10 text-accent border-accent/20",
  unpaid: "bg-primary/10 text-primary border-primary/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  partial: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default function Invoices() {
  const { invoices, hasData, addManualInvoice, updateInvoice } = useInvoiceData();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editInv, setEditInv] = useState<Invoice | null>(null);
  const [reminderDialog, setReminderDialog] = useState<Invoice | null>(null);
  const [newInv, setNewInv] = useState({
    customerName: "", customerEmail: "", customerPhone: "",
    invoiceNumber: "", amount: "", dueDate: "",
  });

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
    const matchesSearch = inv.customerName.toLowerCase().includes(search.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

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
    toast.success("Invoice updated");
  };

  const openEdit = (inv: Invoice) => {
    setEditInv({ ...inv });
    setEditOpen(true);
  };

  const handleSendReminder = (inv: Invoice, channel: "whatsapp" | "sms" | "email") => {
    updateInvoice(inv.id, { remindersSent: inv.remindersSent + 1, lastReminderDate: new Date().toISOString().split("T")[0] });
    const upiId = localStorage.getItem("payrecovery_upi_id") || "merchant@upi";
    const companyName = JSON.parse(localStorage.getItem("payrecovery_user") || "{}").companyName || "Our Company";

    if (channel === "whatsapp") {
      const phone = inv.customerPhone.replace(/[^0-9]/g, "");
      const upiLink = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyName)}&am=${inv.amount}&cu=INR&tn=Invoice%20${encodeURIComponent(inv.invoiceNumber)}`;
      const payPageUrl = `${window.location.origin}/pay/${inv.id}`;
      const msg = `Dear ${inv.customerName},\n\nYour invoice ${inv.invoiceNumber} of Rs ${inv.amount.toLocaleString("en-IN")} is overdue.\n\nPay instantly here:\n${upiLink}\n\nor scan the QR to pay:\n${payPageUrl}\n\nThank you.\n${companyName}`;
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
      toast.success(`WhatsApp reminder opened for ${inv.customerName}`);
    } else if (channel === "sms") {
      const phone = inv.customerPhone.replace(/[^0-9]/g, "");
      const msg = `Dear ${inv.customerName}, your invoice ${inv.invoiceNumber} of Rs ${inv.amount.toLocaleString("en-IN")} is pending. Please pay at your earliest. - ${companyName}`;
      window.open(`sms:${phone}?body=${encodeURIComponent(msg)}`, "_blank");
      toast.success(`SMS reminder opened for ${inv.customerName}`);
    } else {
      const subject = `Payment Reminder - Invoice ${inv.invoiceNumber}`;
      const body = `Dear ${inv.customerName},\n\nThis is a reminder from ${companyName} regarding invoice ${inv.invoiceNumber}.\n\nAmount: ₹${inv.amount.toLocaleString("en-IN")}\n\nPlease pay at your earliest convenience.\n\nThank you.\n${companyName}`;
      window.open(`mailto:${inv.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
      toast.success(`Email reminder opened for ${inv.customerName}`);
    }
    setReminderDialog(null);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">{invoices.length} total invoices</p>
        </div>
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
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-card border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                {["Invoice #", "Customer", "Phone", "Email", "Amount", "Paid", "Due Date", "Status", "Reminders", "Actions"].map((h) => (
                  <th key={h} className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr key={inv.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-xs text-foreground flex items-center gap-1.5">
                    <FileText className="w-3 h-3 text-muted-foreground" />{inv.invoiceNumber}
                  </td>
                  <td className="py-2.5 px-3 text-foreground">{inv.customerName}</td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground">{inv.customerPhone || "—"}</td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground">{inv.customerEmail || "—"}</td>
                  <td className="py-2.5 px-3 font-mono text-foreground">{formatINR(inv.amount)}</td>
                  <td className="py-2.5 px-3 font-mono text-foreground">{formatINR(inv.paidAmount)}</td>
                  <td className="py-2.5 px-3 text-xs text-foreground">{inv.dueDate}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[inv.status] || ""}`}>{inv.status}</Badge>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground">{inv.remindersSent}</td>
                  <td className="py-2.5 px-3">
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
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Invoice</DialogTitle></DialogHeader>
          {editInv && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="space-y-1"><Label className="text-xs">Customer Name</Label><Input value={editInv.customerName} onChange={(e) => setEditInv({ ...editInv, customerName: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Invoice #</Label><Input value={editInv.invoiceNumber} onChange={(e) => setEditInv({ ...editInv, invoiceNumber: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Email</Label><Input value={editInv.customerEmail} onChange={(e) => setEditInv({ ...editInv, customerEmail: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Phone</Label><Input value={editInv.customerPhone} onChange={(e) => setEditInv({ ...editInv, customerPhone: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Amount (₹)</Label><Input type="number" value={editInv.amount} onChange={(e) => setEditInv({ ...editInv, amount: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1"><Label className="text-xs">Paid Amount (₹)</Label><Input type="number" value={editInv.paidAmount} onChange={(e) => setEditInv({ ...editInv, paidAmount: parseFloat(e.target.value) || 0 })} /></div>
              <div className="space-y-1"><Label className="text-xs">Due Date</Label><Input type="date" value={editInv.dueDate} onChange={(e) => setEditInv({ ...editInv, dueDate: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Status</Label>
                <Select value={editInv.status} onValueChange={(v: any) => setEditInv({ ...editInv, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <Button onClick={handleEditInvoice} className="w-full mt-3">Save Changes</Button>
        </DialogContent>
      </Dialog>

      {/* Reminder channel dialog */}
      <Dialog open={!!reminderDialog} onOpenChange={() => setReminderDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Send Reminder to {reminderDialog?.customerName}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Invoice {reminderDialog?.invoiceNumber} — {reminderDialog && formatINR(reminderDialog.amount)}</p>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {reminderDialog?.customerPhone && (
              <>
                <Button variant="outline" className="gap-2 justify-start" onClick={() => reminderDialog && handleSendReminder(reminderDialog, "whatsapp")}>
                  <MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp (with UPI link & QR)
                </Button>
                <Button variant="outline" className="gap-2 justify-start" onClick={() => reminderDialog && handleSendReminder(reminderDialog, "sms")}>
                  <Phone className="w-4 h-4 text-blue-500" /> SMS
                </Button>
              </>
            )}
            {reminderDialog?.customerEmail && (
              <Button variant="outline" className="gap-2 justify-start" onClick={() => reminderDialog && handleSendReminder(reminderDialog, "email")}>
                <Mail className="w-4 h-4 text-orange-500" /> Email
              </Button>
            )}
            {!reminderDialog?.customerPhone && !reminderDialog?.customerEmail && (
              <p className="text-sm text-destructive">No contact info available for this customer.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
