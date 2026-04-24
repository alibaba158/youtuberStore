import { Link, useParams } from "wouter";
import { ArrowRight, CheckCircle2, Printer, ReceiptText } from "lucide-react";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { api } from "../../../convex/_generated/api";

function receiptNumber(id: string) {
  return `RZ-${id.slice(-8).toUpperCase()}`;
}

function paymentMethodLabel(method: string) {
  if (method === "stripe") {
    return "Stripe - כרטיס / Google Pay / Apple Pay";
  }
  if (method === "bit") {
    return "Bit";
  }
  return method;
}

export default function ReceiptPage() {
  const params = useParams<{ id: string }>();
  const order = useQuery(
    api.orders.orderById,
    params.id ? { id: params.id as never } : "skip",
  );

  if (order === undefined) {
    return (
      <div className="container py-12">
        <div className="mb-4 h-4 w-40 rounded skeleton" />
        <div className="h-[520px] rounded-3xl skeleton" />
      </div>
    );
  }

  if (!order || order.orderStatus !== "paid") {
    return (
      <div className="container py-20 text-center">
        <h2 className="mb-3 text-2xl font-bold text-foreground">
          לא נמצאה קבלה זמינה
        </h2>
        <p className="mb-6 text-muted-foreground">
          קבלה זמינה רק להזמנה ששולמה בהצלחה.
        </p>
        <Link href="/account">
          <Button>חזרה לחשבון</Button>
        </Link>
      </div>
    );
  }

  const transactionId =
    order.paymentMethod === "stripe"
      ? order.stripePaymentIntentId ?? order.stripeCheckoutSessionId
      : order.bitPaymentId;

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container py-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link href="/account">
            <span className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowRight className="h-4 w-4" />
              חזרה לחשבון
            </span>
          </Link>
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            הדפסת קבלה
          </Button>
        </div>

        <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-white p-8 shadow-sm print:shadow-none">
          <div className="mb-8 flex flex-col gap-6 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                התשלום אושר
              </div>
              <h1 className="text-3xl font-black text-foreground">קבלה</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Razlo Store · אישור הזמנה ותשלום
              </p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground md:text-right">
              <p>
                <span className="font-semibold text-foreground">מספר קבלה:</span>{" "}
                {receiptNumber(String(order._id))}
              </p>
              <p>
                <span className="font-semibold text-foreground">מספר הזמנה:</span>{" "}
                {String(order._id)}
              </p>
              <p>
                <span className="font-semibold text-foreground">תאריך תשלום:</span>{" "}
                {order.paidAt
                  ? new Date(order.paidAt).toLocaleString("he-IL")
                  : "-"}
              </p>
            </div>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted/20 p-5">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                פרטי לקוח
              </h2>
              <p className="font-semibold text-foreground">{order.customerName}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {order.customerEmail}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-muted/20 p-5">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                פרטי תשלום
              </h2>
              <p className="text-sm text-muted-foreground">
                אמצעי תשלום:{" "}
                <span className="font-semibold text-foreground">
                  {paymentMethodLabel(order.paymentMethod)}
                </span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                סטטוס: <span className="font-semibold text-foreground">שולם</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                מזהה עסקה:{" "}
                <span className="font-semibold text-foreground">
                  {transactionId ?? "לא זמין"}
                </span>
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border bg-muted/20 px-5 py-4 text-sm font-bold text-foreground">
              <div>פריט</div>
              <div>כמות</div>
              <div>סה"כ</div>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div
                  key={item.productId}
                  className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-4 text-sm"
                >
                  <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="mt-1 text-muted-foreground">
                      ₪{Number(item.price).toFixed(2)} ליחידה
                    </p>
                  </div>
                  <div className="font-semibold text-foreground">
                    {item.quantity}
                  </div>
                  <div className="font-semibold text-foreground">
                    ₪{(Number(item.price) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl rounded-2xl border border-accent/20 bg-accent/5 p-4 text-sm leading-7 text-muted-foreground">
              זוהי קבלה פנימית של האתר עבור ההזמנה שבוצעה. אם תרצה, אפשר מחר
              להפוך את זה גם למסמך יותר עסקי עם פרטי עסק, מספרים מסודרים וייצוא
              PDF.
            </div>

            <div className="min-w-[220px] rounded-2xl border border-foreground/10 bg-foreground px-5 py-4 text-white">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/70">
                <ReceiptText className="h-4 w-4" />
                סה"כ ששולם
              </div>
              <div className="text-3xl font-black">
                ₪{Number(order.subtotal).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
