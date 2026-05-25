import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validating, setValidating] = useState(true);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes("type=recovery")) {
      toast.error("Invalid or expired password reset link.");
      nav("/login");
      return;
    }

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setValidating(false);
      }
    });

    // Give a short window for the auth state to settle
    const timer = setTimeout(() => setValidating(false), 500);
    return () => clearTimeout(timer);
  }, [nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're all set.");
      nav("/dashboard");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <section className="min-h-[calc(100vh-200px)] container py-16 flex items-center justify-center">
        <div className="w-full max-w-md text-center">
          <p className="text-muted-foreground">Verifying reset link…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100vh-200px)] container py-16 flex items-center justify-center">
      <div className="w-full max-w-md gold-border rounded-2xl p-10">
        <div className="flex justify-center mb-8"><Logo /></div>
        <h1 className="font-display text-4xl text-center mb-2">Set new password</h1>
        <p className="text-center text-muted-foreground mb-8">Enter your new password below.</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>New password</Label>
            <Input
              type="password"
              required
              minLength={8}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label>Confirm password</Label>
            <Input
              type="password"
              required
              minLength={8}
              placeholder="Repeat your new password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button variant="gold" size="lg" className="w-full" type="submit" disabled={loading}>
            {loading ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </section>
  );
}
