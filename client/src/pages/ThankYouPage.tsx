import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams, useSearch } from "wouter";
import { useAction, useQuery } from "convex/react";
import {
  ArrowLeft,
  CheckCircle2,
  Home,
  Mail,
  PackageCheck,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "../../../convex/_generated/api";
import brawlStarsLogo from "@/images/brawlstars_logo.png";

function receiptNumber(id: string) {
  return `RZ-${id.slice(-8).toUpperCase()}`;
}

export default function ThankYouPage() {
  const params = useParams<{ id: string }>();
  const searchString = useSearch();
  const search = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const sessionId = search.get("session_id");
  const checkoutStatus = search.get("status");
  const confirmedSessionRef = useRef<string | null>(null);
  const confirmCheckoutSession = useAction(api.stripe.confirmCheckoutSession);
  const order = useQuery(
    api.orders.orderById,
    params.id ? { id: params.id as never } : "skip",
  );
  const [confirming, setConfirming] = useState(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);

  const verifyReturnedPayment = async () => {
    if (!params.id || !sessionId || order?.orderStatus === "paid") {
      return;
    }

    try {
      setConfirming(true);
      setConfirmationError(null);
      const result = await confirmCheckoutSession({
        orderId: params.id as never,
        sessionId,
      });

      if (result.status === "paid") {
        toast.success("Payment confirmed");
        return;
      }

      if (result.status === "awaiting_payment") {
        setConfirmationError("Stripe has not confirmed this payment yet.");
        return;
      }

      if (result.status === "configuration_required") {
        throw new Error("Stripe is not fully configured on the server.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not confirm payment.";
      setConfirmationError(message);
      toast.error(message);
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    if (
      !sessionId ||
      checkoutStatus !== "success" ||
      order === undefined ||
      order?.orderStatus === "paid" ||
      confirmedSessionRef.current === sessionId
    ) {
      return;
    }

    confirmedSessionRef.current = sessionId;
    void verifyReturnedPayment();
  }, [checkoutStatus, order, sessionId]);

  if (order === undefined) {
    return (
      <div className="container py-12">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 h-56 rounded-3xl skeleton" />
          <div className="grid gap-5 md:grid-cols-2">
            <div className="h-72 rounded-3xl skeleton" />
            <div className="h-72 rounded-3xl skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-3xl font-black text-foreground">Order not found</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted-foreground">
          We could not find this order. If you paid, contact support with your
          Stripe payment details.
        </p>
        <Link href="/">
          <Button className="mt-6 gap-2">
            <Home className="h-4 w-4" />
            Back to store
          </Button>
        </Link>
      </div>
    );
  }

  const isPaid = order.orderStatus === "paid";

  return (
    <div className="min-h-screen bg-gradient-to-b from-foreground via-foreground/95 to-background pb-12">
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(244,86,165,0.35),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(164,255,62,0.16),_transparent_34%)]" />
        <div className="container relative py-12 md:py-16">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_0.72fr] lg:items-center">
            <div>
              <div className="mb-6 flex items-center gap-4">
                <img
                  src={brawlStarsLogo}
                  alt="Razlo Store"
                  className="h-20 w-20 object-contain drop-shadow-2xl"
                />
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-accent">
                    Razlo Store
                  </p>
                  <p className="text-sm text-white/70">
                    Order {String(order._id).slice(-8)}
                  </p>
                </div>
              </div>

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur-sm">
                {isPaid ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                    Payment went through
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-accent" />
                    Confirming payment
                  </>
                )}
              </div>

              <h1 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                Thanks for buying from Razlo Store.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/76 md:text-lg">
                {isPaid
                  ? "Your order is confirmed. The receipt was sent to your email, and your product details are unlocked below."
                  : "We are checking Stripe now. Keep this page open for a moment while the payment confirmation reaches the store."}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`/receipt/${order._id}`}>
                  <Button
                    size="lg"
                    className="gap-2 bg-accent font-bold text-accent-foreground hover:bg-accent/90"
                    disabled={!isPaid}
                  >
                    <ReceiptText className="h-5 w-5" />
                    View receipt
                  </Button>
                </Link>
                <Link href="/">
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                  >
                    Continue shopping
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur-md">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-white/60">Total paid</p>
                  <p className="text-3xl font-black">
                    ₪{Number(order.subtotal).toFixed(2)}
                  </p>
                </div>
                <PackageCheck className="h-10 w-10 text-accent" />
              </div>

              <div className="space-y-3">
                {order.items.slice(0, 3).map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 p-3"
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <PackageCheck className="h-7 w-7 text-white/40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{item.name}</p>
                      <p className="text-sm text-white/62">
                        {item.quantity} x ₪{Number(item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container -mt-4">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_0.42fr]">
          <section className="rounded-3xl border border-border bg-card p-5 shadow-xl shadow-black/5 md:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-accent/10 p-3 text-accent">
                <PackageCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-foreground">
                  Your order
                </h2>
                <p className="text-sm text-muted-foreground">
                  Receipt {receiptNumber(String(order._id))}
                </p>
              </div>
            </div>

            {!isPaid ? (
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 text-sm leading-7 text-blue-900">
                {confirmationError ? confirmationError : "Confirming payment with Stripe..."}
                {confirmationError ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 gap-2"
                    disabled={confirming}
                    onClick={() => void verifyReturnedPayment()}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Check again
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                {order.items.map((item) => (
                  <article
                    key={item.productId}
                    className="overflow-hidden rounded-2xl border border-border bg-background"
                  >
                    <div className="grid gap-4 p-4 sm:grid-cols-[120px_1fr]">
                      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-muted">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-contain p-3"
                          />
                        ) : (
                          <PackageCheck className="h-10 w-10 text-muted-foreground/30" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-black text-foreground">
                              {item.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} x ₪{Number(item.price).toFixed(2)}
                            </p>
                          </div>
                          <p className="text-xl font-black text-foreground">
                            ₪{(Number(item.price) * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        <div className="rounded-xl border border-dashed border-accent/30 bg-accent/5 p-4 text-sm leading-7 text-foreground">
                          {item.deliveryContent ? (
                            <pre className="whitespace-pre-wrap font-sans">
                              {item.deliveryContent}
                            </pre>
                          ) : (
                            <span className="text-muted-foreground">
                              Delivery details were not added for this product yet.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <Mail className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-black text-foreground">
                  Email receipt
                </h2>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                We send the styled receipt to{" "}
                <span className="font-bold text-foreground">
                  {order.customerEmail}
                </span>
                .
              </p>
              {order.receiptEmailSentAt ? (
                <p className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-700">
                  Email sent
                </p>
              ) : (
                <p className="mt-3 rounded-xl bg-accent/10 px-3 py-2 text-sm font-semibold text-accent">
                  Email is being prepared
                </p>
              )}
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-black text-foreground">
                  Payment protected
                </h2>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                Product details only unlock after Stripe confirms the paid
                session with the server.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
