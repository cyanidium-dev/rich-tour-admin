import { defineType, defineField } from 'sanity'
import PasswordHashInput from '../components/PasswordHashInput'
import PasswordWithHashInput from '../components/PasswordWithHashInput'

const agentUser = defineType({
  name: 'agentUser',
  title: 'Агенти',
  type: 'document',

  fields: [
    defineField({
      name: 'isApproved',
      title: 'Агент схвалений',
      type: 'boolean',
      initialValue: true,
    }),
    // ─────────────────────
    // 📧 Email (логін)
    // ─────────────────────
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: Rule => Rule.required().email(),
    }),
    {
      name: 'agency',
      title: 'Агенція, до якої належить агент',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'agencyUser' }]
        }
      ],
      options: {
        layout: 'checkbox'
      },
    },
    defineField({
      name: 'agencyCrmId',
      title: 'Agency CRM ID',
      type: 'string',
      readOnly: true,
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
      // validation: Rule => Rule.required(),
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
          if (typeof value !== "string") {
            return "Некоректний номер телефону"
          }
    
          // Убираем ВСЁ, кроме цифр
          const digits = value.replace(/[^\d]/g, "")
    
          // Допустимые варианты:
          // 10 цифр (0997875037)
          // 12 цифр (380997875037)
          if (digits.length === 10 || digits.length === 12) {
            return true
          }
    
          return "Номер телефону має містити 10 або 12 цифр"
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
        Rule.custom((value) => {
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
      type: 'string',
    }),

    // ─────────────────────
    // 🧮 Форма оподаткування
    // ─────────────────────
    defineField({
      name: 'taxForm',
      title: 'Форма оподактування',
      type: 'string',
      // validation: Rule => Rule.required(),
      options: {
        list: [
          { title: 'ФОП', value: 'fop' },
          { title: 'ТОВ', value: 'tov' },
          { title: 'Інше', value: 'other' },
        ],
      },
    }),

    // ─────────────────────
    // 🔒 Пароль
    // ─────────────────────
    defineField({
      name: 'password',
      title: 'Password',
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
          // if (!value?.plain) return 'Пароль обовʼязковий'
          if (!value?.hash) return 'Хеш пароля обовʼязковий'
          return true
        }),
    }),


    // ─────────────────────
    // 🔒 id из CRM
    // ─────────────────────
    defineField({
      name: 'crmId',
      title: 'CRM ID',
      type: 'string',
      readOnly: true,
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