import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'review',
  title: 'Відгуки',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Ім\'я',
      type: 'string',
      validation: rule => rule.required(),
    }),
    defineField({
      title: 'Текст відгуку',
      name: 'text',
      type: 'text',
      validation: rule => rule.required(),
    }),
    defineField({
      title: 'Перевірено',
      name: 'verified',
      type: 'boolean'
    }),
  ],
  preview: {
    select: {
      title: 'name',
    },
  },
})
