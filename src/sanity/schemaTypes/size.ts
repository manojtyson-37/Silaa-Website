import React from 'react'
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
  preview: {
    select: {
      title: 'name'
    },
    prepare({ title }) {
      const shortText = title ? (title.length <= 4 ? title : title.substring(0, 3)).toUpperCase() : '?'
      return {
        title,
        media: () => React.createElement('div', {
          style: {
            width: '100%',
            height: '100%',
            backgroundColor: '#f1f5f9',
            borderRadius: '4px',
            border: '1px solid #cbd5e1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#334155'
          }
        }, shortText)
      }
    }
  }
})
