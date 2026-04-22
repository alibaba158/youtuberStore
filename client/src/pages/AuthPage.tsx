import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, Redirect } from "wouter";
import { useAuthActions } from "@convex-dev/auth/react";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type AuthMode = "signIn" | "signUp";

export default function AuthPage() {
  const { isAuthenticated, loading } = useAuth();
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const title = useMemo(
    () => (mode === "signIn" ? "כניסה לחשבון" : "פתיחת חשבון"),
    [mode],
  );

  const description =
    mode === "signIn"
      ? "המשיכו להזמנות, קבלות ופרטי החשבון שלכם."
      : "צרו חשבון כדי לשמור הזמנות ולקבל עדכונים.";

  useEffect(() => {
    if (!signedIn) return;
    const timeout = window.setTimeout(() => {
      window.location.replace("/");
    }, 600);

    return () => window.clearTimeout(timeout);
  }, [signedIn]);

  if (!loading && isAuthenticated) {
    return <Redirect to="/" />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const result = await signIn("password", {
        flow: mode,
        name,
        email,
        password,
      });

      if (!result.signingIn) {
        throw new Error("הכניסה לא הושלמה. נסו שוב.");
      }

      toast.success("נכנסת לחשבון");
      setSignedIn(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "הכניסה נכשלה");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-[420px]">
        <Card className="border-border/80 bg-card p-6 shadow-[0_18px_60px_-36px_oklch(0.15_0.015_330)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-black leading-tight">{title}</h1>
              <p className="mt-1.5 text-sm leading-5 text-muted-foreground">
                {description}
              </p>
            </div>
            <Button
              asChild
              aria-label="חזרה לעמוד הראשי"
              className="h-9 w-9 shrink-0 rounded-lg bg-accent/10 text-primary hover:bg-accent/15"
              size="icon"
              variant="ghost"
            >
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="pt-4">
            <Tabs dir="rtl" value={mode} onValueChange={(value) => setMode(value as AuthMode)}>
              <TabsList className="mb-3 grid grid-cols-2">
                <TabsTrigger value="signIn">כניסה</TabsTrigger>
                <TabsTrigger value="signUp">הרשמה</TabsTrigger>
              </TabsList>

              <TabsContent value={mode} className="mt-0">
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {mode === "signUp" ? (
                    <Input
                      dir="rtl"
                      placeholder="שם מלא"
                      autoComplete="name"
                      maxLength={80}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  ) : null}
                  <Input
                    dir="ltr"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    inputMode="email"
                    maxLength={254}
                    spellCheck={false}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <Input
                    dir="ltr"
                    type="password"
                    placeholder="סיסמה"
                    autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                    minLength={4}
                    maxLength={128}
                    spellCheck={false}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <Button className="w-full" disabled={submitting} type="submit">
                    {submitting
                      ? "טוען..."
                      : mode === "signIn"
                        ? "כניסה"
                        : "יצירת חשבון"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </div>
  );
}
