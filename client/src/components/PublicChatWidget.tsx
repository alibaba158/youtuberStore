import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicChat from "@/components/PublicChat";

const STORAGE_KEY = "razlo-public-chat-open";

export default function PublicChatWidget() {
  const [open, setOpen] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(open));
  }, [open]);

  return (
    <div className="fixed bottom-4 left-4 z-40 md:bottom-6 md:left-6" dir="rtl">
      {open ? (
        <div className="h-[min(640px,calc(100svh-6rem))] w-[calc(100vw-2rem)] max-w-[390px]">
          <PublicChat compact onClose={() => setOpen(false)} />
        </div>
      ) : (
        <Button
          aria-label="פתיחת לייב צ׳אט"
          className="h-14 gap-2 rounded-full px-5 shadow-lg shadow-accent/20"
          type="button"
          onClick={() => setOpen(true)}
        >
          <MessageCircle className="h-5 w-5" />
          לייב צ׳אט
        </Button>
      )}
    </div>
  );
}
