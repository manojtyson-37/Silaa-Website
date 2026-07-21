import { NextResponse } from "next/server";
import { priceItems, saveOrder, validateCustomer } from "@/lib/orders";

export const dynamic = "force-dynamic";

// Records a COD order. Prepaid orders are recorded by /api/verify.
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const customer = validateCustomer(body.customer);
  if (!customer) {
    return NextResponse.json({ error: "Invalid customer" }, { status: 400 });
  }

  const priced = await priceItems(body.items, body.discountCode as string | undefined);
  if (!priced) {
    return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  }

  try {
    const ref = await saveOrder({
      method: "cod",
      status: "pending",
      amount: priced.amountPaise / 100,
      customer,
      items: priced.lines,
      campaign: priced.campaign,
    });
    return NextResponse.json({ ref });
  } catch (e) {
    console.error("COD order save failed:", e);
    return NextResponse.json({ error: "Could not place order" }, { status: 500 });
  }
}
