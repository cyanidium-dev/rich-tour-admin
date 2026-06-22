import { defineType, defineField } from 'sanity'
import PasswordWithHashInput from '../components/PasswordWithHashInput'

const agencyUser = defineType({
  name: 'agencyUser',
  title: 'Агенції',
  type: 'document',

  fields: [
    // ─────────────────────
    // 🏢 Назви агенції
    // ─────────────────────
    defineField({
      name: 'legalAgencyName',
      title: 'Офіційна назва агенції',
      type: 'string',
      validation: Rule => Rule.required(),
    }),

    defineField({
      name: 'marketingAgencyName',
      title: 'Маркетингова назва агенції',
      type: 'string',
    }),

    // ─────────────────────
    // 🔐 Логін
    // ─────────────────────
    defineField({
      name: 'login',
      title: 'Login',
      type: 'string',
      validation: Rule =>
        Rule.required()
          .min(4)
          .regex(/^[a-zA-Z0-9._-]+$/, {
            name: 'login',
          }),
    }),

    // ─────────────────────
    // 🔒 Пароль (хеш)
    // ─────────────────────
    defineField({
      name: 'password',
      title: 'Пароль',
      type: 'object',
      fields: [
        defineField({
          name: 'plain',
          title: 'Plain password',
          type: 'string',
        }),
        defineField({
          name: 'hash',
          title: 'Password hash',
          type: 'string',
          readOnly: true,
        }),
      ],
      components: {
        input: PasswordWithHashInput,
      },
      validation: Rule =>
        Rule.required().custom((value) => {
          if (!value?.hash) return 'Хеш пароля обовʼязковий'
          return true
        }),
    }),

    // ─────────────────────
    // 🏛️ Дані агенції (ПЛОСКО)
    // ─────────────────────
    defineField({
      name: 'agencyEdrpou',
      title: 'ЄДРПОУ агенції',
      type: 'string',
      validation: Rule =>
        Rule.custom((value) => {
          if (!value) return true
          return /^\d{8,10}$/.test(value)
            ? true
            : 'ЄДРПОУ має містити рівно 8 цифр'
        }),
    }),

    defineField({
      name: 'agencyCity',
      title: 'Місто реєстрації',
      type: 'string',
    }),

    defineField({
      name: 'agencyLegalAddress',
      title: 'Адреса реєстрації',
      type: 'string',
    }),

    defineField({
      name: 'agencyEmail',
      title: 'Пошта агенції',
      type: 'string',
      validation: Rule => Rule.required().email(),
    }),

    defineField({
      name: 'agencyPhone',
      title: 'Телефон агенції',
      type: 'string',
      validation: Rule =>
        Rule.required().custom((value) => {
          if (!value) return true
          return /^\+?[0-9\s\-()]{10,15}$/.test(value)
            ? true
            : 'Некоректний номер телефону'
        }),
    }),

    defineField({
      name: 'mainOfficeEmail',
      title: 'Email головного офісу',
      type: 'string',
      validation: Rule => Rule.required().email(),
    }),
  ],

  // ─────────────────────
  // 👁️ Preview
  // ─────────────────────
  preview: {
    select: {
      title: 'marketingAgencyName',
      subtitle: 'legalAgencyName',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || subtitle,
        subtitle,
      }
    },
  },
})

export default agencyUser;
