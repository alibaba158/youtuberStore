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
    const handleScroll = () => setScrolled(window.scrollY > 20);
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
          ? "border-b border-border bg-white/95 shadow-sm backdrop-blur-md"
          : "border-b border-border bg-white"
      }`}
    >
      <div className="container">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/">
            <span className="cursor-pointer text-xl font-black tracking-tight text-foreground transition-colors hover:text-accent">
              SET_NAME
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/">
              <span
                className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  location === "/"
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                ראשי
              </span>
            </Link>

            {categories.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    קטגוריות
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
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
              <Button variant="ghost" size="icon" className="relative cursor-pointer">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 ? (
                  <Badge className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-0 bg-accent p-0 text-xs text-accent-foreground">
                    {cartCount}
                  </Badge>
                ) : null}
              </Button>
            </Link>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="cursor-pointer">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-medium">{user?.name || "משתמש"}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
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
                      <DropdownMenuSeparator />
                    </>
                  ) : null}
                  <DropdownMenuItem
                    onClick={() => void logout()}
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="ml-2 h-4 w-4" />
                    התנתק
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" className="text-sm font-medium" onClick={() => (window.location.href = getLoginUrl())}>
                כניסה
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="cursor-pointer md:hidden"
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
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border bg-white md:hidden"
          >
            <div className="container flex flex-col gap-1 py-4">
              <Link href="/">
                <span className="block cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary">
                  ראשי
                </span>
              </Link>
              {categories.map((category) => (
                <Link key={category._id} href={`/category/${category.slug}`}>
                  <span className="block cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                    {category.name}
                  </span>
                </Link>
              ))}
              {!isAuthenticated ? (
                <Button className="mt-2 w-full" onClick={() => (window.location.href = getLoginUrl())}>
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
