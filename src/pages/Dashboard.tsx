import { useState } from "react";
import { DEMO_INVOICES, DEMO_CUSTOMERS, getDashboardStats } from "@/data/mockData";
import { motion } from "framer-motion";
import {
  IndianRupee, FileText, AlertTriangle, CheckCircle, TrendingUp,
  Users, Clock, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(210, 100%, 50%)",
  "hsl(174, 72%, 46%)",
  "hsl(280, 65%, 55%)",
  "hsl(35, 92%, 55%)",
  "hsl(340, 75%, 55%)",
  "hsl(145, 60%, 45%)",
];

export default function Dashboard() {
  const [invoices] = useState(DEMO_INVOICES);
  const [customers] = useState(DEMO_CUSTOMERS);
  const stats = getDashboardStats(invoices);

  const agingData = Object.entries(stats.aging).map(([key, val]) => ({
    name: key + " days",
    amount: val,
  }));

  const statusData = [
    { name: "Paid", value: invoices.filter((i) => i.status === "paid").length },
    { name: "Unpaid", value: invoices.filter((i) => i.status === "unpaid").length },
    { name: "Overdue", value: invoices.filter((i) => i.status === "overdue").length },
    { name: "Partial", value: invoices.filter((i) => i.status === "partial").length },
  ];

  const riskData = [
    { name: "Low", value: customers.filter((c) => c.riskLevel === "low").length, fill: CHART_COLORS[1] },
    { name: "Medium", value: customers.filter((c) => c.riskLevel === "medium").length, fill: CHART_COLORS[3] },
    { name: "High", value: customers.filter((c) => c.riskLevel === "high").length, fill: CHART_COLORS[4] },
  ];

  const recentOverdue = invoices
    .filter((i) => i.status === "overdue")
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
    .slice(0, 5);

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const statCards = [
    { label: "Total Receivables", value: formatINR(stats.totalReceivables), icon: IndianRupee, color: "text-primary", trend: "+12%", up: true },
    { label: "Overdue Invoices", value: stats.overdueInvoices, icon: AlertTriangle, color: "text-destructive", trend: "-3", up: false },
    { label: "Paid Invoices", value: stats.paidInvoices, icon: CheckCircle, color: "text-accent", trend: "+5", up: true },
    { label: "Recovery Rate", value: `${stats.recoveryRate.toFixed(1)}%`, icon: TrendingUp, color: "text-primary", trend: "+2.5%", up: true },
    { label: "Total Customers", value: customers.length, icon: Users, color: "text-foreground" },
    { label: "Avg Delay", value: `${Math.round(customers.reduce((s, c) => s + c.avgPaymentDelay, 0) / customers.length)} days`, icon: Clock, color: "text-muted-foreground" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Payment recovery overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="p-3 bg-card border-border/50">
              <div className="flex items-center justify-between mb-2">
                <s.icon className={`w-4 h-4 ${s.color}`} />
                {s.trend && (
                  <span className={`text-[10px] flex items-center gap-0.5 ${s.up ? "text-accent" : "text-destructive"}`}>
                    {s.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {s.trend}
                  </span>
                )}
              </div>
              <p className="text-lg font-bold text-foreground font-mono">{s.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Aging Report */}
        <Card className="p-4 bg-card border-border/50 col-span-1">
          <h3 className="text-sm font-semibold text-foreground mb-3">Aging Report</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatINR(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="amount" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Invoice Status */}
        <Card className="p-4 bg-card border-border/50 col-span-1">
          <h3 className="text-sm font-semibold text-foreground mb-3">Invoice Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={2} stroke="none">
                {statusData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11, color: "hsl(var(--foreground))" }} />
              <Legend wrapperStyle={{ fontSize: "10px" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Risk Distribution */}
        <Card className="p-4 bg-card border-border/50 col-span-1">
          <h3 className="text-sm font-semibold text-foreground mb-3">Customer Risk</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={riskData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} width={60} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 11, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {riskData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recent overdue */}
      <Card className="p-4 bg-card border-border/50">
        <h3 className="text-sm font-semibold text-foreground mb-3">Recent Overdue Invoices</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Invoice #</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Customer</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Amount</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Due Date</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Reminders</th>
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
    </div>
  );
}
