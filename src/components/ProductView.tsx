"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import type { Product, Variant } from "@/lib/catalog";
import { price, compareAt, productCategory } from "@/lib/catalog";

// Baby/kid sizes are recorded as an age range ("6-12 months", "2-3 years");
// adult sizes are letter codes. Splitting on this lets a combo product ask
// for both a mom size and a baby size instead of one mixed size list.
const BABY_SIZE_RE = /month|year/i;

function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function ProductView({ product }: { product: Product }) {
  const { add } = useCart();
  const [imgIdx, setImgIdx] = useState(0);
  const isCombo = productCategory(product) === "combo";
  const firstAvailable = product.variants.find((v) => v.available);
  const [variantId, setVariantId] = useState<number | null>(
    firstAvailable?.id ?? null
  );
  const [error, setError] = useState(false);

  // Colours only get their own row when the product actually has more than one;
  // otherwise the size buttons carry the whole label as before.
  const colors = Array.from(
    new Set(product.variants.map((v) => v.color).filter(Boolean) as string[])
  );
  const colorHasStock = (c: string) =>
    product.variants.some((v) => v.color === c && v.available);
  // Start on the colour of the pre-selected variant so the size row and the
  // highlighted button can never disagree.
  const [color, setColor] = useState<string | null>(
    firstAvailable?.color ?? colors.find(colorHasStock) ?? colors[0] ?? null
  );
  const sizeVariants =
    colors.length > 1 ? product.variants.filter((v) => v.color === color) : product.variants;
  const canBuy = sizeVariants.some((v) => v.available);

  const babyVariants = sizeVariants.filter((v) => BABY_SIZE_RE.test(v.size ?? v.title));
  const momVariants = sizeVariants.filter((v) => !BABY_SIZE_RE.test(v.size ?? v.title));
  // Some legacy combo products were never split into separate mom/baby size
  // variants — a single variant like "S / 6-12 months" carries both sizes in
  // one title. The regex above would file that whole label under "baby" and
  // leave momVariants empty, which would brick the dual selector (permanently
  // "Sold out"). Only use the dual selector when the product genuinely has
  // both dimensions to choose from; otherwise fall back to the single
  // unified size list, same as any non-combo product.
  const hasComboSplit = isCombo && momVariants.length > 0 && babyVariants.length > 0;
  const [momVariantId, setMomVariantId] = useState<number | null>(
    momVariants.find((v) => v.available)?.id ?? null
  );
  const [babyVariantId, setBabyVariantId] = useState<number | null>(
    babyVariants.find((v) => v.available)?.id ?? null
  );
  const momSelected = momVariants.find((v) => v.id === momVariantId);
  const babySelected = babyVariants.find((v) => v.id === babyVariantId);
  const comboCanBuy = momVariants.some((v) => v.available) && babyVariants.some((v) => v.available);

  const selected = product.variants.find((v) => v.id === variantId);
  const variantPrice = selected?.price ? Number(selected.price) : 0;
  // Same fallback rule used everywhere a variant price might be blank
  // (variants are sometimes cleared so a size inherits the root price) —
  // shared between the displayed total and the actual cart line prices so
  // the two can never disagree.
  function effectivePrice(v: Variant): number {
    return v.price ? Number(v.price) : price(product);
  }
  const comboPrice =
    (momSelected ? effectivePrice(momSelected) : 0) +
    (babySelected ? effectivePrice(babySelected) : 0);
  const p = hasComboSplit
    ? comboPrice || price(product)
    : variantPrice > 0
      ? variantPrice
      : price(product);
  const cmpRaw = selected?.compare_at_price;
  const rootCmp = compareAt(product);
  const cmp = hasComboSplit ? null : cmpRaw ? (Number(cmpRaw) > p ? Number(cmpRaw) : null) : rootCmp;
  const mainImg = product.images[imgIdx]?.src;

  function addLine(v: Variant, role: string) {
    add({
      variantId: v.id,
      productId: product.id,
      handle: product.handle,
      title: `${product.title} — ${role}`,
      size: v.size ?? v.title,
      price: effectivePrice(v),
      image: product.images[0]?.src ?? "",
      qty: 1,
    });
  }

  function handleAdd() {
    if (hasComboSplit) {
      if (!momSelected || !babySelected) {
        setError(true);
        return;
      }
      addLine(momSelected, "Mom");
      addLine(babySelected, "Baby");
      return;
    }
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

        {colors.length > 1 && (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.2em] text-smoke mb-3">
              Select colour
            </p>
            <div className="flex flex-wrap gap-2.5">
              {colors.map((c) => (
                <button
                  key={c}
                  disabled={!colorHasStock(c)}
                  onClick={() => {
                    setColor(c);
                    const next = product.variants.find(
                      (v) => v.color === c && v.available
                    );
                    setVariantId(next?.id ?? null);
                    setError(false);
                  }}
                  className={`px-5 py-3 text-sm border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 disabled:line-through ${
                    color === c
                      ? "bg-ink text-ivory border-ink"
                      : "border-ink/25 hover:border-ink"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasComboSplit ? (
          <>
            <div className="mt-8">
              <p className="text-xs uppercase tracking-[0.2em] text-smoke mb-3">
                Mom's size
              </p>
              <div className="flex flex-wrap gap-2.5">
                {momVariants.map((v) => (
                  <button
                    key={v.id}
                    disabled={!v.available}
                    onClick={() => {
                      setMomVariantId(v.id);
                      setError(false);
                    }}
                    className={`px-5 py-3 text-sm border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 disabled:line-through ${
                      momVariantId === v.id
                        ? "bg-ink text-ivory border-ink"
                        : "border-ink/25 hover:border-ink"
                    }`}
                  >
                    {v.size ?? v.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs uppercase tracking-[0.2em] text-smoke mb-3">
                Baby's size
              </p>
              <div className="flex flex-wrap gap-2.5">
                {babyVariants.map((v) => (
                  <button
                    key={v.id}
                    disabled={!v.available}
                    onClick={() => {
                      setBabyVariantId(v.id);
                      setError(false);
                    }}
                    className={`px-5 py-3 text-sm border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 disabled:line-through ${
                      babyVariantId === v.id
                        ? "bg-ink text-ivory border-ink"
                        : "border-ink/25 hover:border-ink"
                    }`}
                  >
                    {v.size ?? v.title}
                  </button>
                ))}
              </div>
              {error && (
                <p className="text-red-600 text-xs mt-2">Please select both sizes.</p>
              )}
              {!comboCanBuy && (
                <p className="text-smoke text-xs mt-3 uppercase tracking-[0.15em]">
                  Sold out — every size is currently unavailable.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-[0.2em] text-smoke mb-3">
              Select size
              {colors.length === 1 && (
                <span className="ml-2 normal-case tracking-normal">· {colors[0]}</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {sizeVariants.map((v) => (
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
                  {v.size ?? v.title}
                </button>
              ))}
            </div>
            {error && (
              <p className="text-red-600 text-xs mt-2">Please select a size.</p>
            )}
            {!canBuy && (
              <p className="text-smoke text-xs mt-3 uppercase tracking-[0.15em]">
                {colors.length > 1
                  ? `Sold out in ${color} — try another colour.`
                  : "Sold out — every size is currently unavailable."}
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={hasComboSplit ? !comboCanBuy : !canBuy}
          className="mt-8 w-full bg-ink text-ivory py-5 text-xs uppercase tracking-[0.3em] hover:bg-gold transition-colors duration-300 cursor-pointer disabled:cursor-not-allowed disabled:bg-smoke/40 disabled:hover:bg-smoke/40"
        >
          {(hasComboSplit ? comboCanBuy : canBuy) ? `Add to bag — ${inr(p)}` : "Sold out"}
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
