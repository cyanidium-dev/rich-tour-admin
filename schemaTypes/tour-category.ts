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
    defineField({
      name: 'image',
      title: 'Зображення категорії',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: rule => rule.required().error('Це поле обов’язкове'),
    }),
    defineField({
      name: 'active',
      title: 'Використовувати у фільтрах',
      type: 'boolean',
      initialValue: true
    }),
    defineField({
      name: 'main',
      title: 'Категорія для вітрини',
      type: 'boolean',
      initialValue: true
    })
  ],
  preview: {
    select: {
      title: 'title',
    },
  },
})
