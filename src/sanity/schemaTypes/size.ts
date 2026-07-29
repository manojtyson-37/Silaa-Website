import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'size',
  title: 'Size',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Size Name (e.g. S, M, L)',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
})
