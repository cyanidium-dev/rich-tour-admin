import {useState} from 'react'
import {DocumentActionProps, useClient} from 'sanity'
import {useRouter} from 'sanity/router'

export default function DuplicateTourDateAction(props: DocumentActionProps) {
  const client = useClient({apiVersion: '2025-04-26'})
  const router = useRouter()
  const [working, setWorking] = useState(false)

  if (props.type !== 'tour-to-date') return null

  return {
    label: working ? 'Створення копії…' : 'Створити новий виїзд на основі цього',
    disabled: working,
    onHandle: async () => {
      setWorking(true)

      try {
        const sourceId = props.id.replace(/^drafts\./, '')
        const source =
          (await client.getDocument(props.id)) ??
          (await client.getDocument(sourceId))
        if (!source) throw new Error('Source tour was not found')

        const {
          _id,
          _rev,
          _createdAt,
          _updatedAt,
          dateRange,
          crmNumber,
          ...copy
        } = source
        void _id
        void _rev
        void _createdAt
        void _updatedAt
        void dateRange
        void crmNumber

        const newDocumentId = crypto.randomUUID()
        await client.create({
          ...copy,
          _id: `drafts.${newDocumentId}`,
          _type: 'tour-to-date',
        })

        router.navigateIntent('edit', {id: newDocumentId, type: 'tour-to-date'})
      } finally {
        setWorking(false)
        props.onComplete()
      }
    },
  }
}
