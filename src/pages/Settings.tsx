import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Save, Building2, Trash2, AlertTriangle, PenLine, User, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { user } = useAuth();

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

  const handleSave = () => {
    toast.success("Settings saved successfully");
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
          <p className="text-sm text-muted-foreground">Configure your account and company details</p>
        </div>
        <Button size="sm" className="gap-2" onClick={handleSave}><Save className="w-4 h-4" /> Save</Button>
      </div>

      <Tabs defaultValue="account">
        <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="account" className="text-xs gap-1"><User className="w-3 h-3" /> Account</TabsTrigger>
          <TabsTrigger value="company" className="text-xs gap-1"><Building2 className="w-3 h-3" /> Company</TabsTrigger>
        </TabsList>

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
                  <div className="text-sm text-foreground bg-secondary/30 rounded-md px-3 py-2">{user?.name || "Not provided"}</div>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                {profileEditMode ? (
                  <Input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                ) : (
                  <div className="text-sm text-foreground bg-secondary/30 rounded-md px-3 py-2">{user?.phone || "Not provided"}</div>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Company</Label>
                <div className="text-sm text-foreground bg-secondary/30 rounded-md px-3 py-2">{user?.companyName || "Not provided"}</div>
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
                { label: "Company Name", key: "companyName", value: companyEditMode ? companyForm.companyName : (user?.companyName || "Not provided") },
                { label: "Location", key: "companyLocation", value: companyEditMode ? companyForm.companyLocation : (user?.companyLocation || "Not provided") },
                { label: "Email", key: "email", value: user?.email || "Not provided", readonly: true },
                { label: "CIN Number", key: "cinNumber", value: companyEditMode ? companyForm.cinNumber : (user?.cinNumber || "No CIN Provided") },
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
