import {useCallback, useEffect, useMemo, useState} from 'react'
import {Box, Button, Card, Heading, Label, Stack, Text, TextInput} from '@sanity/ui'
import {useClient, useCurrentUser} from 'sanity'

import {isSuperAdmin, isSuperAdminEmail, projectId} from '../studioAccess'

type Page<T> = {data: T[]; nextCursor: string | null}

type Member = {
  sanityUserId: string
  profile: {
    id: string
    displayName: string
    email: string
    isCurrentUser?: boolean
  }
  memberships: Array<{
    resourceType: string
    resourceId: string
    resourceUserId: string | null
    roleNames: string[]
  }>
}

type Invite = {
  id: string
  email?: string
  role: string
  status: string
}

type AccessClient = ReturnType<ReturnType<typeof useClient>['withConfig']>

const accessPath = `/access/project/${projectId}`

async function getAll<T>(client: AccessClient, path: string) {
  const entries: T[] = []
  let cursor: string | null = null

  do {
    const page: Page<T> = await client.request<Page<T>>({
      url: `${accessPath}/${path}`,
      useGlobalApi: true,
      query: cursor ? {nextCursor: cursor} : undefined,
    })
    entries.push(...page.data)
    cursor = page.nextCursor
  } while (cursor)

  return entries
}

function errorMessage(error: unknown, action: string) {
  const status = (error as {statusCode?: number; status?: number})?.statusCode ||
    (error as {status?: number})?.status

  if (status === 403) return `Sanity отклонил действие «${action}»: недостаточно прав.`
  if (status === 400 || status === 409) {
    return `Sanity отклонил действие «${action}». Проверьте данные и отсутствие повторного приглашения.`
  }
  return `Не удалось выполнить действие «${action}». Проверьте соединение и повторите попытку.`
}

export default function StaffManagementTool() {
  const currentUser = useCurrentUser()
  const client = useClient({apiVersion: '2025-07-11'})
  const accessClient = useMemo(
    () => client.withConfig({useProjectHostname: false, useCdn: false}),
    [client],
  )
  const allowed = isSuperAdmin(currentUser)
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [nextMembers, nextInvites] = await Promise.all([
        getAll<Member>(accessClient, 'users'),
        getAll<Invite>(accessClient, 'invites'),
      ])
      setMembers(nextMembers)
      setInvites(nextInvites)
      return true
    } catch (cause) {
      setMembers([])
      setInvites([])
      setError(errorMessage(cause, 'загрузить сотрудников'))
      return false
    } finally {
      setLoading(false)
    }
  }, [accessClient])

  useEffect(() => {
    if (allowed) void reload()
  }, [allowed, reload])

  const run = async (action: string, operation: () => Promise<unknown>) => {
    if (!allowed || busy) return
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await operation()
      if (await reload()) setNotice(`Действие «${action}» выполнено.`)
    } catch (cause) {
      setError(errorMessage(cause, action))
    } finally {
      setBusy(false)
    }
  }

  const inviteMember = async () => {
    const address = email.trim()
    if (!address || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError('Введите корректный email сотрудника.')
      return
    }
    await run('пригласить сотрудника', async () => {
      await accessClient.request({
        url: `${accessPath}/invites`,
        method: 'POST',
        useGlobalApi: true,
        body: {email: address, role: 'administrator'},
      })
      setEmail('')
    })
  }

  const revokeInvite = async (invite: Invite) => {
    if (!allowed || busy || invite.status !== 'pending') return
    if (!window.confirm(`Отозвать приглашение для ${invite.email || invite.id}?`)) return
    await run('отозвать приглашение', () =>
      accessClient.request({
        url: `${accessPath}/invites/${encodeURIComponent(invite.id)}`,
        method: 'DELETE',
        useGlobalApi: true,
      }),
    )
  }

  const isCurrentMember = (member: Member) => {
    const resourceUserId = member.memberships.find(
      (membership) => membership.resourceType === 'project' && membership.resourceId === projectId,
    )?.resourceUserId
    return Boolean(
      member.profile.isCurrentUser ||
      (currentUser?.sanityUserId && currentUser.sanityUserId === member.sanityUserId) ||
      (currentUser?.id && (currentUser.id === resourceUserId || currentUser.id === member.profile.id || currentUser.id === member.sanityUserId)),
    )
  }

  const isProtectedMember = (member: Member) => {
    return isCurrentMember(member) || isSuperAdminEmail(member.profile.email)
  }

  const removeMember = async (member: Member) => {
    if (!allowed || busy || isProtectedMember(member)) return
    const roles = member.memberships.find(
      (membership) => membership.resourceType === 'project' && membership.resourceId === projectId,
    )?.roleNames || []
    if (!roles.includes('administrator')) return
    if (!window.confirm(`Удалить ${member.profile.displayName} из проекта Sanity?`)) return
    await run('удалить сотрудника', () =>
      accessClient.request({
        url: `${accessPath}/users/${encodeURIComponent(member.sanityUserId)}`,
        method: 'DELETE',
        useGlobalApi: true,
      }),
    )
  }

  if (!allowed) {
    return (
      <Box padding={4}>
        <Card padding={4} tone="caution" border radius={2}>
          <Text>Управление сотрудниками доступно только суперадмину Studio.</Text>
        </Card>
      </Box>
    )
  }

  return (
    <Box padding={4} sizing="border">
      <Stack gap={4}>
        <Heading size={2}>Сотрудники Studio</Heading>
        <Text size={1} muted>
          Приглашённый сотрудник получит роль Sanity Administrator и интерфейс обычного админа.
          Суперадминов назначают через конфигурацию Studio.
        </Text>

        <Card padding={4} border radius={2}>
          <Stack gap={3}>
            <Heading size={1}>Пригласить сотрудника</Heading>
            <Label>Email</Label>
            <TextInput
              type="email"
              value={email}
              onChange={(event) => setEmail(event.currentTarget.value)}
            />
            <Button
              text="Отправить приглашение"
              tone="primary"
              onClick={inviteMember}
              disabled={busy || loading || !email.trim()}
            />
          </Stack>
        </Card>

        {error && <Card padding={3} tone="critical" border radius={2}><Text>{error}</Text></Card>}
        {notice && <Card padding={3} tone="positive" border radius={2}><Text>{notice}</Text></Card>}

        <Stack gap={3}>
          <Heading size={1}>Участники проекта</Heading>
          <Button text={loading ? 'Загрузка…' : 'Обновить список'} onClick={reload} disabled={busy || loading} />
          {!loading && !error && members.length === 0 && <Text>Участники не найдены.</Text>}
          {members.map((member) => {
            const roles = member.memberships.find(
              (membership) => membership.resourceType === 'project' && membership.resourceId === projectId,
            )?.roleNames || []
            const protectedMember = isProtectedMember(member)
            return (
              <Card key={member.sanityUserId} padding={3} border radius={2}>
                <Stack gap={2}>
                  <Text>{member.profile.displayName} — {member.profile.email}</Text>
                  <Text size={1} muted>
                    Роли: {roles.join(', ') || 'нет'}
                    {protectedMember ? ' · защищён от удаления' : ''}
                  </Text>
                  {roles.includes('administrator') && !protectedMember && (
                    <Button
                      text="Удалить сотрудника"
                      tone="critical"
                      onClick={() => removeMember(member)}
                      disabled={busy || loading}
                    />
                  )}
                </Stack>
              </Card>
            )
          })}
        </Stack>

        <Stack gap={3}>
          <Heading size={1}>Ожидающие приглашения</Heading>
          {!loading && !error && invites.length === 0 && <Text>Ожидающих приглашений нет.</Text>}
          {invites.map((invite) => (
            <Card key={invite.id} padding={3} border radius={2}>
              <Stack gap={2}>
                <Text>{invite.email || invite.id} — {invite.role}</Text>
                <Button
                  text="Отозвать приглашение"
                  tone="critical"
                  onClick={() => revokeInvite(invite)}
                  disabled={busy || loading || invite.status !== 'pending'}
                />
              </Stack>
            </Card>
          ))}
        </Stack>
      </Stack>
    </Box>
  )
}
