import {defineType, defineField} from 'sanity'

const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Налаштування сайту',
  type: 'document',

  fields: [
    defineField({
      name: 'eurMarkupUah',
      title: 'Надбавка до курсу євро, грн за 1 €',
      type: 'number',
      initialValue: 0,
      validation: (Rule) =>
        Rule.required()
          .min(0)
          .precision(2)
          .error('Вкажіть надбавку від 0 грн з точністю до копійок'),
    }),
    defineField({
      name: 'usdMarkupUah',
      title: 'Надбавка до курсу долара, грн за 1 $',
      type: 'number',
      initialValue: 0,
      validation: (Rule) =>
        Rule.required()
          .min(0)
          .precision(2)
          .error('Вкажіть надбавку від 0 грн з точністю до копійок'),
    }),
    defineField({
      name: 'agentContract',
      title: 'Договір агента',
      type: 'file',
      options: {
        accept: '.pdf,.doc,.docx',
      },
    }),

    defineField({
      name: 'touristContract',
      title: 'Договір з туристом',
      type: 'file',
      options: {
        accept: '.pdf,.doc,.docx',
      },
    }),

    defineField({
      name: 'telegram',
      title: 'Telegram канал',
      type: 'url',
    }),

    defineField({
      name: 'contacts',
      title: 'Наші контакти',
      type: 'object',
      fields: [
        defineField({
          name: 'address',
          title: 'Адреса',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({name: 'map', title: 'Посилання на Google Map', type: 'url'}),
        defineField({
          name: 'phone_1',
          title: 'Телефон 1',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({name: 'phone_2', title: 'Телефон 2', type: 'string'}),
        defineField({name: 'phone_3', title: 'Телефон 3', type: 'string'}),
        defineField({
          name: 'email',
          title: 'Email',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'working',
          title: 'Робочі дні та години',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({name: 'weekend', title: 'Вихідні', type: 'string'}),
        defineField({name: 'instagram', title: 'Інстаграм', type: 'url'}),
        defineField({name: 'facebook', title: 'Facebook', type: 'url'}),
      ],
    }),
  ],
  preview: {
    prepare: () => ({title: 'Налаштування сайту'}),
  },
})

export default siteSettings
