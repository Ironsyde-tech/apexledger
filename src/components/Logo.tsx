import { Link } from "react-router-dom";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`flex items-center gap-2.5 group ${className}`}>
    <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-gold shadow-gold">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path d="M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0" strokeLinecap="round" />
        <path d="M2 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0" strokeLinecap="round" opacity="0.7" />
        <path d="M2 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0" strokeLinecap="round" opacity="0.4" />
      </svg>
    </span>
    <span className="flex flex-col leading-none">
      <span className="font-display text-xl tracking-tight">Prime Society</span>
      <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Est. premium learning</span>
    </span>
  </Link>
);
