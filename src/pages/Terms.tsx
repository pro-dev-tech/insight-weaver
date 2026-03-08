import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-4xl mx-auto flex items-center gap-4 px-6 py-4">
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
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: March 1, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              By accessing or using InvoiceFlow ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not access or use the Service. These Terms apply to all visitors, users, and others who access the Service. We reserve the right to update or modify these Terms at any time without prior notice. Your continued use of the Service following any changes constitutes acceptance of those changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              InvoiceFlow provides a cloud-based invoicing and business management platform that enables users to create, send, and manage invoices; track payments and revenue; manage customer relationships; generate financial reports and analytics; and automate payment reminders. The Service is provided "as is" and "as available" without warranties of any kind, either express or implied.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              You must provide accurate, complete, and current information when creating an account. You are responsible for safeguarding the password and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account. InvoiceFlow will not be liable for any loss or damage arising from your failure to comply with this section. You must be at least 18 years of age to use this Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Billing and Payments</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Certain features of the Service require payment of fees. You shall pay all applicable fees as described on the Service in connection with such features. All fees are non-refundable except as expressly stated otherwise. We reserve the right to change our pricing at any time. If you are on a subscription plan, price changes will take effect at the start of your next billing cycle. Failure to pay applicable fees may result in suspension or termination of your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Intellectual Property</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The Service and its original content, features, and functionality are owned by InvoiceFlow and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You retain ownership of any data, content, or materials you upload to the Service. By uploading content, you grant InvoiceFlow a limited license to use, store, and process such content solely for the purpose of providing the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Prohibited Uses</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              You may not use the Service for any unlawful purpose or in violation of any applicable laws; to transmit any harmful, threatening, or objectionable content; to impersonate any person or entity; to interfere with or disrupt the Service or servers; to attempt to gain unauthorized access to any part of the Service; to use the Service to send unsolicited communications; or to reverse engineer, decompile, or disassemble any aspect of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              In no event shall InvoiceFlow, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of the Service. Our total liability shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Termination</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the Service will immediately cease. You may export your data prior to termination. We will retain your data for a period of 30 days following termination, after which it will be permanently deleted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Governing Law</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts located in Bangalore, Karnataka, India.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              If you have any questions about these Terms, please contact us at legal@invoiceflow.app. We will respond to all inquiries within 5 business days.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
