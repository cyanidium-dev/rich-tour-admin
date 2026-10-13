import {useCallback, useEffect, useState} from 'react'
import {Box, Button, Card, Heading, Label, Stack, Text, TextInput} from '@sanity/ui'
import {useClient, useCurrentUser} from 'sanity'

import {isSuperAdmin} from '../studioAccess'

import {decryptPayload, getIdentityLookup, type EncryptedUserPayload} from './userCrypto'
import {
  displayUserPayloadValue,
  userPayloadFieldLabel,
  visibleUserPayloadEntries,
} from './userPayloadPresentation'
import {copyPasswordToClipboard} from './copyPassword'

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

export default function UserLookupTool() {
  const client = useClient({apiVersion: '2025-04-26'})
  const currentUser = useCurrentUser()
  const [masterKey, setMasterKey] = useState('')
  const [identity, setIdentity] = useState('')
  const [payload, setPayload] = useState<UserPayload | null>(null)
  const [payloadType, setPayloadType] = useState<EncryptedDocument['_type'] | null>(null)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const allowed = isSuperAdmin(currentUser)

  const lock = useCallback(() => {
    setMasterKey('')
    setIdentity('')
    setPayload(null)
    setPayloadType(null)
    setError('')
    setShowPassword(false)
    setCopyStatus('idle')
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

  const search = useCallback(async () => {
    if (!identity.trim() || !masterKey) return
    setWorking(true)
    setError('')
    setPayload(null)
    setPayloadType(null)
    setShowPassword(false)
    setCopyStatus('idle')
    try {
      const identityLookup = await getIdentityLookup(masterKey, identity)
      const document = await client.fetch<EncryptedDocument | null>(
        `*[_type in ["agentUser", "agencyUser"] && (
          _type == "agentUser" && email == $email ||
          identityLookup == $identityLookup && (_type != "agentUser" || !defined(email))
        )][0]{
          _id, _type, encryptedPayload
        }`,
        {identityLookup, email: identity.trim().toLowerCase()},
      )
      if (!document) {
        setError('Користувача з такою електронною поштою або логіном не знайдено.')
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
      setPayloadType(document._type)
    } catch {
      setError('Не вдалося знайти або розшифрувати дані. Перевірте ключ розшифрування.')
    } finally {
      setWorking(false)
    }
  }, [client, identity, masterKey])

  const copyPassword = useCallback(async () => {
    if (!showPassword || !payload?.password?.plain) return
    setCopyStatus((await copyPasswordToClipboard(payload.password.plain)) ? 'success' : 'error')
  }, [payload, showPassword])

  if (!allowed) {
    return (
      <Box padding={4}>
        <Card padding={4} tone="caution" border radius={2}>
          <Text>Пошук і розшифрування доступні лише суперадміну Studio.</Text>
        </Card>
      </Box>
    )
  }

  return (
    <Box padding={4} sizing="border">
      <Stack gap={4}>
        <Heading size={2}>Пошук користувача</Heading>
        <Card padding={4} border radius={2}>
          <Stack gap={3}>
            <Label>Електронна пошта або логін</Label>
            <TextInput
              value={identity}
              onChange={(event) => setIdentity(event.currentTarget.value)}
            />
            <Label>Ключ розшифрування (USER_DATA_MASTER_KEY, base64)</Label>
            <TextInput
              type="password"
              autoComplete="off"
              value={masterKey}
              onChange={(event) => setMasterKey(event.currentTarget.value)}
            />
            <Button
              text={working ? 'Пошук…' : 'Знайти та розшифрувати'}
              onClick={search}
              disabled={working || !identity.trim() || !masterKey}
              tone="primary"
            />
            <Text size={1} muted>
              Ключ зберігається лише в пам’яті вкладки та видаляється через 15 хвилин.
            </Text>
            {error && <Text size={1}>{error}</Text>}
          </Stack>
        </Card>

        {payload && payloadType && (
          <Card padding={4} border radius={2}>
            <Stack gap={3}>
              {payload.passwordResetRequired && (
                <Card padding={3} tone="caution" border radius={2}>
                  <Text>
                    Це тимчасовий пароль. Передайте його користувачу та попросіть змінити після
                    входу.
                  </Text>
                </Card>
              )}
              {visibleUserPayloadEntries(payload, payloadType).map(([name, value]) => (
                <Box key={name}>
                  <Label>{userPayloadFieldLabel(name)}</Label>
                  <Text>{displayUserPayloadValue(name, value)}</Text>
                </Box>
              ))}
              <Label>Пароль</Label>
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
              <Button text="Закрити дані та видалити ключ" mode="ghost" onClick={lock} />
            </Stack>
          </Card>
        )}
      </Stack>
    </Box>
  )
}
