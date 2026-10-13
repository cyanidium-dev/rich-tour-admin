import {defineField, defineType} from 'sanity'

const agentUser = defineType({
  name: 'agentUser',
  title: 'Агенты',
  type: 'document',
  fields: [
    defineField({
      name: 'isApproved',
      title: 'Агент одобрен',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'displayName',
      title: 'Название для списка',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'displayIdentity',
      title: 'Email для списка',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'agency',
      title: 'Агентство',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'agencyUser'}]}],
      options: {layout: 'list'},
    }),
    defineField({
      name: 'identityLookup',
      title: 'Blind identity index',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'encryptedPayload',
      title: 'Данные пользователя и пароль',
      type: 'encryptedUserPayload',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'crmLinked',
      title: 'Связан с CRM',
      type: 'boolean',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'crmSync',
      title: 'Синхронизация с CRM',
      type: 'object',
      options: {collapsible: true, collapsed: false},
      fields: [
        defineField({
          name: 'status',
          title: 'Статус',
          type: 'string',
          readOnly: true,
          options: {
            list: [
              {title: 'Ожидает', value: 'pending'},
              {title: 'Выполняется', value: 'processing'},
              {title: 'Синхронизирован', value: 'synced'},
              {title: 'Будет повторено', value: 'failed'},
              {title: 'Нужна ручная проверка', value: 'manualReview'},
            ],
          },
        }),
        defineField({
          name: 'attempts',
          title: 'Количество попыток',
          type: 'number',
          readOnly: true,
        }),
        defineField({
          name: 'nextRetryAt',
          title: 'Следующая попытка',
          type: 'datetime',
          readOnly: true,
        }),
        defineField({
          name: 'lastAttemptAt',
          title: 'Последняя попытка',
          type: 'datetime',
          readOnly: true,
        }),
        defineField({
          name: 'lastSuccessAt',
          title: 'Последний успех',
          type: 'datetime',
          readOnly: true,
        }),
        defineField({name: 'lastErrorCode', title: 'Код ошибки', type: 'string', readOnly: true}),
        defineField({
          name: 'lockUntil',
          title: 'Блокировка до',
          type: 'datetime',
          readOnly: true,
          hidden: true,
        }),
        defineField({
          name: 'manualRetryRequestedAt',
          title: 'Ручной повтор',
          type: 'datetime',
          readOnly: true,
          hidden: true,
        }),
      ],
    }),
  ],
  preview: {
    select: {
      displayName: 'displayName',
      displayIdentity: 'displayIdentity',
      status: 'crmSync.status',
      approved: 'isApproved',
    },
    prepare({displayName, displayIdentity, status, approved}) {
      return {
        title: displayName || 'Зашифрованный агент',
        subtitle: [
          displayIdentity,
          approved ? 'одобрен' : 'не одобрен',
          `CRM: ${status || 'нет статуса'}`,
        ]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})

export default agentUser
