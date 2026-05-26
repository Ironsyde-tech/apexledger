import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

type Props = {
  documentBlob: Blob;
  initialPage?: number;
  onPageChange?: (page: number, totalPages: number) => void;
};

export function BookReader({ documentBlob, initialPage = 1, onPageChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState(String(initialPage));
  const [rendering, setRendering] = useState(false);

  // Load the PDF document from blob
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("[BookReader] Blob size:", documentBlob.size, "type:", documentBlob.type);
        const arrayBuffer = await documentBlob.arrayBuffer();
        console.log("[BookReader] ArrayBuffer size:", arrayBuffer.byteLength);
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
        if (cancelled) return;
        console.log("[BookReader] PDF loaded, pages:", pdf.numPages);
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        setCurrentPage(Math.min(initialPage, pdf.numPages));
        setPageInput(String(Math.min(initialPage, pdf.numPages)));
        setLoading(false);
      } catch (err: any) {
        console.error("[BookReader] Failed to load PDF:", err);
        if (!cancelled) {
          setError(err.message || "Failed to parse PDF");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [documentBlob]);

  // Render a page onto the canvas
  const renderPage = useCallback(
    async (pageNum: number) => {
      const pdf = pdfDocRef.current;
      const canvas = canvasRef.current;
      if (!pdf || !canvas || rendering) return;

      setRendering(true);
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        const ctx = canvas.getContext("2d")!;

        // Handle high-DPI displays
        const dpr = window.devicePixelRatio || 1;
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        ctx.scale(dpr, dpr);

        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (err) {
        console.error("Page render error:", err);
      }
      setRendering(false);
    },
    [scale, rendering]
  );

  // Re-render when page or scale changes
  useEffect(() => {
    if (!loading && totalPages > 0) {
      renderPage(currentPage);
    }
  }, [currentPage, scale, loading, totalPages]);

  // Notify parent of page changes
  useEffect(() => {
    if (totalPages > 0) {
      onPageChange?.(currentPage, totalPages);
    }
  }, [currentPage, totalPages]);

  const goToPage = (page: number) => {
    const p = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(p);
    setPageInput(String(p));
  };

  const handlePageInput = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(pageInput, 10);
    if (!isNaN(p)) goToPage(p);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goToPage(currentPage - 1);
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        goToPage(currentPage + 1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentPage, totalPages]);

  const pct = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <span className="ml-3 text-muted-foreground">Loading document…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-destructive font-medium mb-2">Failed to render PDF</p>
        <p className="text-sm text-muted-foreground max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap justify-center">
        <Button
          size="sm"
          variant="outline"
          disabled={currentPage <= 1}
          onClick={() => goToPage(currentPage - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <form onSubmit={handlePageInput} className="flex items-center gap-1.5">
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            className="w-16 h-8 text-center text-sm"
          />
          <span className="text-sm text-muted-foreground">of {totalPages}</span>
        </form>

        <Button
          size="sm"
          variant="outline"
          disabled={currentPage >= totalPages}
          onClick={() => goToPage(currentPage + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button size="sm" variant="ghost" onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground w-10 text-center">
          {Math.round(scale * 100)}%
        </span>
        <Button size="sm" variant="ghost" onClick={() => setScale((s) => Math.min(3, s + 0.25))}>
          <ZoomIn className="h-4 w-4" />
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <span className="text-xs text-muted-foreground">{pct}% read</span>
      </div>

      {/* Canvas */}
      <div className="gold-border rounded-xl overflow-auto max-w-full bg-secondary/20 p-4">
        <canvas
          ref={canvasRef}
          className="mx-auto block"
          style={{ imageRendering: "auto" }}
        />
      </div>

      {/* Bottom nav */}
      <div className="flex items-center justify-between w-full mt-4 max-w-lg">
        <Button
          variant="outline"
          disabled={currentPage <= 1}
          onClick={() => goToPage(currentPage - 1)}
        >
          <ChevronLeft /> Previous page
        </Button>
        <span className="text-xs text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="gold"
          disabled={currentPage >= totalPages}
          onClick={() => goToPage(currentPage + 1)}
        >
          Next page <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
