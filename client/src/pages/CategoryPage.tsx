import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link, useParams } from "wouter";
import { ArrowRight, Package, ShoppingCart } from "lucide-react";
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
    title: "Mythic",
    image: "/rank-mythic.png",
    match: ["mythic", "מיטיק"],
    panelClass: "from-rose-500/24 to-fuchsia-500/12",
    borderClass: "border-rose-300/40",
  },
  {
    key: "diamond",
    title: "Diamond",
    image: "/rank-diamond.png",
    match: ["diamond", "דיימונד"],
    panelClass: "from-sky-400/22 to-cyan-400/12",
    borderClass: "border-sky-300/40",
  },
  {
    key: "legendary",
    title: "Legendary",
    image: "/rank-legendery.png",
    match: ["legendary", "legendery", "לגנדרי", "לג'נדרי"],
    panelClass: "from-amber-400/24 to-stone-400/12",
    borderClass: "border-amber-300/40",
  },
  {
    key: "master",
    title: "Master",
    image: "/rank-master.png",
    match: ["master", "מאסטר"],
    panelClass: "from-emerald-400/24 to-teal-400/12",
    borderClass: "border-emerald-300/40",
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
      transition={{ duration: 0.35, delay: index * 0.04 }}
      disabled={disabled}
      onClick={() => void handleAddToCart()}
      className="group flex w-full items-stretch overflow-hidden rounded-2xl border border-white/70 bg-white/90 text-right shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-55"
    >
      <span className="flex flex-1 items-center justify-center px-4 py-4 text-2xl font-black leading-tight text-black md:text-3xl">
        {product.name}
      </span>
      <span className="flex w-32 shrink-0 items-center justify-center bg-[#a9afd8] px-4 py-4 text-4xl font-black text-black md:w-36 md:text-5xl">
        {Number(product.price).toLocaleString("he-IL")}
      </span>
      <span className="sr-only">
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
    <div className="relative overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-[#192243] via-[#293666] to-[#111827] p-4 shadow-2xl md:p-7">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(244,86,165,0.24),_transparent_36%)]" />
      <div className="relative rounded-3xl bg-white/12 p-4 backdrop-blur-sm md:p-6">
        <h2 className="mb-7 text-center text-4xl font-black text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.55)] md:text-6xl">
          מחירון ראנקד
        </h2>

        <div className="grid gap-4 xl:grid-cols-4">
          {grouped.map((group, groupIndex) => (
            <section
              key={group.key}
              className={`min-h-[560px] rounded-3xl border ${group.borderClass} bg-gradient-to-b ${group.panelClass} p-4 backdrop-blur-md`}
            >
              <div className="mb-5 flex min-h-24 items-center justify-center">
                <img
                  src={group.image}
                  alt={group.title}
                  className="max-h-24 max-w-full object-contain drop-shadow-xl"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                    event.currentTarget.nextElementSibling?.classList.remove(
                      "hidden",
                    );
                  }}
                />
                <div className="hidden rounded-2xl border border-white/30 bg-white/70 p-5 text-muted-foreground">
                  <Package className="h-10 w-10" />
                </div>
              </div>

              <h3 className="mb-5 text-center text-2xl font-black text-white drop-shadow">
                {group.title}
              </h3>

              <div className="space-y-5">
                {group.products.length > 0 ? (
                  group.products.map((product, index) => (
                    <RankOptionCard
                      key={product._id}
                      product={product}
                      index={groupIndex * 4 + index}
                    />
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/30 bg-white/75 p-5 text-center text-base font-black text-foreground">
                    טוען אפשרויות...
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        <div className="mx-auto mt-5 w-fit rounded-2xl bg-[#a9afd8] px-8 py-3 text-center text-2xl font-black text-black">
          כל הזכויות שמורות למדורג*
        </div>
      </div>
    </div>
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
        ) : category.slug === "rank" ? (
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
  );
}
