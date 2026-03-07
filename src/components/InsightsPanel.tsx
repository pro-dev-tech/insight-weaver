import { Insight } from "@/services/api";
import { motion } from "framer-motion";
import { Info, AlertTriangle, TrendingUp, BarChart3 } from "lucide-react";

interface InsightsPanelProps {
  insights: Insight[];
}

const iconMap = {
  info: Info,
  warning: AlertTriangle,
  correlation: TrendingUp,
  distribution: BarChart3,
};

const colorMap = {
  info: "text-chart-1 bg-chart-1/10",
  warning: "text-chart-4 bg-chart-4/10",
  correlation: "text-chart-2 bg-chart-2/10",
  distribution: "text-chart-3 bg-chart-3/10",
};

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="glass-card p-4 animate-slide-up">
      <h2 className="text-sm font-semibold text-foreground mb-3">Auto-Generated Insights</h2>
      <div className="space-y-2">
        {insights.map((insight, i) => {
          const Icon = iconMap[insight.type] || Info;
          const color = colorMap[insight.type] || colorMap.info;
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className={`p-1.5 rounded-md flex-shrink-0 ${color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{insight.message}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
