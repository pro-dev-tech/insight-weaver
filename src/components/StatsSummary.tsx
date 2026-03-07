import { ColumnStats } from "@/services/api";
import { motion } from "framer-motion";

interface StatsSummaryProps {
  stats: ColumnStats[];
}

function fmt(n: number | undefined) {
  if (n === undefined) return "—";
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toFixed(2);
}

export function StatsSummary({ stats }: StatsSummaryProps) {
  const numericStats = stats.filter((s) => s.type === "numeric");
  const categoricalStats = stats.filter((s) => s.type === "categorical");

  return (
    <div className="space-y-6 animate-slide-up">
      {numericStats.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Numeric Columns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {numericStats.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 space-y-2"
              >
                <h4 className="text-xs font-semibold text-primary truncate" title={s.name}>
                  {s.name}
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    ["Mean", fmt(s.mean)],
                    ["Median", fmt(s.median)],
                    ["Min", fmt(s.min)],
                    ["Max", fmt(s.max)],
                    ["Std Dev", fmt(s.std)],
                    ["Missing", s.missing],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="flex justify-between">
                      <span className="stat-label">{label}</span>
                      <span className="text-xs font-mono text-foreground">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      {categoricalStats.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Categorical Columns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoricalStats.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-4 space-y-2"
              >
                <h4 className="text-xs font-semibold text-accent truncate" title={s.name}>
                  {s.name}
                </h4>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="stat-label">Unique</span>
                    <span className="text-xs font-mono text-foreground">{s.unique}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="stat-label">Missing</span>
                    <span className="text-xs font-mono text-foreground">{s.missing}</span>
                  </div>
                  {s.valueCounts && (
                    <div className="pt-1 space-y-1">
                      {Object.entries(s.valueCounts)
                        .slice(0, 5)
                        .map(([k, v]) => (
                          <div key={k} className="flex items-center gap-2 text-[10px]">
                            <span className="text-muted-foreground truncate flex-1">{k}</span>
                            <span className="font-mono text-foreground">{v}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
