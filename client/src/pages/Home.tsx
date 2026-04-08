import { Link } from "wouter";
import { ArrowLeft, Sparkles, Package } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import { api } from "../../../convex/_generated/api";

function CategoryCard({
  category,
  index,
}: {
  category: {
    _id: string;
    name: string;
    slug: string;
    description?: string;
    imageUrl?: string;
  };
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link href={`/category/${category.slug}`}>
        <div className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-xl border border-border bg-card hover-lift">
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary to-muted">
              <Package className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="text-base font-bold text-white">{category.name}</h3>
            {category.description ? (
              <p className="mt-0.5 line-clamp-1 text-xs text-white/75">
                {category.description}
              </p>
            ) : null}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function Home() {
  const categories = useQuery(api.store.listCategories);
  const featured = useQuery(api.store.featuredProducts);
  const allProducts = useQuery(api.store.listProducts, {});

  const categoriesLoading = categories === undefined;
  const featuredLoading = featured === undefined;
  const productsLoading = allProducts === undefined;

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground/95 to-foreground/90 text-white">
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>
        <div className="container relative py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-sm font-medium text-white/90">חנות פשוטה יותר, מבוססת Convex</span>
            </div>
            <h1 className="mb-5 text-4xl font-black leading-tight md:text-5xl lg:text-6xl">
              המוצרים הכי
              <span className="block text-accent">טובים בשבילך</span>
            </h1>
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-white/70">
              חוויית חנות נקייה יותר עם קטלוג, עגלה, משתמשים וניהול מלאי, בלי שכבת Manus ובלי שרת Express נפרד.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="gap-2 bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
                onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
              >
                לקנייה עכשיו
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 font-semibold text-white hover:bg-white/20 hover:text-white"
                onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
              >
                גלה קטגוריות
              </Button>
            </div>
          </motion.div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-8 bg-background"
          style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }}
        />
      </section>

      <section id="categories" className="py-16">
        <div className="container">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="mb-1 text-sm font-medium text-accent">קטגוריות</p>
              <h2 className="text-2xl font-black text-foreground md:text-3xl">עיין לפי קטגוריה</h2>
            </div>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="aspect-[4/3] rounded-xl skeleton" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {categories.map((category, index) => (
                <CategoryCard key={category._id} category={category} index={index} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Package className="mx-auto mb-5 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">עדיין לא נוספו קטגוריות.</p>
            </div>
          )}
        </div>
      </section>

      {featured && featured.length > 0 ? (
        <section className="bg-muted/30 py-16">
          <div className="container">
            <div className="mb-8">
              <p className="mb-1 text-sm font-medium text-accent">מוצרים</p>
              <h2 className="text-2xl font-black text-foreground md:text-3xl">מוצרים מומלצים</h2>
            </div>

            {featuredLoading ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <ProductCardSkeleton key={index} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
                {featured.map((product, index) => (
                  <ProductCard key={product._id} product={product} index={index} />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

      <section id="products" className="py-16">
        <div className="container">
          <div className="mb-8">
            <p className="mb-1 text-sm font-medium text-accent">כל המוצרים</p>
            <h2 className="text-2xl font-black text-foreground md:text-3xl">חפש את המוצר שלך</h2>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : allProducts && allProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
              {allProducts.map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Package className="mx-auto mb-5 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">עדיין לא נוספו מוצרים.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
