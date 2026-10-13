import {useCallback, useEffect, useState} from 'react'
import {Box, Button, Card, Label, Stack, Text, TextInput} from '@sanity/ui'
import bcrypt from 'bcryptjs'
import {ObjectInputProps, set, useCurrentUser, useFormValue} from 'sanity'

import {isSuperAdmin} from '../studioAccess'

import {decryptPayload, encryptPayload, type EncryptedUserPayload} from './userCrypto'
import {copyPasswordToClipboard} from './copyPassword'
import {
  displayUserPayloadValue,
  userPayloadFieldLabel,
  visibleUserPayloadEntries,
} from './userPayloadPresentation'

type PasswordValue = {plain?: string; hash?: string}
type UserPayload = Record<string, unknown> & {password?: PasswordValue}

const KEY_TTL_MS = 15 * 60 * 1000
const PASSWORD_TTL_MS = 30 * 1000

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
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [newPassword, setNewPassword] = useState('')
  const allowed = isSuperAdmin(currentUser)

  const lock = useCallback(() => {
    setMasterKey('')
    setPayload(null)
    setShowPassword(false)
    setCopyStatus('idle')
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
    const timer = window.setTimeout(() => {
      setShowPassword(false)
      setCopyStatus('idle')
    }, PASSWORD_TTL_MS)
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
      setError('Не вдалося розшифрувати дані. Перевірте ключ розшифрування.')
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
      setCopyStatus('idle')
    } catch {
      setError('Не вдалося оновити зашифрований пароль.')
    } finally {
      setWorking(false)
    }
  }, [documentId, documentType, masterKey, newPassword, onChange, payload, value])

  const copyPassword = useCallback(async () => {
    if (!showPassword || !payload?.password?.plain) return
    setCopyStatus((await copyPasswordToClipboard(payload.password.plain)) ? 'success' : 'error')
  }, [payload, showPassword])

  if (!allowed) {
    return (
      <Card padding={3} tone="caution" border radius={2}>
        <Text>Розшифрування доступне лише суперадміну Studio.</Text>
      </Card>
    )
  }

  if (!value) {
    return (
      <Card padding={3} tone="caution" border radius={2}>
        <Text>Зашифрованих даних немає. Створіть користувача через сайт або міграцію.</Text>
      </Card>
    )
  }

  if (!payload) {
    return (
      <Stack gap={3}>
        <Label>Ключ розшифрування (USER_DATA_MASTER_KEY, base64)</Label>
        <TextInput
          type="password"
          autoComplete="off"
          value={masterKey}
          onChange={(event) => setMasterKey(event.currentTarget.value)}
          disabled={working}
        />
        <Button
          text={working ? 'Розшифрування…' : 'Відкрити дані'}
          onClick={unlock}
          disabled={working || !masterKey}
        />
        <Text size={1} muted>
          Ключ зберігається лише в пам’яті вкладки та видаляється через 15 хвилин.
        </Text>
        {error && <Text size={1}>{error}</Text>}
      </Stack>
    )
  }

  const entries = visibleUserPayloadEntries(
    payload,
    documentType === 'agentUser' ? 'agentUser' : 'agencyUser',
  )
  return (
    <Stack gap={4}>
      <Button text="Закрити дані та видалити ключ" mode="ghost" onClick={lock} />
      <Card padding={3} border radius={2}>
        <Stack gap={3}>
          {entries.map(([name, fieldValue]) => (
            <Box key={name}>
              <Label>{userPayloadFieldLabel(name)}</Label>
              <Text>{displayUserPayloadValue(name, fieldValue)}</Text>
            </Box>
          ))}
        </Stack>
      </Card>
      <Card padding={3} border radius={2} tone="caution">
        <Stack gap={3}>
          <Label>Пароль у відкритому вигляді</Label>
          <TextInput
            type={showPassword ? 'text' : 'password'}
            value={payload.password?.plain || ''}
            readOnly
            onFocus={(event) => showPassword && event.currentTarget.select()}
          />
          <Button
            text={showPassword ? 'Приховати пароль' : 'Показати пароль на 30 секунд'}
            onClick={() => {
              setShowPassword((current) => !current)
              setCopyStatus('idle')
            }}
          />
          <Button
            text="Скопіювати показаний пароль"
            mode="ghost"
            onClick={copyPassword}
            disabled={!showPassword || !payload.password?.plain}
          />
          {copyStatus === 'success' && <Text size={1}>Пароль скопійовано.</Text>}
          {copyStatus === 'error' && (
            <Text size={1}>
              Не вдалося скопіювати автоматично. Виділіть пароль і натисніть Ctrl+C.
            </Text>
          )}
          {!readOnly && (
            <>
              <Label>Новий пароль</Label>
              <TextInput
                type="text"
                autoComplete="off"
                value={newPassword}
                onChange={(event) => setNewPassword(event.currentTarget.value)}
                disabled={working}
              />
              <Button
                text={working ? 'Збереження…' : 'Зашифрувати та зберегти новий пароль'}
                onClick={savePassword}
                disabled={working || !newPassword}
                tone="primary"
              />
            </>
          )}
          {error && <Text size={1}>{error}</Text>}
        </Stack>
      </Card>
    </Stack>
  )
}
