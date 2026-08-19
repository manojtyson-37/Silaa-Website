"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "@/context/CartContext";

type ComboItem = {
  id: number;
  variant_color: string | null;
  variant_size: string | null;
};

type Combo = {
  id: number;
  name: string;
  description: string | null;
  selling_price: string;
  image_url: string | null;
  is_active: boolean;
  items: ComboItem[];
};

function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export default function ComboCard({ combo }: { combo: Combo }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    add({
      variantId: -combo.id, // negative ID ensures no collision with real variant IDs
      comboId: combo.id,
      productId: 0,
      handle: `combo-${combo.id}`,
      title: combo.name,
      size: "Combo",
      price: parseFloat(combo.selling_price),
      image: combo.image_url ?? "",
      qty: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="group flex flex-col">
      <div className="relative overflow-hidden bg-cream aspect-[3/4]">
        {combo.image_url ? (
          <Image
            src={combo.image_url}
            alt={combo.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
            <span className="text-[10px] uppercase tracking-[0.3em] text-smoke">Combo Bundle</span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {combo.items.map((item) => (
                <span
                  key={item.id}
                  className="text-[10px] border border-ink/20 px-2 py-1 text-ink/70"
                >
                  {[item.variant_color, item.variant_size].filter(Boolean).join(" / ")}
                </span>
              ))}
            </div>
          </div>
        )}
        <span className="absolute top-3 left-3 bg-gold text-ivory text-[10px] tracking-[0.2em] uppercase px-3 py-1.5">
          Combo
        </span>

        {/* quick-add on hover */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-ivory/95 backdrop-blur px-3 py-2.5 hidden sm:block">
          <button
            onClick={handleAdd}
            className="w-full text-[11px] uppercase tracking-[0.2em] border border-ink/20 py-2 hover:bg-ink hover:text-ivory transition-colors cursor-pointer"
          >
            {added ? "Added ✓" : "Add to bag"}
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug">{combo.name}</p>
          {combo.description && (
            <p className="text-[11px] text-smoke mt-0.5 line-clamp-2">{combo.description}</p>
          )}
        </div>
        <p className="text-sm font-medium whitespace-nowrap">{inr(parseFloat(combo.selling_price))}</p>
      </div>

      {/* mobile add button */}
      <button
        onClick={handleAdd}
        className="mt-3 sm:hidden w-full text-[11px] uppercase tracking-[0.2em] border border-ink/20 py-2.5 hover:bg-ink hover:text-ivory transition-colors cursor-pointer"
      >
        {added ? "Added ✓" : "Add to bag"}
      </button>
    </div>
  );
}
