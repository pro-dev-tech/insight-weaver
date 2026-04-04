import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { MoneyRain } from "@/components/MoneyRain";
import { Shield, ArrowRight, FileText, Zap, BarChart3, Bell } from "lucide-react";
import { toast } from "sonner";
import { motion, type Easing } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.45, ease: "easeOut" as Easing },
  }),
};

const highlights = [
  { icon: Zap, text: "AI-Powered Reminders" },
  { icon: BarChart3, text: "Real-Time Analytics" },
  { icon: Bell, text: "Multi-Channel Alerts" },
  { icon: Shield, text: "Bank-Grade Security" },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMoneyRain, setShowMoneyRain] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill all fields"); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      setShowMoneyRain(true);
      const tourDone = localStorage.getItem("invoiceflow_tour_completed");
      setTimeout(() => navigate("/dashboard", { state: { showTour: !tourDone } }), 2500);
    } catch {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <MoneyRain active={showMoneyRain} />
      {/* Left panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full bg-accent/10 blur-3xl" />
        <div className="relative z-10 flex flex-col justify-center p-12 max-w-lg mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <FileText className="w-7 h-7 text-primary" />
            </div>
             <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-3">
              Welcome back to <span className="gradient-text">Invoice Flow</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed">
              Automate invoice tracking, payment reminders, and receivables analytics.
              Reduce payment delays by up to 60% with AI-driven automation.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 gap-3">
            {highlights.map((h, i) => (
              <motion.div key={h.text} initial="hidden" animate="visible" variants={fadeUp} custom={i + 1}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-background/60 border border-border/50 backdrop-blur-sm">
                <h.icon className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-medium text-foreground">{h.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex justify-end p-4"><ThemeToggle /></div>
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div className="w-full max-w-sm space-y-8" initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <div className="text-center lg:text-left">
              <motion.h2 variants={fadeUp} custom={0} className="text-2xl font-bold text-foreground">Sign In</motion.h2>
              <motion.p variants={fadeUp} custom={1} className="text-sm text-muted-foreground mt-1">Enter your credentials to access your dashboard</motion.p>
            </div>
            <motion.form onSubmit={handleSubmit} className="space-y-4" variants={fadeUp} custom={2}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@company.in" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
              </div>
              <Button type="submit" className="w-full gap-2 h-11 text-sm" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"} <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.form>
            <motion.div variants={fadeUp} custom={3} className="space-y-3">
              <p className="text-xs text-center text-muted-foreground">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary hover:underline font-medium">Create one</Link>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
