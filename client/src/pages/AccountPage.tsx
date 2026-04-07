import { useEffect, useState } from "react";
import { Link } from "wouter";
import { LogOut, ArrowRight, Palette, User, Mail, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { themes, type ThemeType, applyTheme } from "@/lib/themes";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AccountPage() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>("default");
  const utils = trpc.useUtils();

  const updateTheme = trpc.user.updateTheme.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success("התמה עודכנה בהצלחה!");
    },
    onError: (err: any) => toast.error(err?.message || "שגיאה בעדכון התמה"),
  });

  useEffect(() => {
    if (user?.theme) {
      setSelectedTheme(user.theme as ThemeType);
      applyTheme(user.theme as ThemeType);
    }
  }, [user?.theme]);

  const handleThemeChange = (theme: ThemeType) => {
    setSelectedTheme(theme);
    applyTheme(theme);
    updateTheme.mutate({ theme });
  };

  if (loading || !user) {
    return (
      <div className="container py-12">
        <div className="h-8 skeleton rounded w-48 mb-8" />
        <div className="h-64 skeleton rounded-xl" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-black text-foreground mb-3">נדרשת כניסה לחשבון</h2>
        <p className="text-muted-foreground mb-6">כדי לצפות בהגדרות החשבון שלך, יש להתחבר תחילה.</p>
        <Link href="/">
          <Button className="gap-2">
            <ArrowRight className="w-4 h-4" />
            חזרה לדף הבית
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container py-8">
        {/* Header */}
        <Link href="/">
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-8">
            <ArrowRight className="w-4 h-4" />
            חזרה לחנות
          </span>
        </Link>

        <h1 className="text-2xl md:text-3xl font-black text-foreground mb-8">הגדרות החשבון</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-1"
          >
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-foreground truncate">{user.name}</p>
                  {user.role === "admin" && (
                    <Badge className="mt-1 bg-accent/20 text-accent border-accent/30">
                      מנהל
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {user.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">{user.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    הצטרף: {new Date(user.createdAt).toLocaleDateString("he-IL")}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2 text-destructive hover:text-destructive"
                onClick={logout}
              >
                <LogOut className="w-4 h-4" />
                התנתקות
              </Button>
            </Card>

            {user.role === "admin" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mt-6"
              >
                <Link href="/admin">
                  <Button className="w-full gap-2">
                    <ArrowRight className="w-4 h-4" />
                    פאנל ניהול
                  </Button>
                </Link>
              </motion.div>
            )}
          </motion.div>

          {/* Theme Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Palette className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-bold text-foreground">בחר תמה</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(themes).map(([key, theme]) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleThemeChange(key as ThemeType)}
                    className={`relative p-4 rounded-xl border-2 transition-all ${
                      selectedTheme === key
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/50"
                    }`}
                  >
                    {/* Color Preview */}
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-6 h-6 rounded-full border border-border"
                        style={{ backgroundColor: theme.primary }}
                      />
                      <div
                        className="w-6 h-6 rounded-full border border-border"
                        style={{ backgroundColor: theme.accent }}
                      />
                    </div>

                    <p className="font-semibold text-foreground text-sm text-right">
                      {theme.label}
                    </p>

                    {selectedTheme === key && (
                      <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-accent" />
                    )}
                  </motion.button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground mt-6">
                התמה שלך תישמר ותחול על כל הדפים שלך.
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
