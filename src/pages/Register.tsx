import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, ArrowRight, Mail } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const [form, setForm] = useState({
    name: "", email: "", password: "", phone: "", companyName: "", companyLocation: "", cinNumber: "",
  });
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { register, resendConfirmation } = useAuth();
  const navigate = useNavigate();

  const update = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.phone || !form.companyName || !form.companyLocation) {
      toast.error("Please fill all required fields");
      return;
    }
    setLoading(true);
    try {
      await register(form);
      setRegistered(true);
    } catch (err: any) {
      toast.error(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Verify Your Email</h2>
          <p className="text-sm text-muted-foreground">
            A confirmation email has been sent to <span className="font-semibold text-foreground">{form.email}</span>. 
            Please click the link in the email to verify your account.
          </p>
          <div className="space-y-3">
            <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
              <ArrowRight className="w-4 h-4 mr-2" /> Go to Login
            </Button>
            <p className="text-xs text-muted-foreground">Didn't receive the email? Check your spam folder.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Create Account</h2>
          <p className="text-sm text-muted-foreground">Start recovering payments with AI automation</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name *</Label>
              <Input placeholder="Rajesh Kumar" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input type="email" placeholder="you@company.in" value={form.email} onChange={(e) => update("email", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input type="password" placeholder="••••••••" value={form.password} onChange={(e) => update("password", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input placeholder="+91 98765 43210" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Company Name *</Label>
              <Input placeholder="Kumar Enterprises" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Company Location *</Label>
              <Input placeholder="Mumbai, Maharashtra" value={form.companyLocation} onChange={(e) => update("companyLocation", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>CIN Number <span className="text-muted-foreground">(optional)</span></Label>
              <Input placeholder="U12345MH2020PTC123456" value={form.cinNumber} onChange={(e) => update("cinNumber", e.target.value)} />
            </div>
          </div>
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? "Creating..." : "Create Account"} <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
