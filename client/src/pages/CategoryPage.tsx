import { useMutation, useQuery } from "convex/react";
import { useParams, Link } from "wouter";
import { ArrowRight, Package, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import { api } from "../../../convex/_generated/api";
import { Doc } from "../../../convex/_generated/dataModel";
import { addGuestCartItem } from "@/lib/guestCart";
import noProductsImg from "@/images/noproducts.png";

type Product = Doc<"products">;

const rankGroups = [
  {
    key: "mythic",
    title: "Mythic",
    image: "/rank-mythic.png",
    match: ["mythic", "מיטיק"],
    panelClass: "from-rose-500/18 to-fuchsia-500/12",
    borderClass: "border-rose-400/30",
  },
  {
    key: "diamond",
    title: "Diamond",
    image: "/rank-diamond.png",
    match: ["diamond", "דיימונד"],
    panelClass: "from-sky-500/16 to-cyan-500/10",
    borderClass: "border-sky-400/30",
  },
  {
    key: "legendary",
    title: "Legendary",
    image: "/rank-legendery.png",
    match: ["legendary", "legendery", "לגנדרי", "לג'נדרי"],
    panelClass: "from-amber-500/18 to-stone-500/10",
    borderClass: "border-amber-400/30",
  },
  {
    key: "master",
    title: "Master",
    image: "/rank-master.png",
    match: ["master", "מאסטר"],
    panelClass: "from-emerald-500/18 to-teal-500/10",
    borderClass: "border-emerald-400/30",
  },
] as const;

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

  const handleAddToCart = async () => {
    if (product.stock === 0) {
      return;
    }

    try {
      if (isAuthenticated) {
        await addToCart({ productId: product._id, quantity: 1 });
      } else {
        addGuestCartItem(product._id, 1, product.stock);
      }
      toast.success("׳”׳׳₪׳©׳¨׳•׳× ׳ ׳•׳¡׳₪׳” ׳׳¢׳’׳׳”");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "׳©׳’׳™׳׳” ׳‘׳”׳•׳¡׳₪׳” ׳׳¢׳’׳׳”",
      );
    }
  };

  const disabled = product.stock === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="rounded-2xl border border-white/65 bg-white/88 p-3 shadow-sm backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-right">
          <h3 className="line-clamp-2 text-base font-black leading-snug text-foreground">
            {product.name}
          </h3>
          {product.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {product.description}
            </p>
          ) : null}
        </div>

        <div className="shrink-0 rounded-xl bg-[#a9afd8] px-4 py-3 text-2xl font-black text-black shadow-sm">
          ₪{Number(product.price).toFixed(0)}
        </div>
      </div>

      <Button
        type="button"
        size="sm"
        className="mt-3 w-full gap-2 font-bold"
        variant={disabled ? "outline" : "default"}
        disabled={disabled}
        onClick={() => void handleAddToCart()}
      >
        <ShoppingCart className="h-4 w-4" />
        {disabled ? "׳׳–׳ ׳׳”׳׳׳׳™" : "׳”׳•׳¡׳£ ׳׳¢׳’׳׳”"}
      </Button>
    </motion.div>
  );
}

function RankOptionsPage({ products }: { products: Product[] }) {
  const grouped = rankGroups.map((group) => ({
    ...group,
    products: products.filter((product) => rankGroupForProduct(product).key === group.key),
  }));
  const ungroupedProducts = products.filter(
    (product) =>
      !rankGroups.some((group) =>
        group.match.some((token) =>
          `${product.name} ${product.description ?? ""} ${
            product.imageUrl ?? ""
          }`
            .toLowerCase()
            .includes(token.toLowerCase()),
        ),
      ),
  );

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm md:p-7">
        <div className="mb-6 text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-wider text-accent">
            Rank Boost Options
          </p>
          <h2 className="text-3xl font-black text-foreground md:text-4xl">
            ׳‘׳—׳¨ ׳׳× ׳”׳¨׳׳ ׳§ ׳©׳׳×׳” ׳¨׳•׳¦׳”
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            ׳›׳ ׳׳₪׳©׳¨׳•׳× ׳ ׳•׳¡׳₪׳× ׳׳¢׳’׳׳” ׳›׳׳• ׳׳•׳¦׳¨ ׳¨׳’׳™׳, ׳׳‘׳ ׳”׳§׳˜׳’׳•׳¨׳™׳” ׳ž׳•׳¦׳’׳× ׳›׳×׳₪׳¨׳™׳˜ ׳¨׳׳ ׳§׳™׳.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {grouped.map((group, groupIndex) => (
            <section
              key={group.key}
              className={`min-h-[520px] rounded-3xl border ${group.borderClass} bg-gradient-to-b ${group.panelClass} p-4`}
            >
              <div className="mb-4 flex min-h-28 items-center justify-center">
                <img
                  src={group.image}
                  alt={group.title}
                  className="max-h-24 max-w-full object-contain drop-shadow-lg"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                    event.currentTarget.nextElementSibling?.classList.remove("hidden");
                  }}
                />
                <div className="hidden rounded-2xl border border-border bg-white/60 p-5 text-muted-foreground">
                  <Package className="h-10 w-10" />
                </div>
              </div>

              <h3 className="mb-4 text-center text-2xl font-black text-foreground">
                {group.title}
              </h3>

              {group.products.length > 0 ? (
                <div className="space-y-3">
                  {group.products.map((product, index) => (
                    <RankOptionCard
                      key={product._id}
                      product={product}
                      index={groupIndex * 4 + index}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-white/60 p-4 text-center text-sm leading-7 text-muted-foreground">
                  ׳”׳•׳¡׳£ ׳׳•׳¦׳¨ ׳‘׳§׳˜׳’׳•׳¨׳™׳™׳× Rank ׳©׳”׳©׳ ׳©׳׳• ׳›׳•׳׳ {group.title}.
                </div>
              )}
            </section>
          ))}
        </div>

        {ungroupedProducts.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-4">
            <h3 className="mb-3 text-lg font-black text-foreground">
              ׳׳₪׳©׳¨׳•׳™׳•׳× ׳ ׳•׳¡׳₪׳•׳×
            </h3>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {ungroupedProducts.map((product, index) => (
                <RankOptionCard key={product._id} product={product} index={index} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

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
        ) : category.slug === "rank" ? (
          products.length === 0 ? (
            <div className="py-20 text-center">
              <img src={noProductsImg} alt="׳׳™׳ ׳׳•׳¦׳¨׳™׳" className="mx-auto mb-5 h-28 w-28 object-contain opacity-70" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {emptyState.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {emptyState.description}
              </p>
            </div>
          ) : (
            <RankOptionsPage products={products} />
          )
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
