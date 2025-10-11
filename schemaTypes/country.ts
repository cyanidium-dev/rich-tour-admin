import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'country',
  title: 'Країни',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Назва країни',
      type: 'string',
    }),
  ],
})
