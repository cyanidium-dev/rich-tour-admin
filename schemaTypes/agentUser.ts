import { defineType, defineField } from 'sanity'
import PasswordHashInput from '../components/PasswordHashInput'

const agentUser = defineType({
  name: 'agentUser',
  title: 'Агенти',
  type: 'document',

  fields: [
    // ─────────────────────
    // 📧 Email (логін)
    // ─────────────────────
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: Rule => Rule.required().email(),
    }),

    // ─────────────────────
    // 🏢 Назви компанії
    // ─────────────────────
    defineField({
      name: 'companyName',
      title: 'Повне ім\'я/Назва фірми',
      type: 'string',
      validation: Rule => Rule.required(),
    }),

    defineField({
      name: 'legalCompanyName',
      title: 'Юридична назва фірми',
      type: 'string',
      validation: Rule => Rule.required(),
    }),

    // ─────────────────────
    // 📞 Телефон
    // ─────────────────────
    defineField({
      name: 'phone',
      title: 'Телефон',
      type: 'string',
      validation: Rule =>
        Rule.required().custom((value) => {
          if (!value) return true
          return /^\+?[0-9\s\-()]{10,15}$/.test(value)
            ? true
            : 'Некоректний номер телефону'
        }),
    }),

    // ─────────────────────
    // 🧾 ЄДРПОУ
    // ─────────────────────
    defineField({
      name: 'edrpou',
      title: 'ЄДРПОУ',
      type: 'string',
      validation: Rule =>
        Rule.required().custom((value) => {
          if (!value) return true
          return /^\d{8,10}$/.test(value)
            ? true
            : 'ЄДРПОУ має містити від 8 до 10 цифр'
        }),
    }),

    // ─────────────────────
    // 🏙️ Місто
    // ─────────────────────
    defineField({
      name: 'city',
      title: 'City',
      type: 'string',
      validation: Rule => Rule.required(),
    }),

    // ─────────────────────
    // 🌐 Сайт (необовʼязково)
    // ─────────────────────
    defineField({
      name: 'site',
      title: 'Сайт',
      type: 'url',
      validation: Rule => Rule.uri({
        allowRelative: false,
        scheme: ['http', 'https'],
      }),
    }),

    // ─────────────────────
    // 🧮 Форма оподаткування
    // ─────────────────────
    defineField({
      name: 'taxForm',
      title: 'Форма оподактування',
      type: 'string',
      validation: Rule => Rule.required(),
      options: {
        list: [
          { title: 'ФОП', value: 'fop' },
          { title: 'ТОВ', value: 'tov' },
          { title: 'Інше', value: 'other' },
        ],
      },
    }),

    // ─────────────────────
    // 🔒 Пароль (хеш)
    // ─────────────────────
    defineField({
      name: 'passwordHash',
      title: 'Password',
      type: 'string',
      components: {
        input: PasswordHashInput,
      },
      validation: Rule => Rule.required(),
    }),
  ],

  // ─────────────────────
  // 👁️ Preview
  // ─────────────────────
  preview: {
    select: {
      title: 'companyName',
      subtitle: 'email',
    },
  },
})

export default agentUser;