import { useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, Mail, ReceiptText, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { api } from "../../../convex/_generated/api";

function formatPrice(value: string | number) {
  return `₪${Number(value).toFixed(2)}`;
}

export default function AdminOrderFulfillmentPage() {
  const { user, loading } = useAuth();
  const params = useParams<{ id: string }>();
  const order = useQuery(
    api.orders.adminOrderById,
    user?.role === "admin" && params.id ? { orderId: params.id as never } : "skip",
  );
  const saveAdminFulfillment = useMutation(api.orders.saveAdminFulfillment);
  const sendCustomerDeliveryEmail = useMutation(api.orders.sendCustomerDeliveryEmail);

  const initialDrafts = useMemo(
    () =>
      Object.fromEntries(
        (order?.items ?? []).map((item) => [item.productId, item.deliveryContent ?? ""]),
      ),
    [order],
  );
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const effectiveDrafts = Object.keys(drafts).length > 0 ? drafts : initialDrafts;

  const handleChange = (productId: string, value: string) => {
    setDrafts((current) => ({
      ...(Object.keys(current).length > 0 ? current : initialDrafts),
      [productId]: value,
    }));
  };

  const buildPayload = () =>
    order?.items.map((item) => ({
      productId: item.productId,
      content: effectiveDrafts[item.productId] ?? "",
    })) ?? [];

  const handleSave = async () => {
    if (!order) return;
    await saveAdminFulfillment({
      orderId: order._id as never,
      items: buildPayload() as never,
    });
    toast.success("פרטי הלקוח נשמרו");
    setDrafts({});
  };

  const handleSend = async () => {
    if (!order) return;
    await sendCustomerDeliveryEmail({
      orderId: order._id as never,
      items: buildPayload() as never,
    });
    toast.success("המייל ללקוח נשלח");
    setDrafts({});
  };

  if (loading) {
    return <div className="container py-12"><div className="h-64 rounded-2xl skeleton" /></div>;
  }

  if (user?.role !== "admin") {
    return (
      <div className="container py-20 text-center">
        <ReceiptText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <h1 className="text-2xl font-black">אין גישה לעמוד המילוי</h1>
      </div>
    );
  }

  if (order === undefined) {
    return <div className="container py-12"><div className="h-64 rounded-2xl skeleton" /></div>;
  }

  if (!order) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-black">הזמנה לא נמצאה</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20" dir="rtl">
      <div className="container py-8">
        <Link href="/admin/orders">
          <span className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-4 w-4" />
            חזרה לרכישות
          </span>
        </Link>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-black">מילוי ושליחת פרטי לקוח</h1>
            <p className="mt-2 text-sm text-muted-foreground">הזמנה: {order._id}</p>
            <a href={`mailto:${order.customerEmail}`} className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline" dir="ltr">
              <Mail className="h-4 w-4" />
              {order.customerEmail}
            </a>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="gap-2" onClick={() => void handleSave()}>
              <Save className="h-4 w-4" />
              שמור
            </Button>
            <Button type="button" className="gap-2" onClick={() => void handleSend()}>
              <Send className="h-4 w-4" />
              שמור ושלח ללקוח
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {order.items.map((item) => (
            <section key={item.productId} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-foreground">{item.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    כמות {item.quantity} · {formatPrice(item.price)}
                  </p>
                </div>
              </div>
              <Textarea
                rows={8}
                value={effectiveDrafts[item.productId] ?? ""}
                onChange={(event) => handleChange(item.productId, event.target.value)}
                placeholder="כאן ממלאים את פרטי החשבון / קוד / הוראות שהלקוח צריך לקבל"
                className="text-right"
              />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
