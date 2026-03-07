import { useState } from "react";
import { DEMO_CUSTOMERS } from "@/data/mockData";
import type { Customer } from "@/types";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Search, AlertTriangle, CheckCircle, AlertCircle, User } from "lucide-react";

const RISK_CONFIG = {
  low: { color: "bg-accent/10 text-accent border-accent/20", icon: CheckCircle },
  medium: { color: "bg-chart-4/10 text-chart-4 border-chart-4/20", icon: AlertCircle },
  high: { color: "bg-destructive/10 text-destructive border-destructive/20", icon: AlertTriangle },
};

export default function Customers() {
  const [customers] = useState<Customer[]>(DEMO_CUSTOMERS);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const filtered = customers.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === "all" || c.riskLevel === riskFilter;
    return matchSearch && matchRisk;
  });

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">Customers</h1>
        <p className="text-sm text-muted-foreground">{customers.length} customers with AI risk scoring</p>
      </div>

      <div className="flex gap-3 items-center">
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
          return (
            <Card key={c.id} className="p-4 bg-card border-border/50 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] gap-1 ${risk.color}`}>
                  <RiskIcon className="w-3 h-3" />
                  {c.riskLevel}
                </Badge>
              </div>

              {/* Risk score bar */}
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

              <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
                <span>Phone: {c.phone}</span>
                <span className="capitalize">Pref: {c.notificationPreference || "Default"}</span>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
