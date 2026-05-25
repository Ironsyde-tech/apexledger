import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export const Footer = () => (
  <footer className="mt-32 border-t border-border/60 bg-background/60">
    <div className="container py-16 grid gap-12 md:grid-cols-4">
      <div className="md:col-span-2 space-y-4">
        <Logo />
        <p className="max-w-sm text-sm text-muted-foreground">
          Apex Ledger is a premium knowledge hub for crypto traders, forex practitioners, and market enthusiasts. Expert-written, carefully curated.
        </p>
      </div>
      <div>
        <h4 className="text-sm uppercase tracking-widest text-primary mb-4">Learn</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/courses" className="hover:text-foreground">All courses</Link></li>
          <li><Link to="/dashboard" className="hover:text-foreground">My dashboard</Link></li>
          <li><Link to="/about" className="hover:text-foreground">About us</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="text-sm uppercase tracking-widest text-primary mb-4">Support</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
          <li><Link to="/contact" className="hover:text-foreground">FAQ</Link></li>
          <li><Link to="/terms" className="hover:text-foreground">Terms of Service</Link></li>
          <li><Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link></li>
        </ul>
      </div>
    </div>
    <div className="hairline" />
    <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
      <p>© {new Date().getFullYear()} Apex Ledger. All rights reserved.</p>
      <div className="flex gap-4">
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        <span>Disclaimer: Educational content. Not financial advice.</span>
      </div>
    </div>
  </footer>
);
