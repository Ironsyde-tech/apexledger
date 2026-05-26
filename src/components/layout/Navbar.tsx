import { useState, useEffect, useRef } from "react";
import { Link, NavLink as RouterNavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Menu, X, User, LogOut, LayoutDashboard, ShieldCheck,
  Settings, BookOpen, ChevronDown, Sparkles, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { SearchTrigger } from "@/components/GlobalSearch";

const SCROLL_THRESHOLD = 10;

const links = [
  { to: "/", label: "Home" },
  { to: "/courses", label: "Courses" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const loc = useLocation();
  const nav = useNavigate();
  const { user, isAdmin, loading, signOut } = useAuth();

  // Close menus on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [loc.pathname]);

  // Scroll behavior: hide on down, show on up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      if (y > lastScrollY.current && y > 100) {
        setHidden(true);
      } else if (lastScrollY.current - y > SCROLL_THRESHOLD) {
        setHidden(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
  };

  const userInitial = user?.user_metadata?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U";
  const userName = user?.user_metadata?.full_name ?? "User";
  const userEmail = user?.email ?? "";
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "glass-strong shadow-soft border-b border-border/40"
          : "bg-background/60 backdrop-blur-sm border-b border-border/20",
        hidden && !mobileOpen && "-translate-y-full"
      )}
    >
      {/* Gold accent line */}
      <div className="h-[2px] w-full bg-gradient-gold opacity-80" />

      <div className="container flex h-18 items-center justify-between py-4">
        <Logo />

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <RouterNavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                cn(
                  "px-4 py-2 text-sm tracking-wide uppercase transition-base rounded-md",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              {l.label}
            </RouterNavLink>
          ))}
        </nav>

        {/* Desktop right side */}
        <div className="hidden lg:flex items-center gap-3">
          <SearchTrigger />
          {loading ? (
            <div className="h-8 w-20 rounded-md bg-secondary/50 animate-pulse" />
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              {/* Avatar button */}
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-1.5 rounded-full transition-all",
                  "hover:bg-secondary/50 border border-transparent",
                  dropdownOpen && "bg-secondary/50 border-border/60"
                )}
              >
                <div className="h-8 w-8 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-bold text-primary-foreground ring-2 ring-primary/20 overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    userInitial
                  )}
                </div>
                <span className="text-sm text-foreground max-w-[120px] truncate hidden xl:inline">
                  {userName}
                </span>
                <ChevronDown className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform",
                  dropdownOpen && "rotate-180"
                )} />
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-card shadow-elegant py-1 animate-fade-up overflow-hidden">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center text-sm font-bold text-primary-foreground ring-2 ring-primary/20 overflow-hidden shrink-0">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          userInitial
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{userName}</p>
                        <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-primary">
                        <Sparkles className="h-3 w-3" /> Administrator
                      </div>
                    )}
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <DropdownLink to="/profile" icon={<User className="h-4 w-4" />} label="My Profile" />
                    <DropdownLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" />
                    <DropdownLink to="/courses" icon={<BookOpen className="h-4 w-4" />} label="Browse Courses" />
                  </div>

                  {isAdmin && (
                    <div className="border-t border-border/60 py-1">
                      <DropdownLink to="/admin" icon={<ShieldCheck className="h-4 w-4" />} label="Admin Panel" badge="Admin" />
                    </div>
                  )}

                  <div className="border-t border-border/60 py-1">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive/80 hover:text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login"><User className="h-4 w-4" /> Sign in</Link>
              </Button>
              <Button asChild variant="gold" size="sm">
                <Link to="/courses">Enroll Now</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-border"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="container flex flex-col py-4">
            {/* User card (mobile) */}
            {user && (
              <Link
                to="/profile"
                className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-secondary/30 border border-border/60"
              >
                <div className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center text-sm font-bold text-primary-foreground ring-2 ring-primary/20 overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    userInitial
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{userName}</p>
                  <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                </div>
                {isAdmin && (
                  <span className="text-[9px] uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                    Admin
                  </span>
                )}
              </Link>
            )}

            {/* Nav links */}
            <div className="space-y-0.5">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="flex items-center gap-3 px-3 py-3 text-sm uppercase tracking-wide text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/30 transition-colors"
                >
                  {l.label}
                </Link>
              ))}

              {user && (
                <>
                  <div className="h-px bg-border/60 my-2" />
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-3 py-3 text-sm uppercase tracking-wide text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-3 py-3 text-sm uppercase tracking-wide text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary/30 transition-colors"
                  >
                    <Settings className="h-4 w-4" /> Profile Settings
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-3 px-3 py-3 text-sm uppercase tracking-wide text-primary hover:text-primary rounded-lg hover:bg-primary/5 transition-colors"
                    >
                      <ShieldCheck className="h-4 w-4" /> Admin Panel
                    </Link>
                  )}
                </>
              )}
            </div>

            {/* Bottom actions */}
            <div className="mt-4 pt-3 border-t border-border/60">
              {user ? (
                <Button
                  variant="outline"
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/5"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1">
                    <Link to="/login">Sign in</Link>
                  </Button>
                  <Button asChild variant="gold" className="flex-1">
                    <Link to="/signup">Enroll</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

// Dropdown menu item component
function DropdownLink({
  to, icon, label, badge,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[9px] uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </Link>
  );
}
