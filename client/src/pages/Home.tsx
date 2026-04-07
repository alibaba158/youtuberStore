import { Link } from "wouter";
import { ArrowLeft, Sparkles, Package } from "lucide-react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";

function CategoryCard({ category, index }: { category: { id: number; name: string; slug: string; description?: string | null; imageUrl?: string | null }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Link href={`/category/${category.slug}`}>
        <div className="group relative bg-card rounded-xl border border-border overflow-hidden hover-lift cursor-pointer aspect-[4/3]">
          {category.imageUrl ? (
            <img
              src={category.imageUrl}
              alt={category.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-4">
            <h3 className="text-white font-bold text-base">{category.name}</h3>
            {category.description && (
              <p className="text-white/75 text-xs mt-0.5 line-clamp-1">{category.description}</p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function EmptyCategoryCard({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <div className="group bg-card rounded-xl border-2 border-dashed border-border overflow-hidden aspect-[4/3] flex flex-col items-center justify-center gap-3 text-center p-6">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <Package className="w-6 h-6 text-muted-foreground/50" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">קטגוריה בקרוב</p>
          <p className="text-xs text-muted-foreground/60 mt-1">מוצרים חדשים בדרך</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const { data: categories, isLoading: catsLoading } = trpc.categories.list.useQuery();
  const { data: featured, isLoading: featLoading } = trpc.products.featured.useQuery();

  const showEmptyCategories = !catsLoading && (!categories || categories.length === 0);
  const showEmptyFeatured = !featLoading && (!featured || featured.length === 0);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground/95 to-foreground/90 text-white">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px"
          }} />
        </div>
        <div className="container relative py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span className="text-sm font-medium text-white/90">ברוכים הבאים לחנות</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-5">
              המוצרים הכי
              <span className="block text-accent">טובים בשבילך</span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
              מוצרים איכותיים, מחירים הוגנים, ומשלוח מהיר לכל הארץ. גלה את הקולקציה שלנו.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-2"
                onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
              >
                לקנייה עכשיו
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 text-white bg-white/10 hover:bg-white/20 hover:text-white font-semibold"
                onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
              >
                גלה קטגוריות
              </Button>
            </div>
          </motion.div>
        </div>
        {/* Decorative bottom curve */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-background" style={{ clipPath: "ellipse(55% 100% at 50% 100%)" }} />
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-16">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm font-medium text-accent mb-1">קטגוריות</p>
              <h2 className="text-2xl md:text-3xl font-black text-foreground">עיין לפי קטגוריה</h2>
            </div>
          </div>

          {catsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] skeleton rounded-xl" />
              ))}
            </div>
          ) : showEmptyCategories ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <EmptyCategoryCard key={i} index={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories!.map((cat, i) => (
                <CategoryCard key={cat.id} category={cat} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="products" className="py-16 bg-muted/30">
        <div className="container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-sm font-medium text-accent mb-1">מוצרים</p>
              <h2 className="text-2xl md:text-3xl font-black text-foreground">מוצרים מומלצים</h2>
            </div>
          </div>

          {featLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : showEmptyFeatured ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center mb-5">
                <Package className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">אין מוצרים עדיין</h3>
              <p className="text-muted-foreground text-sm">מוצרים חדשים יתווספו בקרוב. חזור מאוחר יותר!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {featured!.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-foreground rounded-2xl p-8 md:p-12 text-center text-white"
          >
            <h2 className="text-2xl md:text-3xl font-black mb-3">מצאת משהו שאהבת?</h2>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              הוסף לעגלה ותהנה ממשלוח מהיר לכל הארץ
            </p>
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              לקנייה עכשיו
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
