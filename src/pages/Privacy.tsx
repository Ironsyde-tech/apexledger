import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

export default function Privacy() {
  return (
    <section className="container py-20 max-w-3xl">
      <SEO title="Privacy Policy" description="How Apex Ledger collects, uses, and protects your personal data." />
      <p className="text-xs uppercase tracking-widest text-primary mb-3">Legal</p>
      <h1 className="font-display text-5xl md:text-6xl mb-10">Privacy Policy</h1>

      <div className="prose prose-sm text-muted-foreground space-y-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Last updated: May 2026
        </p>

        <div className="gold-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-2xl text-foreground">1. Information We Collect</h2>
          <p>
            When you create an account, we collect your full name and email address. When you make
            a purchase, we also collect your USDT transaction hash and payment proof. We automatically
            collect usage data such as lesson progress and last-visited timestamps.
          </p>
        </div>

        <div className="gold-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-2xl text-foreground">2. How We Use Your Data</h2>
          <p>We use your data to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Provide and maintain your account</li>
            <li>Process course enrollments and payments</li>
            <li>Track your learning progress</li>
            <li>Send transactional emails (payment confirmations, course access)</li>
            <li>Respond to support messages</li>
          </ul>
        </div>

        <div className="gold-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-2xl text-foreground">3. Third-Party Services</h2>
          <p>We use the following third-party services to operate our platform:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><strong className="text-foreground">Supabase</strong> — Authentication, database, and file storage</li>
            <li><strong className="text-foreground">Resend</strong> — Transactional email delivery</li>
          </ul>
          <p>
            These services have their own privacy policies. We do not sell or share your data
            with third parties for advertising purposes.
          </p>
        </div>

        <div className="gold-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-2xl text-foreground">4. Data Security</h2>
          <p>
            We implement industry-standard security measures including encrypted connections (HTTPS),
            row-level security on our database, and secure authentication via Supabase. Payment proof
            files are stored in private storage buckets accessible only to the uploading user and admins.
          </p>
        </div>

        <div className="gold-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-2xl text-foreground">5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Withdraw consent at any time</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us via the{" "}
            <Link to="/contact" className="text-primary hover:underline">contact page</Link>.
          </p>
        </div>

        <div className="gold-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-2xl text-foreground">6. Data Retention</h2>
          <p>
            We retain your account data for as long as your account is active. If you request
            account deletion, we will remove your personal data within 30 days, except where
            retention is required by law or for legitimate business purposes (e.g., financial records).
          </p>
        </div>

        <div className="gold-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-2xl text-foreground">7. Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of significant
            changes via email or a prominent notice on our platform.
          </p>
        </div>

        <p className="text-center pt-8">
          Questions about your privacy?{" "}
          <Link to="/contact" className="text-primary hover:underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
