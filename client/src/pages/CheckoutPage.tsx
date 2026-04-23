import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useAction, useQuery } from "convex/react";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Package,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "../../../convex/_generated/api";

export default function CheckoutPage() {
  const params = useParams<{ id: string }>();
  const [location] = useLocation();
  const order = useQuery(
    api.orders.orderById,
    params.id ? { id: params.id as never } : "skip",
  );
  const startCheckout = useAction(api.stripe.startCheckout);
  const confirmCheckoutSession = useAction(api.stripe.confirmCheckoutSession);
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const search = useMemo(() => new URLSearchParams(location.split("?")[1] ?? ""), [location]);
  const checkoutStatus = search.get("status");
  const sessionId = search.get("session_id");

  useEffect(() => {
    if (
      !params.id ||
      !sessionId ||
      checkoutStatus !== "success" ||
      confirming ||
      order === undefined ||
      order?.orderStatus === "paid"
    ) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setConfirming(true);
        const result = await confirmCheckoutSession({
          orderId: params.id as never,
          sessionId,
        });

        if (cancelled) return;

        if (result.status === "paid" || result.status === "already_paid") {
          toast.success("התשלום אומת וההזמנה אושרה");
          return;
        }

        if (result.status === "awaiting_payment") {
          toast.message("התשלום עדיין ממתין לאישור Stripe");
          return;
        }

        if (result.status === "configuration_required") {
          toast.error("Stripe עדיין לא מוגדר עד הסוף בשרת");
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "לא הצלחנו לאמת את התשלום מול Stripe",
          );
        }
      } finally {
        if (!cancelled) {
          setConfirming(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [checkoutStatus, confirmCheckoutSession, confirming, order, params.id, sessionId]);

  const handlePay = async () => {
    if (!params.id) {
      return;
    }

    try {
      setSubmitting(true);
      const result = await startCheckout({
        orderId: params.id as never,
      });

      if (result.status === "already_paid") {
        toast.success("ההזמנה כבר שולמה");
        return;
      }

      if (result.status === "configuration_required") {
        toast.error(result.message);
        return;
      }

      window.location.href = result.url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "לא הצלחנו להתחיל את התשלום",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (order === undefined) {
    return (
      <div className="container py-12">
        <div className="mb-4 h-4 w-40 rounded skeleton" />
        <div className="mb-6 h-10 w-64 rounded skeleton" />
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="h-96 rounded-2xl skeleton" />
          <div className="h-96 rounded-2xl skeleton" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container py-20 text-center">
        <h2 className="mb-3 text-2xl font-bold text-foreground">
          ההזמנה לא נמצאה
        </h2>
        <Link href="/cart">
          <span className="cursor-pointer text-accent hover:underline">
            חזרה לעגלה
          </span>
        </Link>
      </div>
    );
  }

  const isPaid = order.orderStatus === "paid";

  return (
    <div className="min-h-screen">
      <div className="container py-8">
        <Link href="/cart">
          <span className="mb-8 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowRight className="h-4 w-4" />
            חזרה לעגלה
          </span>
        </Link>

        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-foreground">תשלום</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              מספר הזמנה: {order._id}
            </p>
          </div>
          <div className="rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent">
            {isPaid ? "שולם" : "ממתין לתשלום"}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-accent" />
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  פרטי התשלום
                </h2>
                <p className="text-sm text-muted-foreground">
                  כרגע התשלום מתבצע דרך Stripe Checkout
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-accent/30 bg-accent/5 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-accent" />
                <div className="space-y-2 text-sm text-foreground">
                  <p className="font-semibold">
                    ההזמנה משתחררת רק אחרי אישור תשלום מ-Stripe.
                  </p>
                  <p className="text-muted-foreground">
                    גם אם הלקוח חוזר לדף הזה, המוצרים ייפתחו רק אחרי ש-Stripe
                    שולח אישור תשלום חתום לשרת.
                  </p>
                </div>
              </div>
            </div>

            {!order.paymentConfigured ? (
              <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-900">
                Stripe is not fully configured yet. Add `STRIPE_SECRET_KEY`,
                `STRIPE_WEBHOOK_SECRET` and `APP_URL` on the server before enabling
                checkout.
              </div>
            ) : null}

            {checkoutStatus === "success" && !isPaid ? (
              <div className="mb-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5 text-sm text-blue-900">
                חזרת מ-Stripe. אנחנו מאמתים עכשיו את התשלום מול Stripe ומעדכנים את ההזמנה.
              </div>
            ) : null}

            {checkoutStatus === "cancelled" ? (
              <div className="mb-6 rounded-2xl border border-border bg-background p-5 text-sm text-muted-foreground">
                התשלום בוטל. אפשר לנסות שוב מתי שתרצה.
              </div>
            ) : null}

            {isPaid ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700">
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-5 w-5" />
                    התשלום אושר
                  </div>
                  <p className="mt-2 text-sm">
                    התוכן של המוצרים נפתח לך למטה.
                  </p>
                </div>

                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div
                      key={item.productId}
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <div className="mb-2 flex items-center justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {item.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity} x ₪{Number(item.price).toFixed(2)}
                          </p>
                        </div>
                        <span className="font-bold text-foreground">
                          ₪{(Number(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <div className="rounded-xl border border-dashed border-border p-4 text-sm leading-7 text-foreground">
                        {item.deliveryContent ? (
                          <pre className="whitespace-pre-wrap font-sans">
                            {item.deliveryContent}
                          </pre>
                        ) : (
                          <span className="text-muted-foreground">
                            עדיין לא הוגדר תוכן מסירה למוצר הזה.
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl border border-border bg-background p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="rounded-xl bg-accent/10 p-3 text-accent">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">Stripe</h3>
                      <p className="text-sm text-muted-foreground">
                        כרטיס אשראי ותשלום מאובטח דרך Stripe Checkout
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">
                    בלחיצה על הכפתור תועבר לעמוד התשלום של Stripe להשלמת ההזמנה.
                  </p>
                </div>

                <Button
                  type="button"
                  size="lg"
                  className="w-full gap-2 text-base font-semibold"
                  disabled={submitting || confirming}
                  onClick={() => void handlePay()}
                >
                  <ExternalLink className="h-5 w-5" />
                  {submitting ? "מעביר לתשלום..." : confirming ? "מאמת תשלום..." : "המשך לתשלום ב-Stripe"}
                </Button>
              </div>
            )}
          </section>

          <aside className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <Package className="h-5 w-5 text-accent" />
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  סיכום הזמנה
                </h2>
                <p className="text-sm text-muted-foreground">
                  {order.items.length} מוצרים
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-background p-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x ₪{Number(item.price).toFixed(2)}
                    </p>
                  </div>
                  <span className="shrink-0 font-bold text-foreground">
                    ₪{(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-5">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-foreground">
                  סה"כ לתשלום
                </span>
                <span className="text-2xl font-black text-foreground">
                  ₪{Number(order.subtotal).toFixed(2)}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                המסירה תיפתח רק אחרי אישור תשלום מלא מ-Stripe.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
