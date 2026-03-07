import { DatasetMeta } from "@/services/api";
import { Database, Columns, FileText, HardDrive } from "lucide-react";

interface DatasetInfoProps {
  meta: DatasetMeta;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export function DatasetInfo({ meta }: DatasetInfoProps) {
  const items = [
    { icon: FileText, label: "File", value: meta.fileName },
    { icon: HardDrive, label: "Size", value: formatBytes(meta.fileSize) },
    { icon: Database, label: "Rows", value: meta.totalRows.toLocaleString() },
    { icon: Columns, label: "Columns", value: meta.totalColumns.toString() },
  ];

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Dataset Info
      </h3>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            <item.icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">{item.label}</span>
            <span className="ml-auto text-foreground font-mono truncate max-w-[120px]" title={item.value}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
      <div className="pt-2 space-y-1">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Columns
        </h4>
        {meta.columns.map((col) => (
          <div key={col.name} className="flex items-center gap-2 text-xs py-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                col.type === "numeric"
                  ? "bg-chart-1"
                  : col.type === "datetime"
                  ? "bg-chart-2"
                  : "bg-chart-4"
              }`}
            />
            <span className="text-foreground truncate" title={col.name}>
              {col.name}
            </span>
            <span className="ml-auto text-muted-foreground font-mono text-[10px]">
              {col.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
