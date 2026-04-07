import { useParams, Link } from "wouter";
import { ArrowRight, Package } from "lucide-react";
import { trpc } from "@/lib/trpc";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const { data: category, isLoading: catLoading } = trpc.categories.bySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  );

  const { data: products, isLoading: prodsLoading } = trpc.products.byCategory.useQuery(
    { categoryId: category?.id ?? 0 },
    { enabled: !!category?.id }
  );

  if (catLoading) {
    return (
      <div className="container py-12">
        <div className="h-8 skeleton rounded w-48 mb-2" />
        <div className="h-4 skeleton rounded w-64 mb-10" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-3">הקטגוריה לא נמצאה</h2>
        <Link href="/">
          <span className="text-accent hover:underline cursor-pointer">חזרה לדף הבית</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Category Header */}
      <div className="bg-white border-b border-border">
        <div className="container py-8">
          <Link href="/">
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-4">
              <ArrowRight className="w-4 h-4" />
              חזרה לדף הבית
            </span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-foreground">{category.name}</h1>
          {category.description && (
            <p className="text-muted-foreground mt-2 max-w-xl">{category.description}</p>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="container py-10">
        {prodsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
            {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-5">
              <Package className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">אין מוצרים בקטגוריה זו</h3>
            <p className="text-muted-foreground text-sm">מוצרים חדשים יתווספו בקרוב</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">{products.length} מוצרים</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
