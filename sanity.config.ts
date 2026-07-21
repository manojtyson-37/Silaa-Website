import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { schema } from './src/sanity/schemaTypes'
import { projectId, dataset } from './src/sanity/env'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  schema,
  plugins: [
    deskTool(),
  ],
})
