import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Upload, FileText, Users, BarChart3, Bell, Settings,
  ArrowRight, ArrowLeft, X, Sparkles, LayoutDashboard,
} from "lucide-react";

const TOUR_STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to Invoice Flow!",
    desc: "Let's take a quick tour to help you get started. Invoice Flow helps you create, track, and recover invoices with AI-powered automation.",
  },
  {
    icon: Upload,
    title: "Upload & Parse",
    desc: "Upload CSV, Excel files or connect Google Sheets. You can upload multiple files at once — merge them or use them as separate businesses.",
  },
  {
    icon: FileText,
    title: "Invoices",
    desc: "View all your invoices in one place. Add manually, edit inline, and send reminders via Email, SMS, or WhatsApp directly from the table.",
  },
  {
    icon: Users,
    title: "Customers",
    desc: "Centralized customer database with AI risk scoring, payment history, and contact details. Detect and remove duplicate entries easily.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    desc: "Real-time overview of your receivables, aging analysis, recovery rates, and payment trends — all in beautiful interactive charts.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Deep dive into your data with advanced analytics, trend analysis, and exportable reports to optimize your cash flow.",
  },
  {
    icon: Bell,
    title: "Notifications & Automation",
    desc: "Set up automated reminders via Email (SMTP), WhatsApp (wa.me or API), and SMS. Schedule frequency, time, and channel. Run manually or let it auto-send.",
  },
  {
    icon: Settings,
    title: "Settings",
    desc: "Configure payment gateways (UPI, Razorpay, PayPal), company details, SMTP, and manage your account. All securely stored.",
  },
];

interface AppTourProps {
  open: boolean;
  onClose: () => void;
}

export function AppTour({ open, onClose }: AppTourProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const handleNext = () => {
    if (step < TOUR_STEPS.length - 1) setStep(step + 1);
    else {
      localStorage.setItem("invoiceflow_tour_completed", "true");
      onClose();
    }
  };

  const handleSkip = () => {
    localStorage.setItem("invoiceflow_tour_completed", "true");
    onClose();
  };

  const current = TOUR_STEPS[step];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleSkip(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            App Tour ({step + 1}/{TOUR_STEPS.length})
          </DialogTitle>
        </DialogHeader>
        <Card className="p-6 bg-secondary/20 border-border/50 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground">{current.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{current.desc}</p>
        </Card>
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              <X className="w-3 h-3 mr-1" /> Skip Tour
            </Button>
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="w-3 h-3 mr-1" /> Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {step < TOUR_STEPS.length - 1 ? <>Next <ArrowRight className="w-3 h-3 ml-1" /></> : "Finish"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
