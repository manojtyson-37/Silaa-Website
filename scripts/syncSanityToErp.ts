import { createClient } from "next-sanity";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" }); // Load env variables

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "nmf3ae7w";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  console.error("Missing Sanity environment variables. Please check your .env.test file.");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
});

const ERP_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
const ADMIN_USER = process.env.ERP_ADMIN_USERNAME || "admin";
const ADMIN_PASS = process.env.ERP_ADMIN_PASSWORD;

if (!ADMIN_PASS) {
  console.error("Missing ERP_ADMIN_PASSWORD. Set it in .env.test before syncing.");
  process.exit(1);
}

// The dataset still holds a legacy twin for most slugs. Syncing both folds them
// into one ERP style and creates variants for a document the site never renders.
function dedupeBySlug(docs: any[]): any[] {
  const score = (p: any) => (Array.isArray(p?.variants) ? p.variants.length : 0);
  const best = new Map<string, any>();
  for (const doc of docs) {
    const slug = doc?.slug?.current || doc?.title;
    if (!slug) continue;
    const current = best.get(slug);
    if (!current || score(doc) > score(current)) best.set(slug, doc);
  }
  return Array.from(best.values());
}

async function run() {
  console.log(`Connecting to ERP at ${ERP_URL}...`);
  // 1. Login to ERP
  const loginRes = await fetch(`${ERP_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: ADMIN_USER, password: ADMIN_PASS }),
  });

  if (!loginRes.ok) {
    console.error("Failed to login to ERP:", await loginRes.text());
    process.exit(1);
  }

  const { access_token } = await loginRes.json() as any;
  console.log("Logged into ERP successfully.");

  // Fetch all existing styles in ERP to avoid duplication
  const stylesRes = await fetch(`${ERP_URL}/styles`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const existingStyles = await stylesRes.json() as any[];
  const styleMap = new Map<string, number>(); // name -> id
  if (Array.isArray(existingStyles)) {
    existingStyles.forEach(s => styleMap.set(s.name.toLowerCase(), s.id));
  }
  
  // Also fetch all variants to avoid duplication if we missed a Sanity update
  const variantsRes = await fetch(`${ERP_URL}/styles-with-variants`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const stylesWithVariants = await variantsRes.json() as any[];
  const erpVariantSkus = new Set<string>();
  if (Array.isArray(stylesWithVariants)) {
    stylesWithVariants.forEach(s => {
      s.variants.forEach((v: any) => erpVariantSkus.add(v.sku_code));
    });
  }

  console.log(`Fetched ${styleMap.size} styles from ERP.`);

  // Fetch published products from Sanity. A token makes this client's perspective
  // "raw" (drafts included), and a draft can reuse a published slug as an entirely
  // separate, unpublished document — syncing it would create ERP variants and
  // stamp erpVariantId onto content the user hasn't decided to publish yet, and
  // (via dedupeBySlug's variant-count scoring) can even shadow the real published
  // doc out of the sync altogether.
  console.log("Fetching published products from Sanity...");
  const allDocs = await client.fetch(`*[_type == "product" && !(_id in path("drafts.**"))]{
    _id, title, category, slug,
    variants[]{
      ...,
      "sizeName": size->name,
      "colorName": color->name
    }
  }`);

  const products = dedupeBySlug(allDocs);
  console.log(
    `Found ${allDocs.length} product documents in Sanity, ${products.length} after dropping legacy twins.`
  );

  let syncCount = 0;

  for (const product of products) {
    console.log(`Syncing Product: ${product.title}`);
    let styleId = styleMap.get(product.title.toLowerCase());
    
    if (!styleId) {
      console.log(`  -> Creating Style in ERP: ${product.title}`);
      const createStyleRes = await fetch(`${ERP_URL}/styles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          name: product.title,
          category: product.category,
        }),
      });

      if (!createStyleRes.ok) {
        console.error(`  -> Failed to create Style:`, await createStyleRes.text());
        continue;
      }
      const newStyle = await createStyleRes.json() as any;
      styleId = newStyle.id;
      styleMap.set(product.title.toLowerCase(), styleId as number);
    }

    if (!product.variants || product.variants.length === 0) continue;

    let variantsUpdated = false;
    const updatedVariants = [...product.variants];

    for (let i = 0; i < updatedVariants.length; i++) {
      const variant = updatedVariants[i];
      if (variant.erpVariantId) {
        const label = variant.sizeName || variant.title || "(unnamed)";
        console.log(`  -> Variant ${label} already synced (ID: ${variant.erpVariantId}).`);
        continue;
      }

      // Matrix variants carry real size/colour references; only fall back to
      // sniffing the legacy text title for products never moved onto the matrix.
      let size = variant.sizeName || variant.title || "Default";
      let color = variant.colorName || "Default";

      if (!variant.colorName) {
        const titleLower = String(variant.title || "").toLowerCase();
        if (titleLower.includes("red")) color = "Red";
        else if (titleLower.includes("blue")) color = "Blue";
        else if (titleLower.includes("black")) color = "Black";
        else if (titleLower.includes("white")) color = "White";
      }

      const sku_code = `SANITY-${product._id.slice(0, 5)}-${variant.id || i}`.toUpperCase();

      if (erpVariantSkus.has(sku_code)) {
         console.log(`  -> Variant SKU ${sku_code} already exists in ERP. Skipping creation.`);
         continue; 
      }

      console.log(`  -> Creating Variant in ERP: ${size} / ${color}`);
      
      const createVariantRes = await fetch(`${ERP_URL}/styles/${styleId}/variants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          color,
          size,
          sku_code,
          qty: variant.inventory || 0,
          selling_price: variant.price ? parseFloat(variant.price) : 0,
        }),
      });

      if (!createVariantRes.ok) {
        console.error(`  -> Failed to create variant:`, await createVariantRes.text());
        continue;
      }

      const newVariant = await createVariantRes.json() as any;
      updatedVariants[i] = { ...variant, erpVariantId: newVariant.id };
      variantsUpdated = true;
      syncCount++;
    }

    if (variantsUpdated) {
      console.log(`  -> Updating Sanity Product ${product.title} with ERP IDs...`);
      // sizeName/colorName are query-time projections, not document fields —
      // writing them back would pollute the document.
      const toWrite = updatedVariants.map(({ sizeName, colorName, ...rest }: any) => rest);
      await client.patch(product._id).set({ variants: toWrite }).commit();
    }
  }

  console.log(`Sync complete! Synced ${syncCount} variants.`);
}

run().catch(console.error);
