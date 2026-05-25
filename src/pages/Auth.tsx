import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { isRateLimited } from "@/lib/rateLimiter";

type Mode = "login" | "signup" | "forgot";

export default function Auth({ mode }: { mode: Mode }) {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [signupSent, setSignupSent] = useState(false);

  const titles = {
    login: { h: "Welcome back", s: "Sign in to continue your learning." },
    signup: { h: "Create your account", s: "Begin your journey with Apex Ledger." },
    forgot: { h: "Reset your password", s: "We'll send you a secure reset link." },
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limit: 5 login/signup attempts per 60s, 3 reset requests per 5min
    const limitKey = mode === "forgot" ? "auth-reset" : "auth-login";
    const limitMax = mode === "forgot" ? 3 : 5;
    const limitWindow = mode === "forgot" ? 5 * 60 * 1000 : 60 * 1000;
    if (isRateLimited(limitKey, limitMax, limitWindow)) {
      toast.error("Too many attempts. Please wait before trying again.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        setSignupSent(true);
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in.");
        nav("/dashboard");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("If that email exists, a reset link is on its way.");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "signup" && signupSent) {
    return (
      <section className="min-h-[calc(100vh-200px)] container py-16 flex items-center justify-center">
        <div className="w-full max-w-md gold-border rounded-2xl p-10 text-center">
          <div className="flex justify-center mb-8"><Logo /></div>
          <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="font-display text-4xl mb-3">Check your email</h1>
          <p className="text-muted-foreground mb-6">
            We sent a verification link to <strong className="text-foreground">{email}</strong>. Click it to confirm your account, then sign in to access your dashboard.
          </p>
          <Button asChild variant="gold" size="lg" className="w-full">
            <Link to="/login">Back to sign in</Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Didn't get it? Check your spam folder or{" "}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => setSignupSent(false)}
            >
              try again
            </button>.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-200px)] container py-16 flex items-center justify-center">
      <div className="w-full max-w-md gold-border rounded-2xl p-10">
        <div className="flex justify-center mb-8"><Logo /></div>
        <h1 className="font-display text-4xl text-center mb-2">{titles[mode].h}</h1>
        <p className="text-center text-muted-foreground mb-8">{titles[mode].s}</p>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <Label>Full name</Label>
              <Input required placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          )}
          <div>
            <Label>Email</Label>
            <Input type="email" required placeholder="jane@email.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== "forgot" && (
            <div>
              <Label>Password</Label>
              <Input type="password" required minLength={8} placeholder="At least 8 characters" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}

          <Button variant="gold" size="lg" className="w-full" type="submit" disabled={loading}>
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground space-y-2">
          {mode === "login" && (
            <>
              <p><Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link></p>
              <p>Don't have an account? <Link to="/signup" className="text-primary hover:underline">Sign up</Link></p>
            </>
          )}
          {mode === "signup" && <p>Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></p>}
          {mode === "forgot" && <p><Link to="/login" className="text-primary hover:underline">← Back to sign in</Link></p>}
        </div>
      </div>
    </section>
  );
}
