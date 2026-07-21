import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-03-13',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

async function migrate() {
  const productsPath = path.resolve(__dirname, '../src/data/products.json')
  const rawData = JSON.parse(fs.readFileSync(productsPath, 'utf-8'))
  const products = rawData.products

  console.log(`Found ${products.length} products to migrate.`)

  for (const product of products) {
    const doc = {
      _type: 'product',
      _id: `imported-product-${product.id}`,
      id: product.id,
      title: product.title,
      slug: {
        _type: 'slug',
        current: product.handle,
      },
      price: product.variants[0]?.price ? parseFloat(product.variants[0].price) : 0,
      bodyHtml: product.body_html,
      vendor: product.vendor,
      tags: product.tags,
      imageUrls: product.images.map(img => img.src),
      variants: product.variants.map(v => ({
        _key: `var-${v.id}`,
        id: v.id,
        title: v.title,
        price: v.price,
        compare_at_price: v.compare_at_price,
        available: v.available
      }))
    }

    try {
      const result = await client.createOrReplace(doc)
      console.log(`Migrated: ${result.title}`)
    } catch (err) {
      console.error(`Failed to migrate ${product.title}:`, err.message)
    }
  }

  console.log('Migration complete!')
}

migrate()
