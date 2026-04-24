import { Link } from "wouter";
import {
  ArrowRight,
  Calendar,
  ExternalLink,
  LogOut,
  Mail,
  ReceiptText,
  Shield,
  Trash2,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "../../../convex/_generated/api";

function statusLabel(status: string) {
  switch (status) {
    case "paid":
      return "שולם";
    case "awaiting_payment":
      return "ממתין לתשלום";
    case "failed":
      return "נכשל";
    case "canceled":
      return "בוטל";
    default:
      return status;
  }
}

function paymentLabel(status: string) {
  switch (status) {
    case "paid":
      return "מאושר";
    case "pending":
      return "ממתין";
    case "configuration_required":
      return "דורש חיבור";
    case "redirect_required":
      return "דורש המשך";
    case "failed":
      return "נכשל";
    case "expired":
      return "פג תוקף";
    case "canceled":
      return "בוטל";
    default:
      return status;
  }
}

export default function AccountPage() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const myOrders = useQuery(api.orders.myOrders, user ? {} : "skip");
  const cancelMyOrder = useMutation(api.orders.cancelMyOrder);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);

  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancelingOrderId(orderId);
      await cancelMyOrder({ orderId: orderId as never });
      toast.success("ההזמנה הוסרה מהרשימה");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "לא הצלחנו לבטל את ההזמנה",
      );
    } finally {
      setCancelingOrderId(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="container py-12">
        <div className="mb-8 h-8 w-48 rounded skeleton" />
        <div className="h-64 rounded-xl skeleton" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <h2 className="mb-3 text-2xl font-black text-foreground">
          נדרשת כניסה לחשבון
        </h2>
        <p className="mb-6 text-muted-foreground">
          כדי לצפות בהגדרות, הזמנות וקבלות צריך להתחבר קודם.
        </p>
        <Link href="/">
          <Button className="gap-2">
            <ArrowRight className="h-4 w-4" />
            חזרה לדף הבית
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container py-8">
        <Link href="/">
          <span className="mb-8 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowRight className="h-4 w-4" />
            חזרה לחנות
          </span>
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-black text-foreground md:text-3xl">
            החשבון שלי
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            ניהול פרופיל, הזמנות, תשלום וקבלות במקום אחד.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 lg:col-span-1"
          >
            <Card className="p-6">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                  <User className="h-8 w-8 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-foreground">{user.name}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge className="border-border bg-muted text-foreground">
                      לקוח
                    </Badge>
                    {user.role === "admin" ? (
                      <Badge className="border-accent/30 bg-accent/20 text-accent">
                        מנהל
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="mb-6 space-y-3">
                {user.email ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    נרשם בתאריך {new Date(user.createdAt).toLocaleDateString("he-IL")}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2 text-destructive hover:text-destructive"
                onClick={() => void logout()}
              >
                <LogOut className="h-4 w-4" />
                התנתקות
              </Button>
            </Card>

            {user.role === "admin" ? (
              <Link href="/admin">
                <Button className="w-full gap-2">
                  <Shield className="h-4 w-4" />
                  מעבר לפאנל ניהול
                </Button>
              </Link>
            ) : null}
          </motion.div>

          <div className="space-y-6 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="mb-6 flex items-center gap-2">
                  <ReceiptText className="h-5 w-5 text-accent" />
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      הזמנות וקבלות
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      כל ההזמנות האחרונות שלך במקום אחד
                    </p>
                  </div>
                </div>

                {myOrders === undefined ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-24 rounded-2xl skeleton" />
                    ))}
                  </div>
                ) : myOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    עדיין לא נוצרו הזמנות בחשבון הזה.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myOrders.map((order) => (
                      <div
                        key={order._id}
                        className="rounded-2xl border border-border bg-background p-4"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground">
                              הזמנה #{String(order._id).slice(-6).toUpperCase()}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              נוצרה בתאריך{" "}
                              {new Date(order.createdAt).toLocaleString("he-IL")}
                            </p>
                            <p className="mt-2 text-sm text-muted-foreground">
                              {order.items.length} פריטים · ₪
                              {Number(order.subtotal).toFixed(2)}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="border-border bg-muted text-foreground">
                              {statusLabel(order.orderStatus)}
                            </Badge>
                            <Badge className="border-accent/20 bg-accent/10 text-accent">
                              תשלום: {paymentLabel(order.paymentStatus)}
                            </Badge>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link href={`/checkout/${order._id}`}>
                            <Button size="sm" variant="outline" className="gap-2">
                              פתיחת הזמנה
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          {order.orderStatus === "paid" ? (
                            <Link href={`/receipt/${order._id}`}>
                              <Button size="sm" className="gap-2">
                                צפייה בקבלה
                                <ReceiptText className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          ) : null}
                          {order.orderStatus !== "paid" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 text-destructive hover:text-destructive"
                              disabled={cancelingOrderId === order._id}
                              onClick={() => void handleCancelOrder(order._id)}
                            >
                              {cancelingOrderId === order._id
                                ? "מבטל..."
                                : "ביטול הזמנה"}
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
