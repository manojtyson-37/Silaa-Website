"use client";

import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const [method, setMethod] = useState<"prepaid" | "cod">("prepaid");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    pincode: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const formValid =
    form.name.trim().length > 1 &&
    /^\d{10}$/.test(form.phone.replace(/\D/g, "").slice(-10)) &&
    form.address.trim().length > 5 &&
    /^\d{6}$/.test(form.pincode);

  async function placeOrder() {
    setError(null);
    if (!formValid) {
      setError("Please fill name, 10-digit phone, address and 6-digit pincode.");
      return;
    }
    if (items.length === 0) return;

    const payload = {
      items: items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
      customer: form,
    };

    setBusy(true);

    if (method === "cod") {
      try {
        const res = await fetch("/api/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not place order");
        clear();
        router.push(`/success?method=cod&ref=${encodeURIComponent(data.ref)}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        setBusy(false);
      }
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start payment");

      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "SILA Collective",
        description: `${items.length} item(s)`,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        notes: { address: `${form.address}, ${form.city} ${form.pincode}` },
        theme: { color: "#141210" },
        handler: async (resp: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          const v = await fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(resp),
          });
          const verifyData = await v.json();
          if (verifyData.verified) {
            clear();
            router.push(
              `/success?method=prepaid${verifyData.ref ? `&ref=${encodeURIComponent(verifyData.ref)}` : ""}`
            );
          } else {
            setError("Payment verification failed. Contact us if amount was deducted.");
            setBusy(false);
          }
        },
        modal: { ondismiss: () => setBusy(false) },
      });
      rzp.open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] grid place-items-center px-6 text-center">
        <div>
          <h1 className="font-serif text-4xl mb-4">Your bag is empty</h1>
          <Link
            href="/shop"
            className="inline-block bg-ink text-ivory px-10 py-4 text-xs uppercase tracking-[0.25em] hover:bg-gold transition-colors"
          >
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  const inputCls =
    "w-full border border-ink/20 bg-transparent px-4 py-3.5 text-sm focus:outline-none focus:border-gold transition-colors placeholder:text-smoke/50";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-8 pt-10 pb-24">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <h1 className="font-serif text-5xl sm:text-6xl mb-12">
        Check<span className="italic text-gold">out</span>
      </h1>

      <div className="grid lg:grid-cols-5 gap-12">
        <div className="lg:col-span-3 space-y-8">
          <section>
            <h2 className="text-xs uppercase tracking-[0.25em] text-smoke mb-5">
              1 — Delivery details
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <input className={inputCls} placeholder="Full name *" value={form.name} onChange={set("name")} />
              <input className={inputCls} placeholder="Phone (10 digits) *" inputMode="numeric" value={form.phone} onChange={set("phone")} />
              <input className={`${inputCls} sm:col-span-2`} placeholder="Email (for order updates)" type="email" value={form.email} onChange={set("email")} />
              <textarea className={`${inputCls} sm:col-span-2 min-h-[90px]`} placeholder="Full address *" value={form.address} onChange={set("address")} />
              <input className={inputCls} placeholder="City" value={form.city} onChange={set("city")} />
              <input className={inputCls} placeholder="Pincode *" inputMode="numeric" value={form.pincode} onChange={set("pincode")} />
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-[0.25em] text-smoke mb-5">
              2 — Payment method
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => setMethod("prepaid")}
                className={`text-left border p-5 transition-colors cursor-pointer ${
                  method === "prepaid" ? "border-gold bg-gold/5" : "border-ink/20"
                }`}
              >
                <p className="font-medium text-sm">Pay online</p>
                <p className="text-xs text-smoke mt-1.5">
                  UPI, cards, netbanking via Razorpay · free shipping
                </p>
              </button>
              <button
                onClick={() => setMethod("cod")}
                className={`text-left border p-5 transition-colors cursor-pointer ${
                  method === "cod" ? "border-gold bg-gold/5" : "border-ink/20"
                }`}
              >
                <p className="font-medium text-sm">Cash on delivery</p>
                <p className="text-xs text-smoke mt-1.5">Pay when your order arrives</p>
              </button>
            </div>
          </section>

          {error && (
            <p className="text-sm text-red-700 border border-red-200 bg-red-50 px-4 py-3">
              {error}
            </p>
          )}

          <button
            onClick={placeOrder}
            disabled={busy}
            className="w-full bg-ink text-ivory py-5 text-xs uppercase tracking-[0.3em] hover:bg-gold transition-colors duration-300 disabled:opacity-50 cursor-pointer"
          >
            {busy
              ? "Processing…"
              : method === "cod"
              ? `Place COD order — ${inr(subtotal)}`
              : `Pay ${inr(subtotal)}`}
          </button>
        </div>

        <aside className="lg:col-span-2">
          <div className="border border-ink/10 p-6 sticky top-28">
            <h2 className="text-xs uppercase tracking-[0.25em] text-smoke mb-5">
              Order summary
            </h2>
            <div className="space-y-4 max-h-[320px] overflow-y-auto pr-2">
              {items.map((i) => (
                <div key={i.variantId} className="flex gap-3 items-center">
                  <div className="relative w-14 h-20 bg-cream shrink-0">
                    {i.image && (
                      <Image src={i.image} alt={i.title} fill sizes="56px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug truncate">{i.title}</p>
                    <p className="text-[11px] text-smoke mt-0.5">
                      {i.size} × {i.qty}
                    </p>
                  </div>
                  <p className="text-xs font-medium">{inr(i.price * i.qty)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-ink/10 mt-5 pt-5 space-y-2 text-sm">
              <div className="flex justify-between text-smoke">
                <span>Subtotal</span>
                <span>{inr(subtotal)}</span>
              </div>
              <div className="flex justify-between text-smoke">
                <span>Shipping</span>
                <span>{method === "prepaid" ? "Free" : "At delivery"}</span>
              </div>
              <div className="flex justify-between font-medium text-base pt-2">
                <span>Total</span>
                <span>{inr(subtotal)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
