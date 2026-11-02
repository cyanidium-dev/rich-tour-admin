import {useEffect, useRef, useState} from 'react'
import {Stack, Text, TextArea} from '@sanity/ui'
import {set, unset, type StringInputProps} from 'sanity'
import {parseYoutubeVideoId} from './hotelVideo'

const toUrl = (id?: string) => (id ? `https://www.youtube.com/watch?v=${id}` : '')

export default function HotelYoutubeInput(props: StringInputProps) {
  const [input, setInput] = useState(toUrl(props.value))
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setInput(toUrl(props.value))
  }, [props.value])
  const invalid = Boolean(input.trim() && !parseYoutubeVideoId(input))
  return (
    <Stack gap={3}>
      <TextArea
        {...props.elementProps}
        value={input}
        readOnly={props.readOnly}
        rows={3}
        placeholder="https://www.youtube.com/watch?v=… або <iframe …></iframe>"
        aria-invalid={invalid}
        onFocus={(event) => {
          focused.current = true
          props.elementProps.onFocus(event)
        }}
        onBlur={(event) => {
          focused.current = false
          props.elementProps.onBlur(event)
        }}
        onChange={(event) => {
          const next = event.currentTarget.value
          setInput(next)
          const id = parseYoutubeVideoId(next)
          props.onChange(id ? set(id) : unset())
        }}
      />
      {invalid && (
        <Text size={1} role="alert">
          Вставте HTTPS-посилання на відео YouTube або його iframe.
        </Text>
      )}
    </Stack>
  )
}
