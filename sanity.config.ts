import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { schema } from './src/sanity/schemaTypes'
import { projectId, dataset } from './src/sanity/env'
import { myTheme } from './src/sanity/theme'
import { StudioLogo } from './src/sanity/components/StudioLogo'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  schema,
  theme: myTheme,
  studio: {
    components: {
      logo: StudioLogo,
    },
  },
  plugins: [
    deskTool(),
  ],
})
