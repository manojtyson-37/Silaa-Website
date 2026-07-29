type LoaderProps = { src: string; width: number; quality?: number };

// Shopify and Sanity's CDNs already resize + auto-negotiate WebP/AVIF at the
// origin. Routing every request through Vercel's Image Optimization API on
// top of that was double work and burned the Hobby plan's 5K/mo transformation
// quota (product catalog alone is hundreds of unique Shopify images). This
// loader hands resizing back to whichever CDN actually hosts the image.
export default function imageLoader({ src, width, quality }: LoaderProps) {
  if (src.startsWith("/")) return src; // local /public asset, served as-is

  const url = new URL(src);

  // Scoped to product-photo URLs (cdn.shopify.com/s/files/...?v=...), which is
  // the only Shopify image source this app uses — not a general guarantee that
  // every asset class Shopify serves honors ?width=.
  if (url.hostname === "cdn.shopify.com") {
    url.searchParams.set("width", String(width));
    return url.toString();
  }
  if (url.hostname === "cdn.sanity.io") {
    url.searchParams.set("w", String(width));
    url.searchParams.set("auto", "format");
    url.searchParams.set("q", String(quality ?? 80));
    return url.toString();
  }
  return src;
}
