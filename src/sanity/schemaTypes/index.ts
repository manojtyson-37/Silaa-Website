import { type SchemaTypeDefinition } from 'sanity'
import product from './product'
import campaign from './campaign'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [product, campaign],
}
