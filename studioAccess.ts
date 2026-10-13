type StudioUser = {
  email?: string | null
} | null | undefined

export const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'elggedkx'

const superAdminEmails = new Set(
  (process.env.SANITY_STUDIO_SUPERADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
)

export function isSuperAdminEmail(email: string | null | undefined) {
  return Boolean(email && superAdminEmails.has(email.trim().toLowerCase()))
}

export function isSuperAdmin(user: StudioUser) {
  return isSuperAdminEmail(user?.email)
}
