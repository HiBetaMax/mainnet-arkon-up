import { IDB_DB, IDB_KEY_ID, IDB_STORE } from './config.js'

export async function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, 1)
    req.onupgradeneeded = e => e.target.result.createObjectStore(IDB_STORE)
    req.onsuccess = e => resolve(e.target.result)
    req.onerror = e => reject(e.target.error)
  })
}

async function getOrCreateAesKey() {
  const db = await openIDB()
  const existing = await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readonly')
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY_ID)
    req.onsuccess = e => resolve(e.target.result)
    req.onerror = e => reject(e.target.error)
  })
  if (existing) return existing

  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )

  await new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite')
    const req = tx.objectStore(IDB_STORE).put(key, IDB_KEY_ID)
    req.onsuccess = () => resolve()
    req.onerror = e => reject(e.target.error)
  })

  return key
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function derivePasswordKey(password, salt) {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptPrivKeyWithPassword(privKeyHex, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await derivePasswordKey(password, salt)
  const data = new TextEncoder().encode(privKeyHex)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)
  return JSON.stringify({
    mode: 'password',
    salt: bytesToHex(salt),
    iv: bytesToHex(iv),
    ct: bytesToHex(new Uint8Array(ciphertext)),
  })
}

export async function decryptPrivKeyWithPassword(stored, password) {
  const payload = typeof stored === 'string' ? JSON.parse(stored) : stored
  if (!payload || payload.mode !== 'password') throw new Error('Invalid password-protected key format')
  const salt = hexToBytes(payload.salt)
  const iv = hexToBytes(payload.iv)
  const ct = hexToBytes(payload.ct)
  const key = await derivePasswordKey(password, salt)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct)
  return new TextDecoder().decode(plaintext)
}

export function isPasswordEnvelope(stored) {
  if (!stored || typeof stored !== 'string') return false
  return stored.trim().startsWith('{') && stored.includes('"mode":"password"')
}

export async function encryptPrivKey(privKeyHex) {
  const key = await getOrCreateAesKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = new TextEncoder().encode(privKeyHex)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)
  return `${bytesToHex(iv)}:${bytesToHex(new Uint8Array(ciphertext))}`
}

export async function decryptPrivKey(stored) {
  const [ivHex, ctHex] = stored.split(':')
  if (!ivHex || !ctHex) throw new Error('Invalid encrypted key format')
  const key = await getOrCreateAesKey()
  const iv = hexToBytes(ivHex)
  const ciphertext = hexToBytes(ctHex)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}
