import { MessageCircle } from "lucide-react";
import { STORE_INFO } from "@/lib/format";

export function WhatsAppFab() {
  return (
    <a
      href={`https://wa.me/${STORE_INFO.whatsapp}?text=${encodeURIComponent("Hello Prince Esquire, I'd like to enquire about ")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-success text-success-foreground shadow-2xl transition-transform hover:scale-110"
    >
      <MessageCircle className="h-6 w-6" fill="currentColor" />
      <span className="absolute -top-1 -right-1 flex h-3 w-3">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
        <span className="relative inline-flex h-3 w-3 rounded-full bg-success"></span>
      </span>
    </a>
  );
}
