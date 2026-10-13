import {useCallback, useEffect, useState} from 'react'
import {Box, Button, Card, Label, Stack, Text, TextInput} from '@sanity/ui'
import bcrypt from 'bcryptjs'
import {ObjectInputProps, set, useCurrentUser, useFormValue} from 'sanity'

import {isSuperAdmin} from '../studioAccess'

import {decryptPayload, encryptPayload, type EncryptedUserPayload} from './userCrypto'

type PasswordValue = {plain?: string; hash?: string}
type UserPayload = Record<string, unknown> & {password?: PasswordValue}

const KEY_TTL_MS = 15 * 60 * 1000
const PASSWORD_TTL_MS = 30 * 1000

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function EncryptedUserPayloadInput(
  props: ObjectInputProps<Record<string, unknown>>,
) {
  const {onChange, readOnly} = props
  const value = props.value as EncryptedUserPayload | undefined
  const currentUser = useCurrentUser()
  const documentId = String(useFormValue(['_id']) || '')
  const documentType = String(useFormValue(['_type']) || '')
  const [masterKey, setMasterKey] = useState('')
  const [payload, setPayload] = useState<UserPayload | null>(null)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const allowed = isSuperAdmin(currentUser)

  const lock = useCallback(() => {
    setMasterKey('')
    setPayload(null)
    setShowPassword(false)
    setNewPassword('')
    setError('')
  }, [])

  useEffect(() => {
    if (!masterKey) return undefined
    const timer = window.setTimeout(lock, KEY_TTL_MS)
    return () => window.clearTimeout(timer)
  }, [lock, masterKey])

  useEffect(() => {
    if (!showPassword) return undefined
    const timer = window.setTimeout(() => setShowPassword(false), PASSWORD_TTL_MS)
    return () => window.clearTimeout(timer)
  }, [showPassword])

  const unlock = useCallback(async () => {
    if (!value || !documentId || !documentType || !masterKey) return
    setWorking(true)
    setError('')
    try {
      setPayload(await decryptPayload<UserPayload>(masterKey, documentId, documentType, value))
    } catch {
      setPayload(null)
      setError('Не удалось расшифровать данные. Проверьте master key.')
    } finally {
      setWorking(false)
    }
  }, [documentId, documentType, masterKey, value])

  const savePassword = useCallback(async () => {
    if (!payload || !newPassword || !masterKey || !value) return
    setWorking(true)
    setError('')
    try {
      const nextPayload = {
        ...payload,
        password: {plain: newPassword, hash: await bcrypt.hash(newPassword, 10)},
      }
      onChange(set(await encryptPayload(masterKey, documentId, documentType, nextPayload)))
      setPayload(nextPayload)
      setNewPassword('')
      setShowPassword(false)
    } catch {
      setError('Не удалось обновить зашифрованный пароль.')
    } finally {
      setWorking(false)
    }
  }, [documentId, documentType, masterKey, newPassword, onChange, payload, value])

  const copyPassword = useCallback(async () => {
    if (!showPassword || !payload?.password?.plain) return
    await navigator.clipboard.writeText(payload.password.plain)
  }, [payload, showPassword])

  if (!allowed) {
    return (
      <Card padding={3} tone="caution" border radius={2}>
        <Text>Расшифровка доступна только суперадмину Studio.</Text>
      </Card>
    )
  }

  if (!value) {
    return (
      <Card padding={3} tone="caution" border radius={2}>
        <Text>Зашифрованные данные отсутствуют. Создайте пользователя через сайт или миграцию.</Text>
      </Card>
    )
  }

  if (!payload) {
    return (
      <Stack gap={3}>
        <Label>USER_DATA_MASTER_KEY (base64)</Label>
        <TextInput
          type="password"
          autoComplete="off"
          value={masterKey}
          onChange={(event) => setMasterKey(event.currentTarget.value)}
          disabled={working}
        />
        <Button text={working ? 'Расшифровка…' : 'Открыть данные'} onClick={unlock} disabled={working || !masterKey} />
        <Text size={1} muted>Ключ хранится только в памяти вкладки и удаляется через 15 минут.</Text>
        {error && <Text size={1}>{error}</Text>}
      </Stack>
    )
  }

  const entries = Object.entries(payload).filter(([name]) => name !== 'password')
  return (
    <Stack gap={4}>
      <Button text="Закрыть данные и удалить ключ" mode="ghost" onClick={lock} />
      <Card padding={3} border radius={2}>
        <Stack gap={3}>
          {entries.map(([name, fieldValue]) => (
            <Box key={name}>
              <Label>{name}</Label>
              <Text>{displayValue(fieldValue)}</Text>
            </Box>
          ))}
        </Stack>
      </Card>
      <Card padding={3} border radius={2} tone="caution">
        <Stack gap={3}>
          <Label>Пароль в открытом виде</Label>
          <TextInput
            type={showPassword ? 'text' : 'password'}
            value={payload.password?.plain || ''}
            readOnly
            onBlur={() => setShowPassword(false)}
            onCopy={(event) => event.preventDefault()}
          />
          <Button text={showPassword ? 'Скрыть пароль' : 'Показать пароль на 30 секунд'} onClick={() => setShowPassword((current) => !current)} />
          <Button text="Копировать показанный пароль" mode="ghost" onMouseDown={(event) => event.preventDefault()} onClick={copyPassword} disabled={!showPassword || !payload.password?.plain} />
          {!readOnly && (
            <>
              <Label>Новый пароль</Label>
              <TextInput type="text" autoComplete="off" value={newPassword} onChange={(event) => setNewPassword(event.currentTarget.value)} disabled={working} />
              <Button text={working ? 'Сохранение…' : 'Зашифровать и сохранить новый пароль'} onClick={savePassword} disabled={working || !newPassword} tone="primary" />
            </>
          )}
          {error && <Text size={1}>{error}</Text>}
        </Stack>
      </Card>
    </Stack>
  )
}
