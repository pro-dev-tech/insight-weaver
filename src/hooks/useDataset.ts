import { useState, useCallback } from "react";
import {
  uploadFile,
  getPreview,
  getSummary,
  getCharts,
  getInsights,
  exportDataset,
  DatasetMeta,
  ColumnStats,
  ChartConfig,
  Insight,
} from "@/services/api";
import { toast } from "sonner";

export function useDataset() {
  const [meta, setMeta] = useState<DatasetMeta | null>(null);
  const [preview, setPreview] = useState<{ columns: string[]; rows: any[] } | null>(null);
  const [stats, setStats] = useState<ColumnStats[]>([]);
  const [correlations, setCorrelations] = useState<Record<string, Record<string, number>>>({});
  const [charts, setCharts] = useState<ChartConfig[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    try {
      const m = await uploadFile(file, setUploadProgress);
      setMeta(m);
      toast.success("File uploaded successfully!");

      // Load all data in parallel
      setLoading(true);
      const [previewData, summaryData, chartData, insightData] = await Promise.all([
        getPreview(),
        getSummary(),
        getCharts(),
        getInsights(),
      ]);
      setPreview(previewData);
      setStats(summaryData.stats);
      setCorrelations(summaryData.correlations);
      setCharts(chartData);
      setInsights(insightData);
      toast.success("Analysis complete!");
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || "Upload failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
      setLoading(false);
    }
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const blob = await exportDataset();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dataset_cleaned.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Dataset exported!");
    } catch {
      toast.error("Export failed");
    }
  }, []);

  return {
    meta,
    preview,
    stats,
    correlations,
    charts,
    insights,
    uploading,
    uploadProgress,
    loading,
    error,
    handleUpload,
    handleExport,
  };
}
