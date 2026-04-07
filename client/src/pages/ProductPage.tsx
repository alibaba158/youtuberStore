import { useState } from "react";
import { useParams, Link } from "wouter";
import { ArrowRight, ShoppingCart, Package, Minus, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="stock-out text-sm px-3 py-1 rounded-full font-medium">אזל המלאי</span>;
  if (stock <= 5) return <span className="stock-low text-sm px-3 py-1 rounded-full font-medium">נותרו {stock} יחידות בלבד</span>;
  return <span className="stock-in text-sm px-3 py-1 rounded-full font-medium">במלאי</span>;
}

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const productId = parseInt(params.id ?? "0");
  const [quantity, setQuantity] = useState(1);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const { data: product, isLoading } = trpc.products.byId.useQuery(
    { id: productId },
    { enabled: !!productId }
  );

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success(`${product?.name} נוסף לעגלה!`);
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה בהוספה לעגלה");
    },
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (!product || product.stock === 0) return;
    addToCart.mutate({ productId: product.id, quantity });
  };

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="h-4 skeleton rounded w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square skeleton rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 skeleton rounded w-3/4" />
            <div className="h-4 skeleton rounded w-full" />
            <div className="h-4 skeleton rounded w-2/3" />
            <div className="h-10 skeleton rounded w-32 mt-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-3">המוצר לא נמצא</h2>
        <Link href="/"><span className="text-accent hover:underline cursor-pointer">חזרה לדף הבית</span></Link>
      </div>
    );
  }

  const price = parseFloat(product.price);

  return (
    <div className="min-h-screen">
      <div className="container py-8">
        {/* Breadcrumb */}
        <Link href="/">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-8">
            <ArrowRight className="w-4 h-4" />
            חזרה לחנות
          </span>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="aspect-square rounded-2xl overflow-hidden bg-muted border border-border">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-20 h-20 text-muted-foreground/30" />
                </div>
              )}
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-2xl md:text-3xl font-black text-foreground leading-tight">
                {product.name}
              </h1>
              {product.isFeatured && (
                <span className="shrink-0 bg-accent/15 text-accent text-xs font-semibold px-3 py-1 rounded-full border border-accent/30">
                  מומלץ
                </span>
              )}
            </div>

            <div className="mb-4">
              <StockBadge stock={product.stock} />
            </div>

            {product.description && (
              <p className="text-muted-foreground leading-relaxed mb-6">
                {product.description}
              </p>
            )}

            <div className="mt-auto">
              <p className="text-3xl font-black text-foreground mb-6">
                ₪{price.toFixed(2)}
              </p>

              {product.stock > 0 && (
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-sm font-medium text-foreground">כמות:</span>
                  <div className="flex items-center gap-2 border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-10 text-center text-sm font-semibold">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="w-9 h-9 flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <Button
                size="lg"
                className="w-full gap-2 font-semibold text-base"
                disabled={product.stock === 0 || addToCart.isPending}
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-5 h-5" />
                {product.stock === 0 ? "אזל המלאי" : "הוסף לעגלה"}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
