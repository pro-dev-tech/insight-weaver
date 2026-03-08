import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Save, CreditCard, Building2, Lock, Shield, QrCode, KeyRound, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";

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

  // Forgot password flow
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotOtpSent, setForgotOtpSent] = useState(false);
  const [forgotOtpVerified, setForgotOtpVerified] = useState(false);
  const [forgotGeneratedOtp, setForgotGeneratedOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");

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

  // --- Initial password setup OTP (via SMTP) ---
  const handleSendOtp = async () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setOtpSent(true);
    // Try sending via SMTP backend
    try {
      const smtpConfig = JSON.parse(localStorage.getItem("payrecovery_smtp") || "{}");
      if (smtpConfig.smtpServer && smtpConfig.smtpPassword) {
        await fetch("http://localhost:3001/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            smtp: { host: smtpConfig.smtpServer, port: parseInt(smtpConfig.smtpPort || "587"), email: smtpConfig.senderEmail || smtpConfig.smtpUsername, username: smtpConfig.smtpUsername, password: smtpConfig.smtpPassword, tls: smtpConfig.useTls !== false },
            to: user?.email || "",
            subject: "PayRecovery - Payment Security OTP",
            message: `Your OTP for payment security setup is: ${code}\n\nThis OTP is valid for 10 minutes.\n\n- PayRecovery AI`,
          }),
        });
        toast.success(`OTP sent to ${user?.email}`);
        return;
      }
    } catch { /* fallback */ }
    toast.success(`OTP sent to ${user?.email}: ${code} (SMTP not configured - showing for demo)`);
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

  // --- Forgot password flow ---
  const handleForgotSendOtp = async () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setForgotGeneratedOtp(code);
    setForgotOtpSent(true);
    try {
      const smtpConfig = JSON.parse(localStorage.getItem("payrecovery_smtp") || "{}");
      if (smtpConfig.smtpServer && smtpConfig.smtpPassword) {
        await fetch("http://localhost:3001/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            smtp: { host: smtpConfig.smtpServer, port: parseInt(smtpConfig.smtpPort || "587"), email: smtpConfig.senderEmail || smtpConfig.smtpUsername, username: smtpConfig.smtpUsername, password: smtpConfig.smtpPassword, tls: smtpConfig.useTls !== false },
            to: user?.email || "",
            subject: "PayRecovery - Password Reset OTP",
            message: `Your OTP for password reset is: ${code}\n\nThis OTP is valid for 10 minutes.\n\n- PayRecovery AI`,
          }),
        });
        toast.success(`Reset OTP sent to ${user?.email}`);
        return;
      }
    } catch { /* fallback */ }
    toast.success(`Reset OTP sent to ${user?.email}: ${code} (SMTP not configured - showing for demo)`);
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
    setForgotOtp(""); setForgotNewPassword(""); setForgotConfirmPassword("");
    toast.success("Password reset successfully! You can now unlock with your new password.");
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
          <TabsTrigger value="account" className="text-xs gap-1"><Trash2 className="w-3 h-3" /> Account</TabsTrigger>
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
            forgotMode ? (
              <Card className="p-6 bg-card border-border/50 space-y-4">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Reset Payment Password</h3>
                    <p className="text-xs text-muted-foreground">We'll send an OTP to {user?.email} to verify your identity</p>
                  </div>
                </div>
                {!forgotOtpSent ? (
                  <div className="space-y-3">
                    <Button onClick={handleForgotSendOtp} className="gap-2"><Lock className="w-4 h-4" /> Send OTP to {user?.email}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setForgotMode(false)}>Back to login</Button>
                  </div>
                ) : !forgotOtpVerified ? (
                  <div className="space-y-3">
                    <div className="space-y-1"><Label className="text-xs">Enter OTP sent to {user?.email}</Label><Input value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value)} placeholder="6-digit code" maxLength={6} /></div>
                    <div className="flex gap-2">
                      <Button onClick={handleForgotVerifyOtp}>Verify OTP</Button>
                      <Button variant="ghost" size="sm" onClick={handleForgotSendOtp}>Resend OTP</Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setForgotMode(false); setForgotOtpSent(false); }}>Back to login</Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1"><Label className="text-xs">New Password (min 6 chars)</Label><Input type="password" value={forgotNewPassword} onChange={(e) => setForgotNewPassword(e.target.value)} /></div>
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
                    <p className="text-xs text-muted-foreground">Enter your payment password to manage API keys</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input type="password" placeholder="Enter password" value={paymentPassword} onChange={(e) => setPaymentPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleUnlockPayment()} className="max-w-xs" />
                  <Button onClick={handleUnlockPayment}>Unlock</Button>
                </div>
                <button onClick={() => setForgotMode(true)} className="text-xs text-primary hover:underline">
                  Forgot password?
                </button>
              </Card>
            )
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

        {/* Account Deletion */}
        <TabsContent value="account" className="mt-4 space-y-4">
          <AccountDeletion />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const DELETE_REASONS = [
  "I no longer need this service",
  "I found a better alternative",
  "Too expensive / not worth the cost",
  "Missing features I need",
  "Privacy / data concerns",
  "Other",
];

function AccountDeletion() {
  const { user, logout } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestDeletion = async () => {
    const finalReason = reason === "Other" ? otherReason.trim() : reason;
    if (!finalReason) {
      toast.error("Please select a reason for deletion");
      return;
    }
    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    setLoading(true);
    try {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 30);

      // Log the deletion request in activity_logs
      if (user?.id) {
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          action: "account_deletion_scheduled",
          description: `Account deletion scheduled for ${scheduledDate.toLocaleDateString()}. Reason: ${finalReason}`,
        });
      }

      toast.success(
        `Account deletion scheduled. Your account and all data will be permanently deleted on ${scheduledDate.toLocaleDateString()}. You can cancel this within 30 days by contacting support.`
      );
      setShowDialog(false);
      setReason("");
      setOtherReason("");
      setConfirmText("");

      // Sign out after scheduling
      setTimeout(() => logout(), 2000);
    } catch (err: any) {
      toast.error(err?.message || "Failed to schedule deletion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="p-6 bg-card border-destructive/30 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Delete Account</h3>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all associated data. This action is irreversible after 30 days.
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="gap-2"
          onClick={() => setShowDialog(true)}
        >
          <Trash2 className="w-4 h-4" /> Request Account Deletion
        </Button>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Delete Account
            </DialogTitle>
            <DialogDescription>
              Your account will be scheduled for deletion in <span className="font-semibold text-foreground">30 days</span>. 
              During this period you can contact support to cancel. After 30 days, all your data will be permanently removed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Why are you leaving? *</Label>
              <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
                {DELETE_REASONS.map((r) => (
                  <div key={r} className="flex items-center space-x-2">
                    <RadioGroupItem value={r} id={r} />
                    <Label htmlFor={r} className="text-sm font-normal cursor-pointer">{r}</Label>
                  </div>
                ))}
              </RadioGroup>
              {reason === "Other" && (
                <Textarea
                  placeholder="Please tell us more..."
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-sm font-medium">
                Type <span className="font-mono text-destructive">DELETE</span> to confirm
              </Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleRequestDeletion}
              disabled={loading || confirmText !== "DELETE" || !reason}
            >
              {loading ? "Scheduling..." : "Schedule Deletion (30 days)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
