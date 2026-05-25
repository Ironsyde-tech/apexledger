import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BookOpen, ArrowRight, X, Command } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { courseImage } from "@/lib/courses";

type SearchResult = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  category: string | null;
  level: string;
  price: number;
  image_url: string | null;
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelected(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(async () => {
      const q = query.trim().toLowerCase();
      const { data } = await supabase
        .from("courses")
        .select("id, slug, title, tagline, category, level, price, image_url")
        .eq("published", true)
        .or(`title.ilike.%${q}%,tagline.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`)
        .limit(8);

      setResults(data ?? []);
      setSelected(0);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter" && results[selected]) {
      e.preventDefault();
      goTo(results[selected].slug);
    }
  };

  const goTo = (slug: string) => {
    setOpen(false);
    nav(`/courses/${slug}`);
  };

  const highlight = (text: string, q: string) => {
    if (!q.trim()) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-primary/20 text-primary rounded-sm px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
      />

      {/* Search modal */}
      <div className="fixed inset-x-0 top-[15%] z-[101] flex justify-center px-4 animate-fade-up">
        <div className="w-full max-w-xl rounded-2xl border border-border bg-card shadow-elegant overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search courses, topics, categories…"
              className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/60"
            />
            <button
              onClick={() => setOpen(false)}
              className="h-6 w-6 rounded flex items-center justify-center bg-secondary/60 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-[360px] overflow-y-auto">
            {loading && (
              <div className="flex items-center gap-3 px-5 py-8 justify-center text-sm text-muted-foreground">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Searching…
              </div>
            )}

            {!loading && query.trim() && results.length === 0 && (
              <div className="px-5 py-8 text-center">
                <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No courses found for "{query}"</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try different keywords</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="py-2">
                <p className="px-5 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground/60">
                  {results.length} result{results.length !== 1 ? "s" : ""}
                </p>
                {results.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => goTo(r.slug)}
                    onMouseEnter={() => setSelected(i)}
                    className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${
                      selected === i ? "bg-secondary/50" : "hover:bg-secondary/30"
                    }`}
                  >
                    <img
                      src={courseImage(r.image_url)}
                      alt=""
                      className="h-12 w-16 rounded-md object-cover shrink-0 border border-border/40"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {highlight(r.title, query)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {r.tagline ? highlight(r.tagline, query) : ""}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {r.category && (
                          <span className="text-[10px] uppercase tracking-widest text-primary">
                            {r.category}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground/50">{r.level}</span>
                        <span className="text-[10px] font-medium text-foreground">${r.price}</span>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {!loading && !query.trim() && (
              <div className="px-5 py-8 text-center">
                <Search className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Type to search courses</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Search by title, topic, or category</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border/60 px-5 py-2.5 flex items-center justify-between text-[10px] text-muted-foreground/50">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="bg-secondary/60 rounded px-1.5 py-0.5 text-[10px] font-mono">↑↓</kbd> navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-secondary/60 rounded px-1.5 py-0.5 text-[10px] font-mono">↵</kbd> open
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-secondary/60 rounded px-1.5 py-0.5 text-[10px] font-mono">esc</kbd> close
              </span>
            </div>
            <span>Apex Ledger Search</span>
          </div>
        </div>
      </div>
    </>
  );
}

// Trigger button for the Navbar
export function SearchTrigger() {
  const triggerSearch = () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true })
    );
  };

  return (
    <button
      onClick={triggerSearch}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-secondary/30 text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Search…</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/60 bg-secondary/60 rounded px-1.5 py-0.5 font-mono ml-2">
        <Command className="h-2.5 w-2.5" />K
      </kbd>
    </button>
  );
}
