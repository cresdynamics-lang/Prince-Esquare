// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    const siteUrl = Deno.env.get("SITE_URL") ?? "http://localhost:3000";
    if (!stripeSecret) {
      return new Response(JSON.stringify({ error: "Missing STRIPE_SECRET_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as {
      orderNumber: string;
      lineItems: { title: string; quantity: number; unitAmountKes: number }[];
      successUrl: string;
      cancelUrl: string;
    };

    const lineItems = body.lineItems.map((item) => ({
      price_data: {
        currency: "kes",
        product_data: { name: item.title },
        unit_amount: Math.round(item.unitAmountKes * 100),
      },
      quantity: item.quantity,
    }));

    const params = new URLSearchParams();
    params.append("mode", "payment");
    params.append("success_url", body.successUrl || `${siteUrl}/order-confirmation?paid=1&order=${body.orderNumber}`);
    params.append("cancel_url", body.cancelUrl || `${siteUrl}/checkout?payment=cancelled`);
    params.append("client_reference_id", body.orderNumber);
    lineItems.forEach((li, index) => {
      params.append(`line_items[${index}][price_data][currency]`, li.price_data.currency);
      params.append(`line_items[${index}][price_data][product_data][name]`, li.price_data.product_data.name);
      params.append(`line_items[${index}][price_data][unit_amount]`, String(li.price_data.unit_amount));
      params.append(`line_items[${index}][quantity]`, String(li.quantity));
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });
    const stripeData = (await stripeRes.json()) as any;
    if (!stripeRes.ok) {
      return new Response(JSON.stringify({ error: stripeData?.error?.message || "Stripe error" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ url: stripeData.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message ?? "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
