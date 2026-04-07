import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center px-4">
        <p className="text-8xl font-black text-foreground/10 mb-4">404</p>
        <h1 className="text-2xl font-black text-foreground mb-3">הדף לא נמצא</h1>
        <p className="text-muted-foreground mb-8">
          הדף שחיפשת לא קיים או הועבר למקום אחר.
        </p>
        <Button onClick={() => setLocation("/")} className="gap-2">
          <Home className="w-4 h-4" />
          חזרה לדף הבית
        </Button>
      </div>
    </div>
  );
}
