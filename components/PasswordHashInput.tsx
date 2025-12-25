import React, { useCallback, useState } from 'react'
import { Stack, TextInput, Text } from '@sanity/ui'
import { StringInputProps, set, unset } from 'sanity'
import bcrypt from 'bcryptjs'

export default function PasswordHashInput(
  props: StringInputProps
) {
  const { onChange, readOnly, value } = props

  // локально храним ТОЛЬКО введённый пароль (не хеш)
  const [plainPassword, setPlainPassword] = useState('')

  const handleChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const password = event.currentTarget.value
      setPlainPassword(password)

      if (!password) {
        onChange(unset())
        return
      }

      const hash = await bcrypt.hash(password, 10)
      onChange(set(hash))
    },
    [onChange]
  )

  const hasPassword = Boolean(value)

  return (
    <Stack space={3}>
      <TextInput
        type="password"
        value={plainPassword}
        onChange={handleChange}
        readOnly={readOnly}
        placeholder={
          hasPassword
            ? 'Пароль вже заданий'
            : 'Введіть пароль'
        }
      />

      {hasPassword && (
        <Text size={1} muted>
          Пароль уже збережений. Якщо хочете задати новий, введіть його.
        </Text>
      )}

      {!hasPassword && (
        <Text size={1} muted>
          Пароль буде збережений у вигляді хеша
        </Text>
      )}
    </Stack>
  )
}
