import { type SchemaTypeDefinition } from 'sanity'
import product from './product'
import campaign from './campaign'
import size from './size'
import color from './color'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [product, campaign, size, color],
}
