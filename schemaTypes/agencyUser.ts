import {defineField, defineType} from 'sanity'

const agencyUser = defineType({
  name: 'agencyUser',
  title: 'Агентства',
  type: 'document',
  fields: [
    defineField({
      name: 'displayName',
      title: 'Название для списка',
      type: 'string',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'displayIdentity',
      title: 'Login для списка',
      type: 'string',
      readOnly: true,
      hidden: true,
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
  ],
  preview: {
    select: {displayName: 'displayName', displayIdentity: 'displayIdentity'},
    prepare({displayName, displayIdentity}) {
      return {title: displayName || 'Зашифрованное агентство', subtitle: displayIdentity}
    },
  },
})

export default agencyUser
