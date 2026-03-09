import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  FileText, BarChart3, Bell, Shield, Zap, Users, ArrowRight,
  CheckCircle2, Clock, TrendingUp, Linkedin,
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

// Marquee component for features
function FeatureMarquee() {
  const marqueeItems = [...features, ...features];
  return (
    <div className="overflow-hidden py-4">
      <motion.div
        className="flex gap-6"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {marqueeItems.map((f, i) => (
          <motion.div
            key={`${f.title}-${i}`}
            className="flex-shrink-0 w-72"
            whileHover={{ scale: 1.05, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <Card className="h-full glass-card hover:border-primary/40 hover:shadow-lg transition-all duration-300 group cursor-pointer">
              <CardContent className="p-5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
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
    <div className="fixed top-0 left-0 right-0 z-[100] h-1">
      <div
        className="h-full bg-accent transition-all duration-75"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// Fast striking lines effect
function StrikingLines() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          style={{
            top: `${20 + i * 15}%`,
            width: "120px",
          }}
          animate={{
            x: [800, -200],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 0.8 + i * 0.15,
            repeat: Infinity,
            repeatDelay: 1 + i * 0.3,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <ScrollProgressBar />

      {/* Nav */}
      <nav className="sticky top-1 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">InvoiceFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#about" className="hover:text-foreground transition-colors">About</a>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Get Started Free</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24 md:py-36 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/5 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6"
            initial="hidden" animate="visible" variants={fadeUp} custom={0}
          >
            Invoicing that{" "}
            <span className="gradient-text relative inline-block">
              moves as fast
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
            <Button size="lg" className="text-base px-8" asChild>
              <Link to="/register">
                Start Free — No Card Required <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8" asChild>
              <a href="#features">See How It Works</a>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border/50 bg-muted/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-border/50">
          {stats.map((s, i) => (
            <motion.div
              key={s.label} className="text-center py-8 px-4"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
            >
              <p className="text-3xl font-bold font-mono tracking-tight text-foreground">{s.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features - Infinite Marquee */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            >
              Everything you need to <span className="gradient-text">get paid faster</span>
            </motion.h2>
            <motion.p
              className="text-muted-foreground max-w-xl mx-auto"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            >
              A complete invoicing ecosystem designed for modern businesses.
            </motion.p>
          </div>
          <FeatureMarquee />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            >
              Up and running in <span className="gradient-text">3 simple steps</span>
            </motion.h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: Users, title: "Add Your Clients", desc: "Import your customer list or add them one by one. We'll keep everything organized." },
              { step: "02", icon: FileText, title: "Create & Send", desc: "Build beautiful invoices with our editor. Add your logo, terms, and send instantly." },
              { step: "03", icon: TrendingUp, title: "Track & Grow", desc: "Monitor payments in real-time. Get insights to optimize your cash flow." },
            ].map((s, i) => (
              <motion.div key={s.step} className="text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold font-mono text-primary">{s.step}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2 className="text-3xl md:text-4xl font-bold mb-4" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              Simple, transparent <span className="gradient-text">pricing</span>
            </motion.h2>
            <motion.p className="text-muted-foreground" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
              No hidden fees. No surprises. Cancel anytime.
            </motion.p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div key={plan.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className={`h-full relative ${plan.highlighted ? "glow-border bg-card" : "glass-card"}`}>
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-primary text-primary-foreground uppercase tracking-wider">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardContent className="p-7">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                    <div className="my-6">
                      <span className="text-4xl font-bold font-mono">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className="w-full" variant={plan.highlighted ? "default" : "outline"} asChild>
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
      <section id="about" className="py-24 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">About <span className="gradient-text">InvoiceFlow</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We're a team of finance and technology professionals who believe that every business — from solo freelancers to growing enterprises —
              deserves world-class invoicing tools. InvoiceFlow was born from the frustration of clunky billing systems and the vision of making
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
                <Card className="h-full glass-card hover:border-primary/30 transition-all">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Careers */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Join our <span className="gradient-text">team</span></h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              We're always looking for talented people passionate about fintech, AI, and building products that matter.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-8">
            {[
              { role: "Full Stack Engineer", location: "Remote, India", type: "Full-time" },
              { role: "Product Designer", location: "Bangalore", type: "Full-time" },
              { role: "ML Engineer", location: "Remote", type: "Full-time" },
              { role: "Customer Success", location: "Mumbai", type: "Full-time" },
            ].map((job, i) => (
              <motion.div key={job.role} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className="glass-card hover:border-primary/30 transition-all text-left">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm">{job.role}</h4>
                    <p className="text-xs text-muted-foreground">{job.location} · {job.type}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <Button variant="outline" asChild>
            <a href="mailto:careers@invoiceflow.in">Apply Now <ArrowRight className="w-4 h-4 ml-1" /></a>
          </Button>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-muted/20">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <Clock className="w-10 h-10 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Stop chasing payments.<br />
              <span className="gradient-text">Start growing your business.</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of businesses that use InvoiceFlow to streamline their billing,
              reduce late payments, and focus on what matters most.
            </p>
            <Button size="lg" className="text-base px-10" asChild>
              <Link to="/register">
                Get Started — It's Free <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-bold">InvoiceFlow</span>
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
                <li><a href="#about" className="hover:text-foreground transition-colors">Careers</a></li>
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
          <Separator className="mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} InvoiceFlow. All rights reserved.</p>
            <p>Made with precision for businesses that value their time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
