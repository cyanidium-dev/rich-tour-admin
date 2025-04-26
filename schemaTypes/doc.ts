import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'doc',
  title: 'Документи',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Назва документу',
      type: 'string',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'doc',
      title: 'Документ',
      type: 'image',
      validation: rule => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'name',
    },
  },
})
