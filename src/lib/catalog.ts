import { client } from "@/sanity/lib/client";

export type Variant = {
  id: number;
  erpVariantId?: number;
  /** Full label, e.g. "Small / White". Kept for cart/order records. */
  title: string;
  /** Resolved size document name, when the variant references one. */
  size?: string;
  /** Resolved colour document name, when the variant references one. */
  color?: string;
  price: string;
  compare_at_price: string | null;
  available: boolean;
  inventory?: number;
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
  oneTimeUse?: boolean;
  onePerCustomer?: boolean;
  minPurchaseAmount?: number;
  maxUses?: number;
  usageCount?: number;
  startDate?: string;
  endDate?: string;
  allowedCategories?: string[];
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

// Variant prices are optional (they were deliberately cleared so sizes inherit the
// root price), so never trust variants[0] alone — take the first one that has a
// usable number.
function firstPositive(values: (string | null | undefined)[]): number {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 0;
}

function docScore(p: any): number {
  const variants = Array.isArray(p?.variants) ? p.variants.length : 0;
  const images = (Array.isArray(p?.images) ? p.images.length : 0) +
    (Array.isArray(p?.imageUrls) ? p.imageUrls.length : 0);
  return variants * 1000 + images;
}

// The dataset still carries legacy twins of most products (an `imported-product-*`
// or `product-*` doc alongside the Studio-managed one) that share a slug. Keeping
// both means duplicate cards in the grid and `productByHandle` resolving to
// whichever twin the API happened to return first — usually the empty legacy one,
// which renders a lone "Default Title" size. Keep the richest doc per slug.
function dedupeByHandle(docs: any[]): any[] {
  const best = new Map<string, any>();
  for (const doc of docs) {
    const handle = doc?.slug?.current;
    if (!handle) continue;
    const current = best.get(handle);
    if (!current) {
      best.set(handle, doc);
      continue;
    }
    const delta = docScore(doc) - docScore(current);
    const newer = String(doc._updatedAt ?? "") > String(current._updatedAt ?? "");
    if (delta > 0 || (delta === 0 && newer)) best.set(handle, doc);
  }
  return Array.from(best.values());
}

export async function allProducts(): Promise<Product[]> {
  const now = Date.now();
  if (cachedCatalog && now - catalogCacheTime < CACHE_TTL_MS) {
    return cachedCatalog;
  }
  const sanityProducts = await client.fetch(`*[_type == "product"]{
    ...,
    variants[]{
      ...,
      "size": size->name,
      "color": color->name
    }
  }`, {}, { next: { revalidate: 60 } });
  const catalog = dedupeByHandle(sanityProducts).map((p: any) => {
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
    } else {
      // Derive a stable, collision-free id from the document id plus the variant's
      // Sanity array key. Hashing the *title* instead (the old behaviour) collided
      // whenever two variants resolved to the same label — e.g. a size list with a
      // duplicate or a dangling reference — and a collision means duplicate React
      // keys, so some size buttons never render at all.
      variants = variants.map((v: any, i: number) => {
        const size = typeof v.size === 'string' && v.size ? v.size : undefined;
        const color = typeof v.color === 'string' && v.color ? v.color : undefined;
        const generatedTitle = [size, color].filter(Boolean).join(' / ');
        // Resolved references win over the legacy free-text title: a variant that has
        // been adopted into the matrix would otherwise show "Small" on the button and
        // record "S" on the order line.
        const resolvedTitle = generatedTitle || v.title || 'Default Title';
        const uniqueStr = `${p._id || p.id}-${v._key ?? `idx-${i}`}`;
        let hash = 0;
        for (let j = 0; j < uniqueStr.length; j++) {
          hash = (hash << 5) - hash + uniqueStr.charCodeAt(j);
          hash |= 0;
        }
        const inventory = typeof v.inventory === 'number' ? v.inventory : undefined;
        return {
          ...v,
          id: Math.abs(hash),
          title: resolvedTitle,
          size,
          color,
          // An explicit inventory of 0 means out of stock, whatever the flag says.
          available: v.available !== false && (inventory === undefined || inventory > 0),
          inventory,
          erpVariantId: typeof v.erpVariantId === 'number' ? v.erpVariantId : undefined
        };
      });
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
      price: p.price || firstPositive(variants.map((v: Variant) => v.price)),
      compareAtPrice:
        p.compareAtPrice ||
        firstPositive(variants.map((v: Variant) => v.compare_at_price)) ||
        null,
    };
  }).filter((p: Product) => p.price > 0);
  
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
  return p.price || firstPositive(p.variants.map((v) => v.price));
}

export function compareAt(p: Product): number | null {
  const n =
    Number(p.compareAtPrice ?? 0) ||
    firstPositive(p.variants.map((v) => v.compare_at_price));
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
  const campaigns = await client.fetch(`*[_type == "campaign" && isActive == true]`, {}, { next: { revalidate: 60 } });
  const parsed = campaigns.map((c: any) => ({
    id: c._id,
    title: c.title,
    discountCode: c.discountCode || null,
    discountType: c.discountType,
    discountValue: Number(c.discountValue) || 0,
    isActive: !!c.isActive,
    oneTimeUse: !!c.oneTimeUse,
    onePerCustomer: !!c.onePerCustomer,
    minPurchaseAmount: c.minPurchaseAmount ? Number(c.minPurchaseAmount) : undefined,
    maxUses: c.maxUses ? Number(c.maxUses) : undefined,
    usageCount: c.usageCount ? Number(c.usageCount) : 0,
    startDate: c.startDate,
    endDate: c.endDate,
    allowedCategories: c.allowedCategories || [],
  }));
  cachedCampaigns = parsed;
  campaignsCacheTime = now;
  return parsed;
}

export async function resolveDiscount(code?: string): Promise<Campaign | null> {
  const allCampaigns = await activeCampaigns();
  const now = new Date();
  
  const campaigns = allCampaigns.filter((c) => {
    if (c.startDate && new Date(c.startDate) > now) return false;
    if (c.endDate && new Date(c.endDate) < now) return false;
    if (c.maxUses !== undefined && c.usageCount !== undefined && c.usageCount >= c.maxUses) return false;
    return true;
  });

  if (code) {
    const found = campaigns.find((c) => c.discountCode?.toUpperCase() === code.toUpperCase());
    if (found) return found;
  }
  // Fall back to the best automatic discount
  const automatic = campaigns.filter((c) => !c.discountCode);
  return automatic[0] || null;
}

// Rank doubles as the size allowlist: the Studio's size documents are named
// "Small"/"Medium"/"Large"/"XXL"/"XXXL", not just the short codes the original
// import produced, and anything missing here was being filed under Colour.
const SIZE_RANK: Record<string, number> = {
  XXS: 0,
  XS: 1,
  S: 2,
  SMALL: 2,
  M: 3,
  MEDIUM: 3,
  L: 4,
  LARGE: 4,
  XL: 5,
  "XXL": 6,
  "2XL": 6,
  "XXXL": 7,
  "3XL": 7,
  "FREE SIZE": 8,
  "ONE SIZE": 8,
};

// The catalog carries two size vocabularies: short codes from the original import
// ("S", "M") and the Studio's size documents ("Small", "Medium"). Collapse them to
// one label so the shop shows a single chip per size and ticking it matches
// products from either vocabulary.
const SIZE_CANONICAL: Record<string, string> = {
  S: "Small",
  SMALL: "Small",
  M: "Medium",
  MEDIUM: "Medium",
  L: "Large",
  LARGE: "Large",
  "2XL": "XXL",
  XXL: "XXL",
  "3XL": "XXXL",
  XXXL: "XXXL",
  XS: "XS",
  XXS: "XXS",
  XL: "XL",
  "FREE SIZE": "Free size",
  "ONE SIZE": "Free size",
};

function canonicalSize(token: string): string {
  return SIZE_CANONICAL[token.trim().toUpperCase()] ?? token;
}

function classifyToken(token: string): "size" | "age" | "color" {
  if (/month|year/i.test(token)) return "age";
  if (token.toUpperCase() in SIZE_RANK || /^\d+$/.test(token)) return "size";
  return "color";
}

// Prefer the resolved size/colour references; fall back to splitting the legacy
// "S / White" title for products that were never moved onto the matrix.
function variantTokens(v: Variant): string[] {
  if (v.size || v.color) return [v.size, v.color].filter(Boolean) as string[];
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
        if (kind === "size") sizes.add(canonicalSize(token));
        else if (kind === "age") ages.add(token);
        else colors.add(token);
      })
    )
  );
  const ageStartMonths = (token: string): number => {
    const n = parseInt(token, 10) || 0;
    return /year/i.test(token) ? n * 12 : n;
  };
  // Numeric sizes ("1", "2") have no place in the letter scale, so they sort after
  // it and numerically among themselves rather than by insertion order.
  const sizeRank = (s: string) =>
    SIZE_RANK[s.trim().toUpperCase()] ?? (/^\d+$/.test(s.trim()) ? 100 + Number(s) : 999);
  return {
    sizes: Array.from(sizes).sort((a, b) => sizeRank(a) - sizeRank(b)),
    ages: Array.from(ages).sort((a, b) => ageStartMonths(a) - ageStartMonths(b)),
    colors: Array.from(colors).sort(),
  };
}

export function productHasToken(p: Product, token: string): boolean {
  const wanted = canonicalSize(token);
  return p.variants.some((v) =>
    variantTokens(v).some((t) => t === token || canonicalSize(t) === wanted)
  );
}

export function inr(n: number): string {
  return "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}
