import Link from "next/link";

export const metadata = { title: "Order confirmed — SILA Collective" };

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { method?: string; ref?: string };
}) {
  const cod = searchParams.method === "cod";
  const ref = searchParams.ref;
  return (
    <div className="min-h-[70vh] grid place-items-center px-6 text-center">
      <div className="animate-riseUp">
        <p className="text-gold text-5xl mb-6">✦</p>
        <h1 className="font-serif text-5xl sm:text-7xl">
          Thank <span className="italic text-gold">you</span>
        </h1>
        {ref && (
          <p className="mt-6 text-xs uppercase tracking-[0.25em] text-smoke">
            Order ref — <span className="text-ink font-medium">{ref}</span>
          </p>
        )}
        <p className="mt-6 text-smoke max-w-md mx-auto leading-relaxed">
          {cod
            ? "Your cash-on-delivery order is confirmed. We'll call to verify before dispatch — keep your phone handy."
            : "Your payment was received and your order is confirmed. A confirmation will reach you shortly."}
        </p>
        <Link
          href="/shop"
          className="mt-10 inline-block bg-ink text-ivory px-12 py-4 text-xs uppercase tracking-[0.25em] hover:bg-gold transition-colors"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
