import { defineField, defineType } from 'sanity'
import { VariantMatrixInput } from '../components/VariantMatrixInput'
import { MultiSelectReferenceInput } from '../components/MultiSelectReferenceInput'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fieldsets: [
    { name: 'metafields', title: 'Category Metafields', options: { collapsible: true, collapsed: false } }
  ],
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
        isUnique: () => true,
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
      name: 'compareAtPrice',
      title: 'Compare at Price (₹) / MRP',
      type: 'number',
      description: 'Original price (MRP). If higher than the Price, it will be shown slashed out.',
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
      name: 'fabric',
      title: 'Fabric',
      type: 'string',
      fieldset: 'metafields',
    }),
    defineField({
      name: 'clothingFeatures',
      title: 'Baby/Toddler Clothing Features',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      fieldset: 'metafields',
    }),
    defineField({
      name: 'neckline',
      title: 'Neckline',
      type: 'string',
      fieldset: 'metafields',
    }),
    defineField({
      name: 'sleeveLength',
      title: 'Sleeve length type',
      type: 'string',
      fieldset: 'metafields',
    }),
    defineField({
      name: 'targetGender',
      title: 'Target gender',
      type: 'string',
      fieldset: 'metafields',
    }),
    defineField({
      name: 'topLength',
      title: 'Top length type',
      type: 'string',
      fieldset: 'metafields',
    }),
    defineField({
      name: 'availableSizes',
      title: 'Available Sizes (Matrix)',
      type: 'array',
      components: {
        input: MultiSelectReferenceInput,
      },
      of: [{ type: 'reference', to: [{ type: 'size' }] }],
      description: 'Select all sizes to automatically generate variants.',
      fieldset: 'metafields',
    }),
    defineField({
      name: 'availableColors',
      title: 'Available Colors (Matrix)',
      type: 'array',
      components: {
        input: MultiSelectReferenceInput,
      },
      of: [{ type: 'reference', to: [{ type: 'color' }] }],
      description: 'Select all colors to automatically generate variants.',
      fieldset: 'metafields',
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
      components: {
        input: VariantMatrixInput,
      },
      of: [
        {
          type: 'object',
          fields: [
            { name: 'id', type: 'number', title: 'Variant ID', hidden: true, initialValue: () => Math.floor(Math.random() * 1000000000) },
            { name: 'erpVariantId', type: 'number', title: 'ERP Variant ID', description: 'The exact ID of this variant in the Silaa ERP system (used to sync orders automatically)' },
            { name: 'title', type: 'string', title: 'Legacy Size/Color', hidden: true },
            { name: 'size', title: 'Size', type: 'reference', to: [{ type: 'size' }] },
            { name: 'color', title: 'Color', type: 'reference', to: [{ type: 'color' }] },
            { name: 'price', type: 'string', title: 'Price (₹)' },
            { name: 'compare_at_price', type: 'string', title: 'Compare at Price (₹) (Optional)' },
            { name: 'available', type: 'boolean', title: 'In Stock?', initialValue: true },
            { name: 'inventory', type: 'number', title: 'Inventory Count', description: 'Number of items available (Optional)' },
          ],
          preview: {
            select: {
              title: 'title',
              size: 'size.name',
              color: 'color.name',
              price: 'price',
              available: 'available'
            },
            prepare({ title, size, color, price, available }) {
              const generatedTitle = [size, color].filter(Boolean).join(' / ')
              return {
                title: title || generatedTitle || 'Unnamed variant',
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
