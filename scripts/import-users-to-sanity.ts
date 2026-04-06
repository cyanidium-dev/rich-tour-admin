import fs from 'node:fs'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import {createClient} from '@sanity/client'

type InputUser = {
  isApproved?: boolean
  companyName: string | null
  phone: string | null
  email: string | null
  site: string | null
  city: string | null
  passwordHash: string | null
}

type ImportResult = {
  email: string | null
  companyName: string | null
  status: 'created' | 'skipped' | 'failed' | 'dry-run'
  documentId?: string
  reason?: string
  error?: string
}

const SANITY_CONFIG = {
  projectId: 'elggedkx',
  dataset: 'production',
  token: 'skKRRyWcpbh4xc16KOidIFlnxaDqkJKu5yv7tqxb9tU0hnFllMYfDUgP4GYTl2FcXXVILt7yVLrb4Y9nK5c8jS6F5rcKMeRBMkRJuoyztgYwwYwUhs6GYoZxSXhNomBnwx4sqx3TMJCP0bZmzQRE8hib5chm4RE7BhZDmKqCM6OUt0uo87c6',
  apiVersion: '2025-01-01',
  useCdn: false,
}

const USER_TYPE = 'agentUser'
const INPUT_FILE = path.resolve('data/users.json')
const RESULTS_FILE = path.resolve('data/import-results.json')
const DELAY_MS = 700

const client = createClient(SANITY_CONFIG)

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')

const limitArg = args.find((arg) => arg.startsWith('--limit='))
const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined

function normalize(value: unknown): string | null {
  if (value === undefined || value === null) return null
  const result = String(value).trim()
  return result || null
}

function normalizeEmail(value: unknown): string | null {
  const email = normalize(value)
  return email ? email.toLowerCase() : null
}

function hasFop(companyName: string | null): boolean {
  return Boolean(companyName && companyName.includes('ФОП'))
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function findExistingByEmail(email: string) {
  const query = `*[_type == $type && email == $email][0]{_id}`
  return client.fetch<{_id: string} | null>(query, {
    type: USER_TYPE,
    email,
  })
}

async function buildDocument(user: InputUser) {
  const companyName = normalize(user.companyName)
  const plainPassword = normalize(user.passwordHash)

  if (!plainPassword) {
    throw new Error('Missing passwordHash')
  }

  const hashedPassword = await bcrypt.hash(plainPassword, 10)

  return {
    _type: USER_TYPE,
    isApproved: true,
    companyName,
    phone: normalize(user.phone),
    email: normalizeEmail(user.email),
    site: normalize(user.site),
    city: normalize(user.city),
    passwordHash: hashedPassword,
    ...(hasFop(companyName) ? {taxForm: 'fop'} : {}),
  }
}

async function importOne(user: InputUser): Promise<ImportResult> {
  const email = normalizeEmail(user.email)
  const companyName = normalize(user.companyName)

  if (!email) {
    return {
      email: null,
      companyName,
      status: 'failed',
      error: 'Missing email',
    }
  }

  const existing = await findExistingByEmail(email)

  if (existing) {
    return {
      email,
      companyName,
      status: 'skipped',
      documentId: existing._id,
      reason: 'User with this email already exists',
    }
  }

  if (isDryRun) {
    return {
      email,
      companyName,
      status: 'dry-run',
    }
  }

  const doc = await buildDocument(user)
  const created = await client.create(doc)

  return {
    email,
    companyName,
    status: 'created',
    documentId: created._id,
  }
}

async function main() {
  const raw = fs.readFileSync(INPUT_FILE, 'utf8')
  const users = JSON.parse(raw) as InputUser[]

  if (!Array.isArray(users)) {
    throw new Error('Input file must contain a JSON array')
  }

  const batch = typeof limit === 'number' && !Number.isNaN(limit) ? users.slice(0, limit) : users

  const results: ImportResult[] = []

  console.log(`Users loaded: ${users.length}`)
  console.log(`Processing: ${batch.length}`)
  console.log(`Mode: ${isDryRun ? 'dry-run' : 'create'}`)
  console.log(`Sanity type: ${USER_TYPE}`)
  console.log(`Delay between creates: ${DELAY_MS}ms`)

  for (let index = 0; index < batch.length; index++) {
    const user = batch[index]

    try {
      const result = await importOne(user)
      results.push(result)

      console.log(
        `[${index + 1}/${batch.length}] [${result.status}] ${result.email ?? 'no-email'} ${result.reason ?? ''}`
      )

      if (!isDryRun && index < batch.length - 1) {
        await delay(DELAY_MS)
      }
    } catch (error) {
      const result: ImportResult = {
        email: normalizeEmail(user.email),
        companyName: normalize(user.companyName),
        status: 'failed',
        error: error instanceof Error ? error.message : String(error),
      }

      results.push(result)
      console.error(
        `[${index + 1}/${batch.length}] [failed] ${result.email ?? 'no-email'} ${result.error}`
      )
    }
  }

  fs.mkdirSync(path.dirname(RESULTS_FILE), {recursive: true})
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2), 'utf8')

  const stats = results.reduce(
    (acc, item) => {
      acc[item.status] += 1
      return acc
    },
    {
      created: 0,
      skipped: 0,
      failed: 0,
      'dry-run': 0,
    } as Record<ImportResult['status'], number>
  )

  console.log('\nDone.')
  console.log(stats)
  console.log(`Results saved to: ${RESULTS_FILE}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})