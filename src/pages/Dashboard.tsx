import { useState, useEffect } from "react";
import { useInvoiceData } from "@/contexts/InvoiceDataContext";
import { motion } from "framer-motion";
import {
  IndianRupee, AlertTriangle, CheckCircle, TrendingUp,
  Users, Clock, Upload, Maximize2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useNavigate, useLocation } from "react-router-dom";
import { AppTour } from "@/components/AppTour";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip,
} from "recharts";

const CHART_COLORS = [
  "hsl(210, 100%, 50%)", "hsl(174, 72%, 46%)", "hsl(280, 65%, 55%)",
  "hsl(35, 92%, 55%)", "hsl(340, 75%, 55%)", "hsl(145, 60%, 45%)",
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border px-3 py-2 shadow-lg" style={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", color: "hsl(var(--popover-foreground))" }}>
      {label && <p className="text-xs font-medium mb-1" style={{ color: "hsl(var(--foreground))" }}>{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
          <span style={{ color: "hsl(var(--muted-foreground))" }}>{entry.name || entry.dataKey}:</span>
          <span className="font-mono font-medium" style={{ color: "hsl(var(--foreground))" }}>
            {typeof entry.value === "number" ? entry.value.toLocaleString("en-IN") : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { invoices, customers, hasData } = useInvoiceData();
  const navigate = useNavigate();
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  if (!hasData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center space-y-4 max-w-md bg-card border-border/50">
          <Upload className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h2 className="text-lg font-bold text-foreground">No Data Yet</h2>
          <p className="text-sm text-muted-foreground">Upload an invoice file (CSV/Excel) to populate your dashboard with real data.</p>
          <Button onClick={() => navigate("/upload")} className="gap-2">
            <Upload className="w-4 h-4" /> Go to Upload
          </Button>
        </Card>
      </div>
    );
  }

  const stats = (() => {
    const totalReceivables = invoices.reduce((s, i) => s + (i.amount - i.paidAmount), 0);
    const overdueInvoices = invoices.filter((i) => i.status === "overdue").length;
    const paidInvoices = invoices.filter((i) => i.status === "paid").length;
    const totalInvoices = invoices.length;
    const recoveryRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;
    const aging: Record<string, number> = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
    const now = Date.now();
    invoices.forEach((inv) => {
      if (inv.status === "paid") return;
      const due = new Date(inv.dueDate).getTime();
      const d = Math.max(0, Math.floor((now - due) / 86400000));
      const out = inv.amount - inv.paidAmount;
      if (d <= 30) aging["0-30"] += out;
      else if (d <= 60) aging["31-60"] += out;
      else if (d <= 90) aging["61-90"] += out;
      else aging["90+"] += out;
    });
    return { totalReceivables, overdueInvoices, paidInvoices, totalInvoices, recoveryRate, aging };
  })();

  const agingData = Object.entries(stats.aging).map(([key, val]) => ({ name: key + " days", amount: val }));
  const statusData = [
    { name: "Paid", value: invoices.filter((i) => i.status === "paid").length },
    { name: "Unpaid", value: invoices.filter((i) => i.status === "unpaid").length },
    { name: "Overdue", value: invoices.filter((i) => i.status === "overdue").length },
    { name: "Partial", value: invoices.filter((i) => i.status === "partial").length },
  ].filter((d) => d.value > 0);
  const riskData = [
    { name: "Low", value: customers.filter((c) => c.riskLevel === "low").length, fill: CHART_COLORS[1] },
    { name: "Medium", value: customers.filter((c) => c.riskLevel === "medium").length, fill: CHART_COLORS[3] },
    { name: "High", value: customers.filter((c) => c.riskLevel === "high").length, fill: CHART_COLORS[4] },
  ].filter((d) => d.value > 0);

  const recentOverdue = invoices
    .filter((i) => i.status === "overdue")
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 5);

  const formatINR = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const avgDelay = customers.length > 0 ? Math.round(customers.reduce((s, c) => s + c.avgPaymentDelay, 0) / customers.length) : 0;

  const statCards = [
    { label: "Total Receivables", value: formatINR(stats.totalReceivables), icon: IndianRupee, color: "text-primary" },
    { label: "Overdue Invoices", value: stats.overdueInvoices, icon: AlertTriangle, color: "text-destructive" },
    { label: "Paid Invoices", value: stats.paidInvoices, icon: CheckCircle, color: "text-accent" },
    { label: "Recovery Rate", value: `${stats.recoveryRate.toFixed(1)}%`, icon: TrendingUp, color: "text-primary" },
    { label: "Total Customers", value: customers.length, icon: Users, color: "text-foreground" },
    { label: "Avg Delay", value: `${avgDelay} days`, icon: Clock, color: "text-muted-foreground" },
  ];

  const tickStyle = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };

  const renderChart = (chartId: string, height: number) => {
    if (chartId === "aging") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={agingData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" tick={tickStyle} />
            <YAxis tick={tickStyle} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="amount" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    }
    if (chartId === "status") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={height * 0.35} innerRadius={height * 0.18} paddingAngle={2} stroke="none">
              {statusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "10px", color: "hsl(var(--foreground))" }} />
          </PieChart>
        </ResponsiveContainer>
      );
    }
    if (chartId === "risk") {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={riskData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" tick={tickStyle} />
            <YAxis type="category" dataKey="name" tick={tickStyle} width={60} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {riskData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }
    return null;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Payment recovery overview — {invoices.length} invoices from uploaded data</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-3 bg-card border-border/50">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-lg font-bold text-foreground font-mono">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { id: "aging", title: "Aging Report" },
          { id: "status", title: "Invoice Status" },
          { id: "risk", title: "Customer Risk" },
        ].map((chart) => (
          <Card key={chart.id} className="p-4 bg-card border-border/50 col-span-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">{chart.title}</h3>
              <button onClick={() => setExpandedChart(chart.id)} className="p-1 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {renderChart(chart.id, 200)}
          </Card>
        ))}
      </div>

      {recentOverdue.length > 0 && (
        <Card className="p-4 bg-card border-border/50">
          <h3 className="text-sm font-semibold text-foreground mb-3">Recent Overdue Invoices</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  {["Invoice #", "Customer", "Amount", "Due Date", "Reminders"].map((h) => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOverdue.map((inv) => (
                  <tr key={inv.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-xs text-foreground">{inv.invoiceNumber}</td>
                    <td className="py-2.5 px-3 text-foreground">{inv.customerName}</td>
                    <td className="py-2.5 px-3 font-mono text-foreground">{formatINR(inv.amount)}</td>
                    <td className="py-2.5 px-3 text-destructive text-xs">{inv.dueDate}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">{inv.remindersSent} sent</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={!!expandedChart} onOpenChange={() => setExpandedChart(null)}>
        <DialogContent className="max-w-3xl w-[85vw]">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {expandedChart === "aging" ? "Aging Report" : expandedChart === "status" ? "Invoice Status" : "Customer Risk"}
          </h3>
          {expandedChart && renderChart(expandedChart, 450)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
