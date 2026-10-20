import {type DocumentActionProps, useClient, useCurrentUser} from 'sanity'

const siteUrl = process.env.SANITY_STUDIO_SITE_URL

export default function PreviewTourDateAction(props: DocumentActionProps) {
  const client = useClient({apiVersion: '2025-04-26'})
  const currentUser = useCurrentUser()

  if (props.type !== 'tour-to-date') return null
  if (!currentUser?.roles.some((role) => role.name === 'administrator')) return null

  const saved = Boolean(props.draft || props.published)

  return {
    label: 'Подивитися на сайті',
    disabled: !saved,
    title: !saved
      ? 'Спочатку збережіть чернетку'
      : !siteUrl
        ? 'Адресу сайту не налаштовано в Studio'
        : undefined,
    onHandle: () => {
      try {
        const token = client.config().token
        if (!token) throw new Error('Увійдіть у Studio повторно, щоб відкрити перегляд')
        if (!siteUrl) {
          throw new Error('Адресу сайту не налаштовано. Задайте SANITY_STUDIO_SITE_URL та пересоберіть Studio')
        }

        const url = new URL('/api/tour-preview', siteUrl)
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Неправильна адреса сайту')

        const form = document.createElement('form')
        form.method = 'POST'
        form.action = url.href
        form.target = '_blank'

        for (const [name, value] of Object.entries({
          token,
          id: props.id.replace(/^drafts\./, ''),
        })) {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = name
          input.value = value
          form.append(input)
        }

        document.body.append(form)
        form.submit()
        form.remove()
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'Не вдалося відкрити перегляд')
      } finally {
        props.onComplete()
      }
    },
  }
}
