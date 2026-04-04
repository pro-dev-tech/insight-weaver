import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  FileText, BarChart3, Bell, Shield, Zap, Users, ArrowRight,
  CheckCircle2, Clock, TrendingUp, Linkedin, ChevronDown, Briefcase,
} from "lucide-react";
import type { Easing } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as Easing },
  }),
};

const features = [
  { icon: FileText, title: "Smart Invoicing", desc: "Create, customize, and send professional invoices in seconds. Auto-calculate taxes, discounts, and totals." },
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Track revenue, outstanding payments, and cash flow with interactive charts and exportable reports." },
  { icon: Bell, title: "Automated Reminders", desc: "Never chase payments manually. Set up smart reminders via email and WhatsApp on your schedule." },
  { icon: Users, title: "Customer Management", desc: "Maintain a centralized customer database with payment history, contact details, and activity logs." },
  { icon: Shield, title: "Bank-Grade Security", desc: "End-to-end encryption, role-based access, and compliance-ready audit trails to protect your data." },
  { icon: TrendingUp, title: "AI Risk Scoring", desc: "Predict payment defaults with AI-driven risk analysis and smart escalation recommendations." },
];

const stats = [
  { value: "50K+", label: "Invoices Sent" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9★", label: "User Rating" },
  { value: "60%", label: "Faster Recovery" },
];

const pricingPlans = [
  {
    name: "Starter", price: "Free", period: "", desc: "Perfect for freelancers getting started",
    features: ["Up to 10 invoices/month", "1 user", "Basic analytics", "Email support"],
    cta: "Get Started", highlighted: false,
  },
  {
    name: "Professional", price: "₹999", period: "/month", desc: "For growing businesses that need more",
    features: ["Unlimited invoices", "Up to 5 users", "Advanced analytics & reports", "Automated reminders", "Priority support"],
    cta: "Start Free Trial", highlighted: true,
  },
  {
    name: "Enterprise", price: "Custom", period: "", desc: "For large teams with custom needs",
    features: ["Everything in Professional", "Unlimited users", "Custom integrations", "Dedicated account manager", "SLA guarantee", "On-premise option"],
    cta: "Contact Sales", highlighted: false,
  },
];

// Marquee component — pure CSS seamless infinite loop
function FeatureMarquee() {
  const renderCard = (f: typeof features[0], i: number) => (
    <div key={`${f.title}-${i}`} className="flex-shrink-0 w-72 hover:scale-105 hover:-translate-y-2 transition-transform duration-300">
      <Card className="h-full border-border/40 bg-card/80 backdrop-blur-sm hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group cursor-pointer">
        <CardContent className="p-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center mb-4 group-hover:from-primary/25 group-hover:to-accent/25 group-hover:scale-110 transition-all duration-300">
            <f.icon className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-semibold text-sm mb-2 text-foreground">{f.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="overflow-hidden py-4">
      <div className="flex gap-6 animate-marquee-scroll" style={{ width: "max-content" }}>
        {features.map((f, i) => renderCard(f, i))}
        {features.map((f, i) => renderCard(f, i + features.length))}
      </div>
    </div>
  );
}

// Scroll progress bar
function ScrollProgressBar() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-border/30">
      <motion.div
        className="h-full bg-gradient-to-r from-primary via-accent to-primary"
        style={{ width: `${progress}%` }}
        transition={{ duration: 0.1 }}
      />
    </div>
  );
}

// Fast striking lines effect
function StrikingLines() {
  const lines = [
    { top: "5%", width: "160px", duration: 0.4, delay: 0, opacity: 0.6 },
    { top: "15%", width: "200px", duration: 0.35, delay: 0.2, opacity: 0.5 },
    { top: "25%", width: "140px", duration: 0.5, delay: 0.4, opacity: 0.45 },
    { top: "38%", width: "180px", duration: 0.3, delay: 0.1, opacity: 0.55 },
    { top: "50%", width: "220px", duration: 0.45, delay: 0.35, opacity: 0.5 },
    { top: "62%", width: "130px", duration: 0.38, delay: 0.55, opacity: 0.4 },
    { top: "72%", width: "190px", duration: 0.42, delay: 0.15, opacity: 0.55 },
    { top: "82%", width: "150px", duration: 0.36, delay: 0.45, opacity: 0.5 },
    { top: "90%", width: "170px", duration: 0.48, delay: 0.25, opacity: 0.45 },
    { top: "95%", width: "210px", duration: 0.32, delay: 0.6, opacity: 0.4 },
    { top: "10%", width: "100px", duration: 0.28, delay: 0.7, opacity: 0.35 },
    { top: "45%", width: "240px", duration: 0.33, delay: 0.5, opacity: 0.3 },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {lines.map((l, i) => (
        <motion.div
          key={i}
          className="absolute h-[2px] bg-gradient-to-r from-transparent via-white to-transparent"
          style={{ top: l.top, width: l.width, opacity: l.opacity }}
          animate={{ x: [600, -300] }}
          transition={{ duration: l.duration, repeat: Infinity, repeatDelay: 0.6 + l.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export default function Landing() {
  const [navScrolled, setNavScrolled] = useState(false);
  const [careerOpen, setCareerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setNavScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ScrollProgressBar />

      {/* Nav */}
      <nav className={`sticky top-1 z-50 transition-all duration-300 ${navScrolled ? "bg-background/90 backdrop-blur-xl shadow-sm border-b border-border/50" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Invoice Flow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors relative group">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#pricing" className="hover:text-foreground transition-colors relative group">
              Pricing
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </a>
            <a href="#about" className="hover:text-foreground transition-colors relative group">
              About
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </a>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-md" asChild>
              <Link to="/register">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-28 md:py-40 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/3 blur-[150px]" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1
            className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6"
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
          >
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent whitespace-nowrap">
                Invoicing that moves as fast
              </span>
              <StrikingLines />
            </span>
            <br />as your business
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Create stunning invoices, automate payment reminders, and gain powerful insights into your
            cash flow — all from one beautifully simple platform.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            <Button size="lg" className="text-base px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20" asChild>
              <Link to="/register">
                Start Free — No Card Required <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 border-border/60 hover:bg-secondary/50" asChild>
              <a href="#features">See How It Works</a>
            </Button>
          </motion.div>
          <motion.div
            className="mt-16 flex justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          >
            <a href="#stats" className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <ChevronDown className="w-6 h-6 animate-bounce" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section id="stats" className="border-y border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-border/40">
          {stats.map((s, i) => (
            <motion.div
              key={s.label} className="text-center py-10 px-4"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
            >
              <p className="text-3xl md:text-4xl font-bold font-mono tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{s.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-1.5 uppercase tracking-wider">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features - Infinite Marquee */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-accent mb-4"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            >
              Features
            </motion.div>
            <motion.h2
              className="text-3xl md:text-5xl font-bold mb-4"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            >
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">get paid faster</span>
            </motion.h2>
            <motion.p
              className="text-muted-foreground max-w-xl mx-auto text-base"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            >
              A complete invoicing ecosystem designed for modern businesses.
            </motion.p>
          </div>
          <FeatureMarquee />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-28 px-6 bg-muted/20 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[100px]" />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-4"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            >
              How it works
            </motion.div>
            <motion.h2
              className="text-3xl md:text-5xl font-bold mb-4"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            >
              Up and running in{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">3 simple steps</span>
            </motion.h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: Users, title: "Add Your Clients", desc: "Import your customer list or add them one by one. We'll keep everything organized." },
              { step: "02", icon: FileText, title: "Create & Send", desc: "Build beautiful invoices with our editor. Add your logo, terms, and send instantly." },
              { step: "03", icon: TrendingUp, title: "Track & Grow", desc: "Monitor payments in real-time. Get insights to optimize your cash flow." },
            ].map((s, i) => (
              <motion.div key={s.step} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className="text-center border-border/40 bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group h-full">
                  <CardContent className="p-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-5 group-hover:from-primary/20 group-hover:to-accent/20 group-hover:scale-110 transition-all duration-300">
                      <span className="text-2xl font-bold font-mono bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{s.step}</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-primary mb-4"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            >
              Pricing
            </motion.div>
            <motion.h2 className="text-3xl md:text-5xl font-bold mb-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              Simple, transparent{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">pricing</span>
            </motion.h2>
            <motion.p className="text-muted-foreground text-base" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
              No hidden fees. No surprises. Cancel anytime.
            </motion.p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div key={plan.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className={`h-full relative transition-all duration-300 group hover:shadow-xl ${plan.highlighted ? "border-primary/50 bg-card shadow-xl shadow-primary/10 scale-[1.02]" : "border-border/40 bg-card/80 hover:border-primary/30 hover:shadow-primary/5"}`}>
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-[10px] font-bold px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground uppercase tracking-wider shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardContent className="p-8 flex flex-col h-full">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                    <div className="my-7">
                      <span className="text-4xl font-bold font-mono">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${plan.highlighted ? "bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-md" : ""}`}
                      variant={plan.highlighted ? "default" : "outline"}
                      asChild
                    >
                      <Link to="/register">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="py-28 px-6 bg-muted/20 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-primary/3 blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-medium text-accent mb-4">
              About Us
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">About <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Invoice Flow</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-base">
              We're a team of finance and technology professionals who believe that every business — from solo freelancers to growing enterprises —
              deserves world-class invoicing tools. Invoice Flow was born from the frustration of clunky billing systems and the vision of making
              cash flow management effortless.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: "Our Mission", desc: "To eliminate payment delays and empower businesses with intelligent financial automation." },
              { title: "Our Values", desc: "Transparency, simplicity, and relentless focus on helping businesses grow faster." },
              { title: "Our Team", desc: "20+ engineers, designers, and finance experts across India building the future of invoicing." },
            ].map((item, i) => (
              <motion.div key={item.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className="h-full border-border/40 bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center mx-auto mb-8">
              <Clock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Stop chasing payments.<br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Start growing your business.</span>
            </h2>
            <p className="text-muted-foreground mb-10 max-w-lg mx-auto text-base">
              Join thousands of businesses that use Invoice Flow to streamline their billing,
              reduce late payments, and focus on what matters most.
            </p>
            <Button size="lg" className="text-base px-10 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20" asChild>
              <Link to="/register">
                Get Started — It's Free <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold">Invoice Flow</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Modern invoicing for modern businesses. Simple, fast, and reliable.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#about" className="hover:text-foreground transition-colors">About Us</a></li>
                <li>
                  <button onClick={() => setCareerOpen(true)} className="hover:text-foreground transition-colors">
                    Careers
                  </button>
                </li>
                <li>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors inline-flex items-center gap-1">
                    <Linkedin className="w-3 h-3" /> LinkedIn
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <Separator className="mb-6 bg-border/40" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Invoice Flow. All rights reserved.</p>
            <p>Made with precision for businesses that value their time.</p>
          </div>
        </div>
      </footer>

      {/* Career Dialog */}
      <Dialog open={careerOpen} onOpenChange={setCareerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" /> Careers at Invoice Flow
            </DialogTitle>
          </DialogHeader>
          <Card className="p-6 bg-secondary/20 border-border/50 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Briefcase className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No Open Positions</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We don't have any open positions at the moment. Please check back later or follow us on LinkedIn for updates.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="gap-1">
                <Linkedin className="w-3 h-3" /> Follow on LinkedIn
              </a>
            </Button>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
}
