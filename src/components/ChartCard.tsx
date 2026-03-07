import { useRef } from "react";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ChartConfig } from "@/services/api";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
];

function useChartTheme() {
  const style = getComputedStyle(document.documentElement);
  const get = (v: string) => {
    const val = style.getPropertyValue(v).trim();
    return val ? `hsl(${val})` : undefined;
  };
  return {
    grid: get("--chart-grid") || "#e5e7eb",
    text: get("--chart-text") || "#374151",
    tooltipBg: get("--chart-tooltip-bg") || "#ffffff",
    tooltipBorder: get("--chart-tooltip-border") || "#e5e7eb",
    tooltipText: get("--chart-tooltip-text") || "#111827",
    bg: get("--background") || "#ffffff",
  };
}

interface ChartCardProps {
  config: ChartConfig;
}

export function ChartCard({ config }: ChartCardProps) {
  const ref = useRef<HTMLDivElement>(null);

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
    <div ref={ref} className="glass-card overflow-hidden">
      <div className="p-3 border-b border-border/50 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-foreground">{config.title}</h3>
          <p className="text-[10px] text-muted-foreground">{config.description}</p>
        </div>
        <button
          onClick={handleDownload}
          className="p-1.5 rounded-md hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
          title="Download as PNG"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="p-2">
        <ChartRenderer config={config} />
      </div>
    </div>
  );
}

function ChartRenderer({ config }: { config: ChartConfig }) {
  const theme = useChartTheme();
  const tickStyle = { fontSize: 10, fill: theme.text };
  const tooltipStyle = {
    contentStyle: {
      background: theme.tooltipBg,
      border: `1px solid ${theme.tooltipBorder}`,
      borderRadius: "8px",
      fontSize: "11px",
      color: theme.tooltipText,
    },
  };

  switch (config.type) {
    case "bar":
    case "histogram":
      return (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={config.data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
            <XAxis dataKey={config.xKey} tick={tickStyle} />
            <YAxis tick={tickStyle} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey={config.yKey || "value"} fill={COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    case "pie":
      return (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={config.data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={45}
              paddingAngle={2}
              stroke="none"
            >
              {config.data.map((_: any, i: number) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: "10px", color: theme.text }} />
          </PieChart>
        </ResponsiveContainer>
      );
    case "line":
      return (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={config.data}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
            <XAxis dataKey={config.xKey} tick={tickStyle} />
            <YAxis tick={tickStyle} />
            <Tooltip {...tooltipStyle} />
            <Line type="monotone" dataKey={config.yKey || "value"} stroke={COLORS[0]} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      );
    case "scatter":
      return (
        <ResponsiveContainer width="100%" height={250}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
            <XAxis dataKey={config.xKey} tick={tickStyle} name={config.xKey} />
            <YAxis dataKey={config.yKey} tick={tickStyle} name={config.yKey} />
            <Tooltip {...tooltipStyle} />
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
              <th key={k} className="p-1 text-muted-foreground truncate max-w-[60px]" title={k}>
                {k.slice(0, 8)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {config.data.map((row: any, i: number) => (
            <tr key={i}>
              <td className="p-1 text-muted-foreground truncate max-w-[60px]" title={row.name}>
                {row.name?.slice(0, 8)}
              </td>
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
