// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatPhone(input: string): string {
  const cleaned = input.replace(/[^\d]/g, "");
  if (cleaned.startsWith("254")) return cleaned;
  if (cleaned.startsWith("0")) return `254${cleaned.slice(1)}`;
  if (cleaned.startsWith("7") || cleaned.startsWith("1")) return `254${cleaned}`;
  return cleaned;
}

function timestamp() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
    const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");
    const passkey = Deno.env.get("MPESA_PASSKEY");
    const shortcode = Deno.env.get("MPESA_SHORTCODE");
    const callbackUrl = Deno.env.get("MPESA_CALLBACK_URL");
    const env = (Deno.env.get("MPESA_ENV") ?? "sandbox").toLowerCase();

    if (!consumerKey || !consumerSecret || !passkey || !shortcode || !callbackUrl) {
      return new Response(
        JSON.stringify({ error: "Missing M-Pesa function secrets configuration." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = (await req.json()) as {
      phone: string;
      amount: number;
      orderNumber: string;
    };

    const phone = formatPhone(body.phone || "");
    const amount = Math.max(1, Math.round(Number(body.amount || 0)));
    const orderNumber = body.orderNumber || "ORDER";
    if (!phone || Number.isNaN(amount)) {
      return new Response(JSON.stringify({ error: "Invalid phone or amount." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl =
      env === "live" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";

    const authTokenRes = await fetch(
      `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${btoa(`${consumerKey}:${consumerSecret}`)}`,
        },
      },
    );
    const authTokenData = (await authTokenRes.json()) as any;
    if (!authTokenRes.ok || !authTokenData?.access_token) {
      return new Response(
        JSON.stringify({ error: "Could not authorize M-Pesa request.", details: authTokenData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const ts = timestamp();
    const password = btoa(`${shortcode}${passkey}${ts}`);

    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authTokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: ts,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: shortcode,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: orderNumber,
        TransactionDesc: `Prince Esquare ${orderNumber}`,
      }),
    });
    const stkData = (await stkRes.json()) as any;
    if (!stkRes.ok || stkData?.ResponseCode !== "0") {
      return new Response(
        JSON.stringify({ error: stkData?.errorMessage || stkData?.ResponseDescription || "STK push failed", details: stkData }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({
        merchantRequestId: stkData.MerchantRequestID,
        checkoutRequestId: stkData.CheckoutRequestID,
        customerMessage: stkData.CustomerMessage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message ?? "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
