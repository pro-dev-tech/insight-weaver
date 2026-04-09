import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, FileText } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/"><ArrowLeft className="w-4 h-4" /></Link>
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold">InvoiceFlow</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: March 1, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/90">
          <section><h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2><p className="text-sm leading-relaxed text-muted-foreground">By accessing or using InvoiceFlow ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not access or use the Service.</p></section>
          <section><h2 className="text-xl font-semibold mb-3">2. Description of Service</h2><p className="text-sm leading-relaxed text-muted-foreground">InvoiceFlow provides a cloud-based invoicing and business management platform that enables users to create, send, and manage invoices; track payments and revenue; manage customer relationships; generate financial reports and analytics; and automate payment reminders.</p></section>
          <section><h2 className="text-xl font-semibold mb-3">3. User Accounts</h2><p className="text-sm leading-relaxed text-muted-foreground">You must provide accurate, complete, and current information when creating an account. You are responsible for safeguarding the password and for all activities that occur under your account. You must be at least 18 years of age.</p></section>
          <section><h2 className="text-xl font-semibold mb-3">4. Billing and Payments</h2><p className="text-sm leading-relaxed text-muted-foreground">Certain features require payment. All fees are non-refundable except as expressly stated. We reserve the right to change pricing at any time.</p></section>
          <section><h2 className="text-xl font-semibold mb-3">5. Intellectual Property</h2><p className="text-sm leading-relaxed text-muted-foreground">The Service and its original content, features, and functionality are owned by InvoiceFlow and protected by international intellectual property laws. You retain ownership of data you upload.</p></section>
          <section><h2 className="text-xl font-semibold mb-3">6. Prohibited Uses</h2><p className="text-sm leading-relaxed text-muted-foreground">You may not use the Service for any unlawful purpose; to transmit harmful content; to impersonate any person; to interfere with the Service; or to reverse engineer any aspect of the Service.</p></section>
          <section><h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2><p className="text-sm leading-relaxed text-muted-foreground">In no event shall InvoiceFlow be liable for any indirect, incidental, special, consequential, or punitive damages. Our total liability shall not exceed the amount you paid us in the twelve months preceding the claim.</p></section>
          <section><h2 className="text-xl font-semibold mb-3">8. Termination</h2><p className="text-sm leading-relaxed text-muted-foreground">We may terminate or suspend your account immediately for any reason. Upon termination, we will retain your data for 30 days, after which it will be permanently deleted.</p></section>
          <section><h2 className="text-xl font-semibold mb-3">9. Governing Law</h2><p className="text-sm leading-relaxed text-muted-foreground">These Terms shall be governed by the laws of India. Disputes shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka, India.</p></section>
          <section><h2 className="text-xl font-semibold mb-3">10. Contact Us</h2><p className="text-sm leading-relaxed text-muted-foreground">If you have any questions, contact us at legal@invoiceflow.app. We will respond within 5 business days.</p></section>
        </div>
      </main>
    </div>
  );
}
