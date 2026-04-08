import { useEffect, useState } from "react";
import { Link } from "wouter";
import { LogOut, ArrowRight, Palette, User, Mail, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { useAuth } from "@/_core/hooks/useAuth";
import { themes, type ThemeType, applyTheme } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "../../../convex/_generated/api";

export default function AccountPage() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>("default");
  const updateTheme = useMutation(api.store.updateTheme);

  useEffect(() => {
    if (user?.theme) {
      setSelectedTheme(user.theme as ThemeType);
      applyTheme(user.theme as ThemeType);
    }
  }, [user?.theme]);

  const handleThemeChange = async (theme: ThemeType) => {
    setSelectedTheme(theme);
    applyTheme(theme);

    try {
      await updateTheme({ theme });
      toast.success("התמה עודכנה בהצלחה");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "שגיאה בעדכון התמה");
    }
  };

  if (loading || !user) {
    return (
      <div className="container py-12">
        <div className="mb-8 h-8 w-48 rounded skeleton" />
        <div className="h-64 rounded-xl skeleton" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <h2 className="mb-3 text-2xl font-black text-foreground">נדרשת כניסה לחשבון</h2>
        <p className="mb-6 text-muted-foreground">כדי לצפות בהגדרות החשבון שלך צריך להתחבר קודם.</p>
        <Link href="/">
          <Button className="gap-2">
            <ArrowRight className="h-4 w-4" />
            חזרה לדף הבית
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container py-8">
        <Link href="/">
          <span className="mb-8 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowRight className="h-4 w-4" />
            חזרה לחנות
          </span>
        </Link>

        <h1 className="mb-8 text-2xl font-black text-foreground md:text-3xl">הגדרות החשבון</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-1"
          >
            <Card className="p-6">
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                  <User className="h-8 w-8 text-accent" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-foreground">{user.name}</p>
                  {user.role === "admin" ? (
                    <Badge className="mt-1 border-accent/30 bg-accent/20 text-accent">מנהל</Badge>
                  ) : null}
                </div>
              </div>

              <div className="mb-6 space-y-3">
                {user.email ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate text-muted-foreground">{user.email}</span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    הצטרף: {new Date(user.createdAt).toLocaleDateString("he-IL")}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2 text-destructive hover:text-destructive"
                onClick={() => void logout()}
              >
                <LogOut className="h-4 w-4" />
                התנתקות
              </Button>
            </Card>

            {user.role === "admin" ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-6"
              >
                <Link href="/admin">
                  <Button className="w-full gap-2">
                    <ArrowRight className="h-4 w-4" />
                    פאנל ניהול
                  </Button>
                </Link>
              </motion.div>
            ) : null}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="p-6">
              <div className="mb-6 flex items-center gap-2">
                <Palette className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-bold text-foreground">בחר תמה</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(themes).map(([key, theme]) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => void handleThemeChange(key as ThemeType)}
                    className={`relative rounded-xl border-2 p-4 transition-all ${
                      selectedTheme === key
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: theme.primary }} />
                      <div className="h-6 w-6 rounded-full border border-border" style={{ backgroundColor: theme.accent }} />
                    </div>
                    <p className="text-right text-sm font-semibold text-foreground">{theme.label}</p>
                    {selectedTheme === key ? <div className="absolute left-2 top-2 h-2 w-2 rounded-full bg-accent" /> : null}
                  </motion.button>
                ))}
              </div>

              <p className="mt-6 text-xs text-muted-foreground">
                הבחירה נשמרת בפרופיל המשתמש ב-Convex ומוחלת על כל הדפים.
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
