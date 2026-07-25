import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'campaign',
  title: 'Discount Campaign',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Campaign Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'discountCode',
      title: 'Discount Code',
      type: 'string',
      description: 'The code customers enter at checkout (e.g., DIWALI20). If left blank, this acts as an automatic site-wide discount.',
    }),
    defineField({
      name: 'discountType',
      title: 'Discount Type',
      type: 'string',
      options: {
        list: [
          { title: 'Percentage (%)', value: 'percentage' },
          { title: 'Fixed Amount (₹)', value: 'fixed' },
        ],
        layout: 'radio'
      },
      initialValue: 'percentage',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'discountValue',
      title: 'Discount Value',
      type: 'number',
      description: 'The percentage (e.g., 20 for 20%) or fixed amount (e.g., 500 for ₹500)',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'isActive',
      title: 'Is Active?',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'oneTimeUse',
      title: 'One code one use',
      description: 'If enabled, this code can only be used once globally across the entire store.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'onePerCustomer',
      title: 'One customer one use',
      description: 'If enabled, a single customer can only use this code once.',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      discountCode: 'discountCode',
      isActive: 'isActive',
    },
    prepare({ title, discountCode, isActive }) {
      return {
        title,
        subtitle: `${isActive ? '🟢 Active' : '🔴 Inactive'} | Code: ${discountCode || 'Automatic (No Code)'}`,
      }
    },
  },
})
