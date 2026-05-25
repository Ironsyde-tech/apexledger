import { Anchor, Compass, Feather } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <>
      <section className="container py-24 max-w-4xl">
        <p className="text-xs uppercase tracking-widest text-primary mb-4">Our philosophy</p>
        <h1 className="font-display text-5xl md:text-7xl mb-8 leading-tight">
          A quiet academy <br />for a noisy world.
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed">
          Apex Ledger was built on a simple idea: that learning to navigate markets should feel less like gambling and more like a craft. We write books with the patience of editors and the rigour of practitioners — so that what you learn here stays with you.
        </p>
      </section>

      <section className="container py-16 grid md:grid-cols-3 gap-6">
        {[
          { icon: Anchor, title: "Grounded", text: "We teach what works in practice — not what trends on social media." },
          { icon: Compass, title: "Considered", text: "Every lesson is shaped by mentors with real, lived experience." },
          { icon: Feather, title: "Crafted", text: "Clean writing, beautiful design, honest pacing. No filler." },
        ].map((v) => (
          <div key={v.title} className="gold-border rounded-xl p-8">
            <v.icon className="h-7 w-7 text-primary mb-4" />
            <h3 className="font-display text-2xl mb-2">{v.title}</h3>
            <p className="text-muted-foreground">{v.text}</p>
          </div>
        ))}
      </section>

      <section className="container py-24 max-w-3xl">
        <h2 className="font-display text-4xl mb-6">Our story</h2>
        <div className="space-y-5 text-muted-foreground leading-relaxed">
          <p>Apex Ledger began as a small reading group between practitioners and friends. What started as evening discussions over markets, books, and strategy eventually became a library — and then a platform.</p>
          <p>We chose the name Apex Ledger for what it represents: reaching the peak through clear, recorded knowledge. The markets reward those who think clearly. We're here to help you do exactly that.</p>
        </div>
        <Button asChild variant="gold" size="lg" className="mt-10"><Link to="/courses">See our courses</Link></Button>
      </section>
    </>
  );
}
