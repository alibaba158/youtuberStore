import { Link } from "wouter";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSeo } from "@/lib/seo";
import brawlStarsLogo from "@/images/brawlstars_logo.png";
import trophieImg from "@/images/trophie.png";
import rankImg from "@/images/rank.png";

const boostTabs = ["בוסט ראנק", "בוסט גביעים", "אייקון Prestige", "ראנק בראולרים"];

const trustItems = [
  "מוכרים מאומתים",
  "מסירה מהירה",
  "תשלום מאובטח",
  "תמיכה בצ׳אט",
];

const processSteps = [
  {
    title: "בחר שירות",
    text: "בחר את החשבון או קטגוריית הבוסט שמתאימים למה שאתה צריך.",
    icon: Zap,
  },
  {
    title: "בחר הצעה",
    text: "השווה בין המוצרים הזמינים ובחר את האפשרות שמתאימה לך.",
    icon: CheckCircle2,
  },
  {
    title: "סיים תשלום",
    text: "התשלום מתבצע דרך תהליך תשלום מאובטח.",
    icon: CreditCard,
  },
  {
    title: "קבל את השירות",
    text: "קבל את פרטי החשבון או אישור השירות אחרי התשלום.",
    icon: Trophy,
  },
];

export default function BrawlStarsBoostingPage() {
  useSeo({
    title: "Brawl Stars Boosting Services | Razlo Store",
    description:
      "Buy Brawl Stars rank boosting and trophy boosting services from Razlo Store with fast delivery and support.",
    canonicalPath: "/brawl-stars-boosting",
    image: "/favicon.png",
  });

  return (
    <section dir="rtl" className="relative overflow-hidden bg-[#f3f4f7] text-slate-950">
      <div className="absolute inset-x-0 top-0 h-24 bg-[#181923]" />
      <div className="absolute inset-x-0 top-24 h-8 bg-accent/80" />
      <div className="absolute inset-0 top-32 bg-[linear-gradient(110deg,rgba(255,255,255,0.92),rgba(255,255,255,0.7)),url('/src/images/brawlstars_logo.png')] bg-[length:420px] bg-[center_top_3rem] bg-no-repeat" />

      <div className="container relative py-10 md:py-14">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 flex items-center justify-between gap-6 text-white"
        >
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-sm font-black text-accent-foreground">
              RS
            </span>
            <span className="text-lg font-black">Razlo Store</span>
          </Link>
          <div className="hidden items-center gap-6 text-sm font-semibold text-white/70 md:flex">
            <span>חשבונות</span>
            <span>בוסטים</span>
            <span>תמיכה</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mb-8 flex flex-wrap items-center gap-4 border-b border-white/10 pb-4 text-white"
        >
          <div className="flex items-center gap-2 font-black">
            <img src={brawlStarsLogo} alt="Brawl Stars" className="h-9 w-9 object-contain" />
            <span>Brawl Stars Boosting</span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-white/65">
            <span>חשבונות</span>
            <span>יהלומים</span>
            <span className="border-b-2 border-accent pb-3 text-white">בוסטים</span>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
          >
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="max-w-2xl text-3xl font-black leading-tight md:text-5xl">
                  קנה שירותי Brawl Stars ממוכרים אמינים בדקות
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  חשבונות, גביעים, ראנקים וחברויות במקום אחד ברור ונוח.
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-white/80 px-4 py-3 shadow-sm">
                <Star className="h-8 w-8 fill-accent text-accent" />
                <div className="text-sm">
                  <p className="font-black">תגובות חיוביות</p>
                  <p className="text-slate-500">תמיכה מהירה בעברית</p>
                </div>
              </div>
            </div>

            <div className="mb-7 flex flex-wrap gap-3">
              {boostTabs.map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  className={`rounded-full border px-5 py-2 text-sm font-bold shadow-sm transition hover:-translate-y-0.5 ${
                    index === 0
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-accent/30"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {[
                ["ראנק נוכחי", "Bronze I", rankImg, "נקודות נוכחיות", "0"],
                ["ראנק יעד", "Pro", trophieImg, "נקודות יעד", "300"],
              ].map(([label, value, image, secondLabel, secondValue]) => (
                <div key={label} className="overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-4 border-b border-slate-100 p-6">
                    <img src={image} alt="" className="h-16 w-16 object-contain" />
                    <div>
                      <p className="text-sm font-bold text-slate-500">{label}</p>
                      <p className="text-2xl font-black">{value}</p>
                    </div>
                  </div>
                  <div className="space-y-4 p-6">
                    <label className="block text-sm font-bold">{label}</label>
                    <div className="rounded-xl bg-slate-100 px-4 py-4 text-sm font-semibold text-slate-700">
                      {value}
                    </div>
                    <label className="block text-sm font-bold">{secondLabel}</label>
                    <div className="rounded-xl bg-slate-100 px-4 py-4 text-sm font-semibold text-slate-700">
                      {secondValue}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur">
              <h2 className="text-2xl font-black">למה לבחור ב-Razlo Store?</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                אם אתם רוצים לקנות יותר מראנק אחד תוסיפו על ראנק שאתם רוצים בנפרד.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {trustItems.map((item) => (
                  <div key={item} className="flex items-center gap-3 border-t border-slate-200 pt-4">
                    <CheckCircle2 className="h-5 w-5 text-accent" />
                    <span className="font-bold">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, delay: 0.22 }}
            className="h-fit rounded-2xl border border-accent/50 bg-white shadow-xl shadow-slate-950/10 lg:sticky lg:top-6"
          >
            <div className="rounded-t-2xl bg-gradient-to-l from-accent to-sky-400 p-6">
              <p className="text-sm font-black">התאמת הזמנה</p>
            </div>
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-2 rounded-full border border-slate-200 bg-slate-100 p-1">
                <button className="rounded-full bg-white px-4 py-3 text-sm font-bold shadow-sm" type="button">
                  Solo
                </button>
                <button className="rounded-full px-4 py-3 text-sm font-bold text-slate-500" type="button">
                  Duo
                </button>
              </div>
              {["שידור", "תור Solo", "מצב אופליין", "בראולרים מסוימים"].map((item) => (
                <div key={item} className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold">{item}</span>
                  <span className="h-6 w-11 rounded-full bg-slate-200 p-0.5">
                    <span className="block h-5 w-5 rounded-full bg-white shadow-sm" />
                  </span>
                </div>
              ))}
              <Button
                size="lg"
                className="group w-full gap-2 bg-slate-950 font-black text-white hover:bg-slate-800"
              >
                קבל הצעות עכשיו
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
                <ShieldCheck className="h-4 w-4" />
                תשלום מאובטח
              </div>
            </div>
          </motion.aside>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="mt-20 bg-white/55 px-4 py-14 backdrop-blur md:px-8"
        >
          <h2 className="text-center text-3xl font-black">תהליך קנייה פשוט</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-4">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="text-center md:text-right">
                  <Icon className="mx-auto mb-5 h-12 w-12 text-accent md:mx-0 md:mr-0" />
                  <h3 className="text-lg font-black">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{step.text}</p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
