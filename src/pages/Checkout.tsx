import { useEffect, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Copy, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { courseImage } from "@/lib/courses";
import { isRateLimited } from "@/lib/rateLimiter";

const TRC20_TX_REGEX = /^[a-fA-F0-9]{64}$/;
const ERC20_TX_REGEX = /^0x[a-fA-F0-9]{64}$/;

type CheckoutCourse = {
  id: string;
  slug: string;
  title: string;
  tagline: string | null;
  price: number;
  image_url: string | null;
  disclaimer: string | null;
};

export default function Checkout() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState<CheckoutCourse | null>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState(false);
  const [network, setNetwork] = useState<"TRC20" | "ERC20">("TRC20");
  const [txHash, setTxHash] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const [wallets, setWallets] = useState<{ TRC20: string; ERC20: string } | null>(null);
  const [walletsError, setWalletsError] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  const MAX_PROOF_BYTES = 10 * 1024 * 1024;
  const ALLOWED_PROOF_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

  const loadCourse = () => {
    if (!slug) return;
    setCourseLoading(true);
    setCourseError(false);
    supabase
      .from("courses")
      .select("id, slug, title, tagline, price, image_url, disclaimer")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setCourseError(true);
          setCourse(null);
        } else {
          setCourse(
            data
              ? {
                  id: data.id,
                  slug: data.slug,
                  title: data.title,
                  tagline: data.tagline,
                  price: Number(data.price ?? 0),
                  image_url: data.image_url,
                  disclaimer: data.disclaimer,
                }
              : null
          );
        }
        setCourseLoading(false);
      });
  };

  useEffect(() => {
    loadCourse();
  }, [slug]);

  // Check for an existing pending order on this course for this user
  useEffect(() => {
    if (!user || !course) return;
    supabase
      .from("orders")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setPendingOrderId(data?.id ?? null));
  }, [user, course]);

  const loadWallets = () => {
    setWalletsError(false);
    supabase
      .from("settings")
      .select("key, value")
      .in("key", ["usdt_trc20_address", "usdt_erc20_address"])
      .then(({ data, error }) => {
        if (error || !data) {
          setWalletsError(true);
          return;
        }
        const map = Object.fromEntries(data.map((r) => [r.key, r.value ?? ""]));
        setWallets({
          TRC20: map["usdt_trc20_address"] ?? "",
          ERC20: map["usdt_erc20_address"] ?? "",
        });
      });
  };

  useEffect(() => {
    loadWallets();
  }, []);

  if (courseLoading || !wallets) {
    return (
      <section className="container py-24">
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10">
          <div className="space-y-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-14 w-2/3" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <aside className="gold-border rounded-xl p-8 self-start space-y-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="aspect-[16/10] w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-10 w-full" />
          </aside>
        </div>
      </section>
    );
  }
  if (courseError) {
    return (
      <section className="container py-24">
        <EmptyState variant="error" onRetry={loadCourse} />
      </section>
    );
  }
  if (walletsError) {
    return (
      <section className="container py-24">
        <EmptyState
          variant="error"
          title="Could not load payment settings"
          description="We couldn't fetch the USDT wallet addresses. Please try again."
          onRetry={loadWallets}
        />
      </section>
    );
  }
  if (!course) return <Navigate to="/courses" replace />;

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const onProofChange = (file: File | null) => {
    if (!file) { setProofFile(null); return; }
    if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, WebP, or PDF files are accepted");
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      toast.error("File is larger than 10 MB");
      return;
    }
    setProofFile(file);
  };

  const submitCrypto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error("Please sign in first");
    if (!course) return toast.error("Course not ready yet");
    if (pendingOrderId) return toast.error("You already have a pending order for this course");
    if (!txHash.trim()) return toast.error("Paste your transaction hash");

    // Validate tx hash format
    const hash = txHash.trim();
    const validHash = network === "TRC20" ? TRC20_TX_REGEX.test(hash) : ERC20_TX_REGEX.test(hash);
    if (!validHash) {
      return toast.error(
        network === "TRC20"
          ? "TRC20 transaction hash must be 64 hexadecimal characters"
          : "ERC20 transaction hash must start with 0x followed by 64 hex characters"
      );
    }

    if (!proofFile) return toast.error("Upload a screenshot of your payment");

    if (isRateLimited("checkout-submit", 3, 10 * 60 * 1000)) {
      return toast.error("Too many submissions. Please wait a few minutes before trying again.");
    }

    setSubmitting(true);
    try {
      // 1) Upload proof to private bucket
      const ext = proofFile.name.split(".").pop() ?? "png";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-proofs")
        .upload(path, proofFile, { contentType: proofFile.type });
      if (upErr) throw upErr;

      // 2) Create order
      const method = network === "TRC20" ? "usdt_trc20" : "usdt_erc20";
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          course_id: course.id,
          amount: course.price,
          currency: "USD",
          status: "pending",
          payment_method: method,
        })
        .select("id")
        .single();
      if (orderErr) throw orderErr;

      // 3) Create payment
      const { error: payErr } = await supabase.from("payments").insert({
        order_id: order.id,
        method,
        status: "submitted",
        usdt_network: network,
        usdt_tx_hash: txHash.trim(),
        usdt_proof_url: path,
      });
      if (payErr) {
        // Roll back the order so the user can retry with a different hash
        await supabase.from("orders").delete().eq("id", order.id);
        if (payErr.code === "23505" || /duplicate|unique/i.test(payErr.message)) {
          throw new Error("That transaction hash has already been submitted on another order.");
        }
        throw payErr;
      }

      setSubmittedOrderId(order.id);
    } catch (err: any) {
      toast.error(err.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedOrderId) {
    return (
      <section className="container py-24 max-w-xl">
        <div className="gold-border rounded-2xl p-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="font-display text-4xl mb-3">Payment submitted</h1>
          <p className="text-muted-foreground mb-6">
            Your USDT transaction is now pending review. We typically confirm within a few hours. You'll be enrolled in <strong className="text-foreground">{course.title}</strong> as soon as the on-chain transfer is verified.
          </p>
          <div className="rounded-lg bg-secondary/40 border border-border p-4 mb-6 text-sm">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Order ID</p>
            <p className="font-mono break-all">{submittedOrderId}</p>
          </div>
          <Button asChild variant="gold" size="lg" className="w-full">
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-16 grid lg:grid-cols-[1.3fr_1fr] gap-10">
      <div>
        <Link to={`/courses/${course.slug}`} className="text-xs uppercase tracking-widest text-primary hover:underline">← Back to course</Link>
        <h1 className="font-display text-5xl md:text-6xl mt-6 mb-3">Checkout</h1>
        <p className="text-muted-foreground mb-6">Pay with USDT on TRC20 or ERC20. Enrollment activates after our team confirms the on-chain transfer.</p>
        {course.disclaimer && (
          <div className="rounded-lg border border-warning/40 bg-warning/5 p-4 flex gap-3 mb-10">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Disclaimer · </strong>{course.disclaimer}
            </p>
          </div>
        )}

        {pendingOrderId ? (
          <div className="gold-border rounded-xl p-8 text-center">
            <AlertCircle className="h-10 w-10 text-warning mx-auto mb-3" />
            <h2 className="font-display text-2xl mb-2">You have a pending order</h2>
            <p className="text-muted-foreground mb-6">
              We're still reviewing your previous USDT submission for this course. You'll be enrolled as soon as the on-chain transfer is verified. Please wait for a decision before submitting another payment.
            </p>
            <Button asChild variant="gold"><Link to="/dashboard">Go to dashboard</Link></Button>
          </div>
        ) : (
        <form onSubmit={submitCrypto} className="gold-border rounded-xl p-8 space-y-6">
          <div>
            <Label className="mb-3 block">Select network</Label>
            <div className="grid grid-cols-2 gap-3">
              {(["TRC20", "ERC20"] as const).map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setNetwork(n)}
                  className={`p-4 rounded-lg border text-left transition-base ${
                    network === n ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="font-display text-xl">USDT · {n}</div>
                  <div className="text-xs text-muted-foreground mt-1">{n === "TRC20" ? "Tron · low fee" : "Ethereum"}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Send exactly ${course.price} USDT to:</Label>
            <div className="flex gap-2">
              <Input readOnly value={wallets[network]} className="font-mono text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={() => copy(wallets[network])}><Copy /></Button>
            </div>
          </div>

          <div className="rounded-lg bg-secondary/40 border border-border p-4 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">Payment instructions</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Send exactly ${course.price} USDT on the <strong>{network}</strong> network.</li>
              <li>Copy the transaction hash from your wallet.</li>
              <li>Paste it below and upload a screenshot as proof.</li>
            </ol>
          </div>

          <div>
            <Label>Transaction hash</Label>
            <Input value={txHash} onChange={(e) => setTxHash(e.target.value)} placeholder="0x… or T…" className="font-mono text-xs" required />
          </div>

          <div>
            <Label className="mb-2 block">Proof of payment (screenshot or PDF)</Label>
            <label className="flex items-center justify-center gap-3 border border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/60 transition-base">
              <Upload className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">{proofFile?.name ?? "Click to upload JPG, PNG, WebP or PDF · max 10 MB"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => onProofChange(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="rounded-lg border border-warning/40 bg-warning/5 p-4 flex gap-3 text-sm">
            <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">Disclaimer:</strong> Enrollment activates only after our team confirms your USDT payment on-chain. Status will move from <em>pending → confirmed</em>, or <em>rejected</em> if the transaction cannot be verified.
            </p>
          </div>

          <Button variant="gold" size="lg" className="w-full" type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit payment for review"}
          </Button>
        </form>
        )}
      </div>

      <aside className="gold-border rounded-xl p-8 self-start sticky top-24">
        <p className="text-xs uppercase tracking-widest text-primary mb-4">Order summary</p>
        <img src={courseImage(course.image_url)} alt={course.title} className="aspect-[16/10] w-full object-cover rounded-lg mb-5" />
        <h3 className="font-display text-2xl mb-2">{course.title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{course.tagline}</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${course.price}.00</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>$0.00</span></div>
        </div>
        <div className="hairline my-6" />
        <div className="flex justify-between items-baseline">
          <span className="font-display text-lg">Total</span>
          <span className="font-display text-3xl text-gradient-gold">${course.price}.00</span>
        </div>
      </aside>
    </section>
  );
}
