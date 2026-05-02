import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/order-confirmation")({
  head: () => ({ meta: [{ title: "Order Confirmed — Prince Esquire" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    order: (s.order as string) || "",
    paid: (s.paid as string) || "0",
    mpesa: (s.mpesa as string) || "0",
  }),
  component: OrderConfirmationPage,
});

function OrderConfirmationPage() {
  const { order, paid, mpesa } = Route.useSearch();
  const paidOnline = paid === "1";
  const isMpesa = mpesa === "1";
  return (
    <div className="container mx-auto px-4 py-24 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-gold" />
      <h1 className="mt-6 font-display text-4xl font-bold">Thank you for your order</h1>
      <p className="mt-3 text-muted-foreground">
        Your order <span className="font-mono font-semibold text-foreground">{order}</span> has been received.
        {isMpesa
          ? " M-Pesa payment request was sent to your phone. Once completed, we will process your order."
          : paidOnline
          ? " Payment was successful and we will now process your order."
          : " We'll confirm payment on delivery/pickup and send delivery details shortly."}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/account"><Button variant="default">View my orders</Button></Link>
        <Link to="/shop"><Button variant="outline">Continue shopping</Button></Link>
      </div>
    </div>
  );
}
