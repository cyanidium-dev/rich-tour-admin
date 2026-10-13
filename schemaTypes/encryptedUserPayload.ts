import {defineField, defineType} from 'sanity'
import EncryptedUserPayloadInput from '../components/EncryptedUserPayloadInput'

export default defineType({
  name: 'encryptedUserPayload',
  title: 'Зашифрованные данные пользователя',
  type: 'object',
  components: {input: EncryptedUserPayloadInput},
  fields: [
    defineField({name: 'version', title: 'Version', type: 'number', readOnly: true}),
    defineField({name: 'iv', title: 'IV', type: 'string', readOnly: true}),
    defineField({name: 'ciphertext', title: 'Ciphertext', type: 'text', readOnly: true}),
    defineField({name: 'tag', title: 'Authentication tag', type: 'string', readOnly: true}),
  ],
})
