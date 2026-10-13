import {useState} from 'react'
import {DocumentActionProps, useClient} from 'sanity'

export default function RetryCrmSyncAction(props: DocumentActionProps) {
  const client = useClient({apiVersion: '2025-04-26'})
  const [working, setWorking] = useState(false)

  if (props.type !== 'agentUser') return null

  return {
    label: working ? 'Запуск синхронізації…' : 'Повторити синхронізацію з CRM',
    disabled: working,
    onHandle: async () => {
      setWorking(true)
      const now = new Date().toISOString()

      try {
        await client
          .patch(props.id)
          .setIfMissing({crmSync: {}})
          .set({
            'crmSync.status': 'pending',
            'crmSync.nextRetryAt': now,
            'crmSync.manualRetryRequestedAt': now,
          })
          .unset(['crmSync.lockUntil'])
          .commit()
      } finally {
        setWorking(false)
        props.onComplete()
      }
    },
  }
}
