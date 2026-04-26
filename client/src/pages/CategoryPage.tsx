import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link, useParams } from "wouter";
import { ArrowRight, Check, Package, ShoppingCart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import { addGuestCartItem } from "@/lib/guestCart";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import noProductsImg from "@/images/noproducts.png";

type Product = Doc<"products">;

const rankGroups = [
  {
    key: "mythic",
    title: "מיטיק",
    eyebrow: "Mythic",
    image: "/rank-mythic.png",
    match: ["mythic", "מיטיק"],
    frameClass: "from-[#ff5270]/35 via-[#a54070]/22 to-[#3d294d]/65",
    accentClass: "bg-[#ff5270]",
  },
  {
    key: "diamond",
    title: "דיימונד",
    eyebrow: "Diamond",
    image: "/rank-diamond.png",
    match: ["diamond", "דיימונד"],
    frameClass: "from-[#62d8ff]/35 via-[#3b8db9]/20 to-[#243c5c]/65",
    accentClass: "bg-[#5fd6ff]",
  },
  {
    key: "legendary",
    title: "לג׳נדרי",
    eyebrow: "Legendary",
    image: "/rank-legendery.png",
    match: ["legendary", "legendery", "לג׳נדרי", "לגנדרי"],
    frameClass: "from-[#ffb11f]/35 via-[#b68539]/20 to-[#4a4036]/65",
    accentClass: "bg-[#ffb11f]",
  },
  {
    key: "master",
    title: "מאסטר",
    eyebrow: "Master",
    image: "/rank-master.png",
    match: ["master", "מאסטר"],
    frameClass: "from-[#31d77a]/32 via-[#23866b]/20 to-[#163f43]/65",
    accentClass: "bg-[#31d77a]",
  },
] as const;

const emptyStateBySlug = {
  accounts: {
    title: "עדיין אין חשבונות זמינים",
    description: "כאן יופיעו חשבונות Brawl Stars כשתוסיף מלאי.",
  },
  rank: {
    title: "טוען אפשרויות ראנק",
    description: "אנחנו מכינים את מחירון הראנקד.",
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

const rankNameMap: Record<string, string> = {
  Mythic: "מיטיק",
  Diamond: "דיימונד",
  Legendary: "לג׳נדרי",
  Legendery: "לג׳נדרי",
  Master: "מאסטר",
  Pro: "פרו",
};

function displayRankOptionName(name: string) {
  const match = name.match(/^(.+?)\s+([123])\s+to\s+(.+)$/i);
  if (!match) {
    return name;
  }

  const [, fromRank, level, toRank] = match;
  const from = rankNameMap[fromRank] ?? fromRank;
  const to = rankNameMap[toRank] ?? toRank;
  return `${from} ${level} ל${to}`;
}

function rankGroupForProduct(product: Product) {
  const searchable = `${product.name} ${product.description ?? ""} ${
    product.imageUrl ?? ""
  }`.toLowerCase();

  return (
    rankGroups.find((group) =>
      group.match.some((token) => searchable.includes(token.toLowerCase())),
    ) ?? rankGroups[rankGroups.length - 1]
  );
}

function RankOptionCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const { isAuthenticated } = useAuth();
  const addToCart = useMutation(api.store.addToCart);
  const disabled = product.stock === 0;

  const handleAddToCart = async () => {
    if (disabled) {
      return;
    }

    try {
      if (isAuthenticated) {
        await addToCart({ productId: product._id, quantity: 1 });
      } else {
        addGuestCartItem(product._id, 1, product.stock);
      }
      toast.success("האפשרות נוספה לעגלה");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "שגיאה בהוספה לעגלה",
      );
    }
  };

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.035 }}
      disabled={disabled}
      onClick={() => void handleAddToCart()}
      className="group grid w-full grid-cols-[1fr_104px] overflow-hidden rounded-[22px] border border-white/70 bg-white/[0.92] text-right shadow-[0_14px_35px_rgba(0,0,0,0.16)] transition hover:-translate-y-1 hover:border-white hover:bg-white disabled:cursor-not-allowed disabled:opacity-55 sm:grid-cols-[1fr_118px]"
    >
      <span className="flex min-h-[86px] items-center justify-center px-4 py-3 text-2xl font-black leading-tight text-black sm:text-3xl">
        {displayRankOptionName(product.name)}
      </span>
      <span className="flex min-h-[86px] items-center justify-center bg-[#a9afd8] px-3 py-3 text-3xl font-black tabular-nums text-black sm:text-4xl">
        {Number(product.price).toLocaleString("he-IL")}
      </span>
      <span className="col-span-2 flex items-center justify-center gap-2 border-t border-black/5 bg-black/[0.03] px-4 py-2 text-xs font-black text-foreground opacity-80 transition group-hover:bg-accent group-hover:text-accent-foreground">
        <ShoppingCart className="h-4 w-4" />
        {disabled ? "אזל מהמלאי" : "הוסף לעגלה"}
      </span>
    </motion.button>
  );
}

function RankOptionsPage({ products }: { products: Product[] }) {
  const grouped = rankGroups.map((group) => ({
    ...group,
    products: products.filter(
      (product) => rankGroupForProduct(product).key === group.key,
    ),
  }));

  return (
    <section className="relative overflow-hidden rounded-[34px] border border-white/60 bg-[#111827] p-3 shadow-2xl md:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(97,218,255,0.28),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(255,82,112,0.22),transparent_30%),linear-gradient(135deg,rgba(51,65,120,0.72),rgba(17,24,39,0.96))]" />
      <div className="absolute inset-x-0 top-0 h-28 bg-white/10 blur-2xl" />

      <div className="relative rounded-[28px] border border-white/15 bg-white/10 p-4 backdrop-blur-md md:p-7">
        <div className="mx-auto mb-7 max-w-3xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs font-black text-white">
            <Sparkles className="h-4 w-4 text-accent" />
            בחר את הבוסט שמתאים לך
          </div>
          <h2 className="text-4xl font-black leading-tight text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.45)] md:text-6xl">
            מחירון ראנקד
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/78">
            כל לחיצה מוסיפה את האפשרות לעגלה. אחרי התשלום נבקש בצ׳אט את תג
            השחקן ואת הפרטים המדויקים לביצוע הבוסט.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          {grouped.map((group, groupIndex) => (
            <section
              key={group.key}
              className={`relative overflow-hidden rounded-[30px] border border-white/18 bg-gradient-to-b ${group.frameClass} p-4 shadow-xl shadow-black/20`}
            >
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative">
                <div className="mb-4 flex min-h-24 items-center justify-center">
                  <img
                    src={group.image}
                    alt={group.eyebrow}
                    className="max-h-24 max-w-full object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.38)]"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                      event.currentTarget.nextElementSibling?.classList.remove(
                        "hidden",
                      );
                    }}
                  />
                  <div className="hidden rounded-2xl border border-white/25 bg-white/70 p-5 text-muted-foreground">
                    <Package className="h-10 w-10" />
                  </div>
                </div>

                <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-black/[0.18] px-4 py-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-white/60">
                      {group.eyebrow}
                    </p>
                    <h3 className="text-2xl font-black text-white">
                      {group.title}
                    </h3>
                  </div>
                  <span className={`h-3 w-3 rounded-full ${group.accentClass}`} />
                </div>

                <div className="space-y-4">
                  {group.products.length > 0 ? (
                    group.products.map((product, index) => (
                      <RankOptionCard
                        key={product._id}
                        product={product}
                        index={groupIndex * 4 + index}
                      />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/30 bg-white/82 p-5 text-center text-base font-black text-foreground">
                      טוען אפשרויות...
                    </div>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-2xl bg-[#a9afd8] px-6 py-3 text-center text-lg font-black text-black shadow-lg md:text-2xl">
          <Check className="h-5 w-5" />
          כל הזכויות שמורות למדורג*
        </div>
      </div>
    </section>
  );
}

export default function CategoryPage() {
  const params = useParams<{ slug: string }>();
  const data = useQuery(
    api.store.categoryPageData,
    params.slug ? { slug: params.slug } : "skip",
  );
  const ensureRankBoostProducts = useMutation(api.store.ensureRankBoostProducts);
  const category = data?.category;
  const products = data?.products;
  const isRankCategory = category?.slug === "rank";

  useEffect(() => {
    if (params.slug !== "rank") {
      return;
    }
    void ensureRankBoostProducts().catch((error) => {
      console.error("Failed to ensure rank boost products", error);
    });
  }, [ensureRankBoostProducts, params.slug]);

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
      <div className={isRankCategory ? "bg-[#f8f4f8]" : "border-b border-border bg-white"}>
        <div className="container py-8">
          <Link href="/">
            <span className="mb-4 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <ArrowRight className="h-4 w-4" />
              חזרה לדף הבית
            </span>
          </Link>
          {!isRankCategory ? (
            <>
              <h1 className="text-2xl font-black text-foreground md:text-3xl">
                {category.name}
              </h1>
              {category.description ? (
                <p className="mt-2 max-w-xl text-muted-foreground">
                  {category.description}
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className={isRankCategory ? "bg-[#f8f4f8] pb-12" : "container py-10"}>
        <div className={isRankCategory ? "container" : undefined}>
          {products === undefined ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : isRankCategory ? (
            <RankOptionsPage products={products} />
          ) : products.length === 0 ? (
            <div className="py-20 text-center">
              <img
                src={noProductsImg}
                alt="אין מוצרים"
                className="mx-auto mb-5 h-28 w-28 object-contain opacity-70"
              />
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
    </div>
  );
}
