import { FileUpload } from "@/components/FileUpload";
import { DatasetInfo } from "@/components/DatasetInfo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DatasetMeta } from "@/services/api";
import { Download, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardSidebarProps {
  meta: DatasetMeta | null;
  onUpload: (file: File) => void;
  onExport: () => void;
  uploading: boolean;
  uploadProgress: number;
  error: string | null;
}

export function DashboardSidebar({
  meta,
  onUpload,
  onExport,
  uploading,
  uploadProgress,
  error,
}: DashboardSidebarProps) {
  return (
    <aside className="w-72 flex-shrink-0 border-r border-border/50 bg-card/30 flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-border/50 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-primary" />
        </div>
        <h1 className="text-sm font-bold gradient-text">DataLens</h1>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Upload Dataset
            </h3>
            <FileUpload
              onUpload={onUpload}
              uploading={uploading}
              progress={uploadProgress}
              error={error}
            />
          </div>
          {meta && (
            <>
              <DatasetInfo meta={meta} />
              <Button
                onClick={onExport}
                variant="outline"
                size="sm"
                className="w-full text-xs gap-2 border-border/50 hover:bg-secondary/50"
              >
                <Download className="w-3.5 h-3.5" />
                Export Cleaned CSV
              </Button>
            </>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
