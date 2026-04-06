import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDataset } from "@/hooks/useDataset";
import { useInvoiceData } from "@/contexts/InvoiceDataContext";
import { DatasetPreview } from "@/components/DatasetPreview";
import { ChartCard } from "@/components/ChartCard";
import { StatsSummary } from "@/components/StatsSummary";
import { InsightsPanel } from "@/components/InsightsPanel";
import { FileUpload } from "@/components/FileUpload";
import { DatasetInfo } from "@/components/DatasetInfo";
import { motion } from "framer-motion";
import { BarChart3, Loader2, Download, Trash2, CheckCircle, Plus, RefreshCw, Link2, Unlink, PenLine, Files, Merge } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { Invoice } from "@/types";

export default function UploadPage() {
  const navigate = useNavigate();
  const {
    meta, preview, stats, charts, insights,
    uploading, uploadProgress, loading, error,
    handleUpload: baseHandleUpload, handleExport,
  } = useDataset();

  const {
    setInvoicesFromUpload, hasData, fileName, deleteDataset,
    invoices, addManualInvoice,
    connectGoogleSheet, disconnectGoogleSheet, googleSheetConnected, googleSheetId, syncGoogleSheet,
  } = useInvoiceData();

  const hasUploadedData = meta && preview;

  // Multi-file upload state
  const [multiFiles, setMultiFiles] = useState<File[]>([]);
  const [multiMode, setMultiMode] = useState<"merge" | "separate">("merge");
  const [multiDialogOpen, setMultiDialogOpen] = useState(false);
  const [multiUploading, setMultiUploading] = useState(false);

  // Manual entry
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    customerName: "", amount: "", invoiceNumber: "", invoiceDate: "",
    dueDate: "", phone: "", email: "", status: "pending" as Invoice["status"],
  });

  // Google Sheets
  const [gsheetDialogOpen, setGsheetDialogOpen] = useState(false);
  const [gsheetId, setGsheetId] = useState("");
  const [gsheetToken, setGsheetToken] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Delete confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleUpload = async (file: File) => {
    await baseHandleUpload(file);
  };

  const handleUploadMultiple = (files: File[]) => {
    setMultiFiles(files);
    setMultiDialogOpen(true);
  };

  const handleProcessMultiFiles = async () => {
    setMultiUploading(true);
    try {
      if (multiMode === "merge") {
        // Upload all files sequentially and merge into same dataset
        for (const file of multiFiles) {
          await baseHandleUpload(file);
        }
        toast.success(`${multiFiles.length} files merged and uploaded!`);
      } else {
        // Upload each separately — for now upload the first
        for (const file of multiFiles) {
          await baseHandleUpload(file);
        }
        toast.success(`${multiFiles.length} files uploaded separately!`);
      }
    } catch {
      toast.error("Multi-file upload failed");
    } finally {
      setMultiUploading(false);
      setMultiDialogOpen(false);
      setMultiFiles([]);
    }
  };

  const handlePushToSystem = () => {
    if (!preview || !meta) return;
    setInvoicesFromUpload(preview.rows, meta.fileName);
    toast.success(`${preview.rows.length} records loaded into the system!`);
  };

  const handleDeleteDataset = () => {
    deleteDataset();
    setDeleteConfirmOpen(false);
    toast.success("Active dataset deleted.");
  };

  const handleManualAdd = () => {
    if (!manualForm.customerName || !manualForm.amount) {
      toast.error("Name and amount are required"); return;
    }
    addManualInvoice({
      invoiceNumber: manualForm.invoiceNumber || `INV-M-${Date.now()}`,
      customerName: manualForm.customerName,
      customerPhone: manualForm.phone,
      customerEmail: manualForm.email,
      dueDate: manualForm.dueDate || manualForm.invoiceDate || new Date().toISOString().split("T")[0],
      amount: parseFloat(manualForm.amount) || 0,
      status: manualForm.status === "unpaid" ? "pending" : manualForm.status === "partial" ? "pending" : manualForm.status,
    });
    setManualForm({ customerName: "", amount: "", invoiceNumber: "", invoiceDate: "", dueDate: "", phone: "", email: "", status: "pending" });
    setManualDialogOpen(false);
    toast.success("Invoice added manually!");
  };

  const handleConnectGSheet = () => {
    if (!gsheetId) { toast.error("Enter a Google Sheet ID"); return; }
    if (!gsheetToken) { toast.error("Enter your OAuth access token"); return; }
    connectGoogleSheet(gsheetId, gsheetToken);
    setGsheetDialogOpen(false);
    toast.success("Google Sheet connected!");
  };

  const handleSyncGSheet = async () => {
    setSyncing(true);
    try {
      await syncGoogleSheet();
      toast.success("Google Sheet synced!");
    } catch {
      toast.error("Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Upload & Parse</h1>
          <p className="text-sm text-muted-foreground">Upload single or multiple files, manually enter, or sync from Google Sheets</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setManualDialogOpen(true)}>
            <PenLine className="w-4 h-4" /> Manual Entry
          </Button>
          {!googleSheetConnected ? (
            <Button size="sm" variant="outline" className="gap-2" onClick={() => setGsheetDialogOpen(true)}>
              <Link2 className="w-4 h-4" /> Connect Google Sheet
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="gap-2" onClick={handleSyncGSheet} disabled={syncing}>
                <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} /> Sync
              </Button>
              <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => { disconnectGoogleSheet(); toast.success("Disconnected"); }}>
                <Unlink className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Active data info */}
      {hasData && (
        <Card className="p-4 bg-accent/5 border-accent/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-accent" />
            <div>
              <p className="text-sm font-semibold text-foreground">Active: {fileName || "Uploaded Data"}</p>
              <p className="text-xs text-muted-foreground">{invoices.length} invoices loaded</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" className="gap-2" onClick={() => setDeleteConfirmOpen(true)}>
            <Trash2 className="w-4 h-4" /> Delete
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <FileUpload
            onUpload={handleUpload}
            uploading={uploading}
            progress={uploadProgress}
            error={error}
            multiple={true}
            onUploadMultiple={handleUploadMultiple}
          />
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                <p className="text-sm font-medium text-foreground">Loading dataset...</p>
                <p className="text-xs text-muted-foreground">Analyzing columns, generating charts & insights</p>
                <div className="w-48 mx-auto h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div className="h-full bg-primary rounded-full" initial={{ width: "0%" }} animate={{ width: "90%" }} transition={{ duration: 8, ease: "easeOut" }} />
                </div>
              </div>
            </motion.div>
          )}

          {!hasUploadedData && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-64">
              <div className="text-center space-y-3 max-w-xs">
                <BarChart3 className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">Upload a file, add manually, or connect Google Sheets</p>
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
              <TabsContent value="stats" className="mt-4"><StatsSummary stats={stats} /></TabsContent>
              <TabsContent value="insights" className="mt-4"><InsightsPanel insights={insights} /></TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Multi-file Dialog */}
      <Dialog open={multiDialogOpen} onOpenChange={setMultiDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Files className="w-5 h-5 text-primary" /> Multiple Files Selected ({multiFiles.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-32 overflow-y-auto space-y-1">
              {multiFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded bg-secondary/30 text-xs">
                  <Badge variant="outline" className="text-[9px]">{f.name.split('.').pop()?.toUpperCase()}</Badge>
                  <span className="text-foreground truncate flex-1">{f.name}</span>
                  <span className="text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold">How do you want to process these files?</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMultiMode("merge")}
                  className={`p-3 rounded-lg border text-left transition-all ${multiMode === "merge" ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Merge className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-foreground">Merge All</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Combine all files into one dataset</p>
                </button>
                <button
                  onClick={() => setMultiMode("separate")}
                  className={`p-3 rounded-lg border text-left transition-all ${multiMode === "separate" ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Files className="w-4 h-4 text-accent" />
                    <span className="text-xs font-semibold text-foreground">Separate</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Keep as separate business datasets</p>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMultiDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleProcessMultiFiles} disabled={multiUploading} className="gap-2">
              {multiUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {multiUploading ? "Processing..." : `Upload & ${multiMode === "merge" ? "Merge" : "Separate"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Entry Dialog */}
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Invoice Manually</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">Customer Name *</Label><Input value={manualForm.customerName} onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })} placeholder="Arun Traders" /></div>
              <div className="space-y-1"><Label className="text-xs">Amount *</Label><Input type="number" value={manualForm.amount} onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })} placeholder="2500" /></div>
              <div className="space-y-1"><Label className="text-xs">Invoice Number</Label><Input value={manualForm.invoiceNumber} onChange={(e) => setManualForm({ ...manualForm, invoiceNumber: e.target.value })} placeholder="INV-001" /></div>
              <div className="space-y-1"><Label className="text-xs">Invoice Date</Label><Input type="date" value={manualForm.invoiceDate} onChange={(e) => setManualForm({ ...manualForm, invoiceDate: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Due Date</Label><Input type="date" value={manualForm.dueDate} onChange={(e) => setManualForm({ ...manualForm, dueDate: e.target.value })} /></div>
              <div className="space-y-1"><Label className="text-xs">Status</Label>
                <Select value={manualForm.status} onValueChange={(v: any) => setManualForm({ ...manualForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-xs">Phone</Label><Input value={manualForm.phone} onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })} placeholder="919876543210" /></div>
              <div className="space-y-1"><Label className="text-xs">Email</Label><Input value={manualForm.email} onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })} placeholder="customer@email.com" /></div>
            </div>
            <Button className="w-full gap-2" onClick={handleManualAdd}><Plus className="w-4 h-4" /> Add Invoice</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Google Sheets Dialog */}
      <Dialog open={gsheetDialogOpen} onOpenChange={setGsheetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Connect Google Sheet</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Enter your Google Sheet ID and an OAuth access token.</p>
            <div className="space-y-1"><Label className="text-xs">Google Sheet ID</Label><Input placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" value={gsheetId} onChange={(e) => setGsheetId(e.target.value)} /></div>
            <div className="space-y-1"><Label className="text-xs">OAuth Access Token</Label><Input type="password" placeholder="ya29.a0..." value={gsheetToken} onChange={(e) => setGsheetToken(e.target.value)} /></div>
            <Button className="w-full gap-2" onClick={handleConnectGSheet}><Link2 className="w-4 h-4" /> Connect</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><Trash2 className="w-5 h-5" /> Delete Dataset</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete the uploaded file? This will remove all loaded invoices.</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteDataset}>Yes, Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
