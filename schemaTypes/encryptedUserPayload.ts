import {defineField, defineType} from 'sanity'
import EncryptedUserPayloadInput from '../components/EncryptedUserPayloadInput'

export default defineType({
  name: 'encryptedUserPayload',
  title: 'Зашифровані дані користувача',
  type: 'object',
  components: {input: EncryptedUserPayloadInput},
  fields: [
    defineField({name: 'version', title: 'Версія', type: 'number', readOnly: true}),
    defineField({name: 'iv', title: 'Вектор ініціалізації (IV)', type: 'string', readOnly: true}),
    defineField({name: 'ciphertext', title: 'Зашифрований вміст', type: 'text', readOnly: true}),
    defineField({name: 'tag', title: 'Тег автентифікації', type: 'string', readOnly: true}),
  ],
})
