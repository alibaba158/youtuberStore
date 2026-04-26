import { Link } from "wouter";
import { ShoppingCart, Package } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { addGuestCartItem } from "@/lib/guestCart";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";

type Product = Doc<"products">;

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <span className="stock-out rounded-full px-2 py-0.5 text-xs font-medium">אזל המלאי</span>;
  }
  if (stock <= 5) {
    return <span className="stock-low rounded-full px-2 py-0.5 text-xs font-medium">נותרו {stock} יחידות</span>;
  }
  return <span className="stock-in rounded-full px-2 py-0.5 text-xs font-medium">במלאי</span>;
}

export default function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const { isAuthenticated } = useAuth();
  const addToCart = useMutation(api.store.addToCart);

  const handleAddToCart = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (product.stock === 0) {
      return;
    }

    try {
      if (isAuthenticated) {
        await addToCart({ productId: product._id, quantity: 1 });
      } else {
        addGuestCartItem(product._id, 1, product.stock);
      }
      toast.success("המוצר נוסף לעגלה");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "שגיאה בהוספה לעגלה");
    }
  };

  const price = parseFloat(product.price);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
    >
      <Link href={`/product/${product._id}`} className="group">
        <div className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-card shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
          product.isMysteryBox
            ? "border-pink-400 shadow-pink-200 ring-2 ring-pink-400/70"
            : product.isSpecialOffer
            ? "border-red-400 shadow-red-200 ring-2 ring-red-400/60"
            : "border-border/70 hover:border-accent/20 hover:shadow-accent/5"
        }`}>
          <div className="relative aspect-square overflow-hidden bg-muted">
            {product.imageUrl ? (
              <div className="flex h-full w-full items-center justify-center p-3">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-h-full max-w-full object-contain transition-transform duration-700 ease-out group-hover:scale-110"
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/50 to-muted">
                <Package className="h-16 w-16 text-muted-foreground/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            {product.isFeatured ? (
              <Badge className="absolute right-3 top-3 border-0 bg-accent/95 px-3 py-1 text-xs font-bold text-accent-foreground shadow-lg backdrop-blur-sm">
                ✨ מומלץ
              </Badge>
            ) : null}
            {product.isMysteryBox ? (
              <motion.span
                animate={{ scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-2 top-2 z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 text-center text-[11px] font-black leading-tight text-yellow-900 shadow-[0_0_20px_6px_rgba(234,179,8,0.7)] ring-2 ring-white"
              >
                🎁<br />תיבת<br />מסתורין
              </motion.span>
            ) : product.isSpecialOffer ? (
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-2 top-2 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 text-center text-[11px] font-black leading-tight text-yellow-900 shadow-[0_0_16px_4px_rgba(234,179,8,0.6)] ring-2 ring-white"
              >
                🔥<br />מיוחד!
              </motion.span>
            ) : null}
          </div>

          <div className="p-4">
            <h3 className="mb-1.5 line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors duration-200 group-hover:text-accent/80">
              {product.name}
            </h3>
            {product.description ? (
              <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            ) : null}

            <div className="mt-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-xl font-black text-foreground">₪{price.toFixed(2)}</p>
                <StockBadge stock={product.stock} />
              </div>
              <Button
                size="sm"
                variant={product.stock === 0 ? "outline" : "default"}
                disabled={product.stock === 0}
                onClick={(event) => void handleAddToCart(event)}
                className={`shrink-0 gap-1.5 font-semibold transition-all duration-200 ${
                  product.stock > 0 
                    ? "hover:scale-105 hover:shadow-md" 
                    : ""
                }`}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                {product.stock === 0 ? "אזל" : "הוסף"}
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="aspect-square skeleton" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 rounded skeleton" />
        <div className="h-3 w-full rounded skeleton" />
        <div className="h-3 w-2/3 rounded skeleton" />
        <div className="mt-2 flex items-center justify-between">
          <div className="h-7 w-16 rounded skeleton" />
          <div className="h-9 w-20 rounded skeleton" />
        </div>
      </div>
    </div>
  );
}
