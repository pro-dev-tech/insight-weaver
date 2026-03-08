import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, CreditCard, Building2, Lock, Shield, QrCode } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();

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

  // Payment keys
  const [razorpayKey, setRazorpayKey] = useState("");
  const [razorpaySecret, setRazorpaySecret] = useState("");
  const [razorpayEnabled, setRazorpayEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem("payrecovery_settings") || "{}").razorpayEnabled || false; } catch { return false; }
  });
  const [stripeKey, setStripeKey] = useState("");
  const [stripeSecret, setStripeSecret] = useState("");
  const [stripeEnabled, setStripeEnabled] = useState(() => {
    try { return JSON.parse(localStorage.getItem("payrecovery_settings") || "{}").stripeEnabled || false; } catch { return false; }
  });
  const [upiId, setUpiId] = useState(() => localStorage.getItem("payrecovery_upi_id") || "");
  const [upiName, setUpiName] = useState(() => localStorage.getItem("payrecovery_upi_name") || "");

  const handleSave = () => {
    localStorage.setItem("payrecovery_upi_id", upiId);
    localStorage.setItem("payrecovery_upi_name", upiName);
    const existing = JSON.parse(localStorage.getItem("payrecovery_settings") || "{}");
    localStorage.setItem("payrecovery_settings", JSON.stringify({ ...existing, razorpayEnabled, stripeEnabled }));
    toast.success("Settings saved successfully");
  };

  const handleSendOtp = () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setOtpSent(true);
    toast.success(`OTP sent to ${user?.email || "your email"}: ${code} (demo)`);
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
    setOtpSent(false); setOtpVerified(false); setOtp(""); setNewPassword(""); setConfirmPassword("");
    toast.success("Payment password set successfully!");
  };

  const handleUnlockPayment = () => {
    const stored = localStorage.getItem("payrecovery_pay_password");
    if (stored && btoa(paymentPassword) === stored) { setPaymentUnlocked(true); toast.success("Payment settings unlocked"); }
    else toast.error("Incorrect password");
    setPaymentPassword("");
  };

  const handleSaveKeys = async () => {
    try {
      await fetch("http://localhost:3001/api/settings/payment-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razorpayKey, razorpaySecret, stripeKey, stripeSecret, upiId, upiName }),
      });
      toast.success("Payment keys saved to backend");
    } catch {
      localStorage.setItem("payrecovery_upi_id", upiId);
      localStorage.setItem("payrecovery_upi_name", upiName);
      toast.success("UPI settings saved locally (backend unavailable for API keys)");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your payment recovery system</p>
        </div>
        <Button size="sm" className="gap-2" onClick={handleSave}><Save className="w-4 h-4" /> Save</Button>
      </div>

      <Tabs defaultValue="payment">
        <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="payment" className="text-xs gap-1"><CreditCard className="w-3 h-3" /> Payment</TabsTrigger>
          <TabsTrigger value="company" className="text-xs gap-1"><Building2 className="w-3 h-3" /> Company</TabsTrigger>
        </TabsList>

        {/* Payment */}
        <TabsContent value="payment" className="mt-4 space-y-4">
          {!paymentPasswordSet ? (
            <Card className="p-6 bg-card border-border/50 space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Set Up Payment Security</h3>
                  <p className="text-xs text-muted-foreground">You must set a password before managing API keys</p>
                </div>
              </div>
              {!otpSent ? (
                <Button onClick={handleSendOtp} className="gap-2"><Lock className="w-4 h-4" /> Send OTP to {user?.email || "your email"}</Button>
              ) : !otpVerified ? (
                <div className="space-y-3">
                  <div className="space-y-1"><Label className="text-xs">Enter OTP</Label><Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit code" maxLength={6} /></div>
                  <Button onClick={handleVerifyOtp}>Verify OTP</Button>
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
            <Card className="p-6 bg-card border-border/50 space-y-4">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-chart-4" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Payment Settings Locked</h3>
                  <p className="text-xs text-muted-foreground">Enter your payment password to manage API keys</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input type="password" placeholder="Enter password" value={paymentPassword} onChange={(e) => setPaymentPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleUnlockPayment()} className="max-w-xs" />
                <Button onClick={handleUnlockPayment}>Unlock</Button>
              </div>
            </Card>
          ) : (
            <>
              {/* UPI */}
              <Card className="p-4 bg-card border-border/50 space-y-4">
                <div className="flex items-center gap-2"><QrCode className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold text-foreground">UPI Payment</h3></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs">UPI ID</Label><Input placeholder="merchant@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-xs">Payee Name</Label><Input placeholder="Your Business Name" value={upiName} onChange={(e) => setUpiName(e.target.value)} /></div>
                </div>
                <p className="text-[10px] text-muted-foreground">UPI QR codes will be auto-generated for each invoice using this UPI ID.</p>
              </Card>

              {/* Razorpay */}
              <Card className="p-4 bg-card border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Razorpay Integration</h3>
                  <Switch checked={razorpayEnabled} onCheckedChange={setRazorpayEnabled} />
                </div>
                {razorpayEnabled && (
                  <div className="space-y-3">
                    <div className="space-y-1"><Label className="text-xs">Razorpay Key ID</Label>
                      <Input placeholder="rzp_live_xxxxxxxxxxxx" type="password" value={razorpayKey} onChange={(e) => setRazorpayKey(e.target.value)} style={{ userSelect: "none" }} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} />
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Razorpay Key Secret</Label>
                      <Input placeholder="••••••••••••" type="password" value={razorpaySecret} onChange={(e) => setRazorpaySecret(e.target.value)} style={{ userSelect: "none" }} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} />
                    </div>
                  </div>
                )}
              </Card>

              {/* Stripe */}
              <Card className="p-4 bg-card border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Stripe Integration</h3>
                  <Switch checked={stripeEnabled} onCheckedChange={setStripeEnabled} />
                </div>
                {stripeEnabled && (
                  <div className="space-y-3">
                    <div className="space-y-1"><Label className="text-xs">Stripe Publishable Key</Label>
                      <Input placeholder="pk_live_xxxxxxxxxxxx" type="password" value={stripeKey} onChange={(e) => setStripeKey(e.target.value)} style={{ userSelect: "none" }} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} />
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Stripe Secret Key</Label>
                      <Input placeholder="sk_live_xxxxxxxxxxxx" type="password" value={stripeSecret} onChange={(e) => setStripeSecret(e.target.value)} style={{ userSelect: "none" }} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} />
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

        {/* Company */}
        <TabsContent value="company" className="mt-4 space-y-4">
          <Card className="p-4 bg-card border-border/50 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Company Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Company Name", value: user?.companyName || "" },
                { label: "Location", value: user?.companyLocation || "" },
                { label: "Email", value: user?.email || "" },
                { label: "CIN Number", value: user?.cinNumber || "Not provided" },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <Label className="text-xs">{item.label}</Label>
                  <Input value={item.value} readOnly className="bg-secondary/30" />
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
