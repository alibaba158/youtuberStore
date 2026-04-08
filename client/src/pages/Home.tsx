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
      transition={{ duration: 0.5, delay: index * 0.07 }}
    >
      <Link href={`/category/${category.slug}`} className="group">
        <div className="group relative aspect-[4/3] cursor-pointer overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-accent/10 hover:border-accent/40">
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.name}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/50 to-muted">
              <Package className="h-14 w-14 text-muted-foreground/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-90" />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <h3 className="text-lg font-bold text-white group-hover:text-accent transition-colors">{category.name}</h3>
            {category.description ? (
              <p className="mt-1.5 line-clamp-1 text-xs text-white/80">
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
  const data = useQuery(api.store.homePageData);
  const categories = data?.categories;
  const featured = data?.featured;
  const allProducts = data?.allProducts;

  const categoriesLoading = categories === undefined;
  const featuredLoading = featured === undefined;
  const productsLoading = allProducts === undefined;

  return (
    <div className="min-h-screen">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/85 text-white">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
        <div className="container relative py-28 md:py-36">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-5 py-2.5 backdrop-blur-sm shadow-lg">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-white/95">חנות פשוטה יותר, מבוססת Convex</span>
            </div>
            <h1 className="mb-6 text-5xl font-black leading-tight md:text-6xl lg:text-7xl tracking-tight">
              המוצרים הכי
              <span className="block bg-gradient-to-r from-accent to-accent/70 bg-clip-text text-transparent">טובים בשבילך</span>
            </h1>
            <p className="mb-10 max-w-xl text-lg leading-relaxed text-white/85 md:text-xl">
              חוויית חנות נקייה יותר עם קטלוג, עגלה, משתמשים וניהול מלאי, בלי שכבת Manus ובלי שרת Express נפרד.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="group gap-2 bg-accent font-bold text-white shadow-lg shadow-accent/25 transition-all duration-300 hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/30 hover:scale-105 rounded-xl"
                onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
              >
                לקנייה עכשיו
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="group border-white/30 bg-white/10 font-bold text-white backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:scale-105 hover:shadow-lg rounded-xl"
                onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
              >
                גלה קטגוריות
              </Button>
            </div>
          </motion.div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-16 bg-background"
          style={{ clipPath: "ellipse(70% 100% at 50% 100%)" }}
        />
      </section>

      <section id="categories" className="py-24">
        <div className="container">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <p className="mb-2.5 text-sm font-bold uppercase tracking-wider text-accent">קטגוריות</p>
              <h2 className="text-3xl font-black text-foreground md:text-4xl tracking-tight">עיין לפי קטגוריה</h2>
            </div>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="aspect-[4/3] rounded-2xl skeleton" />
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
              <Package className="mx-auto mb-5 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">עדיין לא נוספו קטגוריות.</p>
            </div>
          )}
        </div>
      </section>

      {featured && featured.length > 0 ? (
        <section className="bg-gradient-to-b from-muted/40 to-transparent py-24">
          <div className="container">
            <div className="mb-12">
              <p className="mb-2.5 text-sm font-bold uppercase tracking-wider text-accent">מוצרים</p>
              <h2 className="text-3xl font-black text-foreground md:text-4xl tracking-tight">מוצרים מומלצים</h2>
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

      <section id="products" className="py-24">
        <div className="container">
          <div className="mb-12">
            <p className="mb-2.5 text-sm font-bold uppercase tracking-wider text-accent">כל המוצרים</p>
            <h2 className="text-3xl font-black text-foreground md:text-4xl tracking-tight">חפש את המוצר שלך</h2>
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
              <Package className="mx-auto mb-5 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">עדיין לא נוספו מוצרים.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
