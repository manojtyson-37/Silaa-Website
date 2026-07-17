import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { allProducts, byCategory, newLaunches, type Category } from "@/lib/catalog";

export const metadata = {
  title: "Shop All — SILA Collective",
};

const filters: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New Launches" },
  { key: "women", label: "Women" },
  { key: "kids", label: "Kids" },
  { key: "combo", label: "Mom & Girl" },
];

export default function ShopPage({
  searchParams,
}: {
  searchParams: { c?: string; sort?: string };
}) {
  const c = searchParams.c ?? "all";
  let products =
    c === "new"
      ? newLaunches()
      : c === "women" || c === "kids" || c === "combo"
      ? byCategory(c as Category)
      : allProducts();

  const sort = searchParams.sort;
  if (sort === "low") {
    products = [...products].sort(
      (a, b) => Number(a.variants[0].price) - Number(b.variants[0].price)
    );
  } else if (sort === "high") {
    products = [...products].sort(
      (a, b) => Number(b.variants[0].price) - Number(a.variants[0].price)
    );
  }

  const active = filters.find((f) => f.key === c) ?? filters[0];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8 pt-10 pb-20">
      <Reveal>
        <h1 className="font-serif text-5xl sm:text-7xl">
          {active.key === "all" ? (
            <>Every <span className="italic text-gold">piece</span></>
          ) : (
            <>{active.label.split(" ")[0]} <span className="italic text-gold">{active.label.split(" ").slice(1).join(" ") || "edit"}</span></>
          )}
        </h1>
        <p className="text-smoke mt-3 text-sm uppercase tracking-[0.2em]">
          {products.length} styles
        </p>
      </Reveal>

      <div className="flex flex-wrap items-center gap-3 mt-8 mb-10 sticky top-16 sm:top-20 z-30 bg-ivory/90 backdrop-blur py-3 -mx-4 px-4 sm:mx-0 sm:px-0">
        {filters.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/shop" : `/shop?c=${f.key}`}
            className={`px-5 py-2 text-xs uppercase tracking-[0.18em] border transition-colors duration-300 ${
              c === f.key
                ? "bg-ink text-ivory border-ink"
                : "border-ink/20 hover:border-ink"
            }`}
          >
            {f.label}
          </Link>
        ))}
        <span className="flex-1" />
        <div className="flex gap-2 text-xs uppercase tracking-[0.15em]">
          <Link
            href={`/shop?${c !== "all" ? `c=${c}&` : ""}sort=low`}
            className={`link-sweep ${sort === "low" ? "text-gold" : "text-smoke"}`}
          >
            Price ↑
          </Link>
          <Link
            href={`/shop?${c !== "all" ? `c=${c}&` : ""}sort=high`}
            className={`link-sweep ${sort === "high" ? "text-gold" : "text-smoke"}`}
          >
            Price ↓
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 4} />
        ))}
      </div>
    </div>
  );
}
