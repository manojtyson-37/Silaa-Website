import { createClient } from '@sanity/client'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const client = createClient({
  projectId: 'nmf3ae7w',
  dataset: 'production',
  apiVersion: '2024-03-13',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

async function uploadImageFromUrl(imageUrl) {
  const response = await fetch(imageUrl)
  if (!response.ok) throw new Error(`Failed to fetch image: ${imageUrl}`)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const ext = imageUrl.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg'
  const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }
  const contentType = mimeMap[ext] || 'image/jpeg'
  const asset = await client.assets.upload('image', buffer, { contentType })
  return asset._id
}

async function migrateImages() {
  // Fetch all products that have imageUrls but no (or empty) images array
  const products = await client.fetch(
    `*[_type == "product" && defined(imageUrls) && count(imageUrls) > 0]{ _id, title, imageUrls, images }`
  )

  console.log(`Found ${products.length} products with legacy image URLs to migrate.\n`)

  for (const product of products) {
    // Skip if already has Sanity images
    if (product.images && product.images.length > 0) {
      console.log(`⏭ Skipping (already has images): ${product.title}`)
      continue
    }

    console.log(`📸 Migrating: ${product.title} (${product.imageUrls.length} images)`)
    const imageAssets = []

    for (const url of product.imageUrls) {
      try {
        const assetId = await uploadImageFromUrl(url)
        imageAssets.push({
          _type: 'image',
          _key: assetId.replace('image-', '').substring(0, 10),
          asset: { _type: 'reference', _ref: assetId },
        })
        process.stdout.write('  ✓')
      } catch (err) {
        process.stdout.write('  ✗')
        console.error(`\n  Failed: ${url} — ${err.message}`)
      }
    }

    if (imageAssets.length > 0) {
      await client.patch(product._id).set({ images: imageAssets }).commit()
      console.log(`\n  ✅ Saved ${imageAssets.length} images to ${product.title}`)
    }
  }

  console.log('\n🎉 Image migration complete!')
}

migrateImages().catch(console.error)
