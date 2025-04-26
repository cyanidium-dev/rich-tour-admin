import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'contact',
  title: 'Наші контакти',
  type: 'document',
  fields: [
    defineField({
      name: 'address',
      title: 'Адреса',
      type: 'string',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'map',
      title: 'Посилання на Google Map',
      type: 'url',
    }),
    defineField({
      name: 'phone_1',
      title: 'Телефон 1',
      type: 'string',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'phone_2',
      title: 'Телефон 2',
      type: 'string',
    }),
    defineField({
      name: 'phone_3',
      title: 'Телефон 3',
      type: 'string',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'working',
      title: 'Робочі дні та години',
      type: 'string',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'weekend',
      title: 'Вихідні',
      type: 'string',
    }),
    defineField({
      name: 'instagram',
      title: 'Інстаграм',
      type: 'url',
    }),
    defineField({
      name: 'facebook',
      title: 'Facebook',
      type: 'url',
    }),
  ],
  preview: {
    select: {
      title: 'address',
    },
  },
})
