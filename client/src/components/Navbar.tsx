import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  ShoppingCart,
  Menu,
  X,
  User,
  LogOut,
  Shield,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "convex/react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { api } from "../../../convex/_generated/api";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const navData = useQuery(api.store.navData);
  const categories = navData?.categories ?? [];
  const cartCount = isAuthenticated ? (navData?.cartCount ?? 0) : 0;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-border/60 bg-white/80 shadow-lg backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="container">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/">
            <span className="cursor-pointer text-xl font-black tracking-tight text-foreground transition-all duration-300 hover:text-primary hover:scale-105">
              SET_NAME
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/">
              <span
                className={`cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  location === "/"
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                }`}
              >
                ראשי
              </span>
            </Link>

            {categories.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-secondary/70 hover:text-foreground">
                    קטגוריות
                    <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 border-border/60 bg-white/95 backdrop-blur-xl">
                  {categories.map((category) => (
                    <DropdownMenuItem key={category._id} asChild>
                      <Link href={`/category/${category.slug}`}>
                        <span className="w-full cursor-pointer">{category.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative cursor-pointer transition-all duration-200 hover:bg-secondary/70 hover:scale-105">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 ? (
                  <Badge className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-0 bg-accent p-0 text-xs font-bold text-accent-foreground shadow-md">
                    {cartCount}
                  </Badge>
                ) : null}
              </Button>
            </Link>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="cursor-pointer transition-all duration-200 hover:bg-secondary/70 hover:scale-105">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 border-border/60 bg-white/95 backdrop-blur-xl">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-semibold">{user?.name || "משתמש"}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-border/60" />
                  <DropdownMenuItem asChild>
                    <Link href="/account">
                      <span className="flex w-full cursor-pointer items-center gap-2">
                        <User className="h-4 w-4" />
                        הגדרות חשבון
                      </span>
                    </Link>
                  </DropdownMenuItem>
                  {user?.role === "admin" ? (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <span className="flex w-full cursor-pointer items-center gap-2">
                            <Shield className="h-4 w-4" />
                            ניהול
                          </span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/60" />
                    </>
                  ) : null}
                  <DropdownMenuItem
                    onClick={() => void logout()}
                    className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <LogOut className="ml-2 h-4 w-4" />
                    התנתק
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" className="text-sm font-semibold shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105" onClick={() => (window.location.href = getLoginUrl())}>
                כניסה
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer transition-all duration-200 hover:bg-secondary/70 md:hidden"
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-border/60 bg-white/95 backdrop-blur-xl md:hidden"
          >
            <div className="container flex flex-col gap-1 py-4">
              <Link href="/">
                <span className="block cursor-pointer rounded-xl px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70">
                  ראשי
                </span>
              </Link>
              {categories.map((category) => (
                <Link key={category._id} href={`/category/${category.slug}`}>
                  <span className="block cursor-pointer rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground">
                    {category.name}
                  </span>
                </Link>
              ))}
              {!isAuthenticated ? (
                <Button className="mt-2 w-full font-semibold shadow-md" onClick={() => (window.location.href = getLoginUrl())}>
                  כניסה
                </Button>
              ) : null}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
