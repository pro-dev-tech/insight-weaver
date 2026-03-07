import { useState } from "react";
import { DEMO_INVOICES, DEMO_CUSTOMERS, getDashboardStats } from "@/data/mockData";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from "recharts";

const COLORS = [
  "hsl(210, 100%, 50%)", "hsl(174, 72%, 46%)", "hsl(280, 65%, 55%)",
  "hsl(35, 92%, 55%)", "hsl(340, 75%, 55%)", "hsl(145, 60%, 45%)",
];

const tooltipStyle = {
  contentStyle: {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 11,
    color: "hsl(var(--foreground))",
  },
};
const tickStyle = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };

export default function Analytics() {
  const [invoices] = useState(DEMO_INVOICES);
  const [customers] = useState(DEMO_CUSTOMERS);
  const stats = getDashboardStats(invoices);

  const formatINR = (n: number) => `₹${(n / 1000).toFixed(0)}k`;

  // Payment trends (monthly mock)
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const trendData = months.map((m, i) => ({
    month: m,
    collected: Math.round(80000 + Math.random() * 200000),
    outstanding: Math.round(50000 + Math.random() * 150000),
  }));

  // Customer risk distribution
  const riskDist = [
    { name: "Low Risk", value: customers.filter((c) => c.riskLevel === "low").length },
    { name: "Medium Risk", value: customers.filter((c) => c.riskLevel === "medium").length },
    { name: "High Risk", value: customers.filter((c) => c.riskLevel === "high").length },
  ];

  // Source distribution
  const sources: Record<string, number> = {};
  invoices.forEach((inv) => {
    sources[inv.source] = (sources[inv.source] || 0) + 1;
  });
  const sourceData = Object.entries(sources).map(([name, value]) => ({ name, value }));

  // Aging
  const agingData = Object.entries(stats.aging).map(([key, val]) => ({ name: key + " days", amount: val }));

  // Reminder effectiveness (mock)
  const reminderData = [
    { type: "Friendly", sent: 45, paid: 28, rate: 62 },
    { type: "Professional", sent: 30, paid: 15, rate: 50 },
    { type: "Firm", sent: 18, paid: 7, rate: 39 },
    { type: "Escalation", sent: 8, paid: 2, rate: 25 },
  ];

  // Top debtors
  const topDebtors = [...customers].sort((a, b) => b.totalOutstanding - a.totalOutstanding).slice(0, 5);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Receivables analytics and payment trends</p>
      </div>

      <Tabs defaultValue="trends">
        <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
          <TabsTrigger value="aging" className="text-xs">Aging</TabsTrigger>
          <TabsTrigger value="risk" className="text-xs">Risk</TabsTrigger>
          <TabsTrigger value="reminders" className="text-xs">Reminders</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4 bg-card border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-3">Collection vs Outstanding</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={tickStyle} />
                  <YAxis tick={tickStyle} tickFormatter={formatINR} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area type="monotone" dataKey="collected" stackId="1" fill={COLORS[1]} stroke={COLORS[1]} fillOpacity={0.3} name="Collected" />
                  <Area type="monotone" dataKey="outstanding" stackId="2" fill={COLORS[4]} stroke={COLORS[4]} fillOpacity={0.3} name="Outstanding" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-4 bg-card border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-3">Invoice Sources</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2} stroke="none">
                    {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="aging" className="mt-4 space-y-4">
          <Card className="p-4 bg-card border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3">Aging Report</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={tickStyle} />
                <YAxis tick={tickStyle} tickFormatter={formatINR} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                <Bar dataKey="amount" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4 bg-card border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-3">Risk Distribution</h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={riskDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={3} stroke="none">
                    <Cell fill={COLORS[1]} />
                    <Cell fill={COLORS[3]} />
                    <Cell fill={COLORS[4]} />
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-4 bg-card border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-3">Top Debtors</h3>
              <div className="space-y-3">
                {topDebtors.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">Risk: {(c.riskScore * 100).toFixed(0)}%</p>
                    </div>
                    <span className="text-sm font-mono font-bold text-foreground">
                      ₹{c.totalOutstanding.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reminders" className="mt-4 space-y-4">
          <Card className="p-4 bg-card border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3">Reminder Effectiveness</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reminderData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="type" tick={tickStyle} />
                <YAxis tick={tickStyle} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="sent" fill={COLORS[0]} name="Sent" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" fill={COLORS[1]} name="Resulted in Payment" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
