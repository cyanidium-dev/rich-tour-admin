import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'faq',
  title: 'Питання-Відповідь',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Питання',
      type: 'string',
      validation: rule => rule.required(),
    }),
    defineField({
      title: 'Відповідь',
      name: 'text',
      type: 'text',
      validation: rule => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
  },
})
