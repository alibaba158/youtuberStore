import { Link } from "wouter";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: cartItems, isLoading } = trpc.cart.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updateItem = trpc.cart.update.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
    onError: (err) => toast.error(err.message || "שגיאה בעדכון"),
  });

  const removeItem = trpc.cart.remove.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success("המוצר הוסר מהעגלה");
    },
    onError: () => toast.error("שגיאה בהסרה"),
  });

  const clearCart = trpc.cart.clear.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success("העגלה רוקנה");
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-5">
          <LogIn className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <h2 className="text-2xl font-black text-foreground mb-3">נדרשת כניסה לחשבון</h2>
        <p className="text-muted-foreground mb-6">כדי לצפות בעגלת הקניות שלך, יש להתחבר תחילה.</p>
        <Button
          size="lg"
          className="gap-2"
          onClick={() => (window.location.href = getLoginUrl())}
        >
          <LogIn className="w-4 h-4" />
          כניסה לחשבון
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="h-8 skeleton rounded w-48 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 skeleton rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = !cartItems || cartItems.length === 0;

  const subtotal = cartItems?.reduce((sum, item) => {
    const price = parseFloat(item.product?.price ?? "0");
    return sum + price * item.quantity;
  }, 0) ?? 0;

  return (
    <div className="min-h-screen">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/">
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-2">
                <ArrowRight className="w-4 h-4" />
                המשך קנייה
              </span>
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-foreground flex items-center gap-3">
              <ShoppingCart className="w-7 h-7" />
              עגלת הקניות
              {!isEmpty && (
                <span className="text-lg font-medium text-muted-foreground">
                  ({cartItems!.length} פריטים)
                </span>
              )}
            </h1>
          </div>
          {!isEmpty && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive gap-1.5"
              onClick={() => clearCart.mutate()}
              disabled={clearCart.isPending}
            >
              <Trash2 className="w-4 h-4" />
              נקה עגלה
            </Button>
          )}
        </div>

        {isEmpty ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-20 text-center"
          >
            <div className="w-24 h-24 rounded-full bg-muted mx-auto flex items-center justify-center mb-6">
              <Package className="w-12 h-12 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">העגלה ריקה</h3>
            <p className="text-muted-foreground mb-8">עדיין לא הוספת מוצרים לעגלה</p>
            <Link href="/">
              <Button size="lg" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                לקנייה עכשיו
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3">
              <AnimatePresence mode="popLayout">
                {cartItems!.map((item) => {
                  const price = parseFloat(item.product?.price ?? "0");
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="bg-card rounded-xl border border-border p-4 flex gap-4"
                    >
                      {/* Image */}
                      <Link href={`/product/${item.productId}`}>
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0 cursor-pointer">
                          {item.product?.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`/product/${item.productId}`}>
                          <h3 className="font-semibold text-foreground text-sm leading-snug hover:text-accent transition-colors cursor-pointer line-clamp-2">
                            {item.product?.name}
                          </h3>
                        </Link>
                        <p className="text-sm font-bold text-foreground mt-1">
                          ₪{price.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          סה"כ: ₪{(price * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      {/* Quantity & Remove */}
                      <div className="flex flex-col items-end justify-between shrink-0">
                        <button
                          onClick={() => removeItem.mutate({ productId: item.productId })}
                          className="text-muted-foreground hover:text-destructive transition-colors p-1"
                          disabled={removeItem.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1.5 border border-border rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateItem.mutate({ productId: item.productId, quantity: item.quantity - 1 })}
                            className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors"
                            disabled={updateItem.isPending}
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateItem.mutate({ productId: item.productId, quantity: item.quantity + 1 })}
                            className="w-7 h-7 flex items-center justify-center hover:bg-muted transition-colors"
                            disabled={updateItem.isPending || item.quantity >= (item.product?.stock ?? 0)}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
                <h2 className="text-lg font-bold text-foreground mb-5">סיכום הזמנה</h2>
                <div className="space-y-3">
                  {cartItems!.map((item) => {
                    const price = parseFloat(item.product?.price ?? "0");
                    return (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground line-clamp-1 flex-1 ml-2">
                          {item.product?.name} × {item.quantity}
                        </span>
                        <span className="font-medium shrink-0">₪{(price * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-foreground text-lg">סה"כ</span>
                  <span className="font-black text-foreground text-xl">₪{subtotal.toFixed(2)}</span>
                </div>
                <Button size="lg" className="w-full font-semibold text-base gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  לתשלום
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  משלוח מהיר לכל הארץ
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
