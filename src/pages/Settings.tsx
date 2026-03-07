import { useState } from "react";
import { DEFAULT_SETTINGS } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import type { MSMESettings } from "@/types";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Bell, CreditCard, Brain, Building2 } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<MSMESettings>(DEFAULT_SETTINGS);

  const update = <K extends keyof MSMESettings>(key: K, val: MSMESettings[K]) =>
    setSettings((p) => ({ ...p, [key]: val }));

  const updateSchedule = (key: string, val: number) =>
    setSettings((p) => ({ ...p, reminderSchedule: { ...p.reminderSchedule, [key]: val } }));

  const handleSave = () => toast.success("Settings saved successfully");

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Configure your payment recovery system</p>
        </div>
        <Button size="sm" className="gap-2" onClick={handleSave}><Save className="w-4 h-4" /> Save</Button>
      </div>

      <Tabs defaultValue="notifications">
        <TabsList className="bg-secondary/50 border border-border/50">
          <TabsTrigger value="notifications" className="text-xs gap-1"><Bell className="w-3 h-3" /> Notifications</TabsTrigger>
          <TabsTrigger value="payment" className="text-xs gap-1"><CreditCard className="w-3 h-3" /> Payment</TabsTrigger>
          <TabsTrigger value="ai" className="text-xs gap-1"><Brain className="w-3 h-3" /> AI Config</TabsTrigger>
          <TabsTrigger value="company" className="text-xs gap-1"><Building2 className="w-3 h-3" /> Company</TabsTrigger>
        </TabsList>

        {/* Notifications */}
        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card className="p-4 bg-card border-border/50 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Default Notification Mode</h3>
            <Select value={settings.defaultNotificationMode} onValueChange={(v: any) => update("defaultNotificationMode", v)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="multi">Multi-Channel</SelectItem>
              </SelectContent>
            </Select>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">WhatsApp API</Label>
                <Switch checked={settings.hasWhatsappAPI} onCheckedChange={(v) => update("hasWhatsappAPI", v)} />
              </div>
              {settings.hasWhatsappAPI && (
                <div>
                  <Label className="text-xs text-muted-foreground">Provider</Label>
                  <Select value={settings.whatsappProvider || ""} onValueChange={(v: any) => update("whatsappProvider", v)}>
                    <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select provider" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="gupshup">Gupshup</SelectItem>
                      <SelectItem value="interakt">Interakt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label className="text-sm">SMS Enabled</Label>
                <Switch checked={settings.smsEnabled} onCheckedChange={(v) => update("smsEnabled", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Email Enabled</Label>
                <Switch checked={settings.emailEnabled} onCheckedChange={(v) => update("emailEnabled", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Fallback Enabled</Label>
                <Switch checked={settings.fallbackEnabled} onCheckedChange={(v) => update("fallbackEnabled", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Auto Reminders</Label>
                <Switch checked={settings.autoReminders} onCheckedChange={(v) => update("autoReminders", v)} />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border-border/50 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Reminder Schedule (days)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">1st (before due)</Label>
                <Input type="number" value={settings.reminderSchedule.firstReminder} onChange={(e) => updateSchedule("firstReminder", parseInt(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">2nd (after due)</Label>
                <Input type="number" value={settings.reminderSchedule.secondReminder} onChange={(e) => updateSchedule("secondReminder", parseInt(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">3rd (firm)</Label>
                <Input type="number" value={settings.reminderSchedule.thirdReminder} onChange={(e) => updateSchedule("thirdReminder", parseInt(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Escalation</Label>
                <Input type="number" value={settings.reminderSchedule.escalation} onChange={(e) => updateSchedule("escalation", parseInt(e.target.value))} />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Payment */}
        <TabsContent value="payment" className="mt-4 space-y-4">
          <Card className="p-4 bg-card border-border/50 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Razorpay Integration</h3>
            <div className="flex items-center justify-between">
              <Label className="text-sm">Enable Razorpay</Label>
              <Switch checked={settings.razorpayEnabled} onCheckedChange={(v) => update("razorpayEnabled", v)} />
            </div>
            {settings.razorpayEnabled && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">Razorpay Key ID</Label>
                  <Input placeholder="rzp_live_xxxxxxxxxxxx" type="password" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Razorpay Key Secret</Label>
                  <Input placeholder="••••••••••••" type="password" />
                </div>
                <p className="text-[10px] text-muted-foreground">Payment links will be auto-generated and included in reminders.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* AI Config */}
        <TabsContent value="ai" className="mt-4 space-y-4">
          <Card className="p-4 bg-card border-border/50 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">AI Provider</h3>
            <Select value={settings.aiProvider} onValueChange={(v: any) => update("aiProvider", v)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Google Gemini (Default)</SelectItem>
                <SelectItem value="openrouter">OpenRouter</SelectItem>
                <SelectItem value="groq">Groq</SelectItem>
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <Label className="text-xs">API Key</Label>
              <Input placeholder="Enter your API key" type="password" />
            </div>
            <p className="text-[10px] text-muted-foreground">
              AI is used for: PDF data extraction, personalized reminder generation, payment risk prediction, and optimal reminder timing.
            </p>
          </Card>
        </TabsContent>

        {/* Company */}
        <TabsContent value="company" className="mt-4 space-y-4">
          <Card className="p-4 bg-card border-border/50 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Company Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Company Name</Label>
                <Input value={user?.companyName || ""} readOnly className="bg-secondary/30" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Location</Label>
                <Input value={user?.companyLocation || ""} readOnly className="bg-secondary/30" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input value={user?.email || ""} readOnly className="bg-secondary/30" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CIN Number</Label>
                <Input value={user?.cinNumber || "Not provided"} readOnly className="bg-secondary/30" />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
