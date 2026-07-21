import { NextResponse } from "next/server";
import crypto from "crypto";
import { saveOrder, takePending } from "@/lib/orders";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  let orderId: string, paymentId: string, signature: string;
  try {
    const body = await req.json();
    orderId = body.razorpay_order_id;
    paymentId = body.razorpay_payment_id;
    signature = body.razorpay_signature;
    if (
      typeof orderId !== "string" ||
      typeof paymentId !== "string" ||
      typeof signature !== "string" ||
      !orderId ||
      !paymentId ||
      !signature
    ) {
      throw new Error();
    }
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const valid =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

  if (!valid) {
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  // Finalize the order record stashed at checkout time.
  let ref: string | null = null;
  try {
    const pending = await takePending(orderId);
    if (pending) {
      ref = await saveOrder({
        method: "prepaid",
        status: "paid",
        amount: pending.amount,
        customer: pending.customer,
        items: pending.items,
        campaign: pending.campaign,
        payment: { razorpayOrderId: orderId, razorpayPaymentId: paymentId },
      });
    } else {
      console.error("Verified payment with no pending record:", orderId, paymentId);
    }
  } catch (e) {
    // Payment is verified either way; the Razorpay dashboard notes still hold order details.
    console.error("Failed to persist paid order:", e);
  }

  return NextResponse.json({ verified: true, ref });
}
