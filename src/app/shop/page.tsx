import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import {
  allProducts,
  byCategory,
  newLaunches,
  filterOptions,
  productHasToken,
  price,
  type Category,
} from "@/lib/catalog";

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

type ShopSearchParams = {
  c?: string;
  sort?: string;
  size?: string | string[];
  color?: string | string[];
  age?: string | string[];
  priceMin?: string;
  priceMax?: string;
};

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function toNumber(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

// Reconstructs the current filter/sort state as a query string, so links
// (category tabs, sort toggles, hidden form inputs) can override a single
// key without silently dropping the rest of the selection.
function currentParams(sp: ShopSearchParams): URLSearchParams {
  const params = new URLSearchParams();
  if (sp.c && sp.c !== "all") params.set("c", sp.c);
  if (sp.sort) params.set("sort", sp.sort);
  toArray(sp.size).forEach((v) => params.append("size", v));
  toArray(sp.color).forEach((v) => params.append("color", v));
  toArray(sp.age).forEach((v) => params.append("age", v));
  if (sp.priceMin) params.set("priceMin", sp.priceMin);
  if (sp.priceMax) params.set("priceMax", sp.priceMax);
  return params;
}

function hrefWith(sp: ShopSearchParams, overrides: Record<string, string | undefined>): string {
  const params = currentParams(sp);
  Object.entries(overrides).forEach(([key, value]) => {
    if (value === undefined || value === "") params.delete(key);
    else params.set(key, value);
  });
  const qs = params.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: ShopSearchParams;
}) {
  const c = searchParams.c ?? "all";
  let products =
    c === "new"
      ? await newLaunches()
      : c === "women" || c === "kids" || c === "combo"
      ? await byCategory(c as Category)
      : await allProducts();

  const options = filterOptions(products);
  const selectedSizes = toArray(searchParams.size);
  const selectedColors = toArray(searchParams.color);
  const selectedAges = toArray(searchParams.age);
  const priceMin = toNumber(searchParams.priceMin);
  const priceMax = toNumber(searchParams.priceMax);

  if (selectedSizes.length) {
    products = products.filter((p) => selectedSizes.some((s) => productHasToken(p, s)));
  }
  if (selectedColors.length) {
    products = products.filter((p) => selectedColors.some((s) => productHasToken(p, s)));
  }
  if (selectedAges.length) {
    products = products.filter((p) => selectedAges.some((s) => productHasToken(p, s)));
  }
  if (priceMin !== undefined) {
    products = products.filter((p) => price(p) >= priceMin);
  }
  if (priceMax !== undefined) {
    products = products.filter((p) => price(p) <= priceMax);
  }

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
  const activeFilterCount =
    selectedSizes.length +
    selectedColors.length +
    selectedAges.length +
    (priceMin !== undefined ? 1 : 0) +
    (priceMax !== undefined ? 1 : 0);

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
            href={hrefWith(searchParams, { c: f.key === "all" ? undefined : f.key })}
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
            href={hrefWith(searchParams, { sort: "low" })}
            className={`link-sweep ${sort === "low" ? "text-gold" : "text-smoke"}`}
          >
            Price ↑
          </Link>
          <Link
            href={hrefWith(searchParams, { sort: "high" })}
            className={`link-sweep ${sort === "high" ? "text-gold" : "text-smoke"}`}
          >
            Price ↓
          </Link>
        </div>
      </div>

      <details className="mb-10 border border-ink/15 group" open={activeFilterCount > 0 || undefined}>
        <summary className="cursor-pointer select-none px-5 py-3 text-xs uppercase tracking-[0.2em] flex items-center justify-between">
          <span>
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 text-gold">({activeFilterCount})</span>
            )}
          </span>
          <span className="text-smoke normal-case tracking-normal">
            Age, size, colour &amp; price
          </span>
        </summary>
        <form
          method="get"
          action="/shop"
          className="border-t border-ink/15 p-5 grid gap-8 sm:grid-cols-4"
        >
          {c !== "all" && <input type="hidden" name="c" value={c} />}
          {sort && <input type="hidden" name="sort" value={sort} />}

          {options.ages.length > 0 && (
            <fieldset>
              <legend className="text-xs uppercase tracking-[0.2em] text-smoke mb-3">Age</legend>
              <div className="space-y-2">
                {options.ages.map((age) => (
                  <label key={age} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="age"
                      value={age}
                      defaultChecked={selectedAges.includes(age)}
                      className="accent-ink"
                    />
                    {age}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {options.sizes.length > 0 && (
            <fieldset>
              <legend className="text-xs uppercase tracking-[0.2em] text-smoke mb-3">Size</legend>
              <div className="space-y-2">
                {options.sizes.map((size) => (
                  <label key={size} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="size"
                      value={size}
                      defaultChecked={selectedSizes.includes(size)}
                      className="accent-ink"
                    />
                    {size === "1" ? "One size" : size}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {options.colors.length > 0 && (
            <fieldset>
              <legend className="text-xs uppercase tracking-[0.2em] text-smoke mb-3">Colour</legend>
              <div className="space-y-2">
                {options.colors.map((color) => (
                  <label key={color} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="color"
                      value={color}
                      defaultChecked={selectedColors.includes(color)}
                      className="accent-ink"
                    />
                    {color}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend className="text-xs uppercase tracking-[0.2em] text-smoke mb-3">Price (₹)</legend>
            <div className="flex items-center gap-2">
              <label htmlFor="priceMin" className="sr-only">Minimum price</label>
              <input
                id="priceMin"
                type="number"
                name="priceMin"
                placeholder="Min"
                min={0}
                defaultValue={searchParams.priceMin ?? ""}
                className="w-full border border-ink/20 px-3 py-2 text-sm"
              />
              <span className="text-smoke">–</span>
              <label htmlFor="priceMax" className="sr-only">Maximum price</label>
              <input
                id="priceMax"
                type="number"
                name="priceMax"
                placeholder="Max"
                min={0}
                defaultValue={searchParams.priceMax ?? ""}
                className="w-full border border-ink/20 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="bg-ink text-ivory px-6 py-2 text-xs uppercase tracking-[0.2em]"
              >
                Apply
              </button>
              {activeFilterCount > 0 && (
                <Link
                  href={hrefWith(
                    { c: searchParams.c, sort: searchParams.sort },
                    {}
                  )}
                  className="link-sweep text-xs uppercase tracking-[0.2em] self-center"
                >
                  Clear
                </Link>
              )}
            </div>
          </fieldset>
        </form>
      </details>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-10">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} priority={i < 4} />
        ))}
      </div>
    </div>
  );
}
