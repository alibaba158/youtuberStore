import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import {
  ArrowRight,
  Check,
  Clock3,
  CreditCard,
  ImageIcon,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import epicSkinImage from "@/images/epic-skin.png";
import legendarySkinImage from "@/images/legendary-skin.png";
import mythicSkinImage from "@/images/mythic-skin.png";
import rareSkinImage from "@/images/rare-skin.png";
import superRareSkinImage from "@/images/super-rare-skin.png";
import { addGuestCartItem } from "@/lib/guestCart";
import { api } from "../../../convex/_generated/api";

const skinStats = [
  { key: "rareSkinCount", label: "רייר", image: rareSkinImage },
  { key: "superRareSkinCount", label: "סופר רייר", image: superRareSkinImage },
  { key: "epicSkinCount", label: "אפיק", image: epicSkinImage },
  { key: "mythicSkinCount", label: "מיתיק", image: mythicSkinImage },
  { key: "legendarySkinCount", label: "לג'נדרי", image: legendarySkinImage },
] as const;

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">אזל מהמלאי</span>;
  }
  if (stock <= 5) {
    return <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">נותרו {stock} יחידות בלבד</span>;
  }
  return <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">במלאי</span>;
}

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [submittingBuy, setSubmittingBuy] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const { isAuthenticated } = useAuth();
  const product = useQuery(
    api.store.productById,
    params.id ? { id: params.id as never } : "skip",
  );
  const addToCart = useMutation(api.store.addToCart);
  const createOrderFromItems = useMutation(api.orders.createGuestOrder);

  const galleryImages = useMemo(() => {
    if (!product) return [];
    const images = [
      product.imageUrl,
      ...((product.imageUrls ?? []) as string[]),
    ].filter((url): url is string => Boolean(url));
    return Array.from(new Set(images)).slice(0, 6);
  }, [product]);

  const handleAddToCart = async () => {
    if (!product || product.stock === 0) return;

    try {
      if (isAuthenticated) {
        await addToCart({ productId: product._id, quantity });
      } else {
        addGuestCartItem(product._id, quantity, product.stock);
      }
      toast.success(`${product.name} נוסף לעגלה`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "שגיאה בהוספה לעגלה");
    }
  };

  const handleBuyNow = async () => {
    if (!product || product.stock === 0) return;
    if (!isAuthenticated) {
      const trimmedGuestEmail = guestEmail.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedGuestEmail)) {
        toast.error("צריך להזין אימייל תקין כדי לקבל קבלה");
        return;
      }
    }

    setSubmittingBuy(true);
    try {
      const orderId = await createOrderFromItems({
        items: [{ productId: product._id, quantity }],
        customerEmail: isAuthenticated ? undefined : guestEmail.trim(),
      });
      setLocation(`/checkout/${orderId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "לא הצלחנו להתחיל רכישה");
    } finally {
      setSubmittingBuy(false);
    }
  };

  if (product === undefined) {
    return (
      <div className="container py-10">
        <div className="mb-6 h-4 w-40 rounded skeleton" />
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="h-[520px] rounded-2xl skeleton" />
          <div className="h-[520px] rounded-2xl skeleton" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <h2 className="mb-3 text-2xl font-bold text-foreground">המוצר לא נמצא</h2>
        <Link href="/">
          <span className="cursor-pointer text-accent hover:underline">חזרה לדף הבית</span>
        </Link>
      </div>
    );
  }

  const price = Number.parseFloat(product.price);
  const mainImage = galleryImages[selectedImage];
  const trophyCount = Number(product.trophyCount ?? 0);
  const visibleSkinStats = skinStats.map((stat) => ({
    ...stat,
    value: Number(product[stat.key] ?? 0),
  }));

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <div className="border-b border-border bg-card">
        <div className="container py-4">
          <Link href="/">
            <span className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              <ArrowRight className="h-4 w-4" />
              חזרה לחנות
            </span>
          </Link>
        </div>
      </div>

      <main className="container py-6">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-md bg-primary/10 px-2.5 py-1 font-bold text-primary">Brawl Stars</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-foreground">{product.name}</span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
          <section className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="grid gap-0 md:grid-cols-[112px_1fr]">
                <div className="order-2 flex gap-3 border-t border-border bg-muted/30 p-3 md:order-1 md:flex-col md:border-l md:border-t-0">
                  {galleryImages.length > 0 ? (
                    galleryImages.map((image, index) => (
                      <button
                        key={image}
                        type="button"
                        className={`flex aspect-square w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white p-2 transition md:w-full ${
                          selectedImage === index
                            ? "border-primary ring-2 ring-primary/20"
                            : "border-border hover:border-primary/40"
                        }`}
                        onClick={() => setSelectedImage(index)}
                      >
                        <img src={image} alt="" className="h-full w-full object-contain" />
                      </button>
                    ))
                  ) : (
                    <div className="flex aspect-square w-20 items-center justify-center rounded-xl border border-border bg-white md:w-full">
                      <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                <div className="order-1 flex min-h-[420px] items-center justify-center bg-white p-8 md:order-2">
                  {mainImage ? (
                    <img
                      src={mainImage}
                      alt={product.name}
                      className="max-h-[520px] max-w-full object-contain"
                    />
                  ) : (
                    <div className="flex h-72 w-full items-center justify-center rounded-2xl bg-muted">
                      <Package className="h-20 w-20 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-xl font-black">נתוני החשבון</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-800">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">גביעים</p>
                    <p className="text-lg font-black">{trophyCount.toLocaleString("he-IL")}</p>
                  </div>
                </div>

                {visibleSkinStats.map((stat) => (
                  <div key={stat.key} className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white p-1.5">
                      <img
                        src={stat.image}
                        alt=""
                        className="h-full w-full object-contain"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground">סקינים {stat.label}</p>
                      <p className="text-lg font-black">{stat.value.toLocaleString("he-IL")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-3 text-xl font-black">פרטי המוצר</h2>
              <p className="max-w-3xl whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {product.description || "אין תיאור למוצר הזה עדיין."}
              </p>
            </section>
          </section>

          <motion.aside
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="h-fit rounded-2xl border border-border bg-card shadow-sm lg:sticky lg:top-24"
          >
            <div className="border-b border-border p-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-black leading-tight">{product.name}</h1>
                  <p className="mt-1 text-sm text-muted-foreground">שירות דיגיטלי ל-Brawl Stars</p>
                </div>
                {product.isFeatured ? (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-black text-yellow-900">
                    מומלץ
                  </span>
                ) : null}
              </div>
              <StockBadge stock={product.stock} />
            </div>

            <div className="space-y-5 p-5">
              <div>
                <p className="text-sm font-semibold text-muted-foreground">מחיר</p>
                <p className="mt-1 text-4xl font-black text-foreground">₪{price.toFixed(2)}</p>
              </div>

              {product.stock > 0 ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-bold text-foreground">כמות</span>
                  <div className="flex items-center overflow-hidden rounded-xl border border-border bg-background">
                    <button
                      type="button"
                      onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                      className="flex h-10 w-11 items-center justify-center hover:bg-muted"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center text-sm font-black">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((value) => Math.min(product.stock, value + 1))}
                      className="flex h-10 w-11 items-center justify-center hover:bg-muted"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <Clock3 className="h-4 w-4 text-primary" />
                    זמן אספקה
                  </span>
                  <span className="text-sm font-black">עד 24 שעות</span>
                </div>
                <div className="flex items-center justify-between border-b border-border py-3">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <CreditCard className="h-4 w-4 text-primary" />
                    אמצעי תשלום
                  </span>
                  <span className="flex flex-wrap items-center justify-end gap-2">
                    <span className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-2 text-xs font-black">
                      <img
                        src="https://svgl.app/library/google-wordmark.svg"
                        alt="Google"
                        className="h-3.5 w-auto"
                      />
                      <span>Pay</span>
                    </span>
                    <span className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-white px-2 text-xs font-black">
                      <img
                        src="https://svgl.app/library/apple.svg"
                        alt="Apple"
                        className="h-4 w-auto"
                      />
                      <span>Pay</span>
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="flex items-center gap-2 text-sm font-bold">
                    <Zap className="h-4 w-4 text-primary" />
                    סוג מוצר
                  </span>
                  <span className="text-sm font-black">דיגיטלי</span>
                </div>
              </div>

              <div className="grid gap-3">
                {!isAuthenticated ? (
                  <div className="space-y-1.5">
                    <label className="block text-right text-sm font-bold text-foreground">
                      אימייל לקבלה
                    </label>
                    <Input
                      dir="ltr"
                      type="email"
                      value={guestEmail}
                      onChange={(event) => setGuestEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                    <p className="text-right text-xs text-muted-foreground">
                      נשלח את האימייל הזה ל-Stripe כדי לשלוח קבלה אחרי תשלום מוצלח.
                    </p>
                  </div>
                ) : null}
                <Button
                  size="lg"
                  className="h-12 gap-2 text-base font-black"
                  disabled={product.stock === 0 || submittingBuy}
                  onClick={() => void handleBuyNow()}
                >
                  <Sparkles className="h-5 w-5" />
                  {submittingBuy ? "פותח הזמנה..." : "קנה עכשיו"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 gap-2 text-base font-bold"
                  disabled={product.stock === 0}
                  onClick={() => void handleAddToCart()}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {product.stock === 0 ? "אזל מהמלאי" : "הוסף לעגלה"}
                </Button>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                {["מענה בלייב צ׳אט", "עדכון אחרי רכישה", "מסירת פרטים אחרי תשלום"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        </div>
      </main>
    </div>
  );
}
