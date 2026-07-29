import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'color',
  title: 'Color',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Color Name (e.g. Red, Blue)',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
})
