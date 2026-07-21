import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';

// Load products
const productsData = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src/data/products.json'), 'utf-8')
);

// We need to provide these via env vars or hardcode for the migration
const projectId = process.env.SANITY_PROJECT_ID || 'nmf3ae7w';
const dataset = process.env.SANITY_DATASET || 'production';
const token = process.env.SANITY_API_TOKEN || 'sk3yJiGxDrqHER0yzbB4uDT8pVexIYYIPC9CLiCRFSOQBkJvAfJRTqVRUbnZdHkedXUxZkzmhppzD1VWIwmGIbz94zF0YqicoTBH5Oq4ojuCT9nIyllvWKBTLBA8yKWsuJ7hh7LgxTrdXblnyplFnrjUOn6B0FQ64EfiTNlGpLer0hRBsMhk';

const client = createClient({
  projectId,
  dataset,
  useCdn: false,
  token,
  apiVersion: '2023-01-01',
});

async function migrate() {
  console.log(`Starting migration for ${productsData.products.length} products...`);
  
  for (const product of productsData.products) {
    try {
      // Create the product document
      const sanityProduct = {
        _type: 'product',
        _id: `product-${product.id}`,
        title: product.title,
        slug: { _type: 'slug', current: product.handle },
        bodyHtml: product.body_html,
        vendor: product.vendor,
        tags: product.tags,
        price: product.variants[0]?.price ? parseFloat(product.variants[0].price) : 0,
        // We will just upload images as URLs for now to save time, or we can use Sanity assets.
        // For a full migration we should download and upload assets to sanity.
        // For now, we will save the Shopify CDN urls as strings in an array.
        imageUrls: product.images.map(img => img.src)
      };

      console.log(`Creating product: ${product.title}`);
      await client.createOrReplace(sanityProduct);
      
    } catch (err) {
      console.error(`Failed to migrate product ${product.title}:`, err.message);
    }
  }
  
  console.log('Migration complete!');
}

migrate();
