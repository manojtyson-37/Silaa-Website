import React from 'react'
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
  preview: {
    select: {
      title: 'name'
    },
    prepare({ title }) {
      const colorValue = title ? title.toLowerCase().replace(/\s/g, '') : '#e5e5e5'
      return {
        title,
        media: () => React.createElement('div', {
          style: {
            width: '100%',
            height: '100%',
            backgroundColor: colorValue,
            borderRadius: '50%',
            border: '1px solid #e5e5e5'
          }
        })
      }
    }
  }
})
