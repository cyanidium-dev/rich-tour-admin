import React from 'react'
import {useClient} from 'sanity'
import {Card, Stack, Text, Button, Box, Flex, Badge} from '@sanity/ui'
import {useRouter} from 'sanity/router'

type Props = {documentId: string}

type DateTour = {
  _id: string
  title?: string
  price?: number
  availability?: string
  dateRange?: {startDate?: string; endDate?: string}
}

const availabilityLabel: Record<string, string> = {
  onRequest: 'Під запит',
  available: 'Місця є',
  fewSeats: 'Мало місць',
  noSeats: 'Немає місць',
}

export default function RelatedDateTours({documentId}: Props) {
  const client = useClient({apiVersion: '2024-01-01'})
  const router = useRouter()

  const [items, setItems] = React.useState<DateTour[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const query = `
        *[_type == "tour-to-date" && basic._ref == $basicId]
          | order(dateRange.startDate asc)
        {
          _id,
          title,
          price,
          availability,
          dateRange
        }
      `
      const data = await client.fetch<DateTour[]>(query, {basicId: documentId})
      setItems(data)
    } catch (e: any) {
      setError(e?.message || 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }, [client, documentId])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const openDoc = (id: string) => {
    router.navigateIntent('edit', {id, type: 'tour-to-date'})
  }

  return (
    <Stack space={4} padding={4}>
      <Flex justify="space-between" align="center">
        <Text size={2} weight="semibold">
          Тури на конкретні дати (цього базового туру)
        </Text>
        <Button text="Оновити" mode="ghost" onClick={fetchData} />
      </Flex>

      {loading && (
        <Card padding={4} radius={2} tone="transparent">
          <Text>Завантаження…</Text>
        </Card>
      )}

      {error && (
        <Card padding={4} radius={2} tone="critical">
          <Text>{error}</Text>
        </Card>
      )}

      {!loading && !error && items.length === 0 && (
        <Card padding={4} radius={2} tone="transparent">
          <Text>Поки немає турів на конкретну дату для цього базового туру.</Text>
        </Card>
      )}

      {!loading &&
        !error &&
        items.map((t) => {
          const start = t.dateRange?.startDate || '—'
          const end = t.dateRange?.endDate || '—'
          const avail = availabilityLabel[t.availability || ''] || t.availability || '—'

          return (
            <Card
              key={t._id}
              padding={3}
              radius={2}
              shadow={1}
              tone="transparent"
            >
              <Flex justify="space-between" align="center">
                <Stack space={2}>
                  <Text weight="semibold" size={2}>
                    {t.title || '(без назви)'}
                  </Text>

                  <Text size={1} muted>
                    {start} → {end} • {typeof t.price === 'number' ? `${t.price} ₴` : 'ціна —'}
                  </Text>
                </Stack>

                <Flex gap={3} align="center">
                  <Button
                    text="Відкрити"
                    tone="primary"
                    onClick={(e) => {
                      e.stopPropagation()
                      openDoc(t._id)
                    }}
                    style={{cursor: 'pointer'}}
                  />
                </Flex>
              </Flex>
            </Card>
          )
        })}
    </Stack>
  )
}
