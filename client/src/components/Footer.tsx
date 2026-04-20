import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-white">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <Link href="/">
              <span className="cursor-pointer text-xl font-black tracking-tight text-foreground">
                Razlo <span className="text-accent">Store</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              חנות לחשבונות ושירותים של Brawl Stars.
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">קישורים</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/">
                  <span className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground">
                    עמוד הבית
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/cart">
                  <span className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground">
                    עגלה
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/account">
                  <span className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground">
                    החשבון שלי
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-foreground">מה יש באתר</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>חשבונות Brawl Stars</li>
              <li>קידום גביעים וראנק</li>
              <li>הזמנות וקבלות</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Razlo Store
        </div>
      </div>
    </footer>
  );
}
