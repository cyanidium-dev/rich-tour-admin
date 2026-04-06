// migrations/migrate-agent-user-password/index.ts
import {defineMigration, at, set, unset} from 'sanity/migrate'

export default defineMigration({
  title: 'Move agentUser.passwordHash to password.hash',

  documentTypes: ['agentUser'],

  // только документы, где есть старый hash
  filter: 'defined(passwordHash)',

  migrate: {
    document(doc) {
      if (typeof doc.passwordHash !== 'string' || !doc.passwordHash) {
        return
      }

      return [
        at(
          'password',
          set({
            plain: '',
            hash: doc.passwordHash,
          })
        ),
        at('passwordHash', unset()),
      ]
    },
  },
})