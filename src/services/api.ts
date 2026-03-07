import axios from "axios";

const API_BASE = "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

export interface DatasetMeta {
  totalRows: number;
  totalColumns: number;
  columns: ColumnInfo[];
  fileName: string;
  fileSize: number;
}

export interface ColumnInfo {
  name: string;
  type: "numeric" | "categorical" | "datetime";
  missing: number;
  unique: number;
}

export interface ColumnStats {
  name: string;
  type: string;
  mean?: number;
  median?: number;
  min?: number;
  max?: number;
  std?: number;
  missing: number;
  unique?: number;
  valueCounts?: Record<string, number>;
  outliers?: number[];
}

export interface ChartConfig {
  id: string;
  type: "bar" | "pie" | "line" | "scatter" | "histogram" | "heatmap";
  title: string;
  description: string;
  data: any[];
  xKey?: string;
  yKey?: string;
  keys?: string[];
  colors?: string[];
}

export interface Insight {
  id: string;
  type: "info" | "warning" | "correlation" | "distribution";
  message: string;
  column?: string;
  severity: "low" | "medium" | "high";
}

export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void
): Promise<DatasetMeta> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return data;
}

export async function getPreview(): Promise<{ columns: string[]; rows: any[] }> {
  const { data } = await api.get("/dataset/preview");
  return data;
}

export async function getSummary(): Promise<{ stats: ColumnStats[]; correlations: Record<string, Record<string, number>> }> {
  const { data } = await api.get("/dataset/summary");
  return data;
}

export async function getCharts(): Promise<ChartConfig[]> {
  const { data } = await api.get("/dataset/charts");
  return data;
}

export async function getInsights(): Promise<Insight[]> {
  const { data } = await api.get("/dataset/insights");
  return data;
}

export async function exportDataset(): Promise<Blob> {
  const { data } = await api.get("/dataset/export", { responseType: "blob" });
  return data;
}
