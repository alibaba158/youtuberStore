import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link, useParams } from "wouter";
import { ArrowRight, Package, ShoppingCart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import { addGuestCartItem } from "@/lib/guestCart";
import { useSeo } from "@/lib/seo";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import noProductsImg from "@/images/noproducts.png";

type Product = Doc<"products">;

const rankGroups = [
  {
    key: "diamond",
    title: "דיימונד",
    eyebrow: "Diamond",
    image: "/rank-diamond.png",
  },
  {
    key: "mythic",
    title: "מיטיק",
    eyebrow: "Mythic",
    image: "/rank-mythic.png",
  },
  {
    key: "legendary",
    title: "לג׳נדרי",
    eyebrow: "Legendary",
    image: "/rank-legendery.png",
  },
  {
    key: "master",
    title: "מאסטר",
    eyebrow: "Master",
    image: "/rank-master.png",
  },
] as const;

const rankFlow = ["Diamond", "Mythic", "Legendary", "Master", "Pro"];

const rankNameMap: Record<string, string> = {
  Diamond: "דיימונד",
  Mythic: "מיטיק",
  Legendary: "לג׳נדרי",
  Legendery: "לג׳נדרי",
  Master: "מאסטר",
  Pro: "פרו",
};

const rankKeyByEnglish: Record<string, (typeof rankGroups)[number]["key"]> = {
  diamond: "diamond",
  mythic: "mythic",
  legendary: "legendary",
  legendery: "legendary",
  master: "master",
};

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

const categorySeoBySlug = {
  accounts: {
    title: "Brawl Stars Accounts for Sale | Razlo Store",
    description:
      "Browse Brawl Stars accounts for sale at Razlo Store. Find accounts with trophies, skins, and fast delivery.",
  },
  rank: {
    title: "Brawl Stars Rank Boosting | Razlo Store",
    description:
      "Choose Brawl Stars rank boosting options from Diamond, Mythic, Legendary, and Master ranks.",
  },
  trophies: {
    title: "Brawl Stars Trophy Boosting | Razlo Store",
    description:
      "Buy Brawl Stars trophy boosting services from Razlo Store with clear options and fast support.",
  },
  friends: {
    title: "Brawl Stars Friends and Services | Razlo Store",
    description:
      "Browse Brawl Stars friend services and account services from Razlo Store.",
  },
} as const;

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

function rankLevel(product: Product) {
  const match = product.name.match(/\s([123])\s+to\s/i);
  return match ? Number(match[1]) : 99;
}

function rankGroupForProduct(product: Product) {
  const startingRank = product.name.match(/^([A-Za-z]+)\s+[123]\s+to\s+/)?.[1];
  if (!startingRank) {
    return rankGroups[0];
  }

  const key = rankKeyByEnglish[startingRank.toLowerCase()];
  return rankGroups.find((group) => group.key === key) ?? rankGroups[0];
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.035 }}
      disabled={disabled}
      onClick={() => void handleAddToCart()}
      className="group grid w-full grid-cols-[1fr_96px] overflow-hidden rounded-2xl border border-border bg-card text-right shadow-sm transition hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-55 sm:grid-cols-[1fr_112px]"
    >
      <span className="flex min-h-[78px] items-center justify-center px-4 py-3 text-xl font-black leading-tight text-foreground sm:text-2xl">
        {displayRankOptionName(product.name)}
      </span>
      <span className="flex min-h-[78px] items-center justify-center bg-accent px-3 py-3 text-2xl font-black tabular-nums text-accent-foreground sm:text-3xl">
        {Number(product.price).toLocaleString("he-IL")}
      </span>
      <span className="col-span-2 flex items-center justify-center gap-2 border-t border-border bg-muted/35 px-4 py-2 text-xs font-black text-muted-foreground transition group-hover:bg-accent/10 group-hover:text-foreground">
        <ShoppingCart className="h-4 w-4" />
        {disabled ? "אזל מהמלאי" : "הוסף לעגלה"}
      </span>
    </motion.button>
  );
}

function RankOptionsPage({ products }: { products: Product[] }) {
  const grouped = rankGroups.map((group) => ({
    ...group,
    products: products
      .filter((product) => rankGroupForProduct(product).key === group.key)
      .sort((a, b) => rankLevel(a) - rankLevel(b)),
  }));

  return (
    <section className="rounded-3xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-gradient-to-l from-foreground via-foreground/95 to-foreground/90 px-5 py-8 text-white md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/10 px-4 py-2 text-xs font-black text-accent">
            <Sparkles className="h-4 w-4" />
            בחר את הבוסט שמתאים לך
          </div>
          <h2 className="text-4xl font-black leading-tight md:text-6xl">
            מחירון ראנקד
          </h2>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {rankFlow.map((rank, index) => (
              <div key={rank} className="flex items-center gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white/90">
                  {rankNameMap[rank] ?? rank}
                </span>
                {index < rankFlow.length - 1 ? (
                  <ArrowRight className="h-4 w-4 rotate-180 text-accent" />
                ) : null}
              </div>
            ))}
          </div>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/75">
            כל לחיצה מוסיפה את האפשרות לעגלה. אחרי התשלום נבקש בצ׳אט את תג
            השחקן ואת הפרטים המדויקים לביצוע הבוסט.
          </p>
        </div>
      </div>

      <div className="grid gap-5 p-4 md:p-6 lg:grid-cols-2 2xl:grid-cols-4">
        {grouped.map((group, groupIndex) => (
          <section
            key={group.key}
            className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm"
          >
            <div className="border-b border-border bg-muted/35 p-5">
              <div className="mb-4 flex min-h-20 items-center justify-center">
                <img
                  src={group.image}
                  alt={group.eyebrow}
                  className="max-h-20 max-w-full object-contain drop-shadow-lg"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                    event.currentTarget.nextElementSibling?.classList.remove(
                      "hidden",
                    );
                  }}
                />
                <div className="hidden rounded-2xl border border-border bg-card p-5 text-muted-foreground">
                  <Package className="h-10 w-10" />
                </div>
              </div>
              <p className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {group.eyebrow}
              </p>
              <h3 className="text-center text-2xl font-black text-foreground">
                {group.title}
              </h3>
            </div>

            <div className="space-y-4 p-4">
              {group.products.length > 0 ? (
                group.products.map((product, index) => (
                  <RankOptionCard
                    key={product._id}
                    product={product}
                    index={groupIndex * 4 + index}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card p-5 text-center text-sm font-bold text-muted-foreground">
                  אין אפשרויות זמינות כרגע
                </div>
              )}
            </div>
          </section>
        ))}
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
  const seo =
    categorySeoBySlug[
      (category?.slug ?? params.slug ?? "accounts") as keyof typeof categorySeoBySlug
    ];

  useSeo({
    title: seo?.title ?? `${category?.name ?? "Category"} | Razlo Store`,
    description:
      seo?.description ??
      category?.description ??
      "Browse Brawl Stars products and services from Razlo Store.",
    canonicalPath: params.slug ? `/category/${params.slug}` : undefined,
    image: "/favicon.png",
  });

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
      <div className={isRankCategory ? "bg-background" : "border-b border-border bg-white"}>
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

      <div className={isRankCategory ? "bg-background pb-12" : "container py-10"}>
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
