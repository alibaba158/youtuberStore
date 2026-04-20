import { FormEvent, useMemo, useState } from "react";
import { Redirect } from "wouter";
import { useAuthActions } from "@convex-dev/auth/react";
import { Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

type AuthMode = "signIn" | "signUp";
type AuthStep = "credentials" | "verifyEmail";

export default function AuthPage() {
  const { isAuthenticated, loading } = useAuth();
  const { signIn } = useAuthActions();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [step, setStep] = useState<AuthStep>("credentials");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const title = useMemo(() => {
    if (step === "verifyEmail") {
      return "Verify your email";
    }
    return mode === "signIn" ? "Sign in" : "Create account";
  }, [mode, step]);

  if (!loading && isAuthenticated) {
    return <Redirect to="/" />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (step === "verifyEmail") {
        await signIn("password", {
          flow: "email-verification",
          email,
          code,
        });
        toast.success("Email verified");
        return;
      }

      await signIn("password", {
        flow: mode,
        name,
        email,
        password,
      });

      if (mode === "signUp") {
        setStep("verifyEmail");
        toast.success("Verification code sent");
      } else {
        toast.success("Signed in");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  const resetToCredentials = () => {
    setStep("credentials");
    setCode("");
  };

  return (
    <div className="container py-16">
      <div className="mx-auto max-w-md">
        <Card className="overflow-hidden border-accent/20 bg-white/95 shadow-xl shadow-accent/10">
          <div className="bg-gradient-to-l from-primary to-accent px-6 py-7 text-primary-foreground">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
              {step === "verifyEmail" ? (
                <Mail className="h-6 w-6" />
              ) : (
                <ShieldCheck className="h-6 w-6" />
              )}
            </div>
            <h1 className="text-2xl font-black">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-primary-foreground/85">
              {step === "verifyEmail"
                ? `Enter the 6-digit code sent to ${email}.`
                : "Use your email and password to access Razlo Store."}
            </p>
          </div>

          <div className="p-6 md:p-8">
            <Tabs
              dir="rtl"
              value={mode}
              onValueChange={(value) => {
                setMode(value as AuthMode);
                resetToCredentials();
              }}
            >
              {step === "credentials" ? (
                <TabsList className="mb-6 grid grid-cols-2">
                  <TabsTrigger value="signIn">Sign in</TabsTrigger>
                  <TabsTrigger value="signUp">Sign up</TabsTrigger>
                </TabsList>
              ) : null}

              <TabsContent value={mode} className="mt-0">
                <form className="space-y-4" onSubmit={handleSubmit}>
                  {step === "verifyEmail" ? (
                    <>
                      <Input
                        dir="ltr"
                        inputMode="numeric"
                        placeholder="123456"
                        autoComplete="one-time-code"
                        maxLength={6}
                        value={code}
                        onChange={(event) =>
                          setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                      />
                      <Button
                        className="w-full"
                        disabled={submitting || code.length < 6}
                        type="submit"
                      >
                        {submitting ? "Verifying..." : "Verify email"}
                      </Button>
                      <Button
                        className="w-full"
                        disabled={submitting}
                        variant="ghost"
                        type="button"
                        onClick={resetToCredentials}
                      >
                        Back to signup
                      </Button>
                    </>
                  ) : (
                    <>
                      {mode === "signUp" ? (
                        <Input
                          dir="rtl"
                          placeholder="Full name"
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
                        minLength={4}
                        maxLength={128}
                        spellCheck={false}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                      <Button className="w-full" disabled={submitting} type="submit">
                        {submitting
                          ? "Loading..."
                          : mode === "signIn"
                            ? "Sign in"
                            : "Create account"}
                      </Button>
                    </>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </div>
  );
}
