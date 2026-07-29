const { createClient } = require('@sanity/client')
require('dotenv').config({ path: '.env.local' })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'nmf3ae7w',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
  apiVersion: '2023-05-03'
})

const sizes = [
  'Small', 'Medium', 'Large', 'XL', 'XXL', 'XXXL',
  '6-12 months', '1-2 years', '2-3 years', '3-4 years'
]

const colors = [
  'Red', 'Blue', 'Green', 'Black', 'White', 'Pink', 'Yellow'
]

async function populate() {
  console.log('Populating sizes...')
  for (const size of sizes) {
    await client.create({
      _type: 'size',
      name: size
    })
    console.log(`Created size: ${size}`)
  }

  console.log('Populating colors...')
  for (const color of colors) {
    await client.create({
      _type: 'color',
      name: color
    })
    console.log(`Created color: ${color}`)
  }
  
  console.log('Done!')
}

populate().catch(console.error)
