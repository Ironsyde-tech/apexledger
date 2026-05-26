import { useRef, useCallback, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Award, ArrowRight, User, Pencil } from "lucide-react";

type CertificateProps = {
  open: boolean;
  onClose: () => void;
  studentName: string;
  courseTitle: string;
  completionDate: string;
  certificateId: string;
};

export function CertificateDialog({
  open,
  onClose,
  studentName,
  courseTitle,
  completionDate,
  certificateId,
}: CertificateProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<'confirm' | 'certificate'>('confirm');
  const [displayName, setDisplayName] = useState(studentName);

  // Reset step when dialog opens
  useEffect(() => {
    if (open) {
      setStep('confirm');
      setDisplayName(studentName);
    }
  }, [open, studentName]);

  const drawCertificate = useCallback(
    (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = 1200;
      const H = 850;
      canvas.width = W;
      canvas.height = H;

      // Background
      ctx.fillStyle = "#0c0a09";
      ctx.fillRect(0, 0, W, H);

      // Inner frame
      const pad = 40;
      ctx.strokeStyle = "#c9a84c";
      ctx.lineWidth = 2;
      ctx.strokeRect(pad, pad, W - pad * 2, H - pad * 2);

      // Double border
      ctx.strokeStyle = "rgba(201, 168, 76, 0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(pad + 8, pad + 8, W - (pad + 8) * 2, H - (pad + 8) * 2);

      // Corner ornaments
      const cornerSize = 30;
      const corners = [
        [pad, pad],
        [W - pad, pad],
        [pad, H - pad],
        [W - pad, H - pad],
      ];
      ctx.strokeStyle = "#c9a84c";
      ctx.lineWidth = 2;
      corners.forEach(([cx, cy]) => {
        const dirX = cx < W / 2 ? 1 : -1;
        const dirY = cy < H / 2 ? 1 : -1;
        ctx.beginPath();
        ctx.moveTo(cx + dirX * cornerSize, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + dirY * cornerSize);
        ctx.stroke();
      });

      // Gold gradient line at top
      const gradient = ctx.createLinearGradient(pad + 60, 0, W - pad - 60, 0);
      gradient.addColorStop(0, "rgba(201, 168, 76, 0)");
      gradient.addColorStop(0.3, "#c9a84c");
      gradient.addColorStop(0.7, "#c9a84c");
      gradient.addColorStop(1, "rgba(201, 168, 76, 0)");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad + 60, pad + 50);
      ctx.lineTo(W - pad - 60, pad + 50);
      ctx.stroke();

      // "CERTIFICATE OF COMPLETION" header
      ctx.fillStyle = "#c9a84c";
      ctx.font = "500 14px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.letterSpacing = "8px";
      ctx.fillText("C E R T I F I C A T E   O F   C O M P L E T I O N", W / 2, pad + 95);

      // Apex Ledger brand
      ctx.fillStyle = "rgba(201, 168, 76, 0.5)";
      ctx.font = "400 11px 'Inter', sans-serif";
      ctx.fillText("APEX LEDGER", W / 2, pad + 120);

      // "This certifies that"
      ctx.fillStyle = "#a8a29e";
      ctx.font = "300 16px 'Inter', sans-serif";
      ctx.fillText("This certifies that", W / 2, 210);

      // Student name — use displayName
      ctx.fillStyle = "#fafaf9";
      ctx.font = "italic 600 48px 'Cormorant Garamond', Georgia, serif";
      ctx.fillText(displayName, W / 2, 280);

      // Line under name
      const nameWidth = Math.min(ctx.measureText(displayName).width + 60, 600);
      const lineGrad = ctx.createLinearGradient(W / 2 - nameWidth / 2, 0, W / 2 + nameWidth / 2, 0);
      lineGrad.addColorStop(0, "rgba(201, 168, 76, 0)");
      lineGrad.addColorStop(0.2, "rgba(201, 168, 76, 0.4)");
      lineGrad.addColorStop(0.8, "rgba(201, 168, 76, 0.4)");
      lineGrad.addColorStop(1, "rgba(201, 168, 76, 0)");
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - nameWidth / 2, 295);
      ctx.lineTo(W / 2 + nameWidth / 2, 295);
      ctx.stroke();

      // "has successfully completed"
      ctx.fillStyle = "#a8a29e";
      ctx.font = "300 16px 'Inter', sans-serif";
      ctx.fillText("has successfully completed the course", W / 2, 340);

      // Course title
      ctx.fillStyle = "#c9a84c";
      ctx.font = "600 32px 'Cormorant Garamond', Georgia, serif";

      // Word-wrap course title if too long
      const maxTitleWidth = W - 200;
      if (ctx.measureText(courseTitle).width > maxTitleWidth) {
        const words = courseTitle.split(" ");
        let line1 = "";
        let line2 = "";
        let onLine2 = false;
        for (const word of words) {
          const test = onLine2 ? line2 + " " + word : line1 + " " + word;
          if (!onLine2 && ctx.measureText(test.trim()).width > maxTitleWidth) {
            onLine2 = true;
            line2 = word;
          } else if (onLine2) {
            line2 += " " + word;
          } else {
            line1 = test.trim();
          }
        }
        ctx.fillText(line1, W / 2, 400);
        if (line2) ctx.fillText(line2, W / 2, 445);
      } else {
        ctx.fillText(courseTitle, W / 2, 400);
      }

      // Bottom section
      const bottomY = 540;

      // Completion date
      ctx.fillStyle = "#a8a29e";
      ctx.font = "300 14px 'Inter', sans-serif";
      ctx.fillText("Completed on", W / 2, bottomY);
      ctx.fillStyle = "#fafaf9";
      ctx.font = "500 18px 'Inter', sans-serif";
      ctx.fillText(completionDate, W / 2, bottomY + 28);

      // Divider
      ctx.strokeStyle = "rgba(201, 168, 76, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad + 60, bottomY + 60);
      ctx.lineTo(W - pad - 60, bottomY + 60);
      ctx.stroke();

      // Signature lines
      const sigY = bottomY + 110;

      // Left: "Director"
      ctx.strokeStyle = "#c9a84c";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(160, sigY);
      ctx.lineTo(380, sigY);
      ctx.stroke();
      ctx.fillStyle = "#a8a29e";
      ctx.font = "300 12px 'Inter', sans-serif";
      ctx.fillText("Director, Apex Ledger", 270, sigY + 22);

      // Right: "Certificate ID"
      ctx.beginPath();
      ctx.moveTo(W - 380, sigY);
      ctx.lineTo(W - 160, sigY);
      ctx.stroke();
      ctx.fillStyle = "#78716c";
      ctx.font = "300 10px 'Inter', monospace";
      ctx.fillText(`ID: ${certificateId.slice(0, 8).toUpperCase()}`, W - 270, sigY + 22);

      // Bottom brand
      ctx.fillStyle = "rgba(201, 168, 76, 0.25)";
      ctx.font = "400 10px 'Inter', sans-serif";
      ctx.fillText("apexledger.com · Master the Markets", W / 2, H - pad - 15);

      // Bottom gold line
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad + 60, H - pad - 50);
      ctx.lineTo(W - pad - 60, H - pad - 50);
      ctx.stroke();
    },
    [displayName, courseTitle, completionDate, certificateId]
  );

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCertificate(canvas);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Apex-Ledger-Certificate-${courseTitle.replace(/\s+/g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        {step === 'confirm' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" /> Confirm your details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="gold-border rounded-xl p-6 text-center bg-gradient-to-br from-primary/5 to-transparent">
                <Award className="h-12 w-12 text-primary mx-auto mb-3" />
                <h3 className="font-display text-2xl mb-1">Congratulations! 🎉</h3>
                <p className="text-muted-foreground text-sm">
                  You've completed <span className="text-foreground font-medium">{courseTitle}</span>
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-primary" /> Full name (as it will appear on your certificate)
                  </Label>
                  <div className="relative">
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your full name"
                      className="text-lg pr-10"
                    />
                    <Pencil className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Please make sure this is exactly how you want it on your certificate. This cannot be changed after download.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Course</p>
                    <p className="text-sm font-medium truncate">{courseTitle}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Completion date</p>
                    <p className="text-sm font-medium">{completionDate}</p>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                variant="gold"
                onClick={() => setStep('certificate')}
                disabled={!displayName.trim()}
              >
                Generate Certificate <ArrowRight className="h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" /> Your Certificate
              </DialogTitle>
            </DialogHeader>

            <div className="rounded-lg overflow-hidden border border-border bg-black">
              <canvas
                ref={(el) => {
                  if (el) {
                    (canvasRef as any).current = el;
                    drawCertificate(el);
                  }
                }}
                className="w-full h-auto"
              />
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setStep('confirm')}>
                <Pencil className="h-4 w-4" /> Edit name
              </Button>
              <Button variant="gold" onClick={handleDownload}>
                <Download className="h-4 w-4" /> Download Certificate
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
