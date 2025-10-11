import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'tour-basic',
  title: 'Базовий тур',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Назва базового туру',
      type: 'string',
      validation: Rule => Rule.required().error('Це поле обов’язкове'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required().error('Це поле обов’язкове, натисніть кнопку Generate')
    }),
    {
      name: 'categories',
      title: 'Категорії',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'tour-category' }]
        }
      ],
      options: {
        layout: 'checkbox'
      },
      validation: Rule => Rule.required().min(1).error('Оберіть хоча б одну категорію')
    },
    {
      name: 'countries',
      title: 'Країни, через які проходить тур',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'country' }]
        }
      ],
      options: {
        layout: 'checkbox'
      },
      validation: Rule => Rule.required().min(1).error('Оберіть хоча б одну країну')
    },
    defineField({
      name: 'earlyBooking',
      title: 'Раннє бронювання',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'image',
      title: 'Зображення базового туру',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: rule => rule.required().error('Це поле обов’язкове'),
    }),
    defineField({
      name: 'description',
      title: 'Короткий опис (до 210 символів)',
      type: 'text',
      validation: Rule => Rule.required().error('Це поле обов’язкове').max(210).error('Максимум 210 символів')
    }),
    defineField({
      name: 'duration',
      title: 'Тривалість туру у днях',
      type: 'number',
      validation: Rule => Rule.required().error('Це поле обов’язкове'),
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
  },
})
