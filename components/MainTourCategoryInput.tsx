import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Box, Button, Dialog, Flex, Stack, Text} from '@sanity/ui'
import {getPublishedId, PatchEvent, useClient, useFormValue} from 'sanity'
import type {BooleanInputProps} from 'sanity'

type HomeCategory = {_id: string; title: string}

type CategoryDialog =
  {kind: 'limit'; categories: HomeCategory[]; published: boolean} | {kind: 'error'}

const selectedCategoriesQuery =
  '*[_type == "tour-category" && main == true && _id != $documentId] | order(publishedAt desc)[0...5] {_id, title}'

export default function MainTourCategoryInput(props: BooleanInputProps) {
  const documentId = getPublishedId(String(useFormValue(['_id']) || ''))

  return <MainTourCategoryToggle key={documentId} {...props} documentId={documentId} />
}

function MainTourCategoryToggle(props: BooleanInputProps & {documentId: string}) {
  const {documentId, onChange, readOnly, renderDefault, value} = props
  const studioClient = useClient({apiVersion: '2025-04-26'})
  const clients = useMemo(
    () => ({
      published: studioClient.withConfig({perspective: 'published', useCdn: false}),
      drafts: studioClient.withConfig({perspective: 'drafts', useCdn: false}),
    }),
    [studioClient],
  )
  const [checking, setChecking] = useState(false)
  const [dialog, setDialog] = useState<CategoryDialog | null>(null)
  const request = useRef<AbortController | null>(null)

  useEffect(() => () => request.current?.abort(), [])

  const handleChange = useCallback<BooleanInputProps['onChange']>(
    async (event) => {
      if (readOnly || request.current || dialog) return

      const patch = PatchEvent.from(event)
      const enabling = patch.patches.some(
        (item) => item.type === 'set' && item.path.length === 0 && item.value === true,
      )

      if (!enabling || value === true) {
        onChange(event)
        return
      }

      const controller = new AbortController()
      request.current = controller
      setChecking(true)

      try {
        const [publishedCategories, selectedCategories] = await Promise.all([
          clients.published.fetch<HomeCategory[]>(
            selectedCategoriesQuery,
            {documentId},
            {signal: controller.signal},
          ),
          clients.drafts.fetch<HomeCategory[]>(
            selectedCategoriesQuery,
            {documentId},
            {signal: controller.signal},
          ),
        ])
        if (controller.signal.aborted) return

        const published = publishedCategories.length >= 5
        const categories = published ? publishedCategories : selectedCategories
        if (categories.length >= 5) {
          setDialog({kind: 'limit', categories, published})
        } else {
          onChange(event)
        }
      } catch {
        if (!controller.signal.aborted) setDialog({kind: 'error'})
      } finally {
        request.current = null
        if (!controller.signal.aborted) setChecking(false)
      }
    },
    [clients, dialog, documentId, onChange, readOnly, value],
  )

  const closeDialog = useCallback(() => setDialog(null), [])
  return (
    <Stack gap={3}>
      {renderDefault({
        ...props,
        onChange: handleChange,
        readOnly: readOnly || checking || !!dialog,
      })}
      {checking && (
        <Text size={1} muted>
          Перевіряємо кількість обраних категорій…
        </Text>
      )}
      {dialog && (
        <Dialog
          id={`${props.id}-category-limit`}
          header={
            dialog.kind === 'limit'
              ? 'Уже обрано 5 категорій для головної сторінки'
              : 'Не вдалося перевірити категорії'
          }
          onClose={closeDialog}
          onClickOutside={closeDialog}
          width={1}
          footer={
            <Flex gap={3} justify="flex-end" padding={4} wrap="wrap">
              <Button text="Зрозуміло" tone="primary" onClick={closeDialog} autoFocus />
            </Flex>
          }
        >
          <Box padding={4}>
            {dialog.kind === 'limit' ? (
              <Stack gap={4}>
                <Text size={2}>
                  Для головної сторінки вже обрано 5 категорій. Щоб додати цю категорію, приберіть
                  із головної сторінки одну з наведених категорій:
                </Text>
                {!dialog.published && (
                  <Text size={1} muted>
                    У цьому списку також враховано категорії з неопублікованими змінами.
                  </Text>
                )}
                <Stack as="ul" gap={3} style={{margin: 0, paddingLeft: 24, listStyle: 'disc'}}>
                  {dialog.categories.map((category) => (
                    <Box as="li" key={category._id}>
                      <Text size={2}>{category.title}</Text>
                    </Box>
                  ))}
                </Stack>
                <Text size={2}>
                  Вимкніть «Категорія для вітрини» в одній із них та опублікуйте зміни.
                </Text>
                <Text size={1} muted>
                  Перемикач для цієї категорії залишився вимкненим.
                </Text>
              </Stack>
            ) : (
              <Text size={2}>
                Не вдалося перевірити, скільки категорій уже обрано для головної сторінки. Спробуйте
                увімкнути перемикач ще раз.
              </Text>
            )}
          </Box>
        </Dialog>
      )}
    </Stack>
  )
}
