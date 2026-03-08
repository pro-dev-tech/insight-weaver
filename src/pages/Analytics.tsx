import { useState } from "react";
import { useInvoiceData } from "@/contexts/InvoiceDataContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Upload, Maximize2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from "recharts";

const COLORS = [
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

const tickStyle = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };

export default function Analytics() {
  const { invoices, customers, hasData } = useInvoiceData();
  const navigate = useNavigate();
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  if (!hasData) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center space-y-4 max-w-md bg-card border-border/50">
          <Upload className="w-12 h-12 text-muted-foreground/40 mx-auto" />
          <h2 className="text-lg font-bold text-foreground">No Analytics Data</h2>
          <p className="text-sm text-muted-foreground">Upload invoices to generate analytics and insights.</p>
          <Button onClick={() => navigate("/upload")} className="gap-2">
            <Upload className="w-4 h-4" /> Go to Upload
          </Button>
        </Card>
      </div>
    );
  }

  const formatINR = (n: number) => `₹${(n / 1000).toFixed(0)}k`;

  // Build real trend data from invoices grouped by month
  const monthMap = new Map<string, { collected: number; outstanding: number }>();
  invoices.forEach((inv) => {
    const month = inv.invoiceDate?.slice(0, 7) || "Unknown";
    if (!monthMap.has(month)) monthMap.set(month, { collected: 0, outstanding: 0 });
    const entry = monthMap.get(month)!;
    entry.collected += inv.paidAmount;
    entry.outstanding += Math.max(0, inv.amount - inv.paidAmount);
  });
  const trendData = Array.from(monthMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => ({ month, ...data }));

  const riskDist = [
    { name: "Low Risk", value: customers.filter((c) => c.riskLevel === "low").length },
    { name: "Medium Risk", value: customers.filter((c) => c.riskLevel === "medium").length },
    { name: "High Risk", value: customers.filter((c) => c.riskLevel === "high").length },
  ].filter((d) => d.value > 0);

  const sources: Record<string, number> = {};
  invoices.forEach((inv) => { sources[inv.source] = (sources[inv.source] || 0) + 1; });
  const sourceData = Object.entries(sources).map(([name, value]) => ({ name, value }));

  const aging: Record<string, number> = { "0-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
  const now = Date.now();
  invoices.forEach((inv) => {
    if (inv.status === "paid") return;
    const d = Math.max(0, Math.floor((now - new Date(inv.dueDate).getTime()) / 86400000));
    const out = inv.amount - inv.paidAmount;
    if (d <= 30) aging["0-30"] += out;
    else if (d <= 60) aging["31-60"] += out;
    else if (d <= 90) aging["61-90"] += out;
    else aging["90+"] += out;
  });
  const agingData = Object.entries(aging).map(([key, val]) => ({ name: key + " days", amount: val }));

  // Reminder stats from actual data
  const reminderData = (() => {
    const buckets = [
      { type: "0 reminders", sent: 0, paid: 0 },
      { type: "1 reminder", sent: 0, paid: 0 },
      { type: "2-3 reminders", sent: 0, paid: 0 },
      { type: "4+ reminders", sent: 0, paid: 0 },
    ];
    invoices.forEach((inv) => {
      const idx = inv.remindersSent === 0 ? 0 : inv.remindersSent === 1 ? 1 : inv.remindersSent <= 3 ? 2 : 3;
      buckets[idx].sent++;
      if (inv.status === "paid") buckets[idx].paid++;
    });
    return buckets;
  })();

  const topDebtors = [...customers].sort((a, b) => b.totalOutstanding - a.totalOutstanding).slice(0, 5);

  const renderChart = (chartId: string, height: number) => {
    switch (chartId) {
      case "trend":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={tickStyle} />
              <YAxis tick={tickStyle} tickFormatter={formatINR} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: "hsl(var(--foreground))" }} />
              <Area type="monotone" dataKey="collected" stackId="1" fill={COLORS[1]} stroke={COLORS[1]} fillOpacity={0.3} name="Collected" />
              <Area type="monotone" dataKey="outstanding" stackId="2" fill={COLORS[4]} stroke={COLORS[4]} fillOpacity={0.3} name="Outstanding" />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "sources":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={height * 0.35} innerRadius={height * 0.17} paddingAngle={2} stroke="none">
                {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: "hsl(var(--foreground))" }} />
            </PieChart>
          </ResponsiveContainer>
        );
      case "aging":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={agingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={tickStyle} />
              <YAxis tick={tickStyle} tickFormatter={formatINR} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case "risk":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie data={riskDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={height * 0.35} innerRadius={height * 0.17} paddingAngle={3} stroke="none">
                <Cell fill={COLORS[1]} />
                <Cell fill={COLORS[3]} />
                <Cell fill={COLORS[4]} />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: "hsl(var(--foreground))" }} />
            </PieChart>
          </ResponsiveContainer>
        );
      case "reminders":
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={reminderData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="type" tick={tickStyle} />
              <YAxis tick={tickStyle} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="sent" fill={COLORS[0]} name="Total" radius={[4, 4, 0, 0]} />
              <Bar dataKey="paid" fill={COLORS[1]} name="Paid" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Receivables analytics from {invoices.length} invoices</p>
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
            {[
              { id: "trend", title: "Collection vs Outstanding" },
              { id: "sources", title: "Invoice Sources" },
            ].map((chart) => (
              <Card key={chart.id} className="p-4 bg-card border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground">{chart.title}</h3>
                  <button onClick={() => setExpandedChart(chart.id)} className="p-1 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {renderChart(chart.id, 280)}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="aging" className="mt-4">
          <Card className="p-4 bg-card border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Aging Report</h3>
              <button onClick={() => setExpandedChart("aging")} className="p-1 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {renderChart("aging", 300)}
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4 bg-card border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-foreground">Risk Distribution</h3>
                <button onClick={() => setExpandedChart("risk")} className="p-1 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {renderChart("risk", 280)}
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
                {topDebtors.length === 0 && <p className="text-sm text-muted-foreground">No outstanding debts.</p>}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reminders" className="mt-4">
          <Card className="p-4 bg-card border-border/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Reminder Effectiveness</h3>
              <button onClick={() => setExpandedChart("reminders")} className="p-1 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {renderChart("reminders", 300)}
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!expandedChart} onOpenChange={() => setExpandedChart(null)}>
        <DialogContent className="max-w-3xl w-[85vw]">
          <h3 className="text-lg font-semibold text-foreground mb-4">Expanded View</h3>
          {expandedChart && renderChart(expandedChart, 450)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
