import {
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  type ReactNode,
} from 'react'
import {Card, Stack, Text} from '@sanity/ui'
import {isArrayOfObjectsInputProps, type FileInputProps, type InputProps} from 'sanity'
import {hotelVideoFileError} from './hotelVideo'

function MediaUploadGuard({children}: {children: ReactNode}) {
  const [error, setError] = useState<string>()
  const validate = (files: File[], allowImages = true) => {
    // Images still use the existing Portable Text image uploader / poster input.
    const message = files
      .filter((file) => !allowImages || !file.type.startsWith('image/'))
      .map(hotelVideoFileError)
      .find(Boolean)
    setError(message)
    return !message
  }
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    if (!validate(Array.from(event.dataTransfer.files))) {
      event.preventDefault()
      event.stopPropagation()
    }
  }
  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    if (!validate(Array.from(event.clipboardData.files))) {
      event.preventDefault()
      event.stopPropagation()
    }
  }
  const onChange = (event: ChangeEvent<HTMLDivElement>) => {
    const input = event.target
    if (
      input instanceof HTMLInputElement &&
      input.type === 'file' &&
      input.files &&
      !validate(Array.from(input.files), input.accept.includes('image'))
    ) {
      event.preventDefault()
      event.stopPropagation()
      input.value = ''
    }
  }
  return (
    <div onDropCapture={onDrop} onPasteCapture={onPaste} onChangeCapture={onChange}>
      <Stack gap={3}>
        {error && (
          <Card padding={3} tone="critical" role="alert">
            <Text size={1}>{error}</Text>
          </Card>
        )}
        {children}
      </Stack>
    </div>
  )
}

export function HotelVideoFileInput(props: FileInputProps) {
  return <MediaUploadGuard>{props.renderDefault(props)}</MediaUploadGuard>
}

export function HotelDescriptionInput(props: InputProps) {
  if (!isArrayOfObjectsInputProps(props)) return null
  return <MediaUploadGuard>{props.renderDefault(props)}</MediaUploadGuard>
}
