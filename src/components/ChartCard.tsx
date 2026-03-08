import { useRef, useState } from "react";
import { Download, Maximize2, X } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ChartConfig } from "@/services/api";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

function getChartTheme() {
  const style = getComputedStyle(document.documentElement);
  const get = (v: string) => {
    const val = style.getPropertyValue(v).trim();
    return val ? `hsl(${val})` : undefined;
  };
  return {
    grid: get("--chart-grid") || "hsl(220, 14%, 88%)",
    text: get("--chart-text") || "hsl(220, 15%, 35%)",
    tooltipBg: get("--chart-tooltip-bg") || "hsl(0, 0%, 100%)",
    tooltipBorder: get("--chart-tooltip-border") || "hsl(220, 14%, 88%)",
    tooltipText: get("--chart-tooltip-text") || "hsl(220, 20%, 10%)",
  };
}

interface ChartCardProps {
  config: ChartConfig;
}

export function ChartCard({ config }: ChartCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  const handleDownload = async () => {
    if (!ref.current) return;
    try {
      const bg = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
      const url = await toPng(ref.current, { backgroundColor: bg ? `hsl(${bg})` : "#ffffff" });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${config.title.replace(/\s+/g, "_")}.png`;
      a.click();
      toast.success("Chart downloaded!");
    } catch {
      toast.error("Download failed");
    }
  };

  return (
    <>
      <div ref={ref} className="glass-card overflow-hidden">
        <div className="p-3 border-b border-border/50 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-foreground">{config.title}</h3>
            <p className="text-[10px] text-muted-foreground">{config.description}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(true)}
              className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Expand chart"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              title="Download as PNG"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="p-2">
          <ChartRenderer config={config} height={250} />
        </div>
      </div>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[85vh] overflow-auto">
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{config.title}</h3>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
            <div className="min-h-[500px]">
              <ChartRenderer config={config} height={500} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 shadow-lg"
      style={{
        backgroundColor: "hsl(var(--popover))",
        borderColor: "hsl(var(--border))",
        color: "hsl(var(--popover-foreground))",
      }}
    >
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

function ChartRenderer({ config, height = 250 }: { config: ChartConfig; height?: number }) {
  const tickStyle = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };

  switch (config.type) {
    case "bar":
    case "histogram":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={config.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xKey} tick={tickStyle} />
            <YAxis tick={tickStyle} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey={config.yKey || "value"} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "pie":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie data={config.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={Math.min(height * 0.35, 120)} innerRadius={Math.min(height * 0.17, 50)} paddingAngle={2} stroke="none">
              {config.data.map((_: any, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "10px", color: "hsl(var(--foreground))" }} />
          </PieChart>
        </ResponsiveContainer>
      );
    case "line":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={config.data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xKey} tick={tickStyle} />
            <YAxis tick={tickStyle} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey={config.yKey || "value"} stroke={COLORS[0]} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    case "scatter":
      return (
        <ResponsiveContainer width="100%" height={height}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey={config.xKey} tick={tickStyle} name={config.xKey} />
            <YAxis dataKey={config.yKey} tick={tickStyle} name={config.yKey} />
            <Tooltip content={<CustomTooltip />} />
            <Scatter data={config.data} fill={COLORS[1]} />
          </ScatterChart>
        </ResponsiveContainer>
      );
    case "heatmap":
      return <HeatmapChart config={config} />;
    default:
      return <p className="text-xs text-muted-foreground p-4">Unsupported chart type</p>;
  }
}

function HeatmapChart({ config }: { config: ChartConfig }) {
  const keys = config.keys || [];
  return (
    <div className="overflow-x-auto p-2">
      <table className="text-[10px] font-mono mx-auto">
        <thead>
          <tr>
            <th className="p-1"></th>
            {keys.map((k) => (
              <th key={k} className="p-1 text-muted-foreground truncate max-w-[60px]" title={k}>{k.slice(0, 8)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {config.data.map((row: any, i: number) => (
            <tr key={i}>
              <td className="p-1 text-muted-foreground truncate max-w-[60px]" title={row.name}>{row.name?.slice(0, 8)}</td>
              {keys.map((k) => {
                const v = row[k] ?? 0;
                const abs = Math.abs(v);
                const hue = v >= 0 ? 210 : 0;
                return (
                  <td
                    key={k}
                    className="p-1 w-8 h-8 text-center rounded-sm"
                    style={{
                      backgroundColor: `hsla(${hue}, 80%, 50%, ${abs * 0.7})`,
                      color: abs > 0.5 ? "white" : "hsl(var(--muted-foreground))",
                    }}
                    title={`${row.name} × ${k}: ${v.toFixed(2)}`}
                  >
                    {v.toFixed(1)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
