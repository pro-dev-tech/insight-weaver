import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useInvoiceData } from "@/contexts/InvoiceDataContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CreditCard, QrCode, Upload as UploadIcon, Lock, Shield, Save, KeyRound, Image } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Payments() {
  const { user } = useAuth();
  const { invoices } = useInvoiceData();

  // Payment security
  const [paymentPassword, setPaymentPassword] = useState("");
  const [paymentPasswordSet, setPaymentPasswordSet] = useState(() => !!localStorage.getItem("payrecovery_pay_password"));
  const [paymentUnlocked, setPaymentUnlocked] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpExpiry, setOtpExpiry] = useState<number | null>(null);
  const [otpTimeLeft, setOtpTimeLeft] = useState(0);

  // Forgot password flow
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtpVerified, setForgotOtpVerified] = useState(false);
  const [forgotGeneratedOtp, setForgotGeneratedOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotOtpExpiry, setForgotOtpExpiry] = useState<number | null>(null);
  const [forgotOtpTimeLeft, setForgotOtpTimeLeft] = useState(0);

  // Payment keys
  const [razorpayKey, setRazorpayKey] = useState("");
  const [razorpaySecret, setRazorpaySecret] = useState("");
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [upiId, setUpiId] = useState(() => localStorage.getItem("payrecovery_upi_id") || "");
  const [upiName, setUpiName] = useState(() => localStorage.getItem("payrecovery_upi_name") || "");
  const [qrImage, setQrImage] = useState<string | null>(null);

  // OTP Timer
  useEffect(() => {
    if (!otpExpiry) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.floor((otpExpiry - Date.now()) / 1000));
      setOtpTimeLeft(left);
      if (left === 0) { setOtpSent(false); setGeneratedOtp(""); setOtpExpiry(null); toast.error("OTP expired. Please resend."); }
    }, 1000);
    return () => clearInterval(interval);
  }, [otpExpiry]);

  useEffect(() => {
    if (!forgotOtpExpiry) return;
    const interval = setInterval(() => {
      const left = Math.max(0, Math.floor((forgotOtpExpiry - Date.now()) / 1000));
      setForgotOtpTimeLeft(left);
      if (left === 0) { setForgotOtpSent(false); setForgotGeneratedOtp(""); setForgotOtpExpiry(null); toast.error("OTP expired. Please resend."); }
    }, 1000);
    return () => clearInterval(interval);
  }, [forgotOtpExpiry]);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("api_key_vault").select("*").eq("user_id", user.id).then(({ data }) => {
      if (!data) return;
      data.forEach((row: any) => {
        if (row.provider === "razorpay" && row.key_name === "key_id") { setRazorpayKey(row.key_value_encrypted || ""); setRazorpayEnabled(true); }
        if (row.provider === "razorpay" && row.key_name === "key_secret") setRazorpaySecret(row.key_value_encrypted || "");
        if (row.provider === "upi" && row.key_name === "upi_id") setUpiId(row.key_value_encrypted || "");
        if (row.provider === "upi" && row.key_name === "upi_name") setUpiName(row.key_value_encrypted || "");
      });
    });
  }, [user?.id]);

  const sendOtpEmail = async (code: string) => {
    try {
      const smtpConfig = JSON.parse(localStorage.getItem("payrecovery_smtp") || "{}");
      if (smtpConfig.smtpServer && smtpConfig.smtpPassword) {
        await fetch("http://localhost:3001/api/email/send", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            smtp: { host: smtpConfig.smtpServer, port: parseInt(smtpConfig.smtpPort || "587"), email: smtpConfig.senderEmail || smtpConfig.smtpUsername, username: smtpConfig.smtpUsername, password: smtpConfig.smtpPassword, tls: smtpConfig.useTls !== false },
            to: user?.email || "", subject: "InvoiceFlow - Payment Security OTP",
            message: `Your OTP for payment security setup is: ${code}\n\nThis OTP is valid for 5 minutes.\n\n- InvoiceFlow`,
          }),
        });
        toast.success(`OTP sent to ${user?.email}`);
        return;
      }
    } catch { /* fallback */ }
    toast.success(`OTP: ${code} (SMTP not configured - showing for demo)`);
  };

  const handleSendOtp = async () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setOtpSent(true);
    setOtpExpiry(Date.now() + 5 * 60 * 1000);
    setOtpTimeLeft(300);
    await sendOtpEmail(code);
  };

  const handleResendOtp = async () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setOtpExpiry(Date.now() + 5 * 60 * 1000);
    setOtpTimeLeft(300);
    await sendOtpEmail(code);
  };

  const handleVerifyOtp = () => {
    if (otp === generatedOtp) { setOtpVerified(true); toast.success("OTP verified!"); }
    else toast.error("Invalid OTP");
  };

  const handleSetPassword = () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    localStorage.setItem("payrecovery_pay_password", btoa(newPassword));
    setPaymentPasswordSet(true);
    setPaymentUnlocked(true);
    setOtpSent(false); setOtpVerified(false); setOtp(""); setNewPassword(""); setConfirmPassword(""); setOtpExpiry(null);
    toast.success("Payment password set successfully!");
  };

  const handleUnlockPayment = () => {
    const stored = localStorage.getItem("payrecovery_pay_password");
    if (stored && btoa(paymentPassword) === stored) { setPaymentUnlocked(true); toast.success("Payment settings unlocked"); }
    else toast.error("Incorrect password");
    setPaymentPassword("");
  };

  const handleForgotSendOtp = async () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setForgotGeneratedOtp(code);
    setForgotOtpSent(true);
    setForgotOtpExpiry(Date.now() + 5 * 60 * 1000);
    setForgotOtpTimeLeft(300);
    await sendOtpEmail(code);
  };

  const handleForgotVerifyOtp = () => {
    if (forgotOtp === forgotGeneratedOtp) { setForgotOtpVerified(true); toast.success("OTP verified!"); }
    else toast.error("Invalid OTP");
  };

  const handleForgotResetPassword = () => {
    if (forgotNewPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (forgotNewPassword !== forgotConfirmPassword) { toast.error("Passwords don't match"); return; }
    localStorage.setItem("payrecovery_pay_password", btoa(forgotNewPassword));
    setForgotMode(false); setForgotOtpSent(false); setForgotOtpVerified(false);
    setForgotOtp(""); setForgotNewPassword(""); setForgotConfirmPassword(""); setForgotOtpExpiry(null);
    toast.success("Password reset successfully!");
  };

  const upsertKey = async (provider: string, keyName: string, value: string) => {
    if (!user?.id) return;
    const { data: existing } = await supabase.from("api_key_vault").select("id").eq("user_id", user.id).eq("provider", provider).eq("key_name", keyName).maybeSingle();
    if (existing) await supabase.from("api_key_vault").update({ key_value_encrypted: value }).eq("id", existing.id);
    else await supabase.from("api_key_vault").insert({ user_id: user.id, provider, key_name: keyName, key_value_encrypted: value });
  };

  const handleSaveKeys = async () => {
    try {
      if (razorpayEnabled) {
        await upsertKey("razorpay", "key_id", razorpayKey);
        await upsertKey("razorpay", "key_secret", razorpaySecret);
      }
      await upsertKey("upi", "upi_id", upiId);
      await upsertKey("upi", "upi_name", upiName);
      localStorage.setItem("payrecovery_upi_id", upiId);
      localStorage.setItem("payrecovery_upi_name", upiName);
      try {
        await fetch("http://localhost:3001/api/settings/payment-keys", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ razorpayKey, razorpaySecret, upiId, upiName }),
        });
      } catch { /* backend may be offline */ }
      toast.success("Payment keys saved");
      setPaymentUnlocked(false);
    } catch { toast.error("Failed to save keys"); }
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setQrImage(ev.target?.result as string);
      localStorage.setItem("payrecovery_qr_image", ev.target?.result as string);
      toast.success("QR code uploaded");
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const saved = localStorage.getItem("payrecovery_qr_image");
    if (saved) setQrImage(saved);
  }, []);

  const formatINR = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  // Payment data from invoices
  const paidInvoices = invoices.filter(i => i.status === "paid");
  const totalCollected = paidInvoices.reduce((s, i) => s + (i.paidAmount || i.amount), 0);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Payments</h1>
        <p className="text-sm text-muted-foreground">Manage payment methods, view transactions, and configure payment gateways</p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="overview" className="text-xs gap-1"><CreditCard className="w-3 h-3" /> Overview</TabsTrigger>
          <TabsTrigger value="gateway" className="text-xs gap-1"><Shield className="w-3 h-3" /> Payment Gateway</TabsTrigger>
          <TabsTrigger value="qr" className="text-xs gap-1"><QrCode className="w-3 h-3" /> UPI / QR</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-3 bg-card border-border/50">
              <p className="text-[10px] text-muted-foreground">Total Collected</p>
              <p className="text-lg font-bold font-mono text-foreground">{formatINR(totalCollected)}</p>
            </Card>
            <Card className="p-3 bg-card border-border/50">
              <p className="text-[10px] text-muted-foreground">Paid Invoices</p>
              <p className="text-lg font-bold font-mono text-foreground">{paidInvoices.length}</p>
            </Card>
            <Card className="p-3 bg-card border-border/50">
              <p className="text-[10px] text-muted-foreground">Payment Method</p>
              <p className="text-sm font-semibold text-foreground">{upiId ? "UPI Active" : "Not Configured"}</p>
            </Card>
            <Card className="p-3 bg-card border-border/50">
              <p className="text-[10px] text-muted-foreground">Gateway</p>
              <p className="text-sm font-semibold text-foreground">{razorpayEnabled ? "Razorpay" : "Not Set"}</p>
            </Card>
          </div>

          {/* Transaction History */}
          <Card className="p-4 bg-card border-border/50">
            <h3 className="text-sm font-semibold text-foreground mb-3">Recent Transactions</h3>
            {paidInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No payment transactions yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      {["Invoice #", "Customer", "Amount", "Status", "Date"].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paidInvoices.slice(0, 20).map(inv => (
                      <tr key={inv.id} className="border-b border-border/30 hover:bg-secondary/20">
                        <td className="py-2 px-3 font-mono text-xs text-foreground">{inv.invoiceNumber}</td>
                        <td className="py-2 px-3 text-foreground">{inv.customerName}</td>
                        <td className="py-2 px-3 font-mono text-foreground">{formatINR(inv.paidAmount || inv.amount)}</td>
                        <td className="py-2 px-3"><Badge variant="outline" className="text-[10px] bg-accent/10 text-accent border-accent/20">Paid</Badge></td>
                        <td className="py-2 px-3 text-xs text-muted-foreground">{inv.lastReminderDate || inv.dueDate || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="gateway" className="mt-4 space-y-4">
          {!paymentPasswordSet ? (
            <Card className="p-6 bg-card border-border/50 space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Set Up Payment Security</h3>
                  <p className="text-xs text-muted-foreground">Set a password before managing payment keys</p>
                </div>
              </div>
              {!otpSent ? (
                <Button onClick={handleSendOtp} className="gap-2"><Lock className="w-4 h-4" /> Send OTP to {user?.email || "your email"}</Button>
              ) : !otpVerified ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Enter OTP</Label>
                    <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" maxLength={6} />
                    <p className="text-[10px] text-muted-foreground">Expires in <span className="font-semibold text-foreground">{formatTime(otpTimeLeft)}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleVerifyOtp}>Verify OTP</Button>
                    <Button variant="outline" size="sm" onClick={handleResendOtp}>Resend OTP</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-xs">New Password (min 6 chars)</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-xs">Confirm Password</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                  <Button onClick={handleSetPassword}>Set Password</Button>
                </div>
              )}
            </Card>
          ) : !paymentUnlocked ? (
            forgotMode ? (
              <Card className="p-6 bg-card border-border/50 space-y-4">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Reset Payment Password</h3>
                    <p className="text-xs text-muted-foreground">We'll send an OTP to {user?.email}</p>
                  </div>
                </div>
                {!forgotOtpSent ? (
                  <div className="space-y-3">
                    <Button onClick={handleForgotSendOtp} className="gap-2"><Lock className="w-4 h-4" /> Send OTP</Button>
                    <Button variant="ghost" size="sm" onClick={() => setForgotMode(false)}>Back</Button>
                  </div>
                ) : !forgotOtpVerified ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Enter OTP</Label>
                      <Input value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value)} placeholder="6-digit code" maxLength={6} />
                      <p className="text-[10px] text-muted-foreground">Expires in <span className="font-semibold text-foreground">{formatTime(forgotOtpTimeLeft)}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleForgotVerifyOtp}>Verify OTP</Button>
                      <Button variant="outline" size="sm" onClick={handleForgotSendOtp}>Resend</Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setForgotMode(false); setForgotOtpSent(false); }}>Back</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1"><Label className="text-xs">New Password</Label><Input type="password" value={forgotNewPassword} onChange={(e) => setForgotNewPassword(e.target.value)} /></div>
                    <div className="space-y-1"><Label className="text-xs">Confirm Password</Label><Input type="password" value={forgotConfirmPassword} onChange={(e) => setForgotConfirmPassword(e.target.value)} /></div>
                    <Button onClick={handleForgotResetPassword}>Reset Password</Button>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-6 bg-card border-border/50 space-y-4">
                <div className="flex items-center gap-3">
                  <Lock className="w-6 h-6 text-chart-4" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Payment Settings Locked</h3>
                    <p className="text-xs text-muted-foreground">Enter your password to manage payment keys</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input type="password" placeholder="Enter password" value={paymentPassword} onChange={(e) => setPaymentPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleUnlockPayment()} className="max-w-xs" />
                  <Button onClick={handleUnlockPayment}>Unlock</Button>
                </div>
                <button onClick={() => setForgotMode(true)} className="text-xs text-primary hover:underline">Forgot password?</button>
              </Card>
            )
          ) : (
            <>
              <Card className="p-4 bg-card border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Razorpay Integration</h3>
                  <Switch checked={razorpayEnabled} onCheckedChange={setRazorpayEnabled} />
                </div>
                {razorpayEnabled && (
                  <div className="space-y-3">
                    <div className="space-y-1"><Label className="text-xs">Razorpay Key ID</Label>
                      <Input placeholder="rzp_live_xxxxxxxxxxxx" type="password" value={razorpayKey} onChange={(e) => setRazorpayKey(e.target.value)} onCopy={(e) => e.preventDefault()} />
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Razorpay Key Secret</Label>
                      <Input placeholder="••••••••••••" type="password" value={razorpaySecret} onChange={(e) => setRazorpaySecret(e.target.value)} onCopy={(e) => e.preventDefault()} />
                    </div>
                  </div>
                )}
              </Card>
              <div className="flex items-center gap-3">
                <Button size="sm" className="gap-2" onClick={handleSaveKeys}><Save className="w-4 h-4" /> Save Payment Keys</Button>
                <Button variant="outline" size="sm" onClick={() => setPaymentUnlocked(false)}><Lock className="w-3 h-3 mr-1" /> Lock</Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="qr" className="mt-4 space-y-4">
          <Card className="p-4 bg-card border-border/50 space-y-4">
            <div className="flex items-center gap-2"><QrCode className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold text-foreground">UPI Payment</h3></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs">UPI ID</Label><Input placeholder="merchant@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} /></div>
              <div className="space-y-1"><Label className="text-xs">Payee Name</Label><Input placeholder="Your Business Name" value={upiName} onChange={(e) => setUpiName(e.target.value)} /></div>
            </div>
            <p className="text-[10px] text-muted-foreground">UPI QR codes will be auto-generated for each invoice.</p>
          </Card>

          <Card className="p-4 bg-card border-border/50 space-y-4">
            <div className="flex items-center gap-2"><Image className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold text-foreground">Upload QR Code</h3></div>
            <p className="text-xs text-muted-foreground">Upload your custom UPI QR code image (any UPI provider).</p>
            <div className="flex gap-4 items-start">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />
                <div className="w-32 h-32 rounded-lg border-2 border-dashed border-border/50 hover:border-primary/50 flex items-center justify-center transition-colors">
                  {qrImage ? (
                    <img src={qrImage} alt="QR" className="w-full h-full object-contain rounded-lg" />
                  ) : (
                    <div className="text-center">
                      <UploadIcon className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                      <span className="text-[10px] text-muted-foreground">Click to upload</span>
                    </div>
                  )}
                </div>
              </label>
              {qrImage && (
                <Button variant="outline" size="sm" onClick={() => { setQrImage(null); localStorage.removeItem("payrecovery_qr_image"); toast.success("QR removed"); }}>
                  Remove
                </Button>
              )}
            </div>
          </Card>

          <Button size="sm" className="gap-2" onClick={async () => {
            await upsertKey("upi", "upi_id", upiId);
            await upsertKey("upi", "upi_name", upiName);
            localStorage.setItem("payrecovery_upi_id", upiId);
            localStorage.setItem("payrecovery_upi_name", upiName);
            toast.success("UPI settings saved");
          }}><Save className="w-4 h-4" /> Save UPI Settings</Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
