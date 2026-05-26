import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

// Simple SVG social icons
const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);
const DiscordIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
  </svg>
);
const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const socials = [
  { icon: TwitterIcon, label: "Twitter", href: "#" },
  { icon: TelegramIcon, label: "Telegram", href: "#" },
  { icon: DiscordIcon, label: "Discord", href: "#" },
  { icon: YoutubeIcon, label: "YouTube", href: "#" },
];

export const Footer = () => (
  <footer className="mt-32 relative">
    {/* Gradient top border */}
    <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    <div className="h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent mt-px" />

    <div className="bg-background/60">
      <div className="container py-16 grid gap-12 md:grid-cols-5">
        {/* Brand column */}
        <div className="md:col-span-2 space-y-5">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
            Apex Ledger is a premium knowledge hub for crypto traders, forex practitioners, and market enthusiasts. Expert-written, carefully curated.
          </p>
          {/* Social links */}
          <div className="flex gap-3 pt-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                target="_blank"
                rel="noopener noreferrer"
                className="h-9 w-9 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <s.icon />
              </a>
            ))}
          </div>
        </div>

        {/* Learn column */}
        <div>
          <h4 className="text-sm uppercase tracking-widest text-primary mb-4 font-display text-base">Learn</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/courses" className="hover:text-foreground transition-colors">All courses</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground transition-colors">My dashboard</Link></li>
            <li><Link to="/about" className="hover:text-foreground transition-colors">About us</Link></li>
          </ul>
        </div>

        {/* Support column */}
        <div>
          <h4 className="text-sm uppercase tracking-widest text-primary mb-4 font-display text-base">Support</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            <li><Link to="/contact" className="hover:text-foreground transition-colors">FAQ</Link></li>
            <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Payment column */}
        <div>
          <h4 className="text-sm uppercase tracking-widest text-primary mb-4 font-display text-base">Payments</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <span className="h-8 px-3 rounded-md border border-border/60 bg-secondary/30 flex items-center justify-center text-xs font-mono font-medium text-foreground">USDT</span>
              <span>TRC20</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <span className="h-8 px-3 rounded-md border border-border/60 bg-secondary/30 flex items-center justify-center text-xs font-mono font-medium text-foreground">USDT</span>
              <span>ERC20</span>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3">Secure on-chain verification</p>
          </div>
        </div>
      </div>

      <div className="hairline" />

      <div className="container py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Apex Ledger. All rights reserved.</p>
        <div className="flex gap-4">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
          <span className="text-muted-foreground/60">Disclaimer: Educational content. Not financial advice.</span>
        </div>
      </div>
    </div>
  </footer>
);
