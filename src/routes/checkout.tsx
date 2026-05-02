import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { KENYA_COUNTIES, formatKES } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout - Prince Esquire" }] }),
  component: CheckoutPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  phone: z.string().trim().min(7).max(20),
  street_address: z.string().trim().min(2).max(200),
  apartment: z.string().trim().max(100).optional(),
  city: z.string().trim().min(2).max(100),
  county: z.string().trim().min(2).max(60),
});

function CheckoutPage() {
  const { lines, subtotal, clear, count } = useCart();
  const { user } = useAuth();
  const [delivery, setDelivery] = useState<"standard" | "express" | "pickup">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"cash_on_delivery" | "stripe_card" | "mpesa">("stripe_card");
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState({ amount: 0, code: "" });
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    email: user?.email ?? "",
    phone: "",
    street_address: "",
    apartment: "",
    city: "Nairobi",
    county: "Nairobi",
  });

  if (count === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Nothing to checkout</h1>
        <Link to="/shop" className="mt-4 inline-block text-gold hover:underline">
          Shop the collection -&gt;
        </Link>
      </div>
    );
  }

  const fee = delivery === "pickup" ? 0 : delivery === "express" ? 800 : 0;
  const total = Math.max(0, subtotal + fee - discount.amount);

  const applyPromo = async () => {
    if (!promoCode.trim()) return;
    setApplyingPromo(true);
    const { data, error } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", promoCode.trim().toUpperCase())
      .eq("is_active", true)
      .single();

    if (error || !data) {
      toast.error("Invalid or expired promo code.");
      setDiscount({ amount: 0, code: "" });
    } else if (data.minimum_order && subtotal < data.minimum_order) {
      toast.error(`Minimum order of ${formatKES(data.minimum_order)} required.`);
      setDiscount({ amount: 0, code: "" });
    } else {
      const calcDiscount =
        data.discount_type === "percent"
          ? subtotal * (data.discount_value / 100)
          : data.discount_value;
      setDiscount({ amount: calcDiscount, code: data.code });
      toast.success("Promo code applied!");
    }
    setApplyingPromo(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error("Please complete all required fields with valid values.");
      return;
    }
    setSubmitting(true);

    const orderPayload: TablesInsert<"orders"> = {
      user_id: user?.id ?? null,
      guest_email: user ? null : parsed.data.email,
      guest_name: user ? null : parsed.data.full_name,
      guest_phone: user ? null : parsed.data.phone,
      delivery_method: delivery,
      delivery_address: parsed.data,
      subtotal,
      delivery_fee: fee,
      discount_amount: discount.amount,
      total,
      promo_code: discount.code || null,
      payment_method: paymentMethod,
      payment_status: "pending",
      status: "pending",
      estimated_delivery: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    };

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert(orderPayload)
      .select("id, order_number")
      .single();

    if (orderErr || !order) {
      console.error(orderErr);
      toast.error("Could not place your order. Please try again.");
      setSubmitting(false);
      return;
    }

    const items: TablesInsert<"order_items">[] = lines.map((l) => ({
      order_id: order.id,
      product_id: l.productId,
      variant_id: l.variantId,
      product_title: l.title,
      product_image: l.image,
      size: l.size,
      color: l.color,
      quantity: l.quantity,
      unit_price: l.price,
      line_total: l.price * l.quantity,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(items);
    if (itemsErr) {
      console.error(itemsErr);
      toast.error(
        `Order ${order.order_number} was created, but line items failed to save. Contact support before retrying.`,
      );
      setSubmitting(false);
      return;
    }

    if (paymentMethod === "stripe_card") {
      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke(
        "create-stripe-checkout",
        {
          body: {
            orderNumber: order.order_number,
            lineItems: lines.map((l) => ({
              title: l.title,
              quantity: l.quantity,
              unitAmountKes: l.price,
            })),
            successUrl: `${window.location.origin}/order-confirmation?order=${order.order_number}&paid=1`,
            cancelUrl: `${window.location.origin}/checkout?payment=cancelled`,
          },
        },
      );
      if (checkoutError || !checkoutData?.url) {
        console.error(checkoutError);
        toast.error("Could not start card payment. Please try again.");
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      window.location.href = checkoutData.url as string;
      return;
    }

    if (paymentMethod === "mpesa") {
      const { data: stkData, error: stkError } = await supabase.functions.invoke("create-mpesa-stk", {
        body: {
          phone: parsed.data.phone,
          amount: total,
          orderNumber: order.order_number,
        },
      });
      if (stkError || !stkData?.checkoutRequestId) {
        console.error(stkError, stkData);
        await supabase
          .from("orders")
          .update({ payment_status: "failed" })
          .eq("id", order.id);
        toast.error("Could not start M-Pesa payment. Please try again.");
        setSubmitting(false);
        return;
      }
      clear();
      toast.success("M-Pesa prompt sent to your phone. Complete payment to confirm order.");
      setSubmitting(false);
      window.location.href = `/order-confirmation?order=${order.order_number}&paid=0&mpesa=1`;
      return;
    }

    clear();
    toast.success(`Order ${order.order_number} placed!`);
    setSubmitting(false);
    window.location.href = `/order-confirmation?order=${order.order_number}&paid=0`;
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-8 font-display text-4xl font-bold">Checkout</h1>
      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section className="rounded-md border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-xl font-bold">Contact & Delivery</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Full name</Label>
                <Input
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  required
                  placeholder="+254 7XX XXX XXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>City / Town</Label>
                <Input
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <Label>Street address</Label>
                <Input
                  required
                  value={form.street_address}
                  onChange={(e) => setForm({ ...form, street_address: e.target.value })}
                />
              </div>
              <div>
                <Label>Apartment / suite (optional)</Label>
                <Input
                  value={form.apartment}
                  onChange={(e) => setForm({ ...form, apartment: e.target.value })}
                />
              </div>
              <div>
                <Label>County</Label>
                <Select value={form.county} onValueChange={(v) => setForm({ ...form, county: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {KENYA_COUNTIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="rounded-md border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-xl font-bold">Delivery Method</h2>
            <RadioGroup
              value={delivery}
              onValueChange={(v) => setDelivery(v as typeof delivery)}
              className="space-y-3"
            >
              {[
                { v: "standard", t: "Standard Delivery", d: "2-4 business days - Free in Nairobi", p: 0 },
                { v: "express", t: "Express Delivery", d: "Next business day - Nairobi", p: 800 },
                { v: "pickup", t: "In-Store Pickup", d: "Collect from Kimathi Street", p: 0 },
              ].map((o) => (
                <label
                  key={o.v}
                  className="flex cursor-pointer items-center gap-3 rounded border border-border p-3 hover:border-gold"
                >
                  <RadioGroupItem value={o.v} />
                  <div className="flex-1">
                    <div className="font-medium">{o.t}</div>
                    <div className="text-xs text-muted-foreground">{o.d}</div>
                  </div>
                  <span className="text-sm font-semibold">
                    {o.p === 0 ? "Free" : formatKES(o.p)}
                  </span>
                </label>
              ))}
            </RadioGroup>
          </section>

          <section className="rounded-md border border-border bg-card p-6">
            <h2 className="mb-2 font-display text-xl font-bold">Payment</h2>
            <RadioGroup
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
              className="space-y-3"
            >
              <label className="flex cursor-pointer items-center gap-3 rounded border border-border p-3 hover:border-gold">
                <RadioGroupItem value="stripe_card" />
                <div>
                  <div className="font-medium">Card Payment (Stripe)</div>
                  <div className="text-xs text-muted-foreground">
                    Pay securely now with card before order processing.
                  </div>
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded border border-border p-3 hover:border-gold">
                <RadioGroupItem value="mpesa" />
                <div>
                  <div className="font-medium">M-Pesa STK Push</div>
                  <div className="text-xs text-muted-foreground">
                    Receive a prompt on your phone and confirm payment with M-Pesa PIN.
                  </div>
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded border border-border p-3 hover:border-gold">
                <RadioGroupItem value="cash_on_delivery" />
                <div>
                  <div className="font-medium">Pay on Delivery / Pickup</div>
                  <div className="text-xs text-muted-foreground">
                    Pay at delivery or at the store when collecting.
                  </div>
                </div>
              </label>
            </RadioGroup>
          </section>
        </div>

        <aside className="h-fit rounded-md border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            {lines.map((l) => (
              <div key={`${l.productId}-${l.variantId}`} className="flex justify-between">
                <span className="line-clamp-1 pr-2">
                  {l.title} <span className="text-muted-foreground">x {l.quantity}</span>
                </span>
                <span>{formatKES(l.price * l.quantity)}</span>
              </div>
            ))}
            <div className="my-3 h-px bg-border" />
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatKES(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{fee === 0 ? "Free" : formatKES(fee)}</span>
            </div>
            {discount.amount > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount ({discount.code})</span>
                <span>-{formatKES(discount.amount)}</span>
              </div>
            )}
            <div className="my-3 h-px bg-border" />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="text-gold">{formatKES(total)}</span>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <Input
              placeholder="Promo code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              disabled={applyingPromo || discount.amount > 0}
            />
            <Button
              type="button"
              variant="outline"
              onClick={applyPromo}
              disabled={applyingPromo || !promoCode || discount.amount > 0}
            >
              Apply
            </Button>
          </div>
          <Button type="submit" variant="hero" size="lg" className="mt-6 w-full" disabled={submitting}>
            {submitting
              ? paymentMethod === "stripe_card"
                ? "Redirecting to payment..."
                : paymentMethod === "mpesa"
                  ? "Starting M-Pesa..."
                : "Placing order..."
              : paymentMethod === "stripe_card"
                ? "Pay Now"
                : paymentMethod === "mpesa"
                  ? "Pay with M-Pesa"
                : "Place Order"}
          </Button>
        </aside>
      </form>
    </div>
  );
}
