export const USER_PAYLOAD_VERSION = 1 as const

export type EncryptedUserPayload = {
  _type: 'encryptedUserPayload'
  version: typeof USER_PAYLOAD_VERSION
  iv: string
  ciphertext: string
  tag: string
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()
const KEY_SALT = encoder.encode('rich-tour/users-production/v1')

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0))
}

function toBase64(value: Uint8Array) {
  let binary = ''
  for (const byte of value) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function publishedId(documentId: string) {
  return documentId.replace(/^drafts\./, '')
}

function getAad(documentId: string, documentType: string) {
  return encoder.encode(
    `rich-tour-user:${USER_PAYLOAD_VERSION}:${publishedId(documentId)}:${documentType}`,
  )
}

async function getEncryptionKey(masterKey: string) {
  const raw = fromBase64(masterKey.trim())
  if (raw.byteLength !== 32) throw new Error('Master key must contain exactly 32 bytes')
  const imported = await crypto.subtle.importKey('raw', raw, 'HKDF', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: KEY_SALT,
      info: encoder.encode('payload-encryption'),
    },
    imported,
    {name: 'AES-GCM', length: 256},
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function getIdentityLookup(masterKey: string, identity: string) {
  const raw = fromBase64(masterKey.trim())
  if (raw.byteLength !== 32) throw new Error('Master key must contain exactly 32 bytes')
  const imported = await crypto.subtle.importKey('raw', raw, 'HKDF', false, ['deriveKey'])
  const lookupKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: KEY_SALT,
      info: encoder.encode('identity-lookup'),
    },
    imported,
    {name: 'HMAC', hash: 'SHA-256', length: 256},
    false,
    ['sign'],
  )
  const signature = new Uint8Array(
    await crypto.subtle.sign('HMAC', lookupKey, encoder.encode(identity.trim().toLowerCase())),
  )
  return Array.from(signature, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function decryptPayload<T extends object>(
  masterKey: string,
  documentId: string,
  documentType: string,
  envelope: EncryptedUserPayload,
) {
  if (envelope.version !== USER_PAYLOAD_VERSION) throw new Error('Unsupported version')
  const key = await getEncryptionKey(masterKey)
  const ciphertext = fromBase64(envelope.ciphertext)
  const tag = fromBase64(envelope.tag)
  const combined = new Uint8Array(ciphertext.byteLength + tag.byteLength)
  combined.set(ciphertext)
  combined.set(tag, ciphertext.byteLength)
  const plaintext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: fromBase64(envelope.iv),
      additionalData: getAad(documentId, documentType),
      tagLength: 128,
    },
    key,
    combined,
  )
  return JSON.parse(decoder.decode(plaintext)) as T
}

export async function encryptPayload(
  masterKey: string,
  documentId: string,
  documentType: string,
  payload: object,
): Promise<EncryptedUserPayload> {
  const key = await getEncryptionKey(masterKey)
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const result = new Uint8Array(
    await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
        additionalData: getAad(documentId, documentType),
        tagLength: 128,
      },
      key,
      encoder.encode(JSON.stringify(payload)),
    ),
  )
  const tagOffset = result.byteLength - 16
  return {
    _type: 'encryptedUserPayload',
    version: USER_PAYLOAD_VERSION,
    iv: toBase64(iv),
    ciphertext: toBase64(result.slice(0, tagOffset)),
    tag: toBase64(result.slice(tagOffset)),
  }
}
