import { Link } from "wouter";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-white mt-auto">
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link href="/">
              <span className="text-xl font-black tracking-tight cursor-pointer">
                חנות<span className="text-accent">.</span>
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              החנות הרשמית — מוצרים איכותיים עם שירות מעולה.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">ניווט מהיר</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">ראשי</span>
                </Link>
              </li>
              <li>
                <Link href="/cart">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">עגלת קניות</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">מידע</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-muted-foreground">משלוחים לכל הארץ</span>
              </li>
              <li>
                <span className="text-sm text-muted-foreground">שירות לקוחות זמין</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} חנות יוטיובר. כל הזכויות שמורות.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            נבנה על ידי sqbrawlstars <Heart className="w-3 h-3 text-accent fill-accent" />
          </p>
        </div>
      </div>
    </footer>
  );
}
