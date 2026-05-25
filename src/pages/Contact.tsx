import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isRateLimited } from "@/lib/rateLimiter";

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
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your inputs");
      return;
    }

    if (isRateLimited("contact-form", 3, 5 * 60 * 1000)) {
      toast.error("Too many messages. Please wait a few minutes before trying again.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("support_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      user_id: user?.id ?? null,
    });
    setLoading(false);

    if (error) {
      toast.error("Failed to send message. Please try again.");
      return;
    }

    toast.success("Message sent — we'll be in touch within one business day.");
    e.currentTarget.reset();
  };

  return (
    <section className="container py-20 grid lg:grid-cols-[1fr_1.2fr] gap-12">
      <div>
        <p className="text-xs uppercase tracking-widest text-primary mb-3">Support</p>
        <h1 className="font-display text-5xl md:text-6xl mb-6">We're here when you need us.</h1>
        <p className="text-muted-foreground text-lg mb-10">Whether it's a question about a course, a payment issue, or something else entirely — we read every message.</p>

        <ul className="space-y-5">
          {[
            { icon: Mail, label: "Email", value: "support@primesociety.com" },
            { icon: MessageCircle, label: "Live chat", value: "Mon–Fri · 9am – 6pm UTC" },
            { icon: Clock, label: "Response time", value: "Within 1 business day" },
          ].map((c) => (
            <li key={c.label} className="flex items-center gap-4">
              <span className="h-11 w-11 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground"><c.icon className="h-5 w-5" /></span>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">{c.label}</p>
                <p className="font-medium">{c.value}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={submit} className="gold-border rounded-xl p-8 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Name</Label><Input name="name" required maxLength={100} /></div>
          <div><Label>Email</Label><Input name="email" type="email" required maxLength={255} /></div>
        </div>
        <div><Label>How can we help?</Label><Textarea name="message" rows={7} required minLength={10} maxLength={2000} placeholder="Tell us a bit about what you need…" /></div>
        <Button variant="gold" size="lg" type="submit" className="w-full" disabled={loading}>
          {loading ? "Sending…" : "Send message"}
        </Button>
      </form>
    </section>
  );
}
