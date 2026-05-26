import { Link } from "react-router-dom";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`flex items-center gap-2.5 group ${className}`}>
    <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-gold shadow-gold group-hover:shadow-glow transition-shadow duration-500">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M12 3L4 17h16L12 3z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 17l4-7 4 7" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      </svg>
    </span>
    <span className="flex flex-col leading-none">
      <span className="font-display text-xl tracking-tight">Apex Ledger</span>
      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Master the markets</span>
    </span>
  </Link>
);
