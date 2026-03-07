import { useDataset } from "@/hooks/useDataset";
import { DatasetPreview } from "@/components/DatasetPreview";
import { ChartCard } from "@/components/ChartCard";
import { StatsSummary } from "@/components/StatsSummary";
import { InsightsPanel } from "@/components/InsightsPanel";
import { FileUpload } from "@/components/FileUpload";
import { DatasetInfo } from "@/components/DatasetInfo";
import { motion } from "framer-motion";
import { BarChart3, Loader2, Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default function UploadPage() {
  const {
    meta, preview, stats, charts, insights,
    uploading, uploadProgress, loading, error,
    handleUpload, handleExport,
  } = useDataset();

  const hasData = meta && preview;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Upload & Parse</h1>
        <p className="text-sm text-muted-foreground">Upload CSV, Excel, or PDF invoices for automatic parsing and analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload zone */}
        <div className="space-y-4">
          <FileUpload onUpload={handleUpload} uploading={uploading} progress={uploadProgress} error={error} />
          {meta && (
            <>
              <DatasetInfo meta={meta} />
              <Button onClick={handleExport} variant="outline" size="sm" className="w-full text-xs gap-2">
                <Download className="w-3.5 h-3.5" /> Export Cleaned CSV
              </Button>
            </>
          )}
        </div>

        {/* Results */}
        <div className="lg:col-span-2">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Analyzing dataset...</p>
              </div>
            </div>
          )}

          {!hasData && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-64">
              <div className="text-center space-y-3 max-w-xs">
                <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">Upload a file to see parsed data, charts, and insights here</p>
              </div>
            </motion.div>
          )}

          {hasData && !loading && (
            <Tabs defaultValue="charts" className="w-full">
              <TabsList className="bg-secondary/50 border border-border/50">
                <TabsTrigger value="charts" className="text-xs">Charts</TabsTrigger>
                <TabsTrigger value="data" className="text-xs">Data</TabsTrigger>
                <TabsTrigger value="stats" className="text-xs">Stats</TabsTrigger>
                <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
              </TabsList>
              <TabsContent value="charts" className="mt-4">
                {charts.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {charts.map((c) => <ChartCard key={c.id} config={c} />)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No charts generated.</p>
                )}
              </TabsContent>
              <TabsContent value="data" className="mt-4">
                <DatasetPreview columns={preview.columns} rows={preview.rows} />
              </TabsContent>
              <TabsContent value="stats" className="mt-4">
                <StatsSummary stats={stats} />
              </TabsContent>
              <TabsContent value="insights" className="mt-4">
                <InsightsPanel insights={insights} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}
