import { useDataset } from "@/hooks/useDataset";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DatasetPreview } from "@/components/DatasetPreview";
import { ChartCard } from "@/components/ChartCard";
import { StatsSummary } from "@/components/StatsSummary";
import { InsightsPanel } from "@/components/InsightsPanel";
import { motion } from "framer-motion";
import { BarChart3, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

const Index = () => {
  const {
    meta,
    preview,
    stats,
    charts,
    insights,
    uploading,
    uploadProgress,
    loading,
    error,
    handleUpload,
    handleExport,
  } = useDataset();

  const hasData = meta && preview;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar
        meta={meta}
        onUpload={handleUpload}
        onExport={handleExport}
        uploading={uploading}
        uploadProgress={uploadProgress}
        error={error}
      />

      <main className="flex-1 min-w-0">
        {loading && (
          <div className="flex items-center justify-center h-screen">
            <div className="text-center space-y-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground">Analyzing dataset...</p>
            </div>
          </div>
        )}

        {!hasData && !loading && (
          <div className="flex items-center justify-center h-screen">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4 max-w-md"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <BarChart3 className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold gradient-text">DataLens Analytics</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Upload a CSV or Excel file to automatically analyze your data, generate
                visualizations, and discover insights.
              </p>
              <div className="flex gap-3 justify-center pt-2">
                {["Auto Charts", "Statistics", "Insights", "Export"].map((f) => (
                  <span
                    key={f}
                    className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {hasData && !loading && (
          <ScrollArea className="h-screen">
            <div className="p-6 space-y-6">
              <Tabs defaultValue="charts" className="w-full">
                <TabsList className="bg-secondary/50 border border-border/50">
                  <TabsTrigger value="charts" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Charts
                  </TabsTrigger>
                  <TabsTrigger value="data" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Data Preview
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Statistics
                  </TabsTrigger>
                  <TabsTrigger value="insights" className="text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Insights
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="charts" className="mt-4">
                  {charts.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {charts.map((c) => (
                        <ChartCard key={c.id} config={c} />
                      ))}
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
            </div>
          </ScrollArea>
        )}
      </main>
    </div>
  );
};

export default Index;
