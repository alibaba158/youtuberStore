import { useState } from "react";
import { useParams, Link } from "wouter";
import { ArrowRight, ShoppingCart, Package, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { addGuestCartItem } from "@/lib/guestCart";
import { api } from "../../../convex/_generated/api";

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <span className="stock-out rounded-full px-3 py-1 text-sm font-medium">אזל המלאי</span>;
  }
  if (stock <= 5) {
    return <span className="stock-low rounded-full px-3 py-1 text-sm font-medium">נותרו {stock} יחידות בלבד</span>;
  }
  return <span className="stock-in rounded-full px-3 py-1 text-sm font-medium">במלאי</span>;
}

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const { isAuthenticated } = useAuth();
  const product = useQuery(api.store.productById, params.id ? { id: params.id as never } : "skip");
  const addToCart = useMutation(api.store.addToCart);

  const handleAddToCart = async () => {
    if (!product || product.stock === 0) {
      return;
    }

    try {
      if (isAuthenticated) {
        await addToCart({ productId: product._id, quantity });
      } else {
        addGuestCartItem(product._id, quantity, product.stock);
      }
      toast.success(`${product.name} נוסף לעגלה`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "שגיאה בהוספה לעגלה");
    }
  };

  if (product === undefined) {
    return (
      <div className="container py-12">
        <div className="mb-8 h-4 w-48 rounded skeleton" />
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
          <div className="aspect-square rounded-2xl skeleton" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded skeleton" />
            <div className="h-4 w-full rounded skeleton" />
            <div className="h-4 w-2/3 rounded skeleton" />
            <div className="mt-6 h-10 w-32 rounded skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <h2 className="mb-3 text-2xl font-bold text-foreground">המוצר לא נמצא</h2>
        <Link href="/">
          <span className="cursor-pointer text-accent hover:underline">חזרה לדף הבית</span>
        </Link>
      </div>
    );
  }

  const price = parseFloat(product.price);

  return (
    <div className="min-h-screen">
      <div className="container py-8">
        <Link href="/">
          <span className="mb-8 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowRight className="h-4 w-4" />
            חזרה לחנות
          </span>
        </Link>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
              {product.imageUrl ? (
                <div className="flex h-full w-full items-center justify-center p-4">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-20 w-20 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <h1 className="text-2xl font-black leading-tight text-foreground md:text-3xl">
                {product.name}
              </h1>
              {product.isFeatured ? (
                <span className="shrink-0 rounded-full border border-accent/30 bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                  מומלץ
                </span>
              ) : null}
            </div>

            <div className="mb-4">
              <StockBadge stock={product.stock} />
            </div>

            {product.description ? (
              <p className="mb-6 leading-relaxed text-muted-foreground">{product.description}</p>
            ) : null}

            <div className="mt-auto">
              <p className="mb-6 text-3xl font-black text-foreground">₪{price.toFixed(2)}</p>

              {product.stock > 0 ? (
                <div className="mb-5 flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground">כמות:</span>
                  <div className="flex items-center gap-2 overflow-hidden rounded-lg border border-border">
                    <button
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                      className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-muted"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
                      className="flex h-9 w-9 items-center justify-center transition-colors hover:bg-muted"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : null}

              <Button size="lg" className="w-full gap-2 text-base font-semibold" disabled={product.stock === 0} onClick={() => void handleAddToCart()}>
                <ShoppingCart className="h-5 w-5" />
                {product.stock === 0 ? "אזל המלאי" : "הוסף לעגלה"}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
