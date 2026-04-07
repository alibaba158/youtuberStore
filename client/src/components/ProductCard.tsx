import { Link } from "wouter";
import { ShoppingCart, Package } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: string;
  imageUrl?: string | null;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
};

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="stock-out text-xs px-2 py-0.5 rounded-full font-medium">אזל המלאי</span>;
  if (stock <= 5) return <span className="stock-low text-xs px-2 py-0.5 rounded-full font-medium">נותרו {stock} יחידות</span>;
  return <span className="stock-in text-xs px-2 py-0.5 rounded-full font-medium">במלאי</span>;
}

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const addToCart = trpc.cart.add.useMutation({
    onSuccess: () => {
      utils.cart.get.invalidate();
      toast.success("המוצר נוסף לעגלה!");
    },
    onError: (err) => {
      toast.error(err.message || "שגיאה בהוספה לעגלה");
    },
  });

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    if (product.stock === 0) return;
    addToCart.mutate({ productId: product.id, quantity: 1 });
  };

  const price = parseFloat(product.price);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
    >
      <Link href={`/product/${product.id}`}>
        <div className="group bg-card rounded-xl border border-border overflow-hidden hover-lift cursor-pointer">
          {/* Image */}
          <div className="relative aspect-square bg-muted overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}
            {product.isFeatured && (
              <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground border-0 text-xs font-semibold">
                מומלץ
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 mb-1">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                {product.description}
              </p>
            )}

            <div className="flex items-center justify-between gap-2 mt-3">
              <div>
                <p className="text-lg font-bold text-foreground">₪{price.toFixed(2)}</p>
                <StockBadge stock={product.stock} />
              </div>
              <Button
                size="sm"
                variant={product.stock === 0 ? "outline" : "default"}
                disabled={product.stock === 0 || addToCart.isPending}
                onClick={handleAddToCart}
                className="shrink-0 gap-1.5"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
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
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="aspect-square skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-3 skeleton rounded w-full" />
        <div className="h-3 skeleton rounded w-2/3" />
        <div className="flex justify-between items-center mt-2">
          <div className="h-6 skeleton rounded w-16" />
          <div className="h-8 skeleton rounded w-20" />
        </div>
      </div>
    </div>
  );
}
