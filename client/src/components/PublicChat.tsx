import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "convex/react";
import { Headphones, Lock, MessageCircle, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { api } from "../../../convex/_generated/api";

type PublicChatProps = {
  compact?: boolean;
  onClose?: () => void;
};

function formatMessageTime(value: number) {
  return new Intl.DateTimeFormat("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function PublicChat({ compact = false, onClose }: PublicChatProps) {
  const { user, loading } = useAuth();
  const ticket = useQuery(api.chat.myTicket, user ? {} : "skip");
  const messages = useQuery(api.chat.messages, user ? { ticketId: ticket?._id } : "skip");
  const sendMessage = useMutation(api.chat.send);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedBody = body.trim();

    if (!trimmedBody) return;

    setSubmitting(true);
    try {
      await sendMessage({
        body: trimmedBody,
        ticketId: ticket?._id,
      });
      setBody("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "שליחת ההודעה נכשלה");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className={`flex flex-col overflow-hidden border border-border bg-card shadow-[0_18px_60px_-42px_oklch(0.15_0.015_330)] ${
        compact ? "h-full rounded-2xl" : "min-h-[calc(100svh-13rem)] rounded-2xl"
      }`}
      dir="rtl"
    >
      <header className="border-b border-border px-4 py-3 md:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className={compact ? "text-lg font-black" : "text-2xl font-black"}>
              לייב צ׳אט
            </h1>
            <p className="mt-1 text-xs leading-5 text-muted-foreground md:text-sm">
              תמיכה אישית בזמן אמת עם צוות האתר.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-primary">
              <Headphones className="h-5 w-5" />
            </span>
            {onClose ? (
              <Button
                aria-label="סגירת הצ׳אט"
                className="h-10 w-10"
                size="icon"
                type="button"
                variant="ghost"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto bg-secondary/25 px-3 py-3 md:px-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: compact ? 4 : 6 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-xl bg-white/80" />
            ))}
          </div>
        ) : !user ? (
          <div className="flex h-full min-h-56 items-center justify-center text-center">
            <div className="max-w-xs">
              <Lock className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <p className="mt-3 font-bold">צריך להתחבר כדי לפתוח לייב צ׳אט</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                כך נוכל לשמור את השיחה שלך ולחזור אליך בצורה מסודרת.
              </p>
              <Button asChild className="mt-4">
                <Link href={getLoginUrl()}>כניסה לחשבון</Link>
              </Button>
            </div>
          </div>
        ) : user.role === "admin" ? (
          <div className="flex h-full min-h-56 items-center justify-center text-center">
            <div className="max-w-xs">
              <Headphones className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-3 font-bold">ניהול פניות תמיכה</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                מנהלים מטפלים בשיחות דרך תיבת הפניות.
              </p>
              <Button asChild className="mt-4">
                <Link href="/admin/support">פתיחת תיבת פניות</Link>
              </Button>
            </div>
          </div>
        ) : messages === undefined ? (
          <div className="space-y-3">
            {Array.from({ length: compact ? 4 : 6 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-xl bg-white/80" />
            ))}
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-3">
            {messages.map((message) => (
              <article
                key={message._id}
                className="rounded-xl border border-border/70 bg-white px-4 py-3 text-right shadow-sm"
              >
                <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                  <time className="shrink-0 text-muted-foreground">
                    {formatMessageTime(message.createdAt)}
                  </time>
                  <span className="truncate font-bold text-foreground">
                    {message.senderName}
                  </span>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                  {message.body}
                </p>
              </article>
            ))}
            <div ref={scrollRef} />
          </div>
        ) : (
          <div className="flex h-full min-h-56 items-center justify-center text-center">
            <div>
              <Headphones className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <p className="mt-3 font-bold">איך אפשר לעזור?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                שלחו הודעה ונפתח לכם פנייה מסודרת לתמיכה.
              </p>
            </div>
          </div>
        )}
      </div>

      <form className="border-t border-border bg-card p-3 md:p-4" onSubmit={handleSubmit}>
        <div className="flex items-end gap-2">
          <Textarea
            className="min-h-12 resize-none"
            dir="rtl"
            maxLength={500}
            placeholder="כתבו הודעה..."
            value={body}
            disabled={!user || user.role === "admin"}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <Button
            aria-label="שליחת הודעה"
            className="h-12 w-12 shrink-0"
            disabled={submitting || !body.trim() || !user || user.role === "admin"}
            size="icon"
            type="submit"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </section>
  );
}
