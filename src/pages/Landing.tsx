import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  BarChart3,
  Bell,
  Shield,
  Zap,
  Users,
  ArrowRight,
  CheckCircle2,
  Star,
  Globe,
  Clock,
  TrendingUp,
} from "lucide-react";

import type { Easing } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as Easing },
  }),
};

const features = [
  {
    icon: FileText,
    title: "Smart Invoicing",
    desc: "Create, customize, and send professional invoices in seconds. Auto-calculate taxes, discounts, and totals.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    desc: "Track revenue, outstanding payments, and cash flow with interactive charts and exportable reports.",
  },
  {
    icon: Bell,
    title: "Automated Reminders",
    desc: "Never chase payments manually. Set up smart reminders via email and WhatsApp on your schedule.",
  },
  {
    icon: Users,
    title: "Customer Management",
    desc: "Maintain a centralized customer database with payment history, contact details, and activity logs.",
  },
  {
    icon: Shield,
    title: "Bank-Grade Security",
    desc: "End-to-end encryption, role-based access, and compliance-ready audit trails to protect your data.",
  },
  {
    icon: Globe,
    title: "Multi-Currency Support",
    desc: "Invoice clients worldwide with automatic currency conversion and localized tax formatting.",
  },
];

const stats = [
  { value: "50K+", label: "Invoices Sent" },
  { value: "12K+", label: "Active Businesses" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9★", label: "User Rating" },
];

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Founder, DesignCraft Studios",
    quote: "InvoiceFlow transformed how we handle billing. We went from spending hours on invoices to minutes. The automated reminders alone saved us thousands in overdue payments.",
    rating: 5,
  },
  {
    name: "Rajesh Kumar",
    role: "CEO, TechVentures India",
    quote: "The analytics dashboard gives me a real-time pulse on our cash flow. It's not just an invoicing tool — it's a business intelligence platform.",
    rating: 5,
  },
  {
    name: "Ananya Patel",
    role: "Freelance Consultant",
    quote: "As a solo consultant, I needed something simple yet powerful. InvoiceFlow is exactly that. Professional invoices, automated follow-ups, and zero hassle.",
    rating: 5,
  },
];

const pricingPlans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    desc: "Perfect for freelancers getting started",
    features: ["Up to 10 invoices/month", "1 user", "Basic analytics", "Email support"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "₹999",
    period: "/month",
    desc: "For growing businesses that need more",
    features: [
      "Unlimited invoices",
      "Up to 5 users",
      "Advanced analytics & reports",
      "Automated reminders",
      "Priority support",
      "Multi-currency",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For large teams with custom needs",
    features: [
      "Everything in Professional",
      "Unlimited users",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "On-premise option",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
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
            <a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
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
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary mb-6">
              <Zap className="w-3 h-3" /> Trusted by 12,000+ businesses
            </span>
          </motion.div>
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Invoicing that{" "}
            <span className="gradient-text">moves as fast</span>
            <br />as your business
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            Create stunning invoices, automate payment reminders, and gain powerful insights into your
            cash flow — all from one beautifully simple platform.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial="hidden" animate="visible" variants={fadeUp} custom={3}
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
              key={s.label}
              className="text-center py-8 px-4"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
            >
              <p className="text-3xl font-bold font-mono tracking-tight text-foreground">{s.value}</p>
              <p className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            >
              Everything you need to{" "}
              <span className="gradient-text">get paid faster</span>
            </motion.h2>
            <motion.p
              className="text-muted-foreground max-w-xl mx-auto"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            >
              A complete invoicing ecosystem designed for modern businesses. Simple enough for
              freelancers, powerful enough for enterprises.
            </motion.p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <Card className="h-full glass-card hover:border-primary/30 transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <f.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
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
              <motion.div
                key={s.step}
                className="text-center"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
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
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            >
              Simple, transparent <span className="gradient-text">pricing</span>
            </motion.h2>
            <motion.p
              className="text-muted-foreground"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            >
              No hidden fees. No surprises. Cancel anytime.
            </motion.p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <Card
                  className={`h-full relative ${
                    plan.highlighted
                      ? "glow-border bg-card"
                      : "glass-card"
                  }`}
                >
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
                    <Button
                      className="w-full"
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

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            >
              Loved by businesses <span className="gradient-text">everywhere</span>
            </motion.h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <Card className="h-full glass-card">
                  <CardContent className="p-6">
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: t.rating }).map((_, j) => (
                        <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed mb-5 text-muted-foreground">"{t.quote}"</p>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
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
                <li><a href="#testimonials" className="hover:text-foreground transition-colors">Testimonials</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-default">About Us</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">Careers</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">Blog</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><span className="hover:text-foreground transition-colors cursor-default">Cookie Policy</span></li>
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
