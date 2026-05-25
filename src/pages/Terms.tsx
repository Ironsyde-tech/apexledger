import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <section className="container py-20 max-w-3xl">
      <p className="text-xs uppercase tracking-widest text-primary mb-3">Legal</p>
      <h1 className="font-display text-5xl md:text-6xl mb-10">Terms of Service</h1>

      <div className="prose prose-sm text-muted-foreground space-y-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Last updated: May 2026
        </p>

        <div className="gold-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-2xl text-foreground">1. Service Description</h2>
          <p>
            Apex Ledger ("we", "us", "our") provides digital educational courses on trading,
            investing, and cryptocurrency. By creating an account or purchasing a course, you agree
            to these terms.
          </p>
        </div>

        <div className="gold-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-2xl text-foreground">2. Accounts & Access</h2>
          <p>
            You must be at least 18 years of age to create an account. You are responsible for
            maintaining the security of your login credentials. Access to purchased course content
            is granted for as long as your enrollment is active.
          </p>
        </div>

        <div className="gold-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-2xl text-foreground">3. Payments & Refunds</h2>
          <p>
            We accept payments in USDT (TRC20 and ERC20 networks). Enrollment activates after our
            team verifies the on-chain transaction. All sales are final unless otherwise agreed upon
            in writing. If your payment cannot be verified, your order will be rejected and you may
            submit a new payment.
          </p>
        </div>

        <div className="gold-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-2xl text-foreground">4. Intellectual Property</h2>
          <p>
            All course content, including but not limited to videos, text, images, and resources,
            is the property of Apex Ledger. You may not redistribute, copy, or share course
            content without explicit written permission.
          </p>
        </div>

        <div className="gold-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-2xl text-foreground">5. Disclaimers</h2>
          <p>
            Our courses are educational in nature and do not constitute financial advice. Trading
            and investing carry inherent risks, including the loss of capital. Past performance
            does not guarantee future results. You are solely responsible for your financial decisions.
          </p>
        </div>

        <div className="gold-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-2xl text-foreground">6. User Conduct</h2>
          <p>
            You agree not to: share your account credentials with others, reverse-engineer or
            scrape our platform, use our content for commercial purposes, or engage in any activity
            that disrupts the service for other users.
          </p>
        </div>

        <div className="gold-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-2xl text-foreground">7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, Apex Ledger shall not be liable for any
            indirect, incidental, or consequential damages arising from the use of our platform
            or course content.
          </p>
        </div>

        <div className="gold-border rounded-xl p-6 space-y-4">
          <h2 className="font-display text-2xl text-foreground">8. Changes to Terms</h2>
          <p>
            We may update these terms from time to time. Continued use of the platform after
            changes constitutes acceptance of the updated terms.
          </p>
        </div>

        <p className="text-center pt-8">
          Questions about these terms?{" "}
          <Link to="/contact" className="text-primary hover:underline">
            Contact us
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
