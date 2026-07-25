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
      title: 'Single-Use Campaign',
      description: 'If enabled, this code deactivates after one successful order globally.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'onePerCustomer',
      title: 'Limit to One Per Customer',
      description: 'If enabled, a single customer (by email/phone) can only use this code once.',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'minPurchaseAmount',
      title: 'Minimum Purchase Amount (₹)',
      description: 'Optional minimum cart subtotal required to apply this discount.',
      type: 'number',
    }),
    defineField({
      name: 'maxUses',
      title: 'Maximum Uses Counter',
      description: 'Optional limit on how many times this code can be used globally. It will automatically deactivate when reached.',
      type: 'number',
    }),
    defineField({
      name: 'usageCount',
      title: 'Current Usage Count',
      type: 'number',
      initialValue: 0,
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'startDate',
      title: 'Active Start Date',
      type: 'datetime',
      description: 'Optional. When should this campaign start being valid?',
    }),
    defineField({
      name: 'endDate',
      title: 'Expiry Date',
      type: 'datetime',
      description: 'Optional. When should this campaign automatically expire?',
    }),
    defineField({
      name: 'allowedCategories',
      title: 'Specific Categories Only',
      description: 'Optional. Select categories this discount applies to. If empty, applies to all items.',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Women', value: 'women' },
          { title: 'Kids', value: 'kids' },
          { title: 'Combo', value: 'combo' }
        ]
      }
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
