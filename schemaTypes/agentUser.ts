import {defineField, defineType} from 'sanity'

const agentUser = defineType({
  name: 'agentUser',
  title: 'Агенти',
  type: 'document',
  fields: [
    defineField({
      name: 'isApproved',
      title: 'Агента схвалено',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'email',
      title: 'Електронна пошта',
      type: 'string',
      validation: (Rule) =>
        Rule.required()
          .email()
          .custom(async (value, context) => {
            if (!value) return true
            if (value !== value.trim().toLowerCase()) {
              return 'Введіть адресу малими літерами без пробілів'
            }
            const id = context.document?._id?.replace(/^drafts\./, '') || ''
            const duplicates = await context
              .getClient({apiVersion: '2025-04-26'})
              .fetch<number>(
                'count(*[_type == "agentUser" && email == $email && !(_id in [$id, $draftId])])',
                {email: value, id, draftId: `drafts.${id}`},
              )
            return duplicates ? 'Агент із такою електронною поштою вже існує' : true
          }),
    }),
    defineField({name: 'companyName', title: 'Назва компанії', type: 'string'}),
    defineField({name: 'legalCompanyName', title: 'Юридична назва компанії', type: 'string'}),
    defineField({name: 'phone', title: 'Телефон', type: 'string'}),
    defineField({name: 'edrpou', title: 'Код ЄДРПОУ', type: 'string'}),
    defineField({name: 'city', title: 'Місто', type: 'string'}),
    defineField({name: 'site', title: 'Сайт', type: 'string'}),
    defineField({
      name: 'taxForm',
      title: 'Форма оподаткування',
      type: 'string',
      options: {
        list: [
          {title: 'ФОП', value: 'fop'},
          {title: 'ТОВ', value: 'tov'},
          {title: 'Інша', value: 'other'},
        ],
      },
    }),
    defineField({
      name: 'displayName',
      title: 'Назва для списку',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'displayIdentity',
      title: 'Електронна пошта для списку',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'agency',
      title: 'Агенція',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'agencyUser'}]}],
      options: {layout: 'list'},
    }),
    defineField({
      name: 'identityLookup',
      title: 'Прихований індекс користувача',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'encryptedPayload',
      title: 'Пароль та захищені дані',
      type: 'encryptedUserPayload',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'crmLinked',
      title: 'Пов’язано з CRM',
      type: 'boolean',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'crmSync',
      title: 'Синхронізація з CRM',
      type: 'object',
      hidden: true,
      options: {collapsible: true, collapsed: false},
      fields: [
        defineField({
          name: 'status',
          title: 'Статус',
          type: 'string',
          readOnly: true,
          options: {
            list: [
              {title: 'Очікує', value: 'pending'},
              {title: 'Виконується', value: 'processing'},
              {title: 'Синхронізовано', value: 'synced'},
              {title: 'Буде повторено', value: 'failed'},
              {title: 'Потрібна ручна перевірка', value: 'manualReview'},
            ],
          },
        }),
        defineField({
          name: 'attempts',
          title: 'Кількість спроб',
          type: 'number',
          readOnly: true,
        }),
        defineField({
          name: 'nextRetryAt',
          title: 'Наступна спроба',
          type: 'datetime',
          readOnly: true,
        }),
        defineField({
          name: 'lastAttemptAt',
          title: 'Остання спроба',
          type: 'datetime',
          readOnly: true,
        }),
        defineField({
          name: 'lastSuccessAt',
          title: 'Остання успішна спроба',
          type: 'datetime',
          readOnly: true,
        }),
        defineField({name: 'lastErrorCode', title: 'Код помилки', type: 'string', readOnly: true}),
        defineField({
          name: 'lockUntil',
          title: 'Заблоковано до',
          type: 'datetime',
          readOnly: true,
          hidden: true,
        }),
        defineField({
          name: 'manualRetryRequestedAt',
          title: 'Ручний повтор',
          type: 'datetime',
          readOnly: true,
          hidden: true,
        }),
      ],
    }),
  ],
  preview: {
    select: {
      companyName: 'companyName',
      email: 'email',
      displayName: 'displayName',
      displayIdentity: 'displayIdentity',
      approved: 'isApproved',
    },
    prepare({companyName, email, displayName, displayIdentity, approved}) {
      return {
        title: companyName || displayName || 'Зашифрований агент',
        subtitle: [email || displayIdentity, approved ? 'схвалено' : 'не схвалено']
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})

export default agentUser
