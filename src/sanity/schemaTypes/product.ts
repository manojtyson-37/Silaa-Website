import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'id',
      title: 'Original ID',
      type: 'number',
      hidden: true,
      initialValue: () => Math.floor(Math.random() * 1000000000),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
        isUnique: async (slug, context) => {
          const { document, getClient } = context
          if (!document?._id) return true
          const client = getClient({ apiVersion: '2024-03-13' })
          const id = document._id.replace(/^drafts\./, '')
          const params = {
            draft: `drafts.${id}`,
            published: id,
            slug,
          }
          const query = `!defined(*[!(_id in [$draft, $published]) && slug.current == $slug][0]._id)`
          return client.fetch(query, params)
        },
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price (₹)',
      type: 'number',
      description: 'Default base price of the product',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
      description: 'Write a beautiful description for your product. (Replaces old HTML field)',
    }),
    defineField({
      name: 'bodyHtml',
      title: 'Legacy Description (HTML)',
      type: 'text',
      hidden: true,
    }),
    defineField({
      name: 'vendor',
      title: 'Vendor',
      type: 'string',
      hidden: true,
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Women', value: 'women' },
          { title: 'Kids', value: 'kids' },
          { title: 'Combo', value: 'combo' }
        ],
        layout: 'radio'
      }
    }),
    defineField({
      name: 'isNewLaunch',
      title: 'Is this a New Launch?',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'tags',
      title: 'Legacy Tags',
      type: 'array',
      of: [{ type: 'string' }],
      hidden: true,
    }),
    defineField({
      name: 'imageUrls',
      title: 'Legacy Image URLs',
      type: 'array',
      of: [{ type: 'url' }],
      hidden: true,
    }),
    defineField({
      name: 'images',
      title: 'Product Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Upload high-quality images here. These will be prioritized over legacy images.',
    }),
    defineField({
      name: 'variants',
      title: 'Sizes & Colors (Variants)',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'id', type: 'number', title: 'Variant ID', hidden: true, initialValue: () => Math.floor(Math.random() * 1000000000) },
            { name: 'title', type: 'string', title: 'Size/Color (e.g. "S", "M", "Red")' },
            { name: 'price', type: 'string', title: 'Price (₹)' },
            { name: 'compare_at_price', type: 'string', title: 'Compare at Price (₹) (Optional)' },
            { name: 'available', type: 'boolean', title: 'In Stock?', initialValue: true },
          ],
          preview: {
            select: {
              title: 'title',
              price: 'price',
              available: 'available'
            },
            prepare({ title, price, available }) {
              return {
                title: title || 'Unnamed variant',
                subtitle: `₹${price || 0} - ${available ? 'In Stock' : 'Out of Stock'}`
              }
            }
          }
        }
      ]
    }),
  ],
  preview: {
    select: {
      title: 'title',
      price: 'price',
      media: 'images.0'
    },
    prepare({ title, price, media }) {
      return {
        title,
        subtitle: price ? `₹${price}` : 'No price set',
        media
      }
    },
  },
})
