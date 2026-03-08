import { useState } from "react";
import { useInvoiceData } from "@/contexts/InvoiceDataContext";
import type { Customer } from "@/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, AlertTriangle, CheckCircle, AlertCircle, User, Upload, Brain, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

function formatAiExplanation(text: string) {
  if (!text) return <p className="text-sm text-muted-foreground">No analysis available.</p>;

  const sections: { icon: React.ReactNode; title: string; content: string }[] = [];
  const lines = text.split("\n").filter((l) => l.trim());

  let currentTitle = "";
  let currentContent: string[] = [];

  const flushSection = () => {
    if (currentTitle || currentContent.length) {
      sections.push({
        icon: currentTitle.toLowerCase().includes("risk") ? <AlertTriangle className="w-4 h-4 text-chart-4" /> :
              currentTitle.toLowerCase().includes("recommend") ? <CheckCircle className="w-4 h-4 text-accent" /> :
              currentTitle.toLowerCase().includes("pattern") ? <TrendingUp className="w-4 h-4 text-chart-2" /> :
              <Info className="w-4 h-4 text-primary" />,
        title: currentTitle || "Insight",
        content: currentContent.join("\n"),
      });
      currentTitle = "";
      currentContent = [];
    }
  };

  for (const line of lines) {
    const cleaned = line.replace(/^[\d]+[\.\)]\s*/, "").replace(/^\*\*/, "").replace(/\*\*$/, "").replace(/\*\*/g, "").trim();
    const isHeader = /^[\d]+[\.\)]/.test(line.trim()) || (line.startsWith("**") && line.endsWith("**")) || line.startsWith("📌") || line.startsWith("# ");

    if (isHeader) {
      flushSection();
      currentTitle = cleaned;
    } else {
      currentContent.push(cleaned);
    }
  }
  flushSection();

  if (sections.length === 0) {
    return <div className="text-sm text-foreground bg-secondary/20 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">{text}</div>;
  }

  return (
    <>
      {sections.map((s, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
          <div className="p-1.5 rounded-md bg-secondary flex-shrink-0 mt-0.5">{s.icon}</div>
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">{s.title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{s.content}</p>
          </div>
        </div>
      ))}
    </>
  );
}

const RISK_CONFIG = {
  low: { color: "bg-accent/10 text-accent border-accent/20", icon: CheckCircle, label: "Low Risk" },
  medium: { color: "bg-chart-4/10 text-chart-4 border-chart-4/20", icon: AlertCircle, label: "Medium Risk" },
  high: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle, label: "High Risk" },
};

export default function Customers() {
  const { customers, invoices, hasData } = useInvoiceData();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);

  if (!hasData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center space-y-4 max-w-md bg-card border-border/50">
          <User className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h2 className="text-lg font-bold text-foreground">No Customers</h2>
          <p className="text-sm text-muted-foreground">Upload an invoice file to automatically generate customer profiles with risk scoring.</p>
          <Button onClick={() => navigate("/upload")} className="gap-2">
            <Upload className="w-4 h-4" /> Go to Upload
          </Button>
        </Card>
      </div>
    );
  }

  const filtered = customers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === "all" || c.riskLevel === riskFilter;
    return matchSearch && matchRisk;
  });

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const handleRiskExplain = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setAiExplanation("");
    setAiLoading(true);

    const customerInvoices = invoices.filter(
      (i) => i.customerName.toLowerCase() === customer.name.toLowerCase()
    );

    try {
      const response = await fetch("http://localhost:3001/api/ai/risk-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: customer.name,
            totalInvoices: customer.totalInvoices,
            totalOutstanding: customer.totalOutstanding,
            totalPaid: customer.totalPaid,
            avgPaymentDelay: customer.avgPaymentDelay,
            riskScore: customer.riskScore,
            riskLevel: customer.riskLevel,
          },
          invoices: customerInvoices.map((i) => ({
            invoiceNumber: i.invoiceNumber,
            amount: i.amount,
            paidAmount: i.paidAmount,
            status: i.status,
            invoiceDate: i.invoiceDate,
            dueDate: i.dueDate,
            remindersSent: i.remindersSent,
          })),
        }),
      });

      if (!response.ok) throw new Error("AI service unavailable");
      const data = await response.json();
      setAiExplanation(data.explanation || "Unable to generate explanation.");
    } catch {
      // Fallback local explanation
      const reasons: string[] = [];
      if (customer.avgPaymentDelay > 30) reasons.push(`High average payment delay of ${customer.avgPaymentDelay} days indicates consistent late payments.`);
      else if (customer.avgPaymentDelay > 15) reasons.push(`Moderate payment delay of ${customer.avgPaymentDelay} days.`);
      else reasons.push(`Payment delay of ${customer.avgPaymentDelay} days is within acceptable range.`);

      const outRatio = customer.totalOutstanding / Math.max(1, customer.totalOutstanding + customer.totalPaid);
      if (outRatio > 0.6) reasons.push(`${(outRatio * 100).toFixed(0)}% of total invoiced amount remains outstanding — significant exposure.`);
      else if (outRatio > 0.3) reasons.push(`${(outRatio * 100).toFixed(0)}% outstanding balance is moderate.`);
      else reasons.push(`Only ${(outRatio * 100).toFixed(0)}% outstanding — good payment track record.`);

      const overdueCount = customerInvoices.filter((i) => i.status === "overdue").length;
      if (overdueCount > 0) reasons.push(`${overdueCount} invoice(s) currently overdue.`);

      reasons.push(`Risk score: ${(customer.riskScore * 100).toFixed(0)}% — classified as ${customer.riskLevel.toUpperCase()} risk.`);

      if (customer.riskLevel === "high") {
        reasons.push("\n📌 Recommendation: Escalate reminders, consider reducing credit limits, and require advance payments for new orders.");
      } else if (customer.riskLevel === "medium") {
        reasons.push("\n📌 Recommendation: Increase reminder frequency and monitor closely for any deterioration in payment patterns.");
      } else {
        reasons.push("\n📌 Recommendation: Continue standard terms. This is a reliable customer.");
      }

      setAiExplanation(reasons.join("\n\n"));
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Customers</h1>
        <p className="text-sm text-muted-foreground">{customers.length} customers with AI risk scoring</p>
      </div>

      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={riskFilter} onValueChange={setRiskFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Risk Level" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risk</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((c) => {
          const risk = RISK_CONFIG[c.riskLevel];
          const RiskIcon = risk.icon;
          const customerInvoices = invoices.filter(
            (i) => i.customerName.toLowerCase() === c.name.toLowerCase()
          );

          return (
            <Card key={c.id} className="p-4 bg-card border-border/50 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.email || "No email"}</p>
                  </div>
                </div>
                <button onClick={() => handleRiskExplain(c)}>
                  <Badge variant="outline" className={`text-[10px] gap-1 cursor-pointer hover:opacity-80 transition-opacity ${risk.color}`}>
                    <RiskIcon className="w-3 h-3" />
                    {c.riskLevel}
                  </Badge>
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-muted-foreground">Risk Score</span>
                  <span className="text-xs font-mono font-bold text-foreground">{(c.riskScore * 100).toFixed(0)}%</span>
                </div>
                <Progress value={c.riskScore * 100} className="h-1.5" />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-secondary/30 rounded-lg p-2">
                  <p className="text-muted-foreground text-[10px]">Outstanding</p>
                  <p className="font-mono font-semibold text-foreground">{formatINR(c.totalOutstanding)}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2">
                  <p className="text-muted-foreground text-[10px]">Total Paid</p>
                  <p className="font-mono font-semibold text-foreground">{formatINR(c.totalPaid)}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2">
                  <p className="text-muted-foreground text-[10px]">Invoices</p>
                  <p className="font-mono font-semibold text-foreground">{c.totalInvoices}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2">
                  <p className="text-muted-foreground text-[10px]">Avg Delay</p>
                  <p className="font-mono font-semibold text-foreground">{c.avgPaymentDelay} days</p>
                </div>
              </div>

              {/* Scrollable invoice list */}
              <ScrollArea className="max-h-32">
                <div className="space-y-1">
                  {customerInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between text-[10px] px-1 py-0.5 rounded bg-secondary/20">
                      <span className="font-mono text-foreground">{inv.invoiceNumber}</span>
                      <span className="text-muted-foreground">{formatINR(inv.amount)}</span>
                      <Badge variant="outline" className={`text-[8px] px-1 py-0 ${STATUS_COLORS[inv.status] || ""}`}>{inv.status}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                <span>Phone: {c.phone || "—"}</span>
                <span className="capitalize">Pref: {c.notificationPreference || "Default"}</span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* AI Risk Explanation Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Risk Analysis — {selectedCustomer?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`${RISK_CONFIG[selectedCustomer.riskLevel].color}`}>
                  {selectedCustomer.riskLevel.toUpperCase()} RISK
                </Badge>
                <span className="text-sm font-mono font-bold text-foreground">{(selectedCustomer.riskScore * 100).toFixed(0)}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-secondary/30 rounded-lg p-2 text-center">
                  <p className="text-muted-foreground text-[10px]">Outstanding</p>
                  <p className="font-mono font-semibold text-foreground">{formatINR(selectedCustomer.totalOutstanding)}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2 text-center">
                  <p className="text-muted-foreground text-[10px]">Total Paid</p>
                  <p className="font-mono font-semibold text-foreground">{formatINR(selectedCustomer.totalPaid)}</p>
                </div>
                <div className="bg-secondary/30 rounded-lg p-2 text-center">
                  <p className="text-muted-foreground text-[10px]">Avg Delay</p>
                  <p className="font-mono font-semibold text-foreground">{selectedCustomer.avgPaymentDelay}d</p>
                </div>
              </div>
              <div className="border-t border-border/50 pt-3">
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4" /> AI Analysis
                </h4>
                {aiLoading ? (
                  <div className="flex items-center gap-2 py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Analyzing payment patterns...</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formatAiExplanation(aiExplanation)}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-accent/10 text-accent border-accent/20",
  unpaid: "bg-primary/10 text-primary border-primary/20",
  overdue: "bg-destructive/10 text-destructive border-destructive/20",
  partial: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};
