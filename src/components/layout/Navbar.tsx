import { useState, useEffect, useRef } from "react";
import { Link, NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut, LayoutDashboard, ShieldCheck, BookOpen, ChevronDown, Search } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { SearchTrigger } from "@/components/GlobalSearch";

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const loc = useLocation();
  const { user, isAdmin, loading, signOut } = useAuth();

  useEffect(() => { setMobileOpen(false); setDropdownOpen(false); }, [loc.pathname]);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleSignOut = async () => { setDropdownOpen(false); await signOut(); };
  const userInitial = user?.user_metadata?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "U";
  const userName = user?.user_metadata?.full_name ?? "User";
  const userEmail = user?.email ?? "";
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <header style={{ position: "sticky", top: 0, zIndex: 50, background: scrolled ? "rgba(255,255,255,0.97)" : "#FFFFFF", borderBottom: "1px solid var(--border)", backdropFilter: scrolled ? "blur(10px)" : "none", transition: "all 0.2s ease", boxShadow: scrolled ? "0 1px 4px rgba(0,0,0,0.04)" : "none" }}>
      <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <Logo />
          <nav className="hidden lg:flex" style={{ gap: 4 }}>
            {links.map((l) => (
              <RouterNavLink key={l.to} to={l.to} end={l.to === "/"} style={({ isActive }) => ({
                fontSize: 14, fontWeight: isActive ? 600 : 500, color: isActive ? "var(--text)" : "var(--text-secondary)",
                textDecoration: "none", padding: "8px 12px", borderRadius: 8, transition: "all 0.15s",
                background: isActive ? "var(--bg-alt)" : "transparent",
              })}>
                {l.label}
              </RouterNavLink>
            ))}
          </nav>
        </div>

        <div className="hidden lg:flex" style={{ alignItems: "center", gap: 12 }}>
          {/* Search bar */}
          <SearchTrigger />

          {loading ? (
            <div style={{ width: 80, height: 36, borderRadius: 8, background: "var(--bg-alt)" }} className="animate-pulse" />
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 10px", borderRadius: 8, background: dropdownOpen ? "var(--bg-alt)" : "transparent", border: "none", cursor: "pointer", transition: "background 0.15s" }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: "var(--gold)", color: "#fff", overflow: "hidden" }}>
                  {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : userInitial}
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform", dropdownOpen && "rotate-180")} style={{ color: "var(--text-muted)" }} />
              </button>
              {dropdownOpen && (
                <div className="animate-fade-up" style={{ position: "absolute", right: 0, marginTop: 8, width: 260, background: "#fff", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
                  <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{userName}</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{userEmail}</p>
                    {isAdmin && <p style={{ fontSize: 10, letterSpacing: 1, color: "var(--gold-dark)", marginTop: 6, textTransform: "uppercase", fontWeight: 600 }}>✦ Administrator</p>}
                  </div>
                  <div style={{ padding: "4px 0" }}>
                    <DDLink to="/profile" icon={<User className="h-4 w-4" />}>My Profile</DDLink>
                    <DDLink to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>Dashboard</DDLink>
                    <DDLink to="/courses" icon={<BookOpen className="h-4 w-4" />}>Browse Courses</DDLink>
                    {isAdmin && <DDLink to="/admin" icon={<ShieldCheck className="h-4 w-4" />}>Admin Panel</DDLink>}
                  </div>
                  <div style={{ padding: "4px 0", borderTop: "1px solid var(--border)" }}>
                    <button onClick={handleSignOut} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 13, color: "var(--red)", background: "none", border: "none", cursor: "pointer" }}>
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", textDecoration: "none", padding: "8px 16px" }}>Log In</Link>
              <Link to="/signup" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 40, padding: "0 20px", fontSize: 14, fontWeight: 600, color: "#fff", background: "var(--navy)", borderRadius: 8, textDecoration: "none" }}>Join for Free</Link>
            </>
          )}
        </div>

        <button className="lg:hidden" style={{ width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", borderRadius: 8, background: "none", cursor: "pointer" }} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
          {mobileOpen ? <X style={{ width: 20, height: 20, color: "var(--text)" }} /> : <Menu style={{ width: 20, height: 20, color: "var(--text)" }} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden" style={{ background: "#fff", borderTop: "1px solid var(--border)", padding: "16px 24px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {links.map((l) => <Link key={l.to} to={l.to} style={{ padding: "12px 8px", fontSize: 14, fontWeight: 500, color: "var(--text-secondary)", textDecoration: "none", borderRadius: 8 }}>{l.label}</Link>)}
          </div>
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
            {user ? (
              <button onClick={handleSignOut} style={{ flex: 1, height: 44, fontSize: 13, color: "var(--red)", background: "none", border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer" }}>Sign out</button>
            ) : (
              <>
                <Link to="/login" style={{ flex: 1, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "var(--text)", border: "1px solid var(--border)", borderRadius: 8, textDecoration: "none" }}>Log In</Link>
                <Link to="/signup" style={{ flex: 1, height: 44, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#fff", background: "var(--navy)", borderRadius: 8, textDecoration: "none" }}>Join for Free</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

function DDLink({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <Link to={to} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", fontSize: 13, color: "var(--text-secondary)", textDecoration: "none", borderRadius: 4, transition: "background 0.15s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-alt)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>{icon} {children}</Link>;
}
