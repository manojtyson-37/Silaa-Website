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
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
    }),
    defineField({
      name: 'bodyHtml',
      title: 'Description (HTML)',
      type: 'text',
    }),
    defineField({
      name: 'vendor',
      title: 'Vendor',
      type: 'string',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
    }),
    defineField({
      name: 'imageUrls',
      title: 'Image URLs',
      type: 'array',
      of: [{ type: 'url' }],
      description: 'Temporary field for migrated images from Shopify CDN',
    }),
    defineField({
      name: 'variants',
      title: 'Variants',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            { name: 'id', type: 'number', title: 'Variant ID' },
            { name: 'title', type: 'string', title: 'Title' },
            { name: 'price', type: 'string', title: 'Price' },
            { name: 'compare_at_price', type: 'string', title: 'Compare at Price' },
            { name: 'available', type: 'boolean', title: 'Available' },
          ]
        }
      ]
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'price',
    },
    prepare(selection) {
      const { title, subtitle } = selection
      return {
        title,
        subtitle: `₹${subtitle}`,
      }
    },
  },
})
