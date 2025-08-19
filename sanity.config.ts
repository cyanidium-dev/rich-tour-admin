import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Rich tour admin',

  projectId: 'elggedkx',
  dataset: 'production',

  plugins: [structureTool(), visionTool()],
  useCdn: true,
  schema: {
    types: schemaTypes,
  },
})
