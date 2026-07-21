"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";

function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function CartDrawer() {
  const { items, open, setOpen, remove, setQty, subtotal, discountCode, setDiscountCode } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-[70] bg-ink/40 backdrop-blur-sm transition-opacity duration-500 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`fixed top-0 right-0 z-[80] h-full w-full max-w-md bg-ivory shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-ink/10">
          <p className="font-serif text-2xl">
            Your Bag <span className="text-gold text-base">({items.length})</span>
          </p>
          <button
            onClick={() => setOpen(false)}
            className="p-2 cursor-pointer"
            aria-label="Close cart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 grid place-items-center px-6 text-center">
            <div>
              <p className="font-serif text-3xl mb-3">Your bag is empty</p>
              <p className="text-sm text-smoke mb-6">
                Something beautiful is waiting for you.
              </p>
              <button
                onClick={() => setOpen(false)}
                className="inline-block bg-ink text-ivory px-8 py-3 text-xs uppercase tracking-[0.2em] hover:bg-gold transition-colors cursor-pointer"
              >
                Continue shopping
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
              {items.map((i) => (
                <div key={i.variantId} className="flex gap-4">
                  <Link
                    href={`/product/${i.handle}`}
                    onClick={() => setOpen(false)}
                    className="relative w-20 h-28 bg-cream shrink-0"
                  >
                    {i.image && (
                      <Image src={i.image} alt={i.title} fill sizes="80px" className="object-cover" />
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{i.title}</p>
                    <p className="text-xs text-smoke mt-1">Size: {i.size}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center border border-ink/20">
                        <button
                          className="px-2.5 py-1 cursor-pointer hover:bg-cream"
                          onClick={() => setQty(i.variantId, i.qty - 1)}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="px-3 text-sm">{i.qty}</span>
                        <button
                          className="px-2.5 py-1 cursor-pointer hover:bg-cream"
                          onClick={() => setQty(i.variantId, i.qty + 1)}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => remove(i.variantId)}
                        className="text-xs text-smoke underline cursor-pointer hover:text-ink"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{inr(i.price * i.qty)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-ink/10 px-6 py-5 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Discount code"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  className="flex-1 border border-ink/20 px-3 py-2 text-sm focus:outline-none focus:border-ink placeholder:text-smoke/50 bg-ivory"
                />
                {discountCode && (
                  <button
                    onClick={() => setDiscountCode("")}
                    className="px-3 text-xs text-smoke hover:text-ink cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="flex justify-between text-sm">
                <span className="uppercase tracking-[0.15em] text-smoke">Subtotal</span>
                <span className="font-medium text-base">{inr(subtotal)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={() => setOpen(false)}
                className="block bg-ink text-ivory text-center py-4 text-xs uppercase tracking-[0.25em] hover:bg-gold transition-colors"
              >
                Checkout
              </Link>
              <p className="text-[11px] text-center text-smoke">
                COD available · Free shipping on prepaid orders
              </p>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
