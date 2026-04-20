import { useQuery } from "convex/react";
import { useParams, Link } from "wouter";
import { ArrowRight } from "lucide-react";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import { api } from "../../../convex/_generated/api";
import noProductsImg from "@/images/noproducts.png";

const emptyStateBySlug = {
  accounts: {
    title: "עדיין אין חשבונות זמינים",
    description:
      "כאן יופיעו חשבונות Brawl Stars כשתוסיף מלאי.",
  },
  rank: {
    title: "עדיין אין חשבונות ראנק זמינים",
    description: "כאן יופיעו חשבונות לפי ראנק כשתוסיף מלאי.",
  },
  trophies: {
    title: "עדיין אין חשבונות גביעים זמינים",
    description: "כאן יופיעו חשבונות לפי כמות גביעים כשתוסיף מלאי.",
  },
  friends: {
    title: "עדיין אין מוצרים בקטגוריה הזאת",
    description: "כאן יופיעו מוצרי חברויות כשתוסיף מלאי.",
  },
} as const;

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const data = useQuery(
    api.store.categoryPageData,
    params.slug ? { slug: params.slug } : "skip",
  );
  const category = data?.category;
  const products = data?.products;

  if (data === undefined) {
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
        <h2 className="mb-3 text-2xl font-bold text-foreground">
          הקטגוריה לא נמצאה
        </h2>
        <Link href="/">
          <span className="cursor-pointer text-accent hover:underline">
            חזרה לדף הבית
          </span>
        </Link>
      </div>
    );
  }

  const emptyState =
    emptyStateBySlug[category.slug as keyof typeof emptyStateBySlug] ??
    emptyStateBySlug.accounts;

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
          <h1 className="text-2xl font-black text-foreground md:text-3xl">
            {category.name}
          </h1>
          {category.description ? (
            <p className="mt-2 max-w-xl text-muted-foreground">
              {category.description}
            </p>
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
            <img src={noProductsImg} alt="אין מוצרים" className="mx-auto mb-5 h-28 w-28 object-contain opacity-70" />
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              {emptyState.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {emptyState.description}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              {products.length} מוצרים
            </p>
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
