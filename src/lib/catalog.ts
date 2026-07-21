import { client } from "@/sanity/lib/client";

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

let cachedCatalog: Product[] | null = null;
let catalogCacheTime = 0;
const CACHE_TTL_MS = 1000 * 60; // 1 minute cache

export async function allProducts(): Promise<Product[]> {
  const now = Date.now();
  if (cachedCatalog && now - catalogCacheTime < CACHE_TTL_MS) {
    return cachedCatalog;
  }
  const sanityProducts = await client.fetch(`*[_type == "product"]`);
  const catalog = sanityProducts.map((p: any) => ({
    id: p.id,
    title: p.title,
    handle: p.slug?.current || "",
    body_html: sanitizeHtml(p.bodyHtml || ""),
    tags: p.tags || [],
    images: (p.imageUrls || []).map((src: string) => ({ src, width: 800, height: 800 })),
    variants: p.variants || []
  })).filter((p: Product) => Number(p.variants[0]?.price ?? 0) > 0);
  
  cachedCatalog = catalog;
  catalogCacheTime = now;
  return catalog;
}

export async function productByHandle(handle: string): Promise<Product | undefined> {
  const catalog = await allProducts();
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

export async function byCategory(cat: Category): Promise<Product[]> {
  const catalog = await allProducts();
  return catalog.filter((p) => productCategory(p) === cat);
}

export async function newLaunches(): Promise<Product[]> {
  const catalog = await allProducts();
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

export async function variantById(variantId: number): Promise<{ product: Product; variant: Variant } | undefined> {
  const catalog = await allProducts();
  for (const product of catalog) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return undefined;
}

const SIZE_TOKENS = new Set(["XS", "S", "M", "L", "XL", "2XL", "3XL"]);

function classifyToken(token: string): "size" | "age" | "color" {
  if (SIZE_TOKENS.has(token.toUpperCase()) || /^\d+$/.test(token)) return "size";
  if (/month|year/i.test(token)) return "age";
  return "color";
}

function variantTokens(v: Variant): string[] {
  return v.title.split("/").map((s) => s.trim()).filter(Boolean);
}

export type FilterOptions = { sizes: string[]; ages: string[]; colors: string[] };

export function filterOptions(products: Product[]): FilterOptions {
  const sizes = new Set<string>();
  const ages = new Set<string>();
  const colors = new Set<string>();
  products.forEach((p) =>
    p.variants.forEach((v) =>
      variantTokens(v).forEach((token) => {
        const kind = classifyToken(token);
        if (kind === "size") sizes.add(token);
        else if (kind === "age") ages.add(token);
        else colors.add(token);
      })
    )
  );
  const sizeOrder = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
  const ageStartMonths = (token: string): number => {
    const n = parseInt(token, 10) || 0;
    return /year/i.test(token) ? n * 12 : n;
  };
  const sizeRank = (s: string) => {
    const i = sizeOrder.indexOf(s.toUpperCase());
    return i === -1 ? sizeOrder.length : i;
  };
  return {
    sizes: Array.from(sizes).sort((a, b) => sizeRank(a) - sizeRank(b)),
    ages: Array.from(ages).sort((a, b) => ageStartMonths(a) - ageStartMonths(b)),
    colors: Array.from(colors).sort(),
  };
}

export function productHasToken(p: Product, token: string): boolean {
  return p.variants.some((v) => variantTokens(v).includes(token));
}

export function inr(n: number): string {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
