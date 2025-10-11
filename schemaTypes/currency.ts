import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'currency',
  title: 'Курси валют',
  type: 'document',
  fields: [
    defineField({
      name: 'usd_currency',
      title: 'Курс долару',
      type: 'number',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'usd_percent',
      title: 'Відсоткова надбавка до курсу долару',
      type: 'number',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'euro_currency',
      title: 'Курс євро',
      type: 'number',
      validation: rule => rule.required(),
    }),
    defineField({
      name: 'euro_percent',
      title: 'Відсоткова надбавка до курсу євро',
      type: 'number',
      validation: rule => rule.required(),
    }),
  ],
  // preview: {
  //   select: {
  //     title: 'name',
  //   },
  // },
})
