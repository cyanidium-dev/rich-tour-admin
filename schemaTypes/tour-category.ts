import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'tour-category',
  title: 'Категорія туру',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Назва категорії',
      type: 'string',
      validation: Rule => Rule.required().error('Це поле обов’язкове'),
    }),
    defineField({
      name: 'description',
      title: 'Опис категорії',
      type: 'blockContent',
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
  },
})
