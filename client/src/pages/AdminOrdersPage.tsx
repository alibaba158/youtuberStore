import { Link } from "wouter";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Mail,
  Package,
  ReceiptText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { api } from "../../../convex/_generated/api";

function formatDate(value?: number) {
  if (!value) return "לא שולם עדיין";
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusLabel(status: string) {
  if (status === "paid") return "שולם";
  if (status === "awaiting_payment") return "ממתין לתשלום";
  if (status === "failed") return "נכשל";
  return status;
}

export default function AdminOrdersPage() {
  const { user, loading } = useAuth();
  const orders = useQuery(
    api.orders.adminRecentOrders,
    user?.role === "admin" ? {} : "skip",
  );

  if (loading) {
    return (
      <div className="container py-12">
        <div className="h-72 rounded-2xl skeleton" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="container py-20 text-center">
        <ReceiptText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <h1 className="text-2xl font-black">אין גישה לרכישות</h1>
        <Button asChild className="mt-6">
          <Link href="/">חזרה לחנות</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20" dir="rtl">
      <div className="container py-8">
        <Link href="/admin">
          <span className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-4 w-4" />
            חזרה לניהול
          </span>
        </Link>

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black">רכישות אחרונות</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              כאן אפשר לראות מי קנה מה, מתי, ואת האימייל שלו כדי לשלוח לו את פרטי המוצר.
            </p>
          </div>
          <div className="rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-foreground">
            {orders?.length ?? 0} הזמנות
          </div>
        </div>

        {orders === undefined ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 rounded-2xl skeleton" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
            <h2 className="text-xl font-black">אין רכישות להצגה</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              רכישות חדשות יופיעו כאן אחרי שלקוחות יצרו הזמנה.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <section
                key={order._id}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-bold">
                        {order.orderStatus === "paid" ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Clock3 className="h-3.5 w-3.5 text-amber-600" />
                        )}
                        {statusLabel(order.orderStatus)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        הזמנה: {order._id}
                      </span>
                    </div>

                    <h2 className="truncate text-lg font-black text-foreground">
                      {order.customerName || "לקוח"}
                    </h2>
                    <a
                      href={`mailto:${order.customerEmail}`}
                      className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:underline"
                      dir="ltr"
                    >
                      <Mail className="h-4 w-4" />
                      {order.customerEmail}
                    </a>

                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {order.items.map((item) => (
                        <div
                          key={`${order._id}-${item.productId}`}
                          className="rounded-xl border border-border bg-background p-3"
                        >
                          <p className="font-bold text-foreground">{item.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            כמות {item.quantity} · ₪{Number(item.price).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="shrink-0 rounded-xl border border-border bg-background p-4 text-sm lg:w-56">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">סכום</span>
                      <span className="font-black">₪{Number(order.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">נוצר</span>
                      <span className="font-semibold">{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">שולם</span>
                      <span className="font-semibold">{formatDate(order.paidAt)}</span>
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
