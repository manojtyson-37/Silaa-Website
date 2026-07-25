import { createClient } from "next-sanity";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" }); // Load env variables

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "nmf3ae7w";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-01-01";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !dataset || !token) {
  console.error("Missing Sanity environment variables. Please check your .env.local file.");
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
const ADMIN_PASS = process.env.ERP_ADMIN_PASSWORD || "EVzzTRm3gnwbAqFF"; // Fallback to provided password

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

  // Fetch all products from Sanity
  console.log("Fetching products from Sanity...");
  const products = await client.fetch(`*[_type == "product"]{
    _id, title, category, variants
  }`);

  console.log(`Found ${products.length} products in Sanity.`);

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
        console.log(`  -> Variant ${variant.title} already synced (ID: ${variant.erpVariantId}).`);
        continue;
      }

      let size = variant.title || "Default";
      let color = "Default";
      
      const titleLower = size.toLowerCase();
      if (titleLower.includes("red")) color = "Red";
      else if (titleLower.includes("blue")) color = "Blue";
      else if (titleLower.includes("black")) color = "Black";
      else if (titleLower.includes("white")) color = "White";

      const sku_code = `SANITY-${product._id.slice(0, 5)}-${variant.id || i}`.toUpperCase();

      if (erpVariantSkus.has(sku_code)) {
         console.log(`  -> Variant SKU ${sku_code} already exists in ERP. Skipping creation.`);
         continue; 
      }

      console.log(`  -> Creating Variant in ERP: ${variant.title}`);
      
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
      await client.patch(product._id).set({ variants: updatedVariants }).commit();
    }
  }

  console.log(`Sync complete! Synced ${syncCount} variants.`);
}

run().catch(console.error);
