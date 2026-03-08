import { useState } from "react";
import { useDataset } from "@/hooks/useDataset";
import { useInvoiceData } from "@/contexts/InvoiceDataContext";
import { DatasetPreview } from "@/components/DatasetPreview";
import { ChartCard } from "@/components/ChartCard";
import { StatsSummary } from "@/components/StatsSummary";
import { InsightsPanel } from "@/components/InsightsPanel";
import { FileUpload } from "@/components/FileUpload";
import { DatasetInfo } from "@/components/DatasetInfo";
import { motion } from "framer-motion";
import { BarChart3, Loader2, Download, Trash2, CheckCircle, Database, Plus, RefreshCw, Link2, Unlink, PenLine } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { Invoice } from "@/types";

export default function UploadPage() {
  const {
    meta, preview, stats, charts, insights,
    uploading, uploadProgress, loading, error,
    handleUpload: baseHandleUpload, handleExport,
  } = useDataset();

  const {
    setInvoicesFromUpload, hasData, fileName, deleteDataset,
    invoices, datasets, activeDatasetId, switchDataset, deleteDatasetById,
    addManualInvoice,
    connectGoogleSheet, disconnectGoogleSheet, googleSheetConnected, googleSheetId, syncGoogleSheet,
  } = useInvoiceData();

  const hasUploadedData = meta && preview;

  // Manual entry
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    customerName: "", amount: "", invoiceNumber: "", invoiceDate: "",
    dueDate: "", phone: "", email: "", status: "unpaid" as Invoice["status"],
  });

  // Google Sheets
  const [gsheetDialogOpen, setGsheetDialogOpen] = useState(false);
  const [gsheetId, setGsheetId] = useState("");
  const [gsheetToken, setGsheetToken] = useState("");
  const [syncing, setSyncing] = useState(false);

  const handleUpload = async (file: File) => {
    await baseHandleUpload(file);
  };

  const handlePushToSystem = () => {
    if (!preview || !meta) return;
    setInvoicesFromUpload(preview.rows, meta.fileName);
    toast.success(`${preview.rows.length} records loaded into the system!`);
  };

  const handleDeleteDataset = () => {
    deleteDataset();
    toast.success("Active dataset deleted.");
  };

  const handleManualAdd = () => {
    if (!manualForm.customerName || !manualForm.amount) {
      toast.error("Name and amount are required"); return;
    }
    const inv: Invoice = {
      id: `INV-M-${Date.now()}`,
      invoiceNumber: manualForm.invoiceNumber || `INV-M-${Date.now()}`,
      customerName: manualForm.customerName,
      customerPhone: manualForm.phone,
      customerEmail: manualForm.email,
      invoiceDate: manualForm.invoiceDate || new Date().toISOString().split("T")[0],
      dueDate: manualForm.dueDate || manualForm.invoiceDate || new Date().toISOString().split("T")[0],
      amount: parseFloat(manualForm.amount) || 0,
      paidAmount: 0,
      status: manualForm.status,
      source: "manual",
      remindersSent: 0,
      createdAt: new Date().toISOString(),
    };
    addManualInvoice(inv);
    setManualForm({ customerName: "", amount: "", invoiceNumber: "", invoiceDate: "", dueDate: "", phone: "", email: "", status: "unpaid" });
    setManualDialogOpen(false);
    toast.success("Invoice added manually!");
  };

  const handleConnectGSheet = () => {
    if (!gsheetId) { toast.error("Enter a Google Sheet ID"); return; }
    if (!gsheetToken) { toast.error("Enter your OAuth access token"); return; }
    connectGoogleSheet(gsheetId, gsheetToken);
    setGsheetDialogOpen(false);
    toast.success("Google Sheet connected! Click Sync to pull data.");
  };

  const handleSyncGSheet = async () => {
    setSyncing(true);
    try {
      await syncGoogleSheet();
      toast.success("Google Sheet synced successfully!");
    } catch {
      toast.error("Sync failed. Check your Sheet ID and token.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Upload & Parse</h1>
          <p className="text-sm text-muted-foreground">Upload, manually enter, or sync data from Google Sheets</p>
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
              <Button size="sm" variant="ghost" className="gap-1 text-destructive" onClick={() => { disconnectGoogleSheet(); toast.success("Google Sheet disconnected"); }}>
                <Unlink className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Dataset Selector */}
      {datasets.length > 0 && (
        <Card className="p-4 bg-card border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Choose Dataset</h3>
            </div>
            <Badge variant="outline" className="text-[10px]">{datasets.length} dataset{datasets.length > 1 ? "s" : ""}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {datasets.map((ds) => (
              <div key={ds.id} className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={activeDatasetId === ds.id ? "default" : "outline"}
                  className="text-xs gap-2"
                  onClick={() => switchDataset(ds.id)}
                >
                  <CheckCircle className={`w-3 h-3 ${activeDatasetId === ds.id ? "opacity-100" : "opacity-0"}`} />
                  {ds.name} ({ds.invoices.length})
                </Button>
                <Button
                  size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => { deleteDatasetById(ds.id); toast.success(`Deleted: ${ds.name}`); }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {hasData && (
        <Card className="p-4 bg-accent/5 border-accent/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-accent" />
            <div>
              <p className="text-sm font-semibold text-foreground">Active: {fileName}</p>
              <p className="text-xs text-muted-foreground">{invoices.length} invoices loaded</p>
            </div>
          </div>
          <Button variant="destructive" size="sm" className="gap-2" onClick={handleDeleteDataset}>
            <Trash2 className="w-4 h-4" /> Delete
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

      {/* Manual Entry Dialog */}
      <Dialog open={manualDialogOpen} onOpenChange={setManualDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Invoice Manually</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Customer Name *</Label>
                <Input value={manualForm.customerName} onChange={(e) => setManualForm({ ...manualForm, customerName: e.target.value })} placeholder="Arun Traders" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Amount *</Label>
                <Input type="number" value={manualForm.amount} onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })} placeholder="2500" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Invoice Number</Label>
                <Input value={manualForm.invoiceNumber} onChange={(e) => setManualForm({ ...manualForm, invoiceNumber: e.target.value })} placeholder="INV-001" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Invoice Date</Label>
                <Input type="date" value={manualForm.invoiceDate} onChange={(e) => setManualForm({ ...manualForm, invoiceDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Due Date</Label>
                <Input type="date" value={manualForm.dueDate} onChange={(e) => setManualForm({ ...manualForm, dueDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
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
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input value={manualForm.phone} onChange={(e) => setManualForm({ ...manualForm, phone: e.target.value })} placeholder="919876543210" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input value={manualForm.email} onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })} placeholder="customer@email.com" />
              </div>
            </div>
            <Button className="w-full gap-2" onClick={handleManualAdd}>
              <Plus className="w-4 h-4" /> Add Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Google Sheets Dialog */}
      <Dialog open={gsheetDialogOpen} onOpenChange={setGsheetDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Connect Google Sheet</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Enter your Google Sheet ID and an OAuth access token. The Sheet ID is the long string in the URL between <code>/d/</code> and <code>/edit</code>.
            </p>
            <div className="space-y-1">
              <Label className="text-xs">Google Sheet ID</Label>
              <Input placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" value={gsheetId} onChange={(e) => setGsheetId(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">OAuth Access Token</Label>
              <Input type="password" placeholder="ya29.a0..." value={gsheetToken} onChange={(e) => setGsheetToken(e.target.value)} />
              <p className="text-[10px] text-muted-foreground">
                Get this from Google OAuth Playground or your Google Cloud Console app.
              </p>
            </div>
            <Button className="w-full gap-2" onClick={handleConnectGSheet}>
              <Link2 className="w-4 h-4" /> Connect & Enable Sync
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
