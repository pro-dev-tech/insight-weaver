import { useDataset } from "@/hooks/useDataset";
import { useInvoiceData } from "@/contexts/InvoiceDataContext";
import { DatasetPreview } from "@/components/DatasetPreview";
import { ChartCard } from "@/components/ChartCard";
import { StatsSummary } from "@/components/StatsSummary";
import { InsightsPanel } from "@/components/InsightsPanel";
import { FileUpload } from "@/components/FileUpload";
import { DatasetInfo } from "@/components/DatasetInfo";
import { motion } from "framer-motion";
import { BarChart3, Loader2, Download, Trash2, CheckCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function UploadPage() {
  const {
    meta, preview, stats, charts, insights,
    uploading, uploadProgress, loading, error,
    handleUpload: baseHandleUpload, handleExport,
  } = useDataset();

  const { setInvoicesFromUpload, hasData, fileName, deleteDataset, invoices } = useInvoiceData();

  const hasUploadedData = meta && preview;

  const handleUpload = async (file: File) => {
    await baseHandleUpload(file);
  };

  // When preview data arrives, also push it into global context
  const handlePushToSystem = () => {
    if (!preview || !meta) return;
    setInvoicesFromUpload(preview.rows, meta.fileName);
    toast.success(`${preview.rows.length} records loaded into the system! Dashboard, Invoices, Customers, and Analytics are now populated.`);
  };

  const handleDeleteDataset = () => {
    deleteDataset();
    toast.success("Dataset deleted. All pages cleared.");
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Upload & Parse</h1>
        <p className="text-sm text-muted-foreground">Upload CSV or Excel invoices for automatic parsing, analysis, and system-wide data population</p>
      </div>

      {hasData && (
        <Card className="p-4 bg-accent/5 border-accent/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-accent" />
            <div>
              <p className="text-sm font-semibold text-foreground">Active Dataset: {fileName}</p>
              <p className="text-xs text-muted-foreground">{invoices.length} invoices loaded across all pages</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" className="gap-2" onClick={handleDeleteDataset}>
            <Trash2 className="w-4 h-4" /> Delete Dataset
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <FileUpload onUpload={handleUpload} uploading={uploading} progress={uploadProgress} error={error} />
          {meta && (
            <>
              <DatasetInfo meta={meta} />
              <div className="space-y-2">
                <Button onClick={handlePushToSystem} className="w-full text-xs gap-2">
                  <CheckCircle className="w-3.5 h-3.5" /> Load into System
                </Button>
                <Button onClick={handleExport} variant="outline" size="sm" className="w-full text-xs gap-2">
                  <Download className="w-3.5 h-3.5" /> Export Cleaned CSV
                </Button>
              </div>
            </>
          )}
        </div>

        <div className="lg:col-span-2">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Analyzing dataset...</p>
              </div>
            </div>
          )}

          {!hasUploadedData && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-64">
              <div className="text-center space-y-3 max-w-xs">
                <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">Upload a file to see parsed data, charts, and insights here</p>
                <p className="text-xs text-muted-foreground/60">Required columns: name, amount, invoice date, mobile, email</p>
              </div>
            </motion.div>
          )}

          {hasUploadedData && !loading && (
            <Tabs defaultValue="data" className="w-full">
              <TabsList className="bg-secondary/50 border border-border/50">
                <TabsTrigger value="data" className="text-xs">Data</TabsTrigger>
                <TabsTrigger value="charts" className="text-xs">Charts</TabsTrigger>
                <TabsTrigger value="stats" className="text-xs">Stats</TabsTrigger>
                <TabsTrigger value="insights" className="text-xs">Insights</TabsTrigger>
              </TabsList>
              <TabsContent value="data" className="mt-4">
                <DatasetPreview columns={preview.columns} rows={preview.rows} />
              </TabsContent>
              <TabsContent value="charts" className="mt-4">
                {charts.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {charts.map((c) => <ChartCard key={c.id} config={c} />)}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No charts generated.</p>
                )}
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
