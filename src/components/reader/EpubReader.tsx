import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import ePub, { type Book, type Rendition } from "epubjs";

type Props = {
  documentBlob: Blob;
  onPageChange?: (location: number, totalLocations: number) => void;
};

export function EpubReader({ documentBlob, onPageChange }: Props) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<Book | null>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(0);
  const [totalLocations, setTotalLocations] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!viewerRef.current) return;
      setLoading(true);

      try {
        const arrayBuffer = await documentBlob.arrayBuffer();
        const book = ePub(arrayBuffer);
        bookRef.current = book;

        const rendition = book.renderTo(viewerRef.current, {
          width: "100%",
          height: "80vh",
          spread: "none",
        });

        renditionRef.current = rendition;

        // Apply dark theme styling
        rendition.themes.default({
          body: {
            color: "#e0d6c2 !important",
            background: "transparent !important",
            "font-family": "'Inter', sans-serif !important",
            "line-height": "1.8 !important",
            "font-size": "16px !important",
            padding: "0 1rem !important",
          },
          "a, a:link, a:visited": {
            color: "#c9a24c !important",
          },
        });

        await rendition.display();

        // Generate locations for progress tracking
        await book.locations.generate(1024);
        if (cancelled) return;
        setTotalLocations(book.locations.length());
        setLoading(false);

        rendition.on("relocated", (location: any) => {
          if (cancelled) return;
          const current = book.locations.locationFromCfi(location.start.cfi);
          const total = book.locations.length();
          setCurrentLocation(current);
          setTotalLocations(total);
          onPageChange?.(current, total);
        });
      } catch (err) {
        console.error("EPUB load error:", err);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      renditionRef.current?.destroy();
      bookRef.current?.destroy();
    };
  }, [documentBlob]);

  const prev = () => renditionRef.current?.prev();
  const next = () => renditionRef.current?.next();

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const pct = totalLocations > 0
    ? Math.round((currentLocation / totalLocations) * 100)
    : 0;

  return (
    <div className="flex flex-col">
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="ml-3 text-muted-foreground">Loading book…</span>
        </div>
      )}

      <div
        ref={viewerRef}
        className="gold-border rounded-xl overflow-hidden bg-secondary/10"
        style={{ minHeight: "60vh", display: loading ? "none" : "block" }}
      />

      {!loading && (
        <div className="flex items-center justify-between mt-4">
          <Button variant="outline" onClick={prev}>
            <ChevronLeft /> Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Location {currentLocation} of {totalLocations} · {pct}%
          </span>
          <Button variant="gold" onClick={next}>
            Next <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
