import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'team',
  title: 'Наша команда',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Ім\'я',
      type: 'string',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'photo',
      title: 'Фото',
      type: 'image',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Посада',
      type: 'string',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'instagram',
      title: 'Інстаграм',
      type: 'url',
    }),
    defineField({
      name: 'telegram',
      title: 'Телеграм',
      type: 'url',
    }),
    defineField({
      name: 'tiktok',
      title: 'TikTok',
      type: 'url',
    }),
  ],
  preview: {
    select: {
      title: 'name',
    },
  },
})
