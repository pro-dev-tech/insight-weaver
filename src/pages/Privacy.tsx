import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

export default function Privacy() {
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
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: March 1, 2026</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground/90">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We collect information you provide directly to us, including: personal identification information (name, email address, phone number); business information (company name, GST number, business address); financial data (invoice details, payment records, customer information you enter); usage data (how you interact with our Service, features used, time spent); and device information (browser type, operating system, IP address). We do not collect sensitive personal data such as biometric data, health information, or political opinions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We use the information we collect to: provide, maintain, and improve the Service; process transactions and send related information; send you technical notices, updates, and support messages; respond to your comments and questions; analyze usage patterns to improve user experience; detect, investigate, and prevent fraudulent transactions and abuse; and comply with legal obligations. We will never sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Data Storage and Security</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your data is stored on secure, encrypted servers. We implement industry-standard security measures including: AES-256 encryption for data at rest; TLS 1.3 encryption for data in transit; regular security audits and penetration testing; role-based access controls; automated backup systems with geo-redundancy; and SOC 2 Type II compliance. While we strive to protect your data, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Data Sharing</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We may share your information with: service providers who assist in operating our Service (cloud hosting, email delivery, analytics); professional advisors (lawyers, auditors) as necessary; law enforcement or government agencies when required by law; and other parties with your explicit consent. All third-party service providers are contractually bound to protect your data and use it only for the purposes we specify.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Cookies and Tracking</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We use cookies and similar tracking technologies to track activity on our Service and hold certain information. Cookies used include: essential cookies (required for the Service to function); analytics cookies (help us understand how you use the Service); and preference cookies (remember your settings and preferences). You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, some parts of the Service may not function properly without cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Depending on your jurisdiction, you may have the right to: access the personal data we hold about you; request correction of inaccurate data; request deletion of your data; object to processing of your data; request data portability; and withdraw consent at any time. To exercise any of these rights, please contact us at privacy@invoiceflow.app. We will respond to your request within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We retain your personal data only for as long as necessary to provide the Service and fulfill the purposes described in this policy. When you delete your account, we will delete your personal data within 30 days. However, we may retain certain information as required by law or for legitimate business purposes, such as fraud prevention and compliance with legal obligations. Aggregated, anonymized data may be retained indefinitely for analytics purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Children's Privacy</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal data from a child without parental consent, we will take steps to delete that information immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. International Data Transfers</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Your information may be transferred to and maintained on servers located outside of your state, province, country, or governmental jurisdiction where data protection laws may differ. We ensure that appropriate safeguards are in place for international data transfers, including standard contractual clauses approved by relevant authorities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically. Continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact our Data Protection Officer at privacy@invoiceflow.app or write to us at: InvoiceFlow Privacy Team, 4th Floor, Tech Park, Whitefield, Bangalore, Karnataka 560066, India.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
