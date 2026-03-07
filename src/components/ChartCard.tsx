import { useRef } from "react";
import { Download } from "lucide-react";
import { toPng } from "html-to-image";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ChartConfig } from "@/services/api";

const COLORS = [
  "hsl(210 100% 56%)",
  "hsl(174 72% 46%)",
  "hsl(280 65% 60%)",
  "hsl(35 92% 60%)",
  "hsl(340 75% 58%)",
  "hsl(145 60% 48%)",
];

const tooltipStyle = {
  contentStyle: {
    background: "hsl(220 18% 10%)",
    border: "1px solid hsl(220 14% 18%)",
    borderRadius: "8px",
    fontSize: "11px",
    color: "hsl(210 20% 92%)",
  },
};

interface ChartCardProps {
  config: ChartConfig;
}

export function ChartCard({ config }: ChartCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!ref.current) return;
    try {
      const url = await toPng(ref.current, { backgroundColor: "hsl(220,18%,10%)" });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${config.title.replace(/\s+/g, "_")}.png`;
      a.click();
      toast.success("Chart downloaded!");
    } catch {
      toast.error("Download failed");
    }
  };

  const renderChart = () => {
    switch (config.type) {
      case "bar":
      case "histogram":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={config.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
              <XAxis dataKey={config.xKey} tick={{ fontSize: 10, fill: "hsl(215 12% 52%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215 12% 52%)" }} />
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
              <Legend wrapperStyle={{ fontSize: "10px", color: "hsl(215 12% 52%)" }} />
            </PieChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={config.data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
              <XAxis dataKey={config.xKey} tick={{ fontSize: 10, fill: "hsl(215 12% 52%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(215 12% 52%)" }} />
              <Tooltip {...tooltipStyle} />
              <Line
                type="monotone"
                dataKey={config.yKey || "value"}
                stroke={COLORS[0]}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
              <XAxis dataKey={config.xKey} tick={{ fontSize: 10, fill: "hsl(215 12% 52%)" }} name={config.xKey} />
              <YAxis dataKey={config.yKey} tick={{ fontSize: 10, fill: "hsl(215 12% 52%)" }} name={config.yKey} />
              <Tooltip {...tooltipStyle} />
              <Scatter data={config.data} fill={COLORS[1]} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case "heatmap":
        // Render as a simple colored grid
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
                            color: abs > 0.5 ? "white" : "hsl(215 12% 52%)",
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
      default:
        return <p className="text-xs text-muted-foreground p-4">Unsupported chart type</p>;
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
      <div className="p-2">{renderChart()}</div>
    </div>
  );
}
