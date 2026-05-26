import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isRateLimited } from "@/lib/rateLimiter";
import { SEO } from "@/components/SEO";
import { Mail, MessageCircle, Clock } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(10).max(2000),
});

export default function Contact() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(fd));
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Please check your inputs"); return; }
    if (isRateLimited("contact", 60_000)) { toast.error("Please wait a moment before sending another message."); return; }
    setLoading(true);
    try {
      const { error: err } = await supabase.from("contact_messages").insert({ name: parsed.data.name, email: parsed.data.email, message: parsed.data.message, user_id: user?.id ?? null });
      if (err) throw err;
    } catch { toast.error("Something went wrong. Please try again."); setLoading(false); return; }
    setLoading(false);
    toast.success("Message sent — we'll be in touch within one business day.");
    e.currentTarget.reset();
  };

  return (
    <>
      <SEO title="Contact" description="Have a question about Apex Ledger? We read every message." />

      <section style={{ background: "var(--navy)", color: "#fff", padding: "48px 0" }}>
        <div className="container">
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 500, color: "#fff", marginBottom: 8 }}>Contact us</h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)" }}>Have a question? We read every message and respond within one business day.</p>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 48 }}>
          <div>
            <h2 style={{ fontFamily: "Inter, sans-serif", fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Get in touch</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { icon: Mail, label: "Email", value: "support@apexledger.com" },
                { icon: MessageCircle, label: "Live chat", value: "Mon–Fri · 9am – 6pm UTC" },
                { icon: Clock, label: "Response time", value: "Within 1 business day" },
              ].map(c => (
                <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--gold-bg)", border: "1px solid var(--gold-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <c.icon style={{ width: 20, height: 20, color: "var(--gold-dark)" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{c.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={submit} className="card-flat" style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "Inter, sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Send us a message</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div><Label>Name</Label><Input name="name" required maxLength={100} /></div>
              <div><Label>Email</Label><Input name="email" type="email" required maxLength={255} /></div>
            </div>
            <div style={{ marginBottom: 20 }}><Label>How can we help?</Label><Textarea name="message" rows={5} required minLength={10} maxLength={2000} placeholder="Tell us what you need…" /></div>
            <button type="submit" className="btn-primary" style={{ width: "100%", borderRadius: 8 }} disabled={loading}>{loading ? "Sending…" : "Send message"}</button>
          </form>
        </div>
      </section>
    </>
  );
}
