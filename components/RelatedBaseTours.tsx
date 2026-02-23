import React from 'react'
import {useClient} from 'sanity'
import {Card, Stack, Text, Button, Box, Flex} from '@sanity/ui'
import {useRouter} from 'sanity/router'

type Props = {
  documentId: string
}

type BaseTour = {
  _id: string
  title?: string
  slug?: {current?: string}
}

export default function RelatedBaseTours(props: Props) {
  const {documentId} = props
  const client = useClient({apiVersion: '2024-01-01'})
  const router = useRouter()

  const [items, setItems] = React.useState<BaseTour[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const query = `
        *[_type == "tour-basic" && $catId in categories[]._ref]
          | order(title asc)
        { _id, title, slug }
      `
      const data = await client.fetch<BaseTour[]>(query, {catId: documentId})
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
    // открыть документ тура в Desk
    router.navigateIntent('edit', {id, type: 'tour-basic'})
  }

  return (
    <Stack space={4} padding={4}>
      <Flex justify="space-between" align="center">
        <Text size={2} weight="semibold">
          Базові тури цієї категорії
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
          <Text>Немає базових турів, прив’язаних до цієї категорії.</Text>
        </Card>
      )}

      {!loading && !error && items.map((t) => (
        <Card key={t._id} padding={3} radius={2} shadow={1}>
          <Flex justify="space-between" align="center">
            <Box>
              <Text weight="semibold">{t.title || '(без назви)'}</Text>
            </Box>
            <Button text="Відкрити" style={{ cursor: "pointer" }} onClick={() => openDoc(t._id)} />
          </Flex>
        </Card>
      ))}
    </Stack>
  )
}