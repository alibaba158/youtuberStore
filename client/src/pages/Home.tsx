import { Link } from "wouter";
import {
  ArrowLeft,
  Package,
  UserRound,
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import { api } from "../../../convex/_generated/api";
import brawlStarsLogo from "@/images/brawlstars_logo.png";
import trophieImg from "@/images/trophie.png";
import rankImg from "@/images/rank.png";
import friendsImg from "@/images/friends.png";

const categoryImages: Record<string, string> = {
  trophies: trophieImg,
  rank: rankImg,
  friends: friendsImg,
};

const categoryIconBySlug = {
  accounts: UserRound,
} as const;

const categoryMeta = {
  friends: {
    label: "Brawl Stars Friends",
    summary: "חברויות ב-Brawl Stars.",
  },
  accounts: {
    label: "Accounts",
    summary: "חשבונות Brawl Stars ו-Roblox לקנייה.",
  },
  rank: {
    label: "Rank Accounts",
    summary: "חשבונות לפי ראנק. המלאי יתווסף בהמשך.",
  },
  trophies: {
    label: "Trophy Accounts",
    summary: "חשבונות לפי כמות גביעים. המלאי יתווסף בהמשך.",
  },
} as const;

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
  const localImage =
    categoryImages[category.slug] || categoryImages[category.name.toLowerCase()];
  const displayImage = localImage || category.imageUrl;
  const FallbackIcon =
    categoryIconBySlug[category.slug as keyof typeof categoryIconBySlug] ??
    Package;
  const meta =
    categoryMeta[category.slug as keyof typeof categoryMeta] ?? undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
    >
      <Link href={`/category/${category.slug}`} className="group block h-full">
        <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-b from-foreground to-foreground/92 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-accent/60 hover:shadow-2xl hover:shadow-accent/15">
          <div className="relative flex aspect-[1.05] items-center justify-center overflow-hidden px-6 pt-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(164,255,62,0.18),_transparent_48%)]" />
            {displayImage ? (
              <img
                src={displayImage}
                alt={category.name}
                className="relative h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-110"
              />
            ) : (
              <FallbackIcon className="relative h-16 w-16 text-accent/55" />
            )}
          </div>

          <div className="flex flex-1 flex-col gap-3 p-5 text-right">
            <div className="inline-flex w-fit self-end rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-accent">
              {meta?.label ?? "Category"}
            </div>
            <div>
              <h3 className="text-lg font-black text-white transition-colors group-hover:text-accent">
                {category.name}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/72">
                {meta?.summary ?? category.description ?? "מוצרים זמינים בקטגוריה הזאת."}
              </p>
            </div>
            <div className="mt-auto pt-2 text-sm font-semibold text-accent">
              לצפייה במוצרים
            </div>
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
      <section className="relative overflow-hidden bg-gradient-to-br from-foreground via-foreground/95 to-foreground/85 text-white">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />

        <div className="container relative py-20 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="mb-8 flex justify-center">
              <img
                src={brawlStarsLogo}
                alt="Razlo Store"
                className="h-28 w-28 object-contain drop-shadow-2xl md:h-36 md:w-36"
              />
            </div>

            <h1 className="mb-4 text-5xl font-black leading-tight md:text-6xl">
              Razlo Store
            </h1>
            <p className="mx-auto mb-3 max-w-2xl text-xl font-bold text-accent md:text-2xl">
              Brawl Stars ו-Roblox accounts במקום אחד
            </p>
            <p className="mx-auto mb-8 max-w-2xl text-base leading-8 text-white/80 md:text-lg">
              כאן קונים חשבונות Brawl Stars ו-Roblox. יש גם קטגוריות לפי גביעים,
              ראנק וחברויות, ותוכל למלא אותן כשיהיה לך מלאי.
            </p>

            <div className="mx-auto mb-10 max-w-xl rounded-3xl border border-accent/25 bg-white/5 px-6 py-5 text-right shadow-lg backdrop-blur-sm">
              <p className="text-base font-bold text-white">מה יש באתר</p>
              <p className="mt-2 text-sm leading-7 text-white/75">
                חשבונות Brawl Stars, חשבונות Roblox, קטגוריית גביעים, קטגוריית
                ראנק וקטגוריית חברויות.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="group gap-2 bg-accent font-bold text-accent-foreground shadow-lg shadow-accent/25 transition-all duration-300 hover:bg-accent/90"
                onClick={() =>
                  document
                    .getElementById("categories")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                לקטגוריות
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              </Button>
              <Link href="/cart">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                >
                  לעגלה
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="categories" className="py-12 md:py-16">
        <div className="container">
          <div className="mb-12 text-center">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-accent">
              Categories
            </p>
            <h2 className="text-3xl font-black text-foreground md:text-4xl">
              מה אפשר לקנות כאן
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
              בחר קטגוריה והמשך למוצרים שמתאימים למה שאתה מחפש.
            </p>
          </div>

          {categoriesLoading ? (
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="aspect-[0.95] rounded-3xl skeleton" />
              ))}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="mx-auto grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {categories.map((category, index) => (
                <CategoryCard
                  key={category._id}
                  category={category}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Package className="mx-auto mb-5 h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">עדיין אין קטגוריות.</p>
            </div>
          )}
        </div>
      </section>

      {featured && featured.length > 0 ? (
        <section className="bg-gradient-to-b from-muted/40 to-transparent py-20">
          <div className="container">
            <div className="mb-10">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider text-accent">
                Featured
              </p>
              <h2 className="text-3xl font-black text-foreground md:text-4xl">
                מוצרים מומלצים
              </h2>
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

      <section id="products" className="py-20">
        <div className="container">
          <div className="mb-10">
            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-accent">
              Products
            </p>
            <h2 className="text-3xl font-black text-foreground md:text-4xl">
              כל המוצרים
            </h2>
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
              <p className="text-sm text-muted-foreground">עדיין אין מוצרים.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
