import {useCallback, useEffect, useState} from 'react'
import {Box, Button, Card, Heading, Label, Stack, Text, TextInput} from '@sanity/ui'
import {useClient, useCurrentUser} from 'sanity'

import {isSuperAdmin} from '../studioAccess'

import {
  decryptPayload,
  getIdentityLookup,
  type EncryptedUserPayload,
} from './userCrypto'

type EncryptedDocument = {
  _id: string
  _type: 'agentUser' | 'agencyUser'
  encryptedPayload: EncryptedUserPayload
}
type UserPayload = Record<string, unknown> & {
  password?: {plain?: string; hash?: string}
  passwordResetRequired?: boolean
}

const KEY_TTL_MS = 15 * 60 * 1000
const PASSWORD_TTL_MS = 30 * 1000

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export default function UserLookupTool() {
  const client = useClient({apiVersion: '2025-04-26'})
  const currentUser = useCurrentUser()
  const [masterKey, setMasterKey] = useState('')
  const [identity, setIdentity] = useState('')
  const [payload, setPayload] = useState<UserPayload | null>(null)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const allowed = isSuperAdmin(currentUser)

  const lock = useCallback(() => {
    setMasterKey('')
    setIdentity('')
    setPayload(null)
    setError('')
    setShowPassword(false)
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

  const search = useCallback(async () => {
    if (!identity.trim() || !masterKey) return
    setWorking(true)
    setError('')
    setPayload(null)
    setShowPassword(false)
    try {
      const identityLookup = await getIdentityLookup(masterKey, identity)
      const document = await client.fetch<EncryptedDocument | null>(
        `*[_type in ["agentUser", "agencyUser"] && identityLookup == $identityLookup][0]{
          _id, _type, encryptedPayload
        }`,
        {identityLookup},
      )
      if (!document) {
        setError('Пользователь с таким email/login не найден.')
        return
      }
      setPayload(
        await decryptPayload<UserPayload>(
          masterKey,
          document._id,
          document._type,
          document.encryptedPayload,
        ),
      )
    } catch {
      setError('Поиск или расшифровка не удались. Проверьте master key.')
    } finally {
      setWorking(false)
    }
  }, [client, identity, masterKey])

  const copyPassword = useCallback(async () => {
    if (!showPassword || !payload?.password?.plain) return
    await navigator.clipboard.writeText(payload.password.plain)
  }, [payload, showPassword])

  if (!allowed) {
    return (
      <Box padding={4}>
        <Card padding={4} tone="caution" border radius={2}>
          <Text>Поиск и расшифровка доступны только суперадмину Studio.</Text>
        </Card>
      </Box>
    )
  }

  return (
    <Box padding={4} sizing="border">
      <Stack gap={4}>
        <Heading size={2}>Поиск пользователя</Heading>
        <Card padding={4} border radius={2}>
          <Stack gap={3}>
            <Label>Email или login</Label>
            <TextInput value={identity} onChange={(event) => setIdentity(event.currentTarget.value)} />
            <Label>USER_DATA_MASTER_KEY (base64)</Label>
            <TextInput type="password" autoComplete="off" value={masterKey} onChange={(event) => setMasterKey(event.currentTarget.value)} />
            <Button text={working ? 'Поиск…' : 'Найти и расшифровать'} onClick={search} disabled={working || !identity.trim() || !masterKey} tone="primary" />
            <Text size={1} muted>Ключ остаётся только в памяти вкладки и удаляется через 15 минут.</Text>
            {error && <Text size={1}>{error}</Text>}
          </Stack>
        </Card>

        {payload && (
          <Card padding={4} border radius={2}>
            <Stack gap={3}>
              {payload.passwordResetRequired && (
                <Card padding={3} tone="caution" border radius={2}>
                  <Text>Это временный пароль. Передайте его пользователю и попросите сменить после входа.</Text>
                </Card>
              )}
              {Object.entries(payload)
                .filter(([name]) => name !== 'password')
                .map(([name, value]) => (
                  <Box key={name}>
                    <Label>{name}</Label>
                    <Text>{displayValue(value)}</Text>
                  </Box>
                ))}
              <Label>Пароль</Label>
              <TextInput
                type={showPassword ? 'text' : 'password'}
                value={payload.password?.plain || ''}
                readOnly
                onBlur={() => setShowPassword(false)}
                onCopy={(event) => event.preventDefault()}
              />
              <Button text={showPassword ? 'Скрыть пароль' : 'Показать пароль на 30 секунд'} onClick={() => setShowPassword((current) => !current)} />
              <Button text="Копировать показанный пароль" mode="ghost" onMouseDown={(event) => event.preventDefault()} onClick={copyPassword} disabled={!showPassword || !payload.password?.plain} />
              <Button text="Закрыть данные и удалить ключ" mode="ghost" onClick={lock} />
            </Stack>
          </Card>
        )}
      </Stack>
    </Box>
  )
}
