import { NextResponse } from "next/server";
import crypto from "crypto";
import { priceItems, priceComboItems, savePending, validateCustomer } from "@/lib/orders";
import type { ComboOrderItem } from "@/lib/orders";

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

  // Recompute amounts server-side — never trust client totals.
  const hasVariants = Array.isArray(body.items) && (body.items as unknown[]).length > 0;
  const hasComboItems = Array.isArray(body.comboItems) && (body.comboItems as unknown[]).length > 0;
  if (!hasVariants && !hasComboItems) {
    return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  }

  const priced = hasVariants
    ? await priceItems(body.items, body.discountCode as string | undefined)
    : { lines: [], amountPaise: 0, campaign: null };
  if (!priced) {
    return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  }

  const pricedCombos: ComboOrderItem[] | null = hasComboItems
    ? await priceComboItems(body.comboItems)
    : [];
  if (pricedCombos === null) {
    return NextResponse.json({ error: "Invalid combo selection" }, { status: 400 });
  }

  const comboAmountPaise = pricedCombos.reduce((sum, i) => sum + Math.round(i.price * 100) * i.qty, 0);
  const totalAmountPaise = priced.amountPaise + comboAmountPaise;

  const itemsSummary = [
    ...priced.lines.map((l) => `${l.title} (${l.size}) x${l.qty}`),
    ...pricedCombos.map((c) => `${c.title} [combo] x${c.qty}`),
  ].join("; ").slice(0, 255);

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
        amount: totalAmountPaise,
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
  } catch (e: any) {
    console.error("Razorpay unreachable:", e);
    return NextResponse.json({ error: `Could not initiate payment: ${e.message || "Network Error"}` }, { status: 502 });
  }

  if (!res.ok) {
    const errText = await res.text();
    console.error("Razorpay order creation failed:", res.status, errText);
    return NextResponse.json({ error: `Could not initiate payment: ${errText}` }, { status: 502 });
  }

  const order = await res.json();

  try {
    await savePending(order.id, {
      customer,
      items: priced.lines,
      comboItems: pricedCombos,
      amount: totalAmountPaise / 100,
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
