import { Link } from "wouter";
import { ArrowLeft, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import { api } from "../../../convex/_generated/api";
import { buildSiteStructuredData, useSeo } from "@/lib/seo";
import brawlStarsLogo from "@/images/brawlstars_logo.png";
import trophieImg from "@/images/trophie.png";
import rankImg from "@/images/rank.png";
import friendsImg from "@/images/friends.png";
import accountsImg from "@/images/accounts.png";
import noProductsImg from "@/images/noproducts.png";

const categoryImages: Record<string, string> = {
  trophies: trophieImg,
  rank: rankImg,
  friends: friendsImg,
  accounts: accountsImg,
};

const categoryIconBySlug = {
  accounts: UserRound,
} as const;

const categoryMeta = {
  friends: {
    label: "חברויות",
    summary: "חברויות ומשתמשים ל-Brawl Stars במקום אחד.",
  },
  accounts: {
    label: "חשבונות",
    summary: "חשבונות Brawl Stars זמינים לקנייה מהירה.",
  },
  rank: {
    label: "בוסט ראנק",
    summary: "בחר את הראנק הנוכחי ואת היעד, והוסף לעגלה.",
  },
  trophies: {
    label: "בוסט גביעים",
    summary: "אפשרויות לקידום גביעים ב-Brawl Stars.",
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
    UserRound;
  const meta =
    categoryMeta[category.slug as keyof typeof categoryMeta] ?? undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
    >
      <Link href={`/category/${category.slug}`} className="group block h-full">
        <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-accent/25 bg-gradient-to-b from-foreground to-foreground/95 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:border-accent/40 hover:shadow-2xl hover:shadow-accent/10">
          <div className="relative flex aspect-[1.05] items-center justify-center overflow-hidden px-6 pt-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(164,255,62,0.16),_transparent_48%)]" />
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
            <div className="inline-flex w-fit self-end rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-accent">
              {meta?.label ?? "קטגוריה"}
            </div>
            <div>
              <h3 className="text-lg font-black text-white transition-colors group-hover:text-accent/80">
                {category.name}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/72">
                {meta?.summary ??
                  category.description ??
                  "מוצרים זמינים בקטגוריה הזאת."}
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
  useSeo({
    title: "Razlo Store | Brawl Stars Accounts, Rank Boosting and Trophy Boosting",
    description:
      "Buy Brawl Stars accounts, rank boosting, trophy boosting, and friend services from Razlo Store with fast delivery and support.",
    canonicalPath: "/",
    image: "/favicon.png",
    structuredData: buildSiteStructuredData(),
  });

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
        <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-pink-500/10 blur-2xl md:h-72 md:w-72" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-pink-400/10 blur-2xl md:h-80 md:w-80" />
        <div className="container relative py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="mb-7 flex justify-center">
              <img
                src={brawlStarsLogo}
                alt="Razlo Store"
                className="h-28 w-28 object-contain drop-shadow-2xl md:h-36 md:w-36"
              />
            </div>

            <h1 className="mb-4 text-5xl font-black leading-tight md:text-6xl">
              Razlo Store
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-base leading-8 text-white/80 md:text-lg">
              ברוכים הבאים ל-Razlo Store, המקום לקניית שירותים ומוצרים ל-Brawl
              Stars בצורה פשוטה, מהירה וברורה.
            </p>

            <div className="mx-auto mb-10 max-w-xl rounded-3xl border border-accent/25 bg-white/5 px-6 py-5 text-right shadow-lg backdrop-blur-sm">
              <p className="text-base font-bold text-white">מה אפשר למצוא באתר</p>
              <p className="mt-2 text-sm leading-7 text-white/75">
                חשבונות, בוסט ראנק, בוסט גביעים וחברויות. בחר קטגוריה,
                הוסף לעגלה, וסיים תשלום בצורה מאובטחת.
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
            <p className="mb-2 text-sm font-bold text-accent">קטגוריות</p>
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
              <img
                src={noProductsImg}
                alt="אין קטגוריות"
                className="mx-auto mb-5 h-28 w-28 object-contain opacity-70"
              />
              <p className="text-sm text-muted-foreground">
                עדיין אין קטגוריות.
              </p>
            </div>
          )}
        </div>
      </section>

      {featured && featured.length > 0 ? (
        <section className="bg-gradient-to-b from-muted/40 to-transparent py-20">
          <div className="container">
            <div className="mb-10">
              <p className="mb-2 text-sm font-bold text-accent">מומלצים</p>
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
            <p className="mb-2 text-sm font-bold text-accent">מוצרים</p>
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
              <img
                src={noProductsImg}
                alt="אין מוצרים"
                className="mx-auto mb-5 h-28 w-28 object-contain opacity-70"
              />
              <p className="text-sm text-muted-foreground">
                עדיין אין מוצרים.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
