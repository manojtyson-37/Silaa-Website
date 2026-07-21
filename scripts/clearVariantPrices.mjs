import { createClient } from '@sanity/client'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nmf3ae7w',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-03-13',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

async function clearVariantPrices() {
  console.log('Fetching products...')
  const products = await client.fetch(`*[_type == "product"]`)
  
  for (const product of products) {
    if (!product.variants || product.variants.length === 0) continue;
    
    const newVariants = product.variants.map(v => {
      // Clear explicit size prices so they fallback to root price
      return {
        ...v,
        price: "",
        compare_at_price: ""
      }
    })
    
    try {
      await client.patch(product._id)
        .set({ variants: newVariants })
        .commit()
      console.log(`Cleared variant prices for: ${product.title}`)
    } catch (err) {
      console.error(`Failed on ${product.title}:`, err.message)
    }
  }
  console.log('Done!')
}

clearVariantPrices()
