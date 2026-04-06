import React, { useCallback, useState } from 'react'
import { Stack, TextInput, Text } from '@sanity/ui'
import { ObjectInputProps, set, unset } from 'sanity'
import bcrypt from 'bcryptjs'

type PasswordValue = {
  plain?: string
  hash?: string
}

export default function PasswordWithHashInput(
  props: ObjectInputProps<PasswordValue>
) {
  const { onChange, readOnly, value } = props

  const [isHashing, setIsHashing] = useState(false)

  const plainPassword = value?.plain || ''
  const hasPassword = Boolean(value?.plain || value?.hash)

  const handleChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const password = event.currentTarget.value

      if (!password) {
        onChange(unset())
        return
      }

      setIsHashing(true)

      try {
        const hash = await bcrypt.hash(password, 10)

        onChange(
          set({
            plain: password,
            hash,
          })
        )
      } finally {
        setIsHashing(false)
      }
    },
    [onChange]
  )

  return (
    <Stack space={3}>
      <TextInput
        type="text"
        value={plainPassword}
        onChange={handleChange}
        readOnly={readOnly || isHashing}
        placeholder={
          hasPassword ? 'Редагуйте пароль' : 'Введіть пароль'
        }
      />

      {hasPassword && (
        <Text size={1} muted>
          Пароль збережений у відкритому вигляді та як хеш. При зміні хеш оновиться автоматично.
        </Text>
      )}

      {isHashing && (
        <Text size={1} muted>
          Оновлення хеша...
        </Text>
      )}
    </Stack>
  )
}