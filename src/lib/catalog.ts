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
  category?: Category;
  isNewLaunch?: boolean;
  images: { src: string; width: number; height: number }[];
  variants: Variant[];
  price: number;
  compareAtPrice: number | null;
};

export type Campaign = {
  id: string;
  title: string;
  discountCode: string | null;
  discountType: "percentage" | "fixed";
  discountValue: number;
  isActive: boolean;
};

export type Category = "women" | "kids" | "combo";

// Allowlist sanitizer for catalog-sourced rich text rendered via
// dangerouslySetInnerHTML.
function sanitizeHtml(html: string): string {
  return html
    .replace(/<(script|style|iframe|object|embed|form|link|meta)[\s\S]*?(<\/\1>|\/>|>)/gi, "")
    .replace(/<(?!\/?(p|br|ul|ol|li|strong|em|b|i|span)\b)[^>]*>/gi, "")
    .replace(/<([a-z]+)([^>]*)>/gi, (_m, tag) => `<${tag}>`)
    .replace(/javascript:/gi, "");
}

// Convert portable text blocks to simple HTML
function blocksToHtml(blocks: any[]): string {
  if (!blocks || !Array.isArray(blocks)) return "";
  return blocks.map(block => {
    if (block._type !== 'block' || !block.children) return '';
    let text = block.children.map((c: any) => {
       let t = c.text || '';
       if (c.marks?.includes('strong')) t = `<strong>${t}</strong>`;
       if (c.marks?.includes('em')) t = `<em>${t}</em>`;
       return t;
    }).join('');
    if (block.style === 'h1') return `<h1>${text}</h1>`;
    if (block.style === 'h2') return `<h2>${text}</h2>`;
    if (block.style === 'h3') return `<h3>${text}</h3>`;
    return `<p>${text}</p>`;
  }).join('');
}

let cachedCatalog: Product[] | null = null;
let catalogCacheTime = 0;
const CACHE_TTL_MS = 1000 * 60; // 1 minute cache

// Helper to extract image URL from Sanity image object (since we didn't use @sanity/image-url)
function getSanityImageUrl(image: any): string | null {
  if (!image?.asset?._ref) return null;
  // asset._ref looks like: image-Tb9Ew8CXIwaY6R1kjMvI0uRR-2000x3000-jpg
  const parts = image.asset._ref.split('-');
  if (parts.length < 4) return null;
  const id = parts[1];
  const dimensions = parts[2];
  const format = parts[3];
  const projectId = client.config().projectId;
  const dataset = client.config().dataset;
  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${dimensions}.${format}`;
}

export async function allProducts(): Promise<Product[]> {
  const now = Date.now();
  if (cachedCatalog && now - catalogCacheTime < CACHE_TTL_MS) {
    return cachedCatalog;
  }
  const sanityProducts = await client.fetch(`*[_type == "product"]`);
  const catalog = sanityProducts.map((p: any) => {
    // Combine legacy image URLs and new Sanity images
    const legacyImages = (p.imageUrls || []).map((src: string) => ({ src, width: 800, height: 800 }));
    const newImages = (p.images || [])
      .map((img: any) => getSanityImageUrl(img))
      .filter(Boolean)
      .map((src: string) => ({ src, width: 800, height: 800 }));
      
    // Ensure there is at least one variant, or create a default one
    let variants = p.variants || [];
    if (variants.length === 0) {
      variants = [{
        id: Math.floor(Math.random() * 1000000000),
        title: 'Default Title',
        price: p.price ? String(p.price) : "0",
        compare_at_price: p.compareAtPrice ? String(p.compareAtPrice) : null,
        available: true,
      }];
    }

    return {
      id: p.id,
      title: p.title,
      handle: p.slug?.current || "",
      body_html: p.description ? blocksToHtml(p.description) : sanitizeHtml(p.bodyHtml || ""),
      tags: p.tags || [],
      category: p.category,
      isNewLaunch: p.isNewLaunch,
      images: newImages.length > 0 ? newImages : legacyImages,
      variants,
      price: p.price || Number(variants[0]?.price || 0),
      compareAtPrice: p.compareAtPrice || Number(variants[0]?.compare_at_price || 0) || null,
    };
  }).filter((p: Product) => p.price > 0 || Number(p.variants[0]?.price ?? 0) > 0);
  
  cachedCatalog = catalog;
  catalogCacheTime = now;
  return catalog;
}

export async function productByHandle(handle: string): Promise<Product | undefined> {
  const catalog = await allProducts();
  return catalog.find((p) => p.handle === handle);
}

export function productCategory(p: Product): Category {
  if (p.category) return p.category as Category;
  const tags = p.tags.map((t) => t.toUpperCase());
  if (tags.includes("COMBO") || tags.some((t) => t.includes("DUO"))) return "combo";
  if (tags.includes("KIDS") || tags.includes("GIRLS")) return "kids";
  return "women";
}

export function isNewLaunch(p: Product): boolean {
  if (p.isNewLaunch) return true;
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
  return p.price || Number(p.variants[0]?.price ?? 0);
}

export function compareAt(p: Product): number | null {
  const c = p.compareAtPrice || p.variants[0]?.compare_at_price;
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

let cachedCampaigns: Campaign[] | null = null;
let campaignsCacheTime = 0;

export async function activeCampaigns(): Promise<Campaign[]> {
  const now = Date.now();
  if (cachedCampaigns && now - campaignsCacheTime < CACHE_TTL_MS) {
    return cachedCampaigns;
  }
  const campaigns = await client.fetch(`*[_type == "campaign" && isActive == true]`);
  const parsed = campaigns.map((c: any) => ({
    id: c._id,
    title: c.title,
    discountCode: c.discountCode || null,
    discountType: c.discountType,
    discountValue: Number(c.discountValue) || 0,
    isActive: !!c.isActive,
  }));
  cachedCampaigns = parsed;
  campaignsCacheTime = now;
  return parsed;
}

export async function resolveDiscount(code?: string): Promise<Campaign | null> {
  const campaigns = await activeCampaigns();
  if (code) {
    const found = campaigns.find((c) => c.discountCode?.toUpperCase() === code.toUpperCase());
    if (found) return found;
  }
  // Fall back to the best automatic discount
  const automatic = campaigns.filter((c) => !c.discountCode);
  return automatic[0] || null;
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
