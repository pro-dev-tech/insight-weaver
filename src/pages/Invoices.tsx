import { useState } from "react";
import { DEMO_INVOICES } from "@/data/mockData";
import type { Invoice } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Send, FileText, Filter } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-accent/10 text-accent border-accent/20",
  unpaid: "bg-primary/10 text-primary border-primary/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  partial: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export default function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>(DEMO_INVOICES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [newInv, setNewInv] = useState({
    customerName: "", customerEmail: "", customerPhone: "",
    invoiceNumber: "", amount: "", dueDate: "",
  });

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
      toast.error("Fill all required fields");
      return;
    }
    const inv: Invoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber: newInv.invoiceNumber,
      customerName: newInv.customerName,
      customerPhone: newInv.customerPhone,
      customerEmail: newInv.customerEmail,
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: newInv.dueDate,
      amount: parseFloat(newInv.amount),
      paidAmount: 0,
      status: "unpaid",
      source: "manual",
      remindersSent: 0,
      createdAt: new Date().toISOString(),
    };
    setInvoices((prev) => [inv, ...prev]);
    setAddOpen(false);
    setNewInv({ customerName: "", customerEmail: "", customerPhone: "", invoiceNumber: "", amount: "", dueDate: "" });
    toast.success("Invoice added");
  };

  const handleSendReminder = (inv: Invoice) => {
    setInvoices((prev) =>
      prev.map((i) =>
        i.id === inv.id ? { ...i, remindersSent: i.remindersSent + 1, lastReminderDate: new Date().toISOString().split("T")[0] } : i
      )
    );
    toast.success(`Reminder sent to ${inv.customerName}`);
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

      {/* Filters */}
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

      {/* Table */}
      <Card className="bg-card border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-secondary/30">
                {["Invoice #", "Customer", "Amount", "Paid", "Due Date", "Status", "Source", "Reminders", "Actions"].map((h) => (
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
                  <td className="py-2.5 px-3 font-mono text-foreground">{formatINR(inv.amount)}</td>
                  <td className="py-2.5 px-3 font-mono text-foreground">{formatINR(inv.paidAmount)}</td>
                  <td className="py-2.5 px-3 text-xs text-foreground">{inv.dueDate}</td>
                  <td className="py-2.5 px-3">
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[inv.status] || ""}`}>
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground capitalize">{inv.source}</td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground">{inv.remindersSent}</td>
                  <td className="py-2.5 px-3">
                    {inv.status !== "paid" && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => handleSendReminder(inv)}>
                        <Send className="w-3 h-3" /> Remind
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">No invoices found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
