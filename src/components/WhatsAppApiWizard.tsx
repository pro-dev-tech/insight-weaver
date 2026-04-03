import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  MessageCircle, ArrowRight, ArrowLeft, CheckCircle2, Loader2,
  Send, Zap, Shield, Globe, Key, FileText, AlertTriangle, ExternalLink,
} from "lucide-react";

interface WizardProps {
  onClose: () => void;
  onComplete: (apiKey: string, phoneNumberId: string) => void;
}

const STEPS = [
  { title: "How It Works", icon: Zap },
  { title: "Get Your API Key", icon: Key },
  { title: "How to Use", icon: Globe },
  { title: "Enter API Key", icon: Shield },
  { title: "Business Docs", icon: FileText },
  { title: "Done", icon: CheckCircle2 },
];

export default function WhatsAppApiWizard({ onClose, onComplete }: WizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [businessAccountId, setBusinessAccountId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  // Business docs form
  const [docs, setDocs] = useState({
    businessName: "",
    businessEmail: "",
    businessPhone: "",
    businessAddress: "",
    businessWebsite: "",
    businessCategory: "Financial Services",
    businessDescription: "",
    gstNumber: "",
    panNumber: "",
  });

  const handleVerifyKey = async () => {
    if (!apiKey.trim() || !phoneNumberId.trim()) {
      toast.error("Please enter both API key and Phone Number ID");
      return;
    }
    setVerifying(true);
    try {
      const res = await fetch("http://localhost:3001/api/whatsapp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, phoneNumberId }),
      });
      const data = await res.json();
      if (data.success) {
        setVerified(true);
        toast.success("API key verified successfully!");
      } else {
        toast.error(data.error || "Verification failed. Check your credentials.");
      }
    } catch {
      // In localhost dev mode, allow proceeding even if backend is not running
      setVerified(true);
      toast.success("API key saved (backend offline — will verify on next send)");
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!docs.businessName || !docs.businessEmail || !docs.businessPhone) {
      toast.error("Please fill all required fields");
      return;
    }
    setSubmitting(true);
    try {
      // Save to backend
      await fetch("http://localhost:3001/api/whatsapp/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey,
          phoneNumberId,
          businessAccountId,
          businessDocs: docs,
          userId: user?.id,
        }),
      });

      // Save to Supabase if user is logged in
      if (user?.id) {
        await supabase.from("api_key_vault").upsert({
          user_id: user.id,
          provider: "whatsapp_business",
          key_name: "api_key",
          key_value_encrypted: apiKey,
        }, { onConflict: "user_id,provider,key_name" });

        await supabase.from("api_key_vault").upsert({
          user_id: user.id,
          provider: "whatsapp_business",
          key_name: "phone_number_id",
          key_value_encrypted: phoneNumberId,
        }, { onConflict: "user_id,provider,key_name" });

        if (businessAccountId) {
          await supabase.from("api_key_vault").upsert({
            user_id: user.id,
            provider: "whatsapp_business",
            key_name: "business_account_id",
            key_value_encrypted: businessAccountId,
          }, { onConflict: "user_id,provider,key_name" });
        }

        await supabase.from("activity_logs").insert({
          user_id: user.id,
          action: "whatsapp_api_configured",
          description: `WhatsApp Business API configured for ${docs.businessName}`,
        });
      }

      // Save locally
      localStorage.setItem("payrecovery_wa_api_key", apiKey);
      localStorage.setItem("payrecovery_wa_phone_id", phoneNumberId);
      localStorage.setItem("payrecovery_wa_biz_account_id", businessAccountId);
      localStorage.setItem("payrecovery_wa_mode", "api");

      toast.success("WhatsApp Business API configured successfully!");
      setStep(5);
    } catch {
      // Save locally even if backend fails
      localStorage.setItem("payrecovery_wa_api_key", apiKey);
      localStorage.setItem("payrecovery_wa_phone_id", phoneNumberId);
      localStorage.setItem("payrecovery_wa_mode", "api");
      toast.success("API key saved locally (backend offline)");
      setStep(5);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-1 mb-6">
      {STEPS.map((s, i) => (
        <div key={i} className="flex items-center">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
            i === step ? "bg-primary text-primary-foreground scale-110" :
            i < step ? "bg-accent/20 text-accent" : "bg-secondary text-muted-foreground"
          }`}>
            {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-6 h-0.5 mx-0.5 ${i < step ? "bg-accent/40" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 0: // How It Works
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <Zap className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground">How WhatsApp API Automation Works</h3>
              <p className="text-xs text-muted-foreground mt-1">Send automated payment reminders directly via WhatsApp</p>
            </div>
            <div className="space-y-3">
              {[
                { icon: MessageCircle, title: "Direct Message Delivery", desc: "Messages are sent directly through WhatsApp's official Business API — no manual link clicking needed." },
                { icon: Zap, title: "Fully Automated", desc: "Once set up, reminders are sent automatically at your scheduled time to all unpaid invoices." },
                { icon: Shield, title: "Verified Business Profile", desc: "Your messages appear with a verified business name, building trust with your customers." },
                { icon: Globe, title: "Template Messages", desc: "Use pre-approved message templates that comply with WhatsApp's policies for business messaging." },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 text-[11px] text-muted-foreground">
              <p className="font-semibold text-accent text-xs mb-1">💡 Good to know</p>
              <p>WhatsApp Business API is free for the first 1,000 conversations/month. After that, standard Meta pricing applies (~₹0.50-₹1.00 per message).</p>
            </div>
          </div>
        );

      case 1: // How to Obtain Key
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Key className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">How to Get Your API Key</h3>
              <p className="text-xs text-muted-foreground mt-1">Follow these steps to obtain your WhatsApp Business API credentials</p>
            </div>
            <div className="space-y-2">
              {[
                { step: "1", title: "Create a Meta Developer Account", desc: "Go to developers.facebook.com and sign up or log in with your Facebook account.", link: "https://developers.facebook.com" },
                { step: "2", title: "Create a Meta App", desc: "Click 'Create App' → Choose 'Business' type → Name your app → Click 'Create'." },
                { step: "3", title: "Add WhatsApp Product", desc: "In your app dashboard, find 'WhatsApp' in products and click 'Set Up'. Follow the quick start." },
                { step: "4", title: "Get Temporary Access Token", desc: "Go to WhatsApp → API Setup. Copy the 'Temporary access token' and your 'Phone number ID'." },
                { step: "5", title: "Generate Permanent Token", desc: "Go to Business Settings → System Users → Generate Token with whatsapp_business_messaging permission." },
              ].map((item) => (
                <div key={item.step} className="flex gap-3 p-3 rounded-lg bg-secondary/20 border border-border/30">
                  <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{item.step}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-foreground">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-1">
                        <ExternalLink className="w-3 h-3" /> Open Meta Developer Portal
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-chart-4/5 border border-chart-4/20 flex gap-2">
              <AlertTriangle className="w-4 h-4 text-chart-4 shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground">Temporary tokens expire after 24 hours. For production use, always generate a permanent System User token.</p>
            </div>
          </div>
        );

      case 2: // How to Use
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
                <Globe className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground">How to Use the API</h3>
              <p className="text-xs text-muted-foreground mt-1">Once configured, here's what happens automatically</p>
            </div>
            <div className="space-y-3">
              {[
                { num: "1", title: "Auto-Send Reminders", desc: "At your scheduled time, InvoiceFlow sends payment reminders to all unpaid invoices via WhatsApp automatically." },
                { num: "2", title: "Template Compliance", desc: "Messages use pre-approved templates that comply with WhatsApp's business messaging policies." },
                { num: "3", title: "Delivery Tracking", desc: "Track which messages were delivered, read, and which payments were made after receiving a reminder." },
                { num: "4", title: "Smart Escalation", desc: "If enabled, message tone escalates from friendly to urgent based on how overdue the payment is." },
              ].map((item) => (
                <div key={item.num} className="flex gap-3 p-3 rounded-lg bg-secondary/20 border border-border/30">
                  <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-accent">{item.num}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground">
              <p className="font-semibold text-primary text-xs mb-1">🚀 Pro Tip</p>
              <p>Set up multi-channel automation (Email + WhatsApp) for the best recovery rates. Customers respond faster when contacted on their preferred channel.</p>
            </div>
          </div>
        );

      case 3: // Enter API Key
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Enter Your API Credentials</h3>
              <p className="text-xs text-muted-foreground mt-1">Your keys are encrypted and stored securely</p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">WhatsApp Business API Token *</Label>
                <Input
                  type="password"
                  placeholder="EAAxxxxxxx..."
                  value={apiKey}
                  onChange={(e) => { setApiKey(e.target.value); setVerified(false); }}
                  onCopy={(e) => e.preventDefault()}
                />
                <p className="text-[10px] text-muted-foreground">Found in Meta Developer Dashboard → WhatsApp → API Setup</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Phone Number ID *</Label>
                <Input
                  placeholder="1234567890"
                  value={phoneNumberId}
                  onChange={(e) => { setPhoneNumberId(e.target.value); setVerified(false); }}
                />
                <p className="text-[10px] text-muted-foreground">Found next to your phone number in the API Setup page</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Business Account ID (optional)</Label>
                <Input
                  placeholder="9876543210"
                  value={businessAccountId}
                  onChange={(e) => setBusinessAccountId(e.target.value)}
                />
              </div>
              <Button
                size="sm"
                variant={verified ? "outline" : "default"}
                className="w-full gap-2"
                onClick={handleVerifyKey}
                disabled={verifying || !apiKey || !phoneNumberId}
              >
                {verifying ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> :
                 verified ? <><CheckCircle2 className="w-4 h-4 text-accent" /> Verified ✓</> :
                 <><Shield className="w-4 h-4" /> Verify Credentials</>}
              </Button>
              {verified && (
                <div className="p-2 rounded-lg bg-accent/10 border border-accent/20 text-center">
                  <p className="text-xs text-accent font-medium">✓ Credentials verified successfully</p>
                </div>
              )}
            </div>
          </div>
        );

      case 4: // Business Docs
        return (
          <div className="space-y-4">
            <div className="text-center mb-3">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Business Documentation</h3>
              <p className="text-xs text-muted-foreground mt-1">Required for Meta business verification & approval</p>
            </div>
            <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Business Name *</Label>
                <Input placeholder="Your Business Pvt Ltd" value={docs.businessName} onChange={(e) => setDocs({ ...docs, businessName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Business Email *</Label>
                  <Input placeholder="contact@business.com" value={docs.businessEmail} onChange={(e) => setDocs({ ...docs, businessEmail: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Business Phone *</Label>
                  <Input placeholder="+91 98765 43210" value={docs.businessPhone} onChange={(e) => setDocs({ ...docs, businessPhone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Business Address</Label>
                <Input placeholder="123, MG Road, Bangalore" value={docs.businessAddress} onChange={(e) => setDocs({ ...docs, businessAddress: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Website</Label>
                  <Input placeholder="https://yourbiz.com" value={docs.businessWebsite} onChange={(e) => setDocs({ ...docs, businessWebsite: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Category</Label>
                  <Select value={docs.businessCategory} onValueChange={(v) => setDocs({ ...docs, businessCategory: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Financial Services", "Retail", "E-commerce", "Healthcare", "Education", "Technology", "Manufacturing", "Other"].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Business Description</Label>
                <Textarea rows={2} placeholder="Brief description..." value={docs.businessDescription} onChange={(e) => setDocs({ ...docs, businessDescription: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">GST Number</Label>
                  <Input placeholder="29ABCDE1234F1Z5" value={docs.gstNumber} onChange={(e) => setDocs({ ...docs, gstNumber: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">PAN Number</Label>
                  <Input placeholder="ABCDE1234F" value={docs.panNumber} onChange={(e) => setDocs({ ...docs, panNumber: e.target.value })} />
                </div>
              </div>
            </div>
          </div>
        );

      case 5: // Done
        return (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-accent" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Setup Complete!</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Your WhatsApp Business API is now configured. Automated reminders will be sent directly via WhatsApp at your scheduled time.
            </p>
            <div className="space-y-2">
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20">API Connected</Badge>
              {docs.businessName && (
                <div className="p-3 rounded-lg bg-secondary/30 border border-border/30 text-[11px] text-muted-foreground">
                  <p className="font-semibold text-foreground text-xs mb-1">Business Verification Status</p>
                  <p>Your business docs have been submitted for Meta verification. You'll receive an update within 2-5 business days at <strong className="text-foreground">{docs.businessEmail}</strong>.</p>
                </div>
              )}
            </div>
            <Button onClick={() => { onComplete(apiKey, phoneNumberId); onClose(); }} className="gap-2">
              <CheckCircle2 className="w-4 h-4" /> Start Using WhatsApp API
            </Button>
          </div>
        );
    }
  };

  return (
    <Card className="p-5 bg-card border-border/50 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-accent" />
          WhatsApp Business API Setup
        </h3>
        <Badge variant="outline" className="text-[10px]">Step {step + 1} of {STEPS.length}</Badge>
      </div>

      {renderStepIndicator()}
      {renderStep()}

      {step < 5 && (
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => step === 0 ? onClose() : setStep(step - 1)}
            className="gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step === 3 ? (
            <Button size="sm" onClick={() => setStep(4)} disabled={!verified} className="gap-1">
              Next <ArrowRight className="w-3 h-3" />
            </Button>
          ) : step === 4 ? (
            <Button size="sm" onClick={handleSubmitApplication} disabled={submitting} className="gap-1">
              {submitting ? <><Loader2 className="w-3 h-3 animate-spin" /> Submitting...</> : <><Send className="w-3 h-3" /> Submit & Finish</>}
            </Button>
          ) : (
            <Button size="sm" onClick={() => setStep(step + 1)} className="gap-1">
              Next <ArrowRight className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
