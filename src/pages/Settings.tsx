import { useState, useEffect } from "react";
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
import { Save, CreditCard, Building2, Lock, Shield, QrCode, KeyRound, Trash2, AlertTriangle, PenLine, User, X } from "lucide-react";
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

  // Payment keys - Razorpay + PayPal (replaced Stripe)
  const [razorpayKey, setRazorpayKey] = useState("");
  const [razorpaySecret, setRazorpaySecret] = useState("");
  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState("");
  const [paypalSecret, setPaypalSecret] = useState("");
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [upiId, setUpiId] = useState(() => localStorage.getItem("payrecovery_upi_id") || "");
  const [upiName, setUpiName] = useState(() => localStorage.getItem("payrecovery_upi_name") || "");

  // Company edit mode
  const [companyEditMode, setCompanyEditMode] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    companyName: user?.companyName || "",
    companyLocation: user?.companyLocation || "",
    email: user?.email || "",
    cinNumber: user?.cinNumber || "",
  });

  // Profile
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });

  useEffect(() => {
    setCompanyForm({
      companyName: user?.companyName || "",
      companyLocation: user?.companyLocation || "",
      email: user?.email || "",
      cinNumber: user?.cinNumber || "",
    });
    setProfileForm({ name: user?.name || "", phone: user?.phone || "" });
  }, [user]);

  // Load keys from DB
  useEffect(() => {
    if (!user?.id) return;
    supabase.from("api_key_vault").select("*").eq("user_id", user.id).then(({ data }) => {
      if (!data) return;
      data.forEach((row: any) => {
        if (row.provider === "razorpay" && row.key_name === "key_id") { setRazorpayKey(row.key_value_encrypted || ""); setRazorpayEnabled(true); }
        if (row.provider === "razorpay" && row.key_name === "key_secret") setRazorpaySecret(row.key_value_encrypted || "");
        if (row.provider === "paypal" && row.key_name === "client_id") { setPaypalClientId(row.key_value_encrypted || ""); setPaypalEnabled(true); }
        if (row.provider === "paypal" && row.key_name === "client_secret") setPaypalSecret(row.key_value_encrypted || "");
        if (row.provider === "upi" && row.key_name === "upi_id") setUpiId(row.key_value_encrypted || "");
        if (row.provider === "upi" && row.key_name === "upi_name") setUpiName(row.key_value_encrypted || "");
      });
    });
  }, [user?.id]);

  const handleSave = () => {
    localStorage.setItem("payrecovery_upi_id", upiId);
    localStorage.setItem("payrecovery_upi_name", upiName);
    toast.success("Settings saved successfully");
  };

  const handleSendOtp = async () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(code);
    setOtpSent(true);
    try {
      const smtpConfig = JSON.parse(localStorage.getItem("payrecovery_smtp") || "{}");
      if (smtpConfig.smtpServer && smtpConfig.smtpPassword) {
        await fetch("http://localhost:3001/api/email/send", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            smtp: { host: smtpConfig.smtpServer, port: parseInt(smtpConfig.smtpPort || "587"), email: smtpConfig.senderEmail || smtpConfig.smtpUsername, username: smtpConfig.smtpUsername, password: smtpConfig.smtpPassword, tls: smtpConfig.useTls !== false },
            to: user?.email || "", subject: "PayRecovery - Payment Security OTP",
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

  const handleForgotSendOtp = async () => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setForgotGeneratedOtp(code);
    setForgotOtpSent(true);
    try {
      const smtpConfig = JSON.parse(localStorage.getItem("payrecovery_smtp") || "{}");
      if (smtpConfig.smtpServer && smtpConfig.smtpPassword) {
        await fetch("http://localhost:3001/api/email/send", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            smtp: { host: smtpConfig.smtpServer, port: parseInt(smtpConfig.smtpPort || "587"), email: smtpConfig.senderEmail || smtpConfig.smtpUsername, username: smtpConfig.smtpUsername, password: smtpConfig.smtpPassword, tls: smtpConfig.useTls !== false },
            to: user?.email || "", subject: "PayRecovery - Password Reset OTP",
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
    toast.success("Password reset successfully!");
  };

  const upsertKey = async (provider: string, keyName: string, value: string) => {
    if (!user?.id) return;
    const { data: existing } = await supabase
      .from("api_key_vault")
      .select("id")
      .eq("user_id", user.id)
      .eq("provider", provider)
      .eq("key_name", keyName)
      .maybeSingle();

    if (existing) {
      await supabase.from("api_key_vault").update({ key_value_encrypted: value }).eq("id", existing.id);
    } else {
      await supabase.from("api_key_vault").insert({ user_id: user.id, provider, key_name: keyName, key_value_encrypted: value });
    }
  };

  const handleSaveKeys = async () => {
    try {
      // Save all keys to DB
      if (razorpayEnabled) {
        await upsertKey("razorpay", "key_id", razorpayKey);
        await upsertKey("razorpay", "key_secret", razorpaySecret);
      }
      if (paypalEnabled) {
        await upsertKey("paypal", "client_id", paypalClientId);
        await upsertKey("paypal", "client_secret", paypalSecret);
      }
      await upsertKey("upi", "upi_id", upiId);
      await upsertKey("upi", "upi_name", upiName);

      // Also save locally for quick access
      localStorage.setItem("payrecovery_upi_id", upiId);
      localStorage.setItem("payrecovery_upi_name", upiName);

      // Also push to backend .env
      try {
        await fetch("http://localhost:3001/api/settings/payment-keys", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ razorpayKey, razorpaySecret, upiId, upiName }),
        });
      } catch { /* backend may be offline */ }

      toast.success("Payment keys saved to database");
      setPaymentUnlocked(false); // auto-close/lock after save
    } catch {
      toast.error("Failed to save keys");
    }
  };

  const handleSaveCompany = async () => {
    try {
      await supabase.auth.updateUser({
        data: {
          companyName: companyForm.companyName,
          companyLocation: companyForm.companyLocation,
          cinNumber: companyForm.cinNumber,
        },
      });
      toast.success("Company details updated");
      setCompanyEditMode(false);
    } catch {
      toast.error("Failed to update company details");
    }
  };

  const handleSaveProfile = async () => {
    try {
      await supabase.auth.updateUser({
        data: { name: profileForm.name, phone: profileForm.phone },
      });
      toast.success("Profile updated");
      setProfileEditMode(false);
    } catch {
      toast.error("Failed to update profile");
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
          <TabsTrigger value="account" className="text-xs gap-1"><User className="w-3 h-3" /> Account</TabsTrigger>
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
                    <p className="text-xs text-muted-foreground">We'll send an OTP to {user?.email}</p>
                  </div>
                </div>
                {!forgotOtpSent ? (
                  <div className="space-y-3">
                    <Button onClick={handleForgotSendOtp} className="gap-2"><Lock className="w-4 h-4" /> Send OTP to {user?.email}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setForgotMode(false)}>Back to login</Button>
                  </div>
                ) : !forgotOtpVerified ? (
                  <div className="space-y-3">
                    <div className="space-y-1"><Label className="text-xs">Enter OTP</Label><Input value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value)} placeholder="6-digit code" maxLength={6} /></div>
                    <div className="flex gap-2">
                      <Button onClick={handleForgotVerifyOtp}>Verify OTP</Button>
                      <Button variant="ghost" size="sm" onClick={handleForgotSendOtp}>Resend</Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => { setForgotMode(false); setForgotOtpSent(false); }}>Back</Button>
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
                <button onClick={() => setForgotMode(true)} className="text-xs text-primary hover:underline">Forgot password?</button>
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
                      <Input placeholder="rzp_live_xxxxxxxxxxxx" type="password" value={razorpayKey} onChange={(e) => setRazorpayKey(e.target.value)} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} />
                    </div>
                    <div className="space-y-1"><Label className="text-xs">Razorpay Key Secret</Label>
                      <Input placeholder="••••••••••••" type="password" value={razorpaySecret} onChange={(e) => setRazorpaySecret(e.target.value)} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} />
                    </div>
                  </div>
                )}
              </Card>

              {/* PayPal (replaced Stripe) */}
              <Card className="p-4 bg-card border-border/50 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">PayPal Integration</h3>
                  <Switch checked={paypalEnabled} onCheckedChange={setPaypalEnabled} />
                </div>
                {paypalEnabled && (
                  <div className="space-y-3">
                    <div className="space-y-1"><Label className="text-xs">PayPal Client ID</Label>
                      <Input placeholder="AYSq3RDGsmBLJE..." type="password" value={paypalClientId} onChange={(e) => setPaypalClientId(e.target.value)} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} />
                    </div>
                    <div className="space-y-1"><Label className="text-xs">PayPal Secret</Label>
                      <Input placeholder="••••••••••••" type="password" value={paypalSecret} onChange={(e) => setPaypalSecret(e.target.value)} onCopy={(e) => e.preventDefault()} onCut={(e) => e.preventDefault()} />
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
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Company Information</h3>
              {!companyEditMode ? (
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setCompanyEditMode(true)}>
                  <PenLine className="w-3 h-3" /> Edit
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setCompanyEditMode(false)}>
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { label: "Company Name", key: "companyName", value: companyEditMode ? companyForm.companyName : (user?.companyName || "—") },
                { label: "Location", key: "companyLocation", value: companyEditMode ? companyForm.companyLocation : (user?.companyLocation || "—") },
                { label: "Email", key: "email", value: user?.email || "—", readonly: true },
                { label: "CIN Number", key: "cinNumber", value: companyEditMode ? companyForm.cinNumber : (user?.cinNumber || "—") },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <Label className="text-xs">{item.label}</Label>
                  {companyEditMode && !item.readonly ? (
                    <Input value={(companyForm as any)[item.key]} onChange={(e) => setCompanyForm({ ...companyForm, [item.key]: e.target.value })} />
                  ) : (
                    <div className="text-sm text-foreground bg-secondary/30 rounded-md px-3 py-2">{item.value}</div>
                  )}
                </div>
              ))}
            </div>
            {companyEditMode && (
              <Button size="sm" className="gap-2" onClick={handleSaveCompany}>
                <Save className="w-4 h-4" /> Save Company Details
              </Button>
            )}
          </Card>
        </TabsContent>

        {/* Account */}
        <TabsContent value="account" className="mt-4 space-y-4">
          {/* Profile Section */}
          <Card className="p-4 bg-card border-border/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Profile</h3>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              {!profileEditMode ? (
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setProfileEditMode(true)}>
                  <PenLine className="w-3 h-3" /> Edit
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={() => setProfileEditMode(false)}>
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Full Name</Label>
                {profileEditMode ? (
                  <Input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
                ) : (
                  <div className="text-sm text-foreground bg-secondary/30 rounded-md px-3 py-2">{user?.name || "—"}</div>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                {profileEditMode ? (
                  <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                ) : (
                  <div className="text-sm text-foreground bg-secondary/30 rounded-md px-3 py-2">{user?.phone || "—"}</div>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Company</Label>
                <div className="text-sm text-foreground bg-secondary/30 rounded-md px-3 py-2">{user?.companyName || "—"}</div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Role</Label>
                <div className="text-sm text-foreground bg-secondary/30 rounded-md px-3 py-2 capitalize">{user?.role || "admin"}</div>
              </div>
            </div>
            {profileEditMode && (
              <Button size="sm" className="gap-2" onClick={handleSaveProfile}>
                <Save className="w-4 h-4" /> Save Profile
              </Button>
            )}
          </Card>

          {/* Delete Account */}
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
    if (!finalReason) { toast.error("Please select a reason for deletion"); return; }
    if (confirmText !== "DELETE") { toast.error("Please type DELETE to confirm"); return; }

    setLoading(true);
    try {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 30);
      if (user?.id) {
        await supabase.from("activity_logs").insert({
          user_id: user.id,
          action: "account_deletion_scheduled",
          description: `Account deletion scheduled for ${scheduledDate.toLocaleDateString()}. Reason: ${finalReason}`,
        });
      }
      toast.success(`Account deletion scheduled for ${scheduledDate.toLocaleDateString()}.`);
      setShowDialog(false);
      setReason(""); setOtherReason(""); setConfirmText("");
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
            <p className="text-xs text-muted-foreground">Permanently delete your account and all data. Irreversible after 30 days.</p>
          </div>
        </div>
        <Button variant="destructive" size="sm" className="gap-2" onClick={() => setShowDialog(true)}>
          <Trash2 className="w-4 h-4" /> Request Account Deletion
        </Button>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-5 h-5" /> Delete Account</DialogTitle>
            <DialogDescription>Your account will be deleted in <span className="font-semibold text-foreground">30 days</span>.</DialogDescription>
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
              {reason === "Other" && <Textarea placeholder="Please tell us more..." value={otherReason} onChange={(e) => setOtherReason(e.target.value)} className="mt-2" rows={3} />}
            </div>
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-sm font-medium">Type <span className="font-mono text-destructive">DELETE</span> to confirm</Label>
              <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Type DELETE" className="font-mono" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRequestDeletion} disabled={loading || confirmText !== "DELETE" || !reason}>
              {loading ? "Scheduling..." : "Schedule Deletion (30 days)"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
