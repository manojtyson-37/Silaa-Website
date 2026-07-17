import raw from "@/data/products.json";

export type Variant = {
  id: number;
  title: string;
  price: string;
  compare_at_price: string | null;
  available: boolean;
};

export type Product = {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  tags: string[];
  images: { src: string; width: number; height: number }[];
  variants: Variant[];
};

export type Category = "women" | "kids" | "combo";

type RawCatalog = { products: Product[] };

// Allowlist sanitizer for catalog-sourced rich text rendered via
// dangerouslySetInnerHTML. The catalog is the client's own Shopify export,
// but a future re-export must not become an injection channel.
function sanitizeHtml(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed|form|link|meta)[\s\S]*?(<\/\1>|\/>|>)/gi, "")
    .replace(/<(?!\/?(p|br|ul|ol|li|strong|em|b|i|span)\b)[^>]*>/gi, "")
    .replace(/<([a-z]+)([^>]*)>/gi, (_m, tag) => `<${tag}>`)
    .replace(/javascript:/gi, "");
}

const catalog = (raw as unknown as RawCatalog).products
  .filter((p) => Number(p.variants[0]?.price ?? 0) > 0)
  .map((p) => ({ ...p, body_html: sanitizeHtml(p.body_html ?? "") }));

export function allProducts(): Product[] {
  return catalog;
}

export function productByHandle(handle: string): Product | undefined {
  return catalog.find((p) => p.handle === handle);
}

export function productCategory(p: Product): Category {
  const tags = p.tags.map((t) => t.toUpperCase());
  if (tags.includes("COMBO") || tags.some((t) => t.includes("DUO"))) return "combo";
  if (tags.includes("KIDS") || tags.includes("GIRLS")) return "kids";
  return "women";
}

export function isNewLaunch(p: Product): boolean {
  return p.tags.some((t) => t.toLowerCase() === "new launch");
}

export function byCategory(cat: Category): Product[] {
  return catalog.filter((p) => productCategory(p) === cat);
}

export function newLaunches(): Product[] {
  return catalog.filter(isNewLaunch);
}

export function price(p: Product): number {
  return Number(p.variants[0]?.price ?? 0);
}

export function compareAt(p: Product): number | null {
  const c = p.variants[0]?.compare_at_price;
  const n = c ? Number(c) : 0;
  return n > price(p) ? n : null;
}

export function variantById(variantId: number): { product: Product; variant: Variant } | undefined {
  for (const product of catalog) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return undefined;
}

export function inr(n: number): string {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
