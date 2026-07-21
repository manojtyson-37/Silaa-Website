import { NextResponse } from "next/server";
import crypto from "crypto";
import { priceItems, savePending, validateCustomer } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { error: "Payment gateway not configured" },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const customer = validateCustomer(body.customer);
  if (!customer) {
    return NextResponse.json({ error: "Invalid delivery details" }, { status: 400 });
  }

  // Recompute amount server-side from the catalog — never trust client totals.
  const priced = await priceItems(body.items, body.discountCode as string | undefined);
  if (!priced) {
    return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  }

  const itemsSummary = priced.lines
    .map((l) => `${l.title} (${l.size}) x${l.qty}`)
    .join("; ")
    .slice(0, 255);

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  let res: Response;
  try {
    res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: priced.amountPaise,
        currency: "INR",
        receipt: crypto.randomUUID().slice(0, 32),
        payment_capture: 1,
        notes: {
          items: itemsSummary,
          customer: `${customer.name} / ${customer.phone}`,
          address: `${customer.address}, ${customer.city ?? ""} ${customer.pincode}`.slice(0, 255),
          campaign: priced.campaign ? `${priced.campaign.title} (${priced.campaign.discountCode || "Auto"})` : undefined,
        },
      }),
    });
  } catch (e) {
    console.error("Razorpay unreachable:", e);
    return NextResponse.json({ error: "Could not initiate payment" }, { status: 502 });
  }

  if (!res.ok) {
    console.error("Razorpay order creation failed:", res.status, await res.text());
    return NextResponse.json({ error: "Could not initiate payment" }, { status: 502 });
  }

  const order = await res.json();

  try {
    await savePending(order.id, {
      customer,
      items: priced.lines,
      amount: priced.amountPaise / 100,
      campaign: priced.campaign,
    });
  } catch (e) {
    console.error("Failed to stash pending order:", e);
  }

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId,
  });
}
