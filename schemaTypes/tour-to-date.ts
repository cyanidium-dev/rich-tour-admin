import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'tour-to-date',
  title: 'Тур на конкретну дату',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Назва туру',
      type: 'string',
      validation: Rule => Rule.required().error('Це поле обов’язкове'),
    }),
    defineField({
      name: 'crmNumber',
      title: 'Номер процесу у CRM',
      type: 'string',
      // validation: Rule => Rule.required().error('Це поле обов’язкове'),
    }),
    defineField({
        name: 'price',
        title: 'Ціна',
        type: 'number',
        validation: Rule => Rule
          .required().error('Це поле обов’язкове')
          .min(0).error('Ціна не може бути від’ємною')
      }),
    defineField({
      name: 'promotion',
      title: 'Акція',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'guaranteed',
      title: 'Гарантований виїзд',
      type: 'boolean',
      initialValue: true
    }),
    defineField({
      name: 'hot',
      title: 'Гарячий тур',
      type: 'boolean',
      initialValue: false
    }),
    defineField({
      name: 'discount',
      title: 'Діє знижка',
      type: 'boolean',
      initialValue: false
    }),
    {
      name: 'availability',
      title: 'Наявність місць',
      type: 'string',
      options: {
        list: [
          { title: 'Виїзд під запит', value: 'onRequest' },
          { title: 'Місця є', value: 'available' },
          { title: 'Мало місць', value: 'fewSeats' },
          { title: 'Місць немає', value: 'noSeats' },
        ],
        layout: 'dropdown',
      },
      initialValue: 'available', // 👈 значение по умолчанию
    },
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: Rule => Rule.required().error('Це поле обов’язкове'),
    }),
    defineField({
      name: 'basic',
      title: 'Базовий тур',
      type: 'reference',
      to: {type: 'tour-basic'},
      validation: Rule => Rule.required().error('Оберіть базовий тур')
    }),
    {
      name: 'dateRange',
      title: 'Дати туру',
      type: 'object',
      fields: [
        {
          name: 'startDate',
          title: 'Дата від',
          type: 'date',
          options: {
            dateFormat: 'YYYY-MM-DD'
          },
          validation: Rule => Rule.required().error('Оберіть дату початку')
        },
        {
          name: 'endDate',
          title: 'Дата до',
          type: 'date',
          options: {
            dateFormat: 'YYYY-MM-DD'
          },
          validation: Rule => Rule.required().error('Оберіть дату завершення')
        }
      ],
      validation: Rule =>
        Rule.custom(dateRange => {
          //@ts-expect-error
          if (!dateRange?.startDate || !dateRange?.endDate) {
            return true
          }
          //@ts-expect-error
          return dateRange.endDate >= dateRange.startDate
            ? true
            : 'Дата завершення не може бути раніше за дату початку'
        })
    },
    {
      name: 'programUpload',
      title: 'Програма туру',
      type: 'file',
      // validation: Rule => Rule.required().error('Завантажте програму')
    },
    {
      name: 'gallery',
      title: 'Галерея зображень',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true
          }
        }
      ],
      validation: Rule => Rule
        .required()
        .min(5)
        .error('Додайте щонайменше 5 зображень')
    },
    defineField({
      name: 'benefits',
      title: 'Переваги туру',
      type: 'blockContent',
    }),
    defineField({
      name: 'sections',
      title: 'Програма туру',
      type: 'array',
      of: [
        {
          type: 'object',
          title: 'Секція',
          fields: [
            {
              name: 'title',
              title: 'День',
              type: 'string'
            },
            {
              name: 'content',
              title: 'Програма дня',
              type: 'blockContent'
            }
          ]
        }
      ]
    }),
    defineField({
      name: 'excursions',
      title: 'Екскурсії туру',
      type: 'array',
      of: [
        {
          type: 'object',
          title: 'Секція',
          fields: [
            {
              name: 'title',
              title: 'Назва екскурсії',
              type: 'string'
            },
            {
              name: 'content',
              title: 'Опис екскурсії',
              type: 'blockContent'
            },
            // {
            //   name: 'gallery',
            //   title: 'Зображення ескурсії',
            //   type: 'array',
            //   of: [
            //     {
            //       type: 'image',
            //       options: {
            //         hotspot: true
            //       }
            //     }
            //   ],
            // },
          ]
        }
      ]
    }),
    defineField({
      name: 'route',
      title: 'Маршрут туру (у вигляді списку)',
      type: 'blockContent',
    }),
    defineField({
      name: 'includes',
      title: 'Що включено до вартості туру (у вигляді списку)',
      type: 'blockContent',
    }),
    defineField({
      name: 'unincludes',
      title: 'Що НЕ включено до вартості туру (у вигляді списку)',
      type: 'blockContent',
    }),
    defineField({
      name: 'inspiration',
      title: 'Натхнення',
      type: 'array',
      of: [
        {
          type: 'object',
          title: 'Секція',
          fields: [
            {
              name: 'title',
              title: 'Назва',
              type: 'string'
            },
            {
              name: 'description',
              title: 'Короткий опис',
              type: 'string'
            },
            {
              name: 'image',
              title: 'Зображення',
              type: 'image',
              options: {
                hotspot: true,
              },
              validation: rule => rule.required().error('Це поле обов’язкове'),
            }
          ]
        }
      ]
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
  },
})
