"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/catalog";
import { price, compareAt } from "@/lib/catalog";

function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function ProductView({ product }: { product: Product }) {
  const { add } = useCart();
  const [imgIdx, setImgIdx] = useState(0);
  const [variantId, setVariantId] = useState<number | null>(
    product.variants.find((v) => v.available)?.id ?? null
  );
  const [error, setError] = useState(false);

  const selected = product.variants.find((v) => v.id === variantId);
  const variantPrice = selected?.price ? Number(selected.price) : 0;
  const p = variantPrice > 0 ? variantPrice : price(product);
  const cmpRaw = selected?.compare_at_price;
  const rootCmp = compareAt(product);
  const cmp = cmpRaw ? (Number(cmpRaw) > p ? Number(cmpRaw) : null) : rootCmp;
  const mainImg = product.images[imgIdx]?.src;

  function handleAdd() {
    if (!selected) {
      setError(true);
      return;
    }
    add({
      variantId: selected.id,
      productId: product.id,
      handle: product.handle,
      title: product.title,
      size: selected.title,
      price: p,
      image: product.images[0]?.src ?? "",
      qty: 1,
    });
  }

  return (
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
      {/* gallery */}
      <div className="min-w-0">
        <div className="relative w-full aspect-[3/4] bg-cream overflow-hidden">
          {mainImg && (
            <Image
              key={mainImg}
              src={mainImg}
              alt={product.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover animate-fadeIn"
            />
          )}
          {cmp && (
            <span className="absolute top-4 left-4 bg-gold text-ivory text-xs tracking-[0.15em] uppercase px-4 py-2">
              Save {Math.round(((cmp - p) / cmp) * 100)}%
            </span>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="rail overflow-x-auto mt-4">
            <div className="flex gap-3 w-max">
              {product.images.map((img, i) => (
                <button
                  key={img.src}
                  onClick={() => setImgIdx(i)}
                  className={`relative w-20 h-28 shrink-0 overflow-hidden cursor-pointer transition-opacity ${
                    i === imgIdx ? "ring-1 ring-ink" : "opacity-60 hover:opacity-100"
                  }`}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image src={img.src} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* details */}
      <div className="min-w-0 lg:pt-6">
        <h1 className="font-serif text-4xl sm:text-5xl leading-tight">{product.title}</h1>
        <p className="mt-4 text-2xl">
          {cmp && <span className="line-through text-smoke/50 text-lg mr-3">{inr(cmp)}</span>}
          <span className="font-medium">{inr(p)}</span>
          <span className="text-xs text-smoke ml-3 uppercase tracking-[0.15em]">incl. all taxes</span>
        </p>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-[0.2em] text-smoke mb-3">
            Select size
          </p>
          <div className="flex flex-wrap gap-2.5">
            {product.variants.map((v) => (
              <button
                key={v.id}
                disabled={!v.available}
                onClick={() => {
                  setVariantId(v.id);
                  setError(false);
                }}
                className={`px-5 py-3 text-sm border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 disabled:line-through ${
                  variantId === v.id
                    ? "bg-ink text-ivory border-ink"
                    : "border-ink/25 hover:border-ink"
                }`}
              >
                {v.title}
              </button>
            ))}
          </div>
          {error && (
            <p className="text-red-600 text-xs mt-2">Please select a size.</p>
          )}
        </div>

        <button
          onClick={handleAdd}
          className="mt-8 w-full bg-ink text-ivory py-5 text-xs uppercase tracking-[0.3em] hover:bg-gold transition-colors duration-300 cursor-pointer"
        >
          Add to bag — {inr(p)}
        </button>
        <p className="mt-3 text-center text-[11px] text-smoke uppercase tracking-[0.15em]">
          COD available · Free shipping on prepaid orders
        </p>

        {product.body_html && (
          <div
            className="mt-10 pt-8 border-t border-ink/10 prose prose-sm text-smoke leading-relaxed [&_p]:mb-2"
            dangerouslySetInnerHTML={{ __html: product.body_html }}
          />
        )}

        <div className="mt-8 grid grid-cols-3 gap-4 text-center text-[11px] uppercase tracking-[0.12em] text-smoke">
          <div className="border border-ink/10 py-4 px-2">Ships in 2–4 days</div>
          <div className="border border-ink/10 py-4 px-2">Easy size exchange</div>
          <div className="border border-ink/10 py-4 px-2">Secure payments</div>
        </div>
      </div>
    </div>
  );
}
