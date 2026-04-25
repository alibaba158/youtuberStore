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
    <div className="min-h-screen bg-muted/20">
      <div className="container py-8 md:py-10">
        <div className="mx-auto mb-6 flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link href="/">
            <span className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Continue shopping
            </span>
          </Link>
          <div className="rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
            {isPaid ? "Payment approved" : "Confirming payment"}
          </div>
        </div>

        <section className="mx-auto mb-6 max-w-6xl rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-center">
            <div>
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-accent/20 bg-accent/5 p-2">
                  <img
                    src={brawlStarsLogo}
                    alt="Razlo Store"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-accent">
                    Razlo Store
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Order {String(order._id).slice(-8)}
                  </p>
                </div>
              </div>

              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-700">
                {isPaid ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Payment went through
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Confirming payment
                  </>
                )}
              </div>

              <h1 className="max-w-3xl text-3xl font-black leading-tight text-foreground md:text-5xl">
                Thanks for buying from Razlo Store.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                {isPaid
                  ? "Your order is confirmed. The receipt was sent to your email, and your product details are unlocked below."
                  : "We are checking Stripe now. Keep this page open for a moment while the payment confirmation reaches the store."}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link href={`/receipt/${order._id}`}>
                  <Button size="lg" className="gap-2 font-bold" disabled={!isPaid}>
                    <ReceiptText className="h-5 w-5" />
                    View receipt
                  </Button>
                </Link>
                <Link href="/account">
                  <Button size="lg" variant="outline" className="gap-2">
                    My account
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-accent/25 bg-accent/5 p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total paid</p>
                  <p className="text-3xl font-black text-foreground">
                    ₪{Number(order.subtotal).toFixed(2)}
                  </p>
                </div>
                <div className="rounded-2xl bg-accent/10 p-3 text-accent">
                  <PackageCheck className="h-8 w-8" />
                </div>
              </div>

              <div className="space-y-3">
                {order.items.slice(0, 3).map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3"
                  >
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <PackageCheck className="h-7 w-7 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-foreground">
                        {item.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x ₪{Number(item.price).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

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
