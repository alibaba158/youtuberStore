import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowRight, Minus, Package, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  clearGuestCart,
  getGuestCart,
  onGuestCartChange,
  removeGuestCartItem,
  updateGuestCartItem,
} from "@/lib/guestCart";
import { api } from "../../../convex/_generated/api";

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [guestCart, setGuestCart] = useState(() => getGuestCart());
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");

  const cartItems = useQuery(api.store.cartItems, isAuthenticated ? {} : "skip");
  const guestProducts = useQuery(
    api.store.productsByIds,
    !isAuthenticated && guestCart.length > 0
      ? { ids: guestCart.map((item) => item.productId) }
      : "skip",
  );
  const updateItem = useMutation(api.store.updateCartItem);
  const removeItem = useMutation(api.store.removeCartItem);
  const clearCart = useMutation(api.store.clearCart);
  const createOrderFromCart = useMutation(api.orders.createOrderFromCart);
  const createGuestOrder = useMutation(api.orders.createGuestOrder);

  useEffect(() => {
    return onGuestCartChange(() => setGuestCart(getGuestCart()));
  }, []);

  const visibleCartItems = useMemo(() => {
    if (isAuthenticated) {
      return cartItems;
    }

    if (!guestProducts) {
      return guestCart.length > 0 ? undefined : [];
    }

    return guestCart
      .map((item) => {
        const product = guestProducts.find((candidate) => candidate?._id === item.productId);
        return product
          ? {
              _id: item.productId,
              productId: item.productId,
              quantity: Math.min(item.quantity, product.stock),
              product,
            }
          : null;
      })
      .filter((item) => item !== null);
  }, [cartItems, guestCart, guestProducts, isAuthenticated]);

  if (visibleCartItems === undefined) {
    return (
      <div className="container py-12">
        <div className="mb-8 h-8 w-48 rounded skeleton" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-24 rounded-xl skeleton" />
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = visibleCartItems.length === 0;
  const subtotal = visibleCartItems.reduce((sum, item) => {
    const price = parseFloat(item.product?.price ?? "0");
    return sum + price * item.quantity;
  }, 0);

  const handleCheckout = async () => {
    try {
      setSubmittingOrder(true);
      const trimmedGuestEmail = guestEmail.trim();
      if (!isAuthenticated && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedGuestEmail)) {
        toast.error("צריך להזין אימייל תקין כדי לקבל קבלה");
        return;
      }

      const orderId = isAuthenticated
        ? await createOrderFromCart({})
        : await createGuestOrder({
            items: guestCart,
            customerEmail: trimmedGuestEmail,
          });
      setLocation(`/checkout/${orderId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "לא הצלחנו ליצור הזמנה");
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleClearCart = () => {
    if (isAuthenticated) {
      void clearCart().then(() => toast.success("העגלה רוקנה"));
      return;
    }
    clearGuestCart();
    toast.success("העגלה רוקנה");
  };

  return (
    <div className="min-h-screen">
      <div className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/">
              <span className="mb-2 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
                <ArrowRight className="h-4 w-4" />
                המשך קנייה
              </span>
            </Link>
            <h1 className="flex items-center gap-3 text-2xl font-black text-foreground md:text-3xl">
              <ShoppingCart className="h-7 w-7" />
              עגלת הקניות
              {!isEmpty ? (
                <span className="text-lg font-medium text-muted-foreground">
                  ({visibleCartItems.length} פריטים)
                </span>
              ) : null}
            </h1>
          </div>
          {!isEmpty ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={handleClearCart}
            >
              <Trash2 className="h-4 w-4" />
              נקה עגלה
            </Button>
          ) : null}
        </div>

        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 text-center"
          >
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
              <Package className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-foreground">העגלה ריקה</h3>
            <p className="mb-8 text-muted-foreground">עדיין לא הוספת מוצרים לעגלה</p>
            <Link href="/">
              <Button size="lg" className="gap-2">
                <ShoppingCart className="h-4 w-4" />
                לקנייה עכשיו
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              <AnimatePresence mode="popLayout">
                {visibleCartItems.map((item) => {
                  const price = parseFloat(item.product?.price ?? "0");
                  return (
                    <motion.div
                      key={item._id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex gap-4 rounded-xl border border-border bg-card p-4"
                    >
                      <Link href={`/product/${item.productId}`}>
                        <div className="h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-lg bg-muted">
                          {item.product?.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-8 w-8 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                      </Link>

                      <div className="min-w-0 flex-1">
                        <Link href={`/product/${item.productId}`}>
                          <h3 className="line-clamp-2 cursor-pointer text-sm font-semibold leading-snug text-foreground transition-colors hover:text-accent/80">
                            {item.product?.name}
                          </h3>
                        </Link>
                        <p className="mt-1 text-sm font-bold text-foreground">
                          ₪{price.toFixed(2)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          סה"כ: ₪{(price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end justify-between">
                        <button
                          onClick={() => {
                            if (isAuthenticated) {
                              void removeItem({ productId: item.productId }).then(() =>
                                toast.success("המוצר הוסר מהעגלה"),
                              );
                            } else {
                              removeGuestCartItem(item.productId);
                              toast.success("המוצר הוסר מהעגלה");
                            }
                          }}
                          className="p-1 text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="flex items-center gap-1.5 overflow-hidden rounded-lg border border-border">
                          <button
                            onClick={() => {
                              if (isAuthenticated) {
                                void updateItem({
                                  productId: item.productId,
                                  quantity: item.quantity - 1,
                                });
                              } else {
                                updateGuestCartItem(
                                  item.productId,
                                  item.quantity - 1,
                                  item.product?.stock ?? 0,
                                );
                              }
                            }}
                            className="flex h-7 w-7 items-center justify-center transition-colors hover:bg-muted"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              if (isAuthenticated) {
                                void updateItem({
                                  productId: item.productId,
                                  quantity: item.quantity + 1,
                                });
                              } else {
                                updateGuestCartItem(
                                  item.productId,
                                  item.quantity + 1,
                                  item.product?.stock ?? 0,
                                );
                              }
                            }}
                            className="flex h-7 w-7 items-center justify-center transition-colors hover:bg-muted"
                            disabled={item.quantity >= (item.product?.stock ?? 0)}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-border bg-card p-6">
                <h2 className="mb-5 text-lg font-bold text-foreground">סיכום הזמנה</h2>
                <div className="space-y-3">
                  {visibleCartItems.map((item) => {
                    const price = parseFloat(item.product?.price ?? "0");
                    return (
                      <div key={item._id} className="flex justify-between text-sm">
                        <span className="ml-2 line-clamp-1 flex-1 text-muted-foreground">
                          {item.product?.name} x {item.quantity}
                        </span>
                        <span className="shrink-0 font-medium">
                          ₪{(price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <Separator className="my-4" />
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-lg font-bold text-foreground">סה"כ</span>
                  <span className="text-xl font-black text-foreground">
                    ₪{subtotal.toFixed(2)}
                  </span>
                </div>
                {!isAuthenticated ? (
                  <div className="mb-4 space-y-1.5">
                    <label className="block text-right text-sm font-bold text-foreground">
                      אימייל לקבלה
                    </label>
                    <Input
                      dir="ltr"
                      type="email"
                      value={guestEmail}
                      onChange={(event) => setGuestEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    <p className="text-right text-xs text-muted-foreground">
                      נשלח את האימייל הזה ל-Stripe כדי לשלוח קבלה אחרי תשלום מוצלח.
                    </p>
                  </div>
                ) : null}
                <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-right text-xs font-bold leading-6 text-amber-900">
                  אין החזר כספי על מוצרים דיגיטליים לאחר רכישה. יש לוודא את פרטי ההזמנה לפני התשלום.
                </div>
                <Button
                  size="lg"
                  className="w-full gap-2 text-base font-semibold"
                  disabled={submittingOrder}
                  onClick={() => void handleCheckout()}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {submittingOrder ? "טוען..." : "לתשלום"}
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  סדר התשלום ננעל להזמנה אחת מדויקת לפני מסירה
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
