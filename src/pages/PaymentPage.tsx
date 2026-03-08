import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle, Clock, XCircle, Shield } from "lucide-react";

type PaymentStatus = "waiting" | "completed" | "failed";

export default function PaymentPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [status, setStatus] = useState<PaymentStatus>("waiting");

  // Load invoice from localStorage
  const invoices = (() => {
    try {
      return JSON.parse(localStorage.getItem("payrecovery_invoices") || "[]");
    } catch { return []; }
  })();
  const invoice = invoices.find((i: any) => i.id === invoiceId);

  const upiId = localStorage.getItem("payrecovery_upi_id") || "merchant@upi";
  const upiName = localStorage.getItem("payrecovery_upi_name") || "Business";
  const user = (() => {
    try { return JSON.parse(localStorage.getItem("payrecovery_user") || "{}"); } catch { return {}; }
  })();

  if (!invoice) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center space-y-3 max-w-sm bg-card border-border/50">
          <XCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-lg font-bold text-foreground">Invoice Not Found</h2>
          <p className="text-sm text-muted-foreground">This payment link is invalid or has expired.</p>
        </Card>
      </div>
    );
  }

  const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${invoice.amount}&cu=INR&tn=Invoice%20${encodeURIComponent(invoice.invoiceNumber)}`;

  const formatINR = (n: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const statusConfig = {
    waiting: { icon: Clock, color: "text-chart-4", bg: "bg-chart-4/10", label: "Waiting for Payment" },
    completed: { icon: CheckCircle, color: "text-accent", bg: "bg-accent/10", label: "Payment Completed" },
    failed: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", label: "Payment Failed" },
  };

  const st = statusConfig[status];
  const StatusIcon = st.icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="p-6 max-w-sm w-full bg-card border-border/50 space-y-5">
        {/* Company header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-lg font-bold text-foreground">{user.companyName || upiName}</h1>
          <p className="text-xs text-muted-foreground">Payment Request</p>
        </div>

        {/* Invoice details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Customer</span>
            <span className="font-medium text-foreground">{invoice.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Invoice</span>
            <span className="font-mono text-foreground">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-mono font-bold text-foreground text-lg">{formatINR(invoice.amount)}</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-3 py-4 border-y border-border/50">
          <p className="text-xs text-muted-foreground">Scan QR to pay via UPI</p>
          <div className="bg-white p-3 rounded-xl">
            <QRCodeSVG value={upiLink} size={180} level="H" />
          </div>
          <a
            href={upiLink}
            className="text-xs text-primary hover:underline font-medium"
          >
            Or tap here to pay via UPI app
          </a>
        </div>

        {/* Payment status */}
        <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${st.bg}`}>
          <StatusIcon className={`w-5 h-5 ${st.color}`} />
          <span className={`text-sm font-medium ${st.color}`}>{st.label}</span>
        </div>

        {/* Demo controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setStatus("completed")}
            className="flex-1 text-xs py-1.5 rounded-md bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          >
            Mark Paid (Demo)
          </button>
          <button
            onClick={() => setStatus("failed")}
            className="flex-1 text-xs py-1.5 rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
          >
            Mark Failed (Demo)
          </button>
        </div>

        <p className="text-[10px] text-center text-muted-foreground">
          Powered by PayRecovery AI • Secure UPI Payment
        </p>
      </Card>
    </div>
  );
}
