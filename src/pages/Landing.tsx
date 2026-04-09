import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  FileText, BarChart3, Bell, Shield, Zap, Users, ArrowRight,
  CheckCircle2, TrendingUp, Linkedin, ChevronDown, Briefcase,
  Upload, Send,
} from "lucide-react";

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

// Animated logo — money flow coin without box
function AnimatedLogo({ size = 36 }: { size?: number }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-primary/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        style={{ borderTopColor: "hsl(var(--primary))", borderRightColor: "hsl(var(--accent))" }}
      />
      <motion.div
        className="relative z-10 flex items-center justify-center"
        animate={{ rotateY: [0, 360] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-primary font-bold" style={{ fontSize: size * 0.45 }}>₹</span>
      </motion.div>
      <motion.div
        className="absolute inset-0 rounded-full bg-primary/10"
        animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </div>
  );
}

// Marquee component — pauses on hover
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
    <div className="overflow-hidden py-4 group/marquee">
      <div className="flex gap-6 animate-marquee-scroll group-hover/marquee:[animation-play-state:paused]" style={{ width: "max-content" }}>
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

// Striking lines — 3 brighter lines
function StrikingLines({ lineCount = 12 }: { lineCount?: number }) {
  const lines = [
    { top: "5%", width: "160px", duration: 0.4, delay: 0, opacity: 0.9 },
    { top: "15%", width: "200px", duration: 0.35, delay: 0.2, opacity: 0.5 },
    { top: "25%", width: "140px", duration: 0.5, delay: 0.4, opacity: 0.85 },
    { top: "38%", width: "180px", duration: 0.3, delay: 0.1, opacity: 0.55 },
    { top: "50%", width: "220px", duration: 0.45, delay: 0.35, opacity: 0.5 },
    { top: "62%", width: "130px", duration: 0.38, delay: 0.55, opacity: 0.95 },
    { top: "72%", width: "190px", duration: 0.42, delay: 0.15, opacity: 0.55 },
    { top: "82%", width: "150px", duration: 0.36, delay: 0.45, opacity: 0.5 },
    { top: "90%", width: "170px", duration: 0.48, delay: 0.25, opacity: 0.45 },
    { top: "95%", width: "210px", duration: 0.32, delay: 0.6, opacity: 0.4 },
    { top: "10%", width: "100px", duration: 0.28, delay: 0.7, opacity: 0.35 },
    { top: "45%", width: "240px", duration: 0.33, delay: 0.5, opacity: 0.3 },
  ].slice(0, lineCount);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {lines.map((l, i) => (
        <motion.div
          key={i}
          className={`absolute bg-gradient-to-r from-transparent via-white to-transparent ${i === 0 || i === 2 || i === 5 ? "h-[3px] shadow-[0_0_8px_rgba(255,255,255,0.8)]" : "h-[2px]"}`}
          style={{ top: l.top, width: l.width, opacity: l.opacity }}
          animate={{ x: [600, -300] }}
          transition={{ duration: l.duration, repeat: Infinity, repeatDelay: 0.6 + l.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function HighlightedText({ children, lineCount = 6 }: { children: React.ReactNode; lineCount?: number }) {
  return (
    <span className="relative inline-block">
      <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
        {children}
      </span>
      <StrikingLines lineCount={lineCount} />
    </span>
  );
}

// Slide-in text component
function SlideInText({ children, from = "left", className = "", delay = 0 }: { children: React.ReactNode; from?: "left" | "right"; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <motion.div
        initial={{ x: from === "left" ? "-100%" : "100%", opacity: 0 }}
        animate={isInView ? { x: 0, opacity: 1 } : {}}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Steps crackers animation
function StepsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });

  const steps = [
    { title: "Add Your Clients", desc: "Import your customer list or add them one by one. We'll keep everything organized." },
    { title: "Create & Send", desc: "Build beautiful invoices with our editor. Add your logo, terms, and send instantly." },
    { title: "Track & Grow", desc: "Monitor payments in real-time. Get insights to optimize your cash flow." },
  ];

  // Cards spread out as you scroll
  const y0 = useTransform(scrollYProgress, [0.1, 0.4, 0.7, 0.9], [80, 0, 0, 80]);
  const y1 = useTransform(scrollYProgress, [0.1, 0.4, 0.7, 0.9], [80, 0, 0, 80]);
  const y2 = useTransform(scrollYProgress, [0.1, 0.4, 0.7, 0.9], [80, 0, 0, 80]);
  const x0 = useTransform(scrollYProgress, [0.1, 0.4, 0.7, 0.9], [100, 0, 0, 100]);
  const x1 = useTransform(scrollYProgress, [0.1, 0.4, 0.7, 0.9], [0, 0, 0, 0]);
  const x2 = useTransform(scrollYProgress, [0.1, 0.4, 0.7, 0.9], [-100, 0, 0, -100]);
  const scale = useTransform(scrollYProgress, [0.1, 0.4, 0.7, 0.9], [0.7, 1, 1, 0.7]);
  const opacity = useTransform(scrollYProgress, [0.05, 0.2, 0.8, 0.95], [0, 1, 1, 0]);

  const transforms = [
    { x: x0, y: y0 },
    { x: x1, y: y1 },
    { x: x2, y: y2 },
  ];

  return (
    <section ref={sectionRef} className="py-16 sm:py-28 px-4 sm:px-6 bg-muted/20 relative min-h-[80vh]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/3 blur-[100px]" />
      </div>
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-10 sm:mb-16">
          <SlideInText from="left">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4">
              Up and running in{" "}
              <HighlightedText lineCount={6}>3 simple steps</HighlightedText>
            </h2>
          </SlideInText>
        </div>

        {/* Mini box source */}
        <div className="relative">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                style={{ x: transforms[i].x, y: transforms[i].y, scale, opacity }}
              >
                <Card className="text-center border-2 border-border/60 bg-card/80 backdrop-blur-sm hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group h-full">
                  <CardContent className="p-6 sm:p-8">
                    {/* Image placeholder - non-draggable, non-downloadable */}
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mx-auto mb-4 sm:mb-5 overflow-hidden select-none">
                      <img
                        src="/placeholder.svg"
                        alt=""
                        className="w-full h-full object-cover pointer-events-none select-none"
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        style={{ WebkitUserDrag: "none" } as React.CSSProperties}
                      />
                    </div>
                    <h3 className="font-semibold text-base sm:text-lg mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          {/* Mini box at the bottom */}
          <motion.div
            className="mt-8 mx-auto w-32 h-16 rounded-lg border-2 border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center"
            style={{ opacity: useTransform(scrollYProgress, [0.1, 0.3], [1, 0.3]) }}
          >
            <span className="text-xs font-semibold text-primary">How it flows</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// Pricing section with merged cards that separate on scroll
function PricingSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });

  // Cards start merged (overlapping), then separate on scroll
  const x0 = useTransform(scrollYProgress, [0.1, 0.35, 0.65, 0.9], [120, 0, 0, 120]);
  const x2 = useTransform(scrollYProgress, [0.1, 0.35, 0.65, 0.9], [-120, 0, 0, -120]);
  const overlap0 = useTransform(scrollYProgress, [0.1, 0.35, 0.65, 0.9], [0.6, 1, 1, 0.6]);
  const overlap2 = useTransform(scrollYProgress, [0.1, 0.35, 0.65, 0.9], [0.6, 1, 1, 0.6]);

  const cardTransforms = [
    { x: x0, opacity: overlap0 },
    { x: 0, opacity: 1 },
    { x: x2, opacity: overlap2 },
  ];

  return (
    <section id="pricing" ref={sectionRef} className="py-16 sm:py-28 px-4 sm:px-6 min-h-[80vh]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-16">
          <SlideInText from="right">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4">
              Simple, transparent{" "}
              <HighlightedText lineCount={6}>pricing</HighlightedText>
            </h2>
          </SlideInText>
          <motion.p
            className="text-muted-foreground text-sm sm:text-base"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            No hidden fees. No surprises. Cancel anytime.
          </motion.p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.name}
              style={{ x: cardTransforms[i].x, opacity: cardTransforms[i].opacity }}
              className="flex"
            >
              <div className="pricing-card-hover group flex w-full">
                <Card className={`w-full relative transition-all duration-300 group-hover:scale-105 group-hover:z-10 group-hover:shadow-2xl flex flex-col ${plan.highlighted ? "border-2 border-primary/50 bg-card shadow-xl shadow-primary/10" : "border-2 border-white/20 bg-card/80 group-hover:border-transparent"}`}>
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-[10px] font-bold px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground uppercase tracking-wider shadow-lg">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardContent className="p-6 sm:p-8 flex flex-col flex-1">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
                    <div className="my-5 sm:my-7">
                      <span className="text-3xl sm:text-4xl font-bold font-mono">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-6 sm:mb-8 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`btn-shimmer w-full ${plan.highlighted ? "bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-md" : ""}`}
                      variant={plan.highlighted ? "default" : "outline"}
                      asChild
                    >
                      <Link to="/register">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
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
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2.5">
            <AnimatedLogo size={36} />
            <span className="text-lg sm:text-xl font-bold tracking-tight">Invoice Flow</span>
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
            <a href="#demo" className="hover:text-foreground transition-colors relative group">
              Demo
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
            </a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button size="sm" className="btn-shimmer text-xs sm:text-sm px-3 sm:px-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-md" asChild>
              <Link to="/register"><span className="hidden sm:inline">Get Started Free</span><span className="sm:hidden">Start Free</span></Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-16 sm:py-28 md:py-40 px-4 sm:px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-primary/5 blur-[120px]" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-accent/5 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/3 blur-[150px]" />
        </div>
        <div className="max-w-5xl mx-auto text-left relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.15] mb-6">
            <span className="text-foreground">Invoicing that </span>
            <HighlightedText lineCount={12}>moves as fast</HighlightedText>
            <br />
            <span className="text-foreground">as your business</span>
          </h1>
          <motion.p
            className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mb-8 sm:mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            Create stunning invoices, automate payment reminders, and gain powerful insights into your
            cash flow — all from one beautifully simple platform.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <Button size="lg" className="btn-shimmer text-sm sm:text-base px-6 sm:px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20" asChild>
              <Link to="/register">
                Start Free — No Card Required <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="btn-shimmer text-sm sm:text-base px-6 sm:px-8 border-border/60 hover:bg-secondary/50" asChild>
              <a href="#features">See How It Works</a>
            </Button>
          </motion.div>
          <motion.div
            className="mt-12 sm:mt-16 flex justify-start"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
          >
            <a href="#about" className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <ChevronDown className="w-6 h-6 animate-bounce" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* About Invoice Flow */}
      <section id="about" className="py-16 sm:py-28 px-4 sm:px-6 bg-muted/20 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-primary/3 blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-10 sm:mb-12">
            <SlideInText from="right">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4">About Invoice{" "}<HighlightedText lineCount={6}>Flow</HighlightedText></h2>
            </SlideInText>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
              We're a team of finance and technology professionals who believe that every business — from solo freelancers to growing enterprises —
              deserves world-class invoicing tools. Invoice Flow was born from the frustration of clunky billing systems and the vision of making
              cash flow management effortless.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              { title: "Our Mission", desc: "To eliminate payment delays and empower businesses with intelligent financial automation." },
              { title: "Our Values", desc: "Transparency, simplicity, and relentless focus on helping businesses grow faster." },
              { title: "Our Team", desc: "20+ engineers, designers, and finance experts across India building the future of invoicing." },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="h-full border-border/40 bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group">
                  <CardContent className="p-5 sm:p-6">
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Infinite Marquee */}
      <section id="features" className="py-16 sm:py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <SlideInText from="left">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4">
                Everything you need to{" "}
                <HighlightedText lineCount={6}>get paid faster</HighlightedText>
              </h2>
            </SlideInText>
            <motion.p
              className="text-muted-foreground max-w-xl mx-auto text-sm sm:text-base"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              A complete invoicing ecosystem designed for modern businesses.
            </motion.p>
          </div>
          <FeatureMarquee />
        </div>
      </section>

      {/* Stats Bar */}
      <section id="stats" className="border-y border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-border/40">
          {stats.map((s, i) => (
            <motion.div
              key={s.label} className="text-center py-8 sm:py-10 px-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{s.value}</p>
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mt-1.5 uppercase tracking-wider">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <StepsSection />

      {/* Demo Section */}
      <section id="demo" className="py-16 sm:py-24 px-4 sm:px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">Learn how the Invoice <HighlightedText lineCount={6}>flows</HighlightedText></h2>
            <p className="text-muted-foreground text-sm sm:text-base">See how Invoice Flow streamlines your entire billing workflow</p>
          </div>
          <Card className="overflow-hidden border-2 border-border/60 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="aspect-video bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <BarChart3 className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">Demo video coming soon</p>
                  <p className="text-[10px] text-muted-foreground/60">Video placeholder — upload your demo video</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* CTA */}
      <section className="py-16 sm:py-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full bg-primary/5 blur-[120px]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <SlideInText from="left">
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-1">
                Stop chasing payments.
              </h2>
            </SlideInText>
            <SlideInText from="right" delay={0.1}>
              <p className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Start growing your business.</span>
              </p>
            </SlideInText>
            <p className="text-muted-foreground mb-8 sm:mb-10 max-w-lg mx-auto text-sm sm:text-base">
              Join thousands of businesses that use Invoice Flow to streamline their billing,
              reduce late payments, and focus on what matters most.
            </p>
            <Button size="lg" className="btn-shimmer text-sm sm:text-base px-8 sm:px-10 bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/20" asChild>
              <Link to="/register">
                Get Started — It's Free <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <AnimatedLogo size={32} />
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
                <li><a href="#about" className="hover:text-foreground transition-colors">About</a></li>
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
