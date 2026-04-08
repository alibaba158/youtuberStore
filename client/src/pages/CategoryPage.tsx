import { useQuery } from "convex/react";
import { useParams, Link } from "wouter";
import { ArrowRight, Package } from "lucide-react";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import { api } from "../../../convex/_generated/api";

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const category = useQuery(api.store.categoryBySlug, params.slug ? { slug: params.slug } : "skip");
  const products = useQuery(
    api.store.productsByCategory,
    category ? { categoryId: category._id } : "skip",
  );

  if (category === undefined) {
    return (
      <div className="container py-12">
        <div className="mb-2 h-8 w-48 rounded skeleton" />
        <div className="mb-10 h-4 w-64 rounded skeleton" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container py-20 text-center">
        <h2 className="mb-3 text-2xl font-bold text-foreground">הקטגוריה לא נמצאה</h2>
        <Link href="/">
          <span className="cursor-pointer text-accent hover:underline">חזרה לדף הבית</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-white">
        <div className="container py-8">
          <Link href="/">
            <span className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowRight className="h-4 w-4" />
              חזרה לדף הבית
            </span>
          </Link>
          <h1 className="text-2xl font-black text-foreground md:text-3xl">{category.name}</h1>
          {category.description ? (
            <p className="mt-2 max-w-xl text-muted-foreground">{category.description}</p>
          ) : null}
        </div>
      </div>

      <div className="container py-10">
        {products === undefined ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductCardSkeleton key={index} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Package className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">אין מוצרים בקטגוריה זו</h3>
            <p className="text-sm text-muted-foreground">מוצרים חדשים יתווספו בקרוב</p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">{products.length} מוצרים</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
