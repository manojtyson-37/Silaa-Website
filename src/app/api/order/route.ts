import { NextResponse } from "next/server";
import { priceItems, priceComboItems, saveOrder, validateCustomer } from "@/lib/orders";
import type { ComboOrderItem } from "@/lib/orders";

export const dynamic = "force-dynamic";

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

  try {
    const ref = await saveOrder({
      method: "cod",
      status: "pending",
      amount: (priced.amountPaise + comboAmountPaise) / 100,
      customer,
      items: priced.lines,
      comboItems: pricedCombos,
      campaign: priced.campaign,
    });
    return NextResponse.json({ ref });
  } catch (e) {
    console.error("COD order save failed:", e);
    return NextResponse.json({ error: "Could not place order" }, { status: 500 });
  }
}
