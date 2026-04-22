import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, CheckCircle2, Clock, Headphones, Send, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

type TicketStatus = "open" | "pending" | "closed";

const statusLabels: Record<TicketStatus, string> = {
  open: "פתוחות",
  pending: "ממתינות",
  closed: "סגורות",
};

function formatTime(value: number) {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminSupportPage() {
  const { user, loading } = useAuth();
  const [status, setStatus] = useState<TicketStatus>("open");
  const tickets = useQuery(api.chat.adminTickets, user?.role === "admin" ? { status } : "skip");
  const [selectedTicketId, setSelectedTicketId] = useState<Id<"supportTickets"> | null>(null);
  const messages = useQuery(
    api.chat.messages,
    selectedTicketId ? { ticketId: selectedTicketId } : "skip",
  );
  const assignTicket = useMutation(api.chat.assignTicket);
  const updateTicketStatus = useMutation(api.chat.updateTicketStatus);
  const sendMessage = useMutation(api.chat.send);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const selectedTicket = useMemo(
    () => tickets?.find((ticket) => ticket._id === selectedTicketId) ?? null,
    [selectedTicketId, tickets],
  );

  useEffect(() => {
    if (!selectedTicketId && tickets?.[0]) {
      setSelectedTicketId(tickets[0]._id);
    }
    if (selectedTicketId && tickets && !tickets.some((ticket) => ticket._id === selectedTicketId)) {
      setSelectedTicketId(tickets[0]?._id ?? null);
    }
  }, [selectedTicketId, tickets]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: "end" });
  }, [messages?.length]);

  if (loading) {
    return <div className="container py-12"><div className="h-72 rounded-2xl skeleton" /></div>;
  }

  if (user?.role !== "admin") {
    return (
      <div className="container py-20 text-center">
        <Headphones className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
        <h1 className="text-2xl font-black">אין גישה לתיבת התמיכה</h1>
        <Button asChild className="mt-6">
          <Link href="/">חזרה לחנות</Link>
        </Button>
      </div>
    );
  }

  const handleAssign = async () => {
    if (!selectedTicketId) return;
    await assignTicket({ ticketId: selectedTicketId });
    toast.success("הפנייה שויכה אליך");
  };

  const handleStatusChange = async (nextStatus: TicketStatus) => {
    if (!selectedTicketId) return;
    await updateTicketStatus({ ticketId: selectedTicketId, status: nextStatus });
    setStatus(nextStatus);
    toast.success("סטטוס הפנייה עודכן");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTicketId || !body.trim()) return;

    setSubmitting(true);
    try {
      await sendMessage({ ticketId: selectedTicketId, body: body.trim() });
      setBody("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "שליחת ההודעה נכשלה");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20" dir="rtl">
      <div className="container py-8">
        <Link href="/admin">
          <span className="mb-6 inline-flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowRight className="h-4 w-4" />
            חזרה לניהול
          </span>
        </Link>

        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black">לייב צ׳אט - תמיכה</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              בחרו פנייה, שייכו אותה אליכם, והשיבו ללקוח בזמן אמת.
            </p>
          </div>
          <div className="flex gap-2">
            {(Object.keys(statusLabels) as TicketStatus[]).map((value) => (
              <Button
                key={value}
                type="button"
                variant={status === value ? "default" : "outline"}
                onClick={() => setStatus(value)}
              >
                {statusLabels[value]}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid min-h-[680px] grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card shadow-lg lg:grid-cols-[360px_1fr]">
          <aside className="border-b border-border bg-white lg:border-b-0 lg:border-l">
            <div className="border-b border-border p-4">
              <div className="flex items-center justify-between">
                <span className="font-bold">פניות {statusLabels[status]}</span>
                <Badge variant="secondary">{tickets?.length ?? 0}</Badge>
              </div>
            </div>
            <div className="max-h-[620px] overflow-y-auto p-3">
              {tickets === undefined ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="h-24 rounded-xl skeleton" />
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  אין פניות בסטטוס הזה.
                </div>
              ) : (
                <div className="space-y-2">
                  {tickets.map((ticket) => (
                    <button
                      key={ticket._id}
                      type="button"
                      className={`w-full rounded-xl border p-3 text-right transition ${
                        selectedTicketId === ticket._id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:bg-secondary/60"
                      }`}
                      onClick={() => setSelectedTicketId(ticket._id)}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="truncate font-bold">{ticket.customerName}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatTime(ticket.lastMessageAt)}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                        {ticket.lastMessagePreview ?? "פנייה חדשה ללא הודעות"}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {ticket.assignedAdminName ? (
                          <Badge className="bg-accent/15 text-primary" variant="secondary">
                            {ticket.assignedAdminName}
                          </Badge>
                        ) : (
                          <Badge variant="outline">לא שויך</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <section className="flex min-h-[680px] flex-col">
            {selectedTicket ? (
              <>
                <header className="border-b border-border p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-xl font-black">{selectedTicket.customerName}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedTicket.customerEmail ?? "ללא אימייל"} · נוצרה {formatTime(selectedTicket.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button className="gap-2" variant="outline" onClick={handleAssign}>
                        <UserCheck className="h-4 w-4" />
                        שיוך אליי
                      </Button>
                      <Button className="gap-2" variant="outline" onClick={() => void handleStatusChange("pending")}>
                        <Clock className="h-4 w-4" />
                        ממתין
                      </Button>
                      <Button className="gap-2" onClick={() => void handleStatusChange("closed")}>
                        <CheckCircle2 className="h-4 w-4" />
                        סגירה
                      </Button>
                    </div>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto bg-secondary/25 p-4">
                  {messages === undefined ? (
                    <div className="space-y-3">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="h-16 rounded-xl skeleton" />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                      אין עדיין הודעות בפנייה הזו.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <article
                          key={message._id}
                          className={`max-w-[82%] rounded-xl border px-4 py-3 shadow-sm ${
                            message.senderRole === "admin"
                              ? "mr-auto border-primary/20 bg-primary text-primary-foreground"
                              : "ml-auto border-border bg-white"
                          }`}
                        >
                          <div className="mb-1 flex items-center justify-between gap-3 text-xs opacity-80">
                            <time>{formatTime(message.createdAt)}</time>
                            <span className="font-bold">{message.senderName}</span>
                          </div>
                          <p className="whitespace-pre-wrap break-words text-sm leading-6">
                            {message.body}
                          </p>
                        </article>
                      ))}
                      <div ref={scrollRef} />
                    </div>
                  )}
                </div>

                <form className="border-t border-border bg-card p-4" onSubmit={handleSubmit}>
                  <div className="flex items-end gap-2">
                    <Textarea
                      className="min-h-12 resize-none"
                      dir="rtl"
                      maxLength={500}
                      placeholder="כתבו תשובה ללקוח..."
                      value={body}
                      disabled={selectedTicket.status === "closed"}
                      onChange={(event) => setBody(event.target.value)}
                    />
                    <Button
                      aria-label="שליחת תשובה"
                      className="h-12 w-12 shrink-0"
                      disabled={submitting || !body.trim() || selectedTicket.status === "closed"}
                      size="icon"
                      type="submit"
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-center text-muted-foreground">
                בחרו פנייה מהרשימה כדי להתחיל.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
