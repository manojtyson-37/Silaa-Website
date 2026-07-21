"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/catalog";
import { price, compareAt, isNewLaunch } from "@/lib/catalog";

function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const { add } = useCart();
  const img = product.images[0]?.src;
  const hoverImg = product.images[1]?.src;
  const p = price(product);
  const cmp = compareAt(product);
  const isNew = isNewLaunch(product);
  const availableSizes = product.variants.filter((v) => v.available);

  return (
    <div className="group">
      <Link
        href={`/product/${product.handle}`}
        className="block relative overflow-hidden bg-cream aspect-[3/4]"
      >
        {img && (
          <Image
            src={img}
            alt={product.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover card-img ${
              hoverImg ? "group-hover:opacity-0 transition-opacity duration-700" : ""
            }`}
          />
        )}
        {hoverImg && (
          <Image
            src={hoverImg}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-700 scale-105"
          />
        )}
        {isNew && (
          <span className="absolute top-3 left-3 bg-ink text-ivory text-[10px] tracking-[0.2em] uppercase px-3 py-1.5">
            New
          </span>
        )}
        {cmp && (
          <span className="absolute top-3 right-3 bg-gold text-ivory text-[10px] tracking-[0.15em] uppercase px-3 py-1.5">
            −{Math.round(((cmp - p) / cmp) * 100)}%
          </span>
        )}

        {/* quick-add size strip */}
        {availableSizes.length > 0 && (
          <div
            className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-ivory/95 backdrop-blur px-3 py-2.5 hidden sm:block"
            onClick={(e) => e.preventDefault()}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-smoke mb-1.5">
              Quick add
            </p>
            <div className="flex flex-wrap gap-1.5">
              {availableSizes.slice(0, 6).map((v) => (
                <button
                  key={v.id}
                  className="text-[11px] border border-ink/20 px-2 py-1 hover:bg-ink hover:text-ivory transition-colors cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    add({
                      variantId: v.id,
                      productId: product.id,
                      handle: product.handle,
                      title: product.title,
                      size: v.title,
                      price: Number(v.price),
                      image: img ?? "",
                      qty: 1,
                    });
                  }}
                >
                  {v.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <Link
          href={`/product/${product.handle}`}
          className="text-sm leading-snug hover:text-gold transition-colors"
        >
          {product.title}
        </Link>
        <p className="text-sm whitespace-nowrap">
          {cmp && (
            <span className="line-through text-smoke/50 mr-2">{inr(cmp)}</span>
          )}
          <span className="font-medium">{inr(p)}</span>
        </p>
      </div>
    </div>
  );
}
