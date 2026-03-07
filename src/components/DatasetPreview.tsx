import { useState, useMemo } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DatasetPreviewProps {
  columns: string[];
  rows: any[];
}

export function DatasetPreview({ columns, rows }: DatasetPreviewProps) {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filteredRows = useMemo(() => {
    let result = rows;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => String(row[col] ?? "").toLowerCase().includes(q))
      );
    }
    if (sortCol) {
      result = [...result].sort((a, b) => {
        const av = a[sortCol] ?? "";
        const bv = b[sortCol] ?? "";
        const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [rows, columns, search, sortCol, sortDir]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };

  return (
    <div className="glass-card overflow-hidden animate-slide-up">
      <div className="p-4 border-b border-border/50 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-foreground">Data Preview</h2>
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search rows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-xs bg-secondary/50 border-border/50"
          />
        </div>
        <span className="text-xs text-muted-foreground font-mono">
          {filteredRows.length} rows
        </span>
      </div>
      <ScrollArea className="h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card z-10">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="px-4 py-2.5 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap border-b border-border/50"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col}
                      <ArrowUpDown className="w-3 h-3 opacity-40" />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border/20 hover:bg-secondary/30 transition-colors"
                >
                  {columns.map((col) => (
                    <td key={col} className="px-4 py-2 whitespace-nowrap font-mono text-foreground/80">
                      {row[col] === null || row[col] === undefined ? (
                        <span className="text-muted-foreground/40 italic">null</span>
                      ) : (
                        String(row[col])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollArea>
    </div>
  );
}
