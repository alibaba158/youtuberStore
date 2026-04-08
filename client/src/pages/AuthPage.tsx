import { FormEvent, useMemo, useState } from "react";
import { Redirect } from "wouter";
import { useAuthActions } from "@convex-dev/auth/react";
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

  const title = useMemo(
    () => (mode === "signIn" ? "כניסה לחשבון" : "יצירת חשבון"),
    [mode],
  );

  if (!loading && isAuthenticated) {
    return <Redirect to="/" />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await signIn("password", {
        flow: mode,
        name,
        email,
        password,
      });
      toast.success(mode === "signIn" ? "התחברת בהצלחה" : "החשבון נוצר בהצלחה");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "פעולת האימות נכשלה");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-md">
        <Card className="p-6 md:p-8">
          <Tabs
            dir="rtl"
            value={mode}
            onValueChange={(value) => setMode(value as AuthMode)}
          >
            <TabsList className="mb-6 grid grid-cols-2">
              <TabsTrigger value="signIn">כניסה</TabsTrigger>
              <TabsTrigger value="signUp">הרשמה</TabsTrigger>
            </TabsList>

            <TabsContent value={mode} className="mt-0">
              <div className="mb-6 text-right">
                <h1 className="text-2xl font-black text-foreground">{title}</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  האפליקציה כעת משתמשת ב-Convex עבור אימות, מסד הנתונים והעגלה.
                </p>
              </div>

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
                  placeholder="Password"
                  autoComplete={mode === "signIn" ? "current-password" : "new-password"}
                  minLength={12}
                  maxLength={128}
                  spellCheck={false}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <Button className="w-full" disabled={submitting} type="submit">
                  {submitting ? "טוען..." : mode === "signIn" ? "להתחבר" : "ליצור חשבון"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
