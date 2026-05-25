import { useEffect, type ReactNode } from "react";

/**
 * Wraps reader content with anti-piracy measures:
 * - Blocks right-click context menu
 * - Intercepts copy/save/print keyboard shortcuts
 * - Disables text selection via CSS
 * - Hides content when printing
 * - Shows a semi-transparent watermark with user email
 */
export function AntiPiracy({
  children,
  userEmail,
}: {
  children: ReactNode;
  userEmail?: string;
}) {
  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      // Block: Ctrl+S, Ctrl+C, Ctrl+P, Ctrl+Shift+I (DevTools), PrintScreen
      if (
        isCtrlOrCmd &&
        ["s", "c", "p", "u"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
      // PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
      }
      // Ctrl+Shift+I (DevTools shortcut)
      if (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === "i") {
        e.preventDefault();
      }
    };

    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Block drag (prevents dragging images/text)
    const blockDrag = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener("keydown", blockKeys, true);
    document.addEventListener("contextmenu", blockContextMenu, true);
    document.addEventListener("dragstart", blockDrag, true);

    return () => {
      document.removeEventListener("keydown", blockKeys, true);
      document.removeEventListener("contextmenu", blockContextMenu, true);
      document.removeEventListener("dragstart", blockDrag, true);
    };
  }, []);

  const now = new Date().toISOString().slice(0, 16);

  return (
    <div
      className="anti-piracy-shell relative"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {children}

      {/* Watermark overlay */}
      {userEmail && (
        <div
          className="pointer-events-none absolute inset-0 z-50 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-32 opacity-[0.04] rotate-[-25deg] scale-150">
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className="text-foreground text-sm font-mono whitespace-nowrap select-none"
              >
                {userEmail} · {now}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
