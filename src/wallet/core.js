import { SingleKey, Wallet, Ramps, waitForIncomingFunds, VtxoManager } from '@arkade-os/sdk'
import { LocalStorageAdapter } from '@arkade-os/sdk/adapters/localStorage'
import {
  ARK_SERVER,
  ESPLORA_API_URL,
  IDB_KEY_ID,
  STORAGE_KEY,
} from './config.js'
import {
  clearAllState,
  clearRuntimeState,
  getWalletState,
  setManager,
  setPasswordUnlocked,
  setSessionPrivKeyHex,
  setStorage,
  setWallet,
} from './state.js'
import {
  decryptPrivKey,
  decryptPrivKeyWithPassword,
  encryptPrivKey,
  encryptPrivKeyWithPassword,
  isPasswordEnvelope,
  openIDB,
} from './crypto.js'
import { disposeSwaps } from './lightning.js'

async function ensureStorage() {
  const { storage } = getWalletState()
  if (storage) return storage
  const nextStorage = new LocalStorageAdapter()
  setStorage(nextStorage)
  return nextStorage
}

async function migrateV1Key(storage) {
  const oldKey = 'arkade_wallet_privkey_mainnet_v1'
  const rawHex = await storage.getItem(oldKey)
  if (!rawHex || !/^[0-9a-fA-F]{64}$/.test(rawHex.trim())) return null
  console.log('[ArkON] Migrating v1 key to encrypted v2 storage…')
  const encrypted = await encryptPrivKey(rawHex.trim())
  await storage.setItem(STORAGE_KEY, encrypted)
  await storage.removeItem(oldKey)
  console.log('[ArkON] Migration complete — v1 key removed')
  return rawHex.trim()
}

export async function init() {
  const state = getWalletState()
  if (state.wallet) return state.wallet

  const storage = await ensureStorage()
  let privateKeyHex = null
  const encryptedStored = await storage.getItem(STORAGE_KEY)

  if (encryptedStored) {
    try {
      const current = getWalletState()
      if (isPasswordEnvelope(encryptedStored)) {
        if (!current.passwordUnlocked || !current.sessionPrivKeyHex) {
          const err = new Error('Wallet password required')
          err.code = 'PASSWORD_REQUIRED'
          throw err
        }
        privateKeyHex = current.sessionPrivKeyHex
      } else {
        privateKeyHex = await decryptPrivKey(encryptedStored)
        setSessionPrivKeyHex(privateKeyHex)
        setPasswordUnlocked(false)
        console.log('[ArkON] Mainnet wallet decrypted from secure storage')
      }
    } catch (e) {
      if (e?.code === 'PASSWORD_REQUIRED') throw e
      console.warn('[ArkON] Decryption failed, attempting migration:', e)
    }
  }

  if (!privateKeyHex) privateKeyHex = await migrateV1Key(storage)

  if (!privateKeyHex) {
    const newIdentity = SingleKey.fromRandomBytes()
    privateKeyHex = newIdentity.toHex()
    const encrypted = await encryptPrivKey(privateKeyHex)
    await storage.setItem(STORAGE_KEY, encrypted)
    setSessionPrivKeyHex(privateKeyHex)
    setPasswordUnlocked(false)
    console.log('[ArkON] New mainnet wallet created (encrypted)')
  }

  const identity = SingleKey.fromHex(privateKeyHex)
  const wallet = await Wallet.create({
    identity,
    arkServerUrl: ARK_SERVER,
    storage,
  })

  setWallet(wallet)
  setManager(new VtxoManager(wallet, { enabled: true, thresholdPercentage: 10 }))
  console.log('[ArkON] Connected to', ARK_SERVER)
  return wallet
}

export async function hasPasswordEnabled() {
  const storage = await ensureStorage()
  const raw = await storage.getItem(STORAGE_KEY)
  return isPasswordEnvelope(raw)
}

export async function unlockWithPassword(password) {
  const storage = await ensureStorage()
  const raw = await storage.getItem(STORAGE_KEY)
  if (!isPasswordEnvelope(raw)) return true
  const privKeyHex = await decryptPrivKeyWithPassword(raw, password)
  setSessionPrivKeyHex(privKeyHex)
  setPasswordUnlocked(true)
  return true
}

export function lockWallet() {
  disposeSwaps().catch(() => {})
  const { storage } = getWalletState()
  clearRuntimeState()
  setStorage(storage)
}

export async function getPrivKey() {
  const state = getWalletState()
  if (state.sessionPrivKeyHex) return state.sessionPrivKeyHex
  const storage = await ensureStorage()
  const encrypted = await storage.getItem(STORAGE_KEY)
  if (!encrypted) {
    const old = await storage.getItem('arkade_wallet_privkey_mainnet_v1')
    return old || null
  }
  try {
    if (isPasswordEnvelope(encrypted)) {
      return getWalletState().passwordUnlocked ? getWalletState().sessionPrivKeyHex : null
    }
    const priv = await decryptPrivKey(encrypted)
    setSessionPrivKeyHex(priv)
    return priv
  } catch {
    return null
  }
}

export async function enablePassword(password) {
  const storage = await ensureStorage()
  const privKeyHex = await getPrivKey()
  if (!privKeyHex) throw new Error('No wallet key found')
  const encrypted = await encryptPrivKeyWithPassword(privKeyHex, password)
  await storage.setItem(STORAGE_KEY, encrypted)
  setSessionPrivKeyHex(privKeyHex)
  setPasswordUnlocked(true)
  disposeSwaps().catch(() => {})
  setWallet(null)
  setManager(null)
  return true
}

export async function disablePassword() {
  const storage = await ensureStorage()
  const privKeyHex = await getPrivKey()
  if (!privKeyHex) throw new Error('No wallet key found')
  const encrypted = await encryptPrivKey(privKeyHex)
  await storage.setItem(STORAGE_KEY, encrypted)
  setPasswordUnlocked(false)
  disposeSwaps().catch(() => {})
  setWallet(null)
  setManager(null)
  return true
}

export function getWallet() {
  const { wallet } = getWalletState()
  if (!wallet) throw new Error('Wallet not initialised — call init() first')
  return wallet
}

export function getVtxoManager() {
  const { manager } = getWalletState()
  if (!manager) throw new Error('VtxoManager not initialised — call init() first')
  return manager
}

export async function getBalance() {
  const wallet = getWallet()
  try { await wallet.getVtxos() } catch {}
  const bal = await wallet.getBalance()
  const available = Number(bal.available ?? bal.total ?? 0)
  const boarding = Number(bal.boarding?.total ?? bal.boarding ?? 0)
  return {
    sats: available + boarding,
    offchain: available,
    onchain: boarding,
  }
}

export async function getArkFees() {
  try {
    const { fees } = await getWallet().arkProvider.getInfo()
    return fees ?? null
  } catch {
    return null
  }
}

export async function getAddress() {
  return await getWallet().getAddress()
}

export async function getBoardingAddress() {
  return await getWallet().getBoardingAddress()
}

export function detectAddressType(address) {
  if (!address || typeof address !== 'string') return 'unknown'
  let normalized = address.trim()
  normalized = normalized.replace(/^(ark|bitcoin|lightning):/i, '')
  const lower = normalized.toLowerCase()

  if (
    lower.startsWith('lnbc') ||
    lower.startsWith('lntbs') ||
    lower.startsWith('lntb') ||
    lower.startsWith('lnurl') ||
    (normalized.includes('@') && !normalized.includes('://'))
  ) return 'lightning'

  if (lower.startsWith('tark1') || lower.startsWith('ark1')) return 'ark'

  if (
    lower.startsWith('bc1') ||
    lower.startsWith('tb1') ||
    lower.startsWith('sb1') ||
    lower.startsWith('bcrt1') ||
    /^[13]/.test(normalized) ||
    /^[2mn]/.test(normalized)
  ) return 'bitcoin'

  return 'unknown'
}

export async function sendBitcoin({ address, amount }) {
  const cleanAddress = address.replace(/^(ark|bitcoin|lightning):/i, '')
  const satoshis = Math.floor(typeof amount === 'bigint' ? Number(amount) : Number(amount))
  if (!Number.isFinite(satoshis) || satoshis <= 0) {
    throw new Error('Amount must be a positive integer number of sats')
  }
  return await getWallet().sendBitcoin({ address: cleanAddress, amount: satoshis })
}

export async function onboard(eventCallback) {
  const wallet = getWallet()
  const { fees } = await wallet.arkProvider.getInfo()
  const ramps = new Ramps(wallet)
  return await ramps.onboard(fees, undefined, undefined, eventCallback)
}

export async function offboard({ address, amount, eventCallback }) {
  const wallet = getWallet()
  const { fees } = await wallet.arkProvider.getInfo()
  const ramps = new Ramps(wallet)
  const bigAmt = amount ? BigInt(Math.floor(amount)) : undefined
  return await ramps.offboard(address, fees, bigAmt, eventCallback)
}

export async function checkAndRenewVtxos() {
  const manager = getVtxoManager()
  const expiring = await manager.getExpiringVtxos()
  if (expiring.length === 0) return { renewed: false, count: 0 }
  console.log(`[ArkON] Renewing ${expiring.length} expiring VTXOs…`)
  const txid = await manager.renewVtxos()
  console.log('[ArkON] Renewal txid:', txid)
  return { renewed: true, count: expiring.length, txid }
}

export async function getVtxoStatus() {
  const wallet = getWallet()
  const manager = getVtxoManager()
  try { await wallet.getVtxos() } catch {}
  const bal = await wallet.getBalance()
  const expiring = await manager.getExpiringVtxos()
  const recoverable = await manager.getRecoverableBalance()
  return {
    spendable: Number(bal.available ?? bal.total ?? 0),
    boarding: Number(bal.boarding?.total ?? bal.boarding ?? 0),
    expiringCount: expiring?.length || 0,
    recoverable: Number(recoverable?.recoverable ?? 0n),
    subdust: Number(recoverable?.subdust ?? 0n),
    recoverableCount: recoverable?.vtxoCount ?? 0,
  }
}

export async function getRecoverableBalance() {
  const manager = getVtxoManager()
  const bal = await manager.getRecoverableBalance()
  return {
    recoverable: Number(bal.recoverable ?? 0n),
    subdust: Number(bal.subdust ?? 0n),
    vtxoCount: bal.vtxoCount ?? 0,
  }
}

export async function recoverVtxos(eventCallback) {
  return await getVtxoManager().recoverVtxos(eventCallback)
}

export async function getTransactionHistory() {
  try {
    const list = await getWallet().getTransactionHistory()
    return list.map(tx => {
      const txid = tx.key?.arkTxid || tx.key?.boardingTxid || tx.key?.commitmentTxid || ''
      let network = 'Bitcoin'
      if (tx.key?.arkTxid && !tx.key?.boardingTxid) network = 'Ark'
      if (tx.key?.commitmentTxid) network = 'Bitcoin (Exit)'
      return {
        id: txid,
        type: tx.type,
        amount: Number(tx.amount),
        settled: tx.settled,
        createdAt: tx.createdAt,
        date: (() => {
          if (!tx.createdAt && tx.createdAt !== 0) return null
          const n = Number(tx.createdAt)
          if (!n || n < 0 || Number.isNaN(n)) return null
          const d = new Date(n > 1e12 ? n : n * 1000)
          return Number.isNaN(d.getTime()) ? null : d
        })(),
        network,
        arkTxid: tx.key?.arkTxid || null,
        boardingTxid: tx.key?.boardingTxid || null,
        commitmentTxid: tx.key?.commitmentTxid || null,
      }
    })
  } catch (e) {
    console.warn('[ArkON] History fetch failed:', e)
    throw e
  }
}

export async function exportEncryptedBackup(password) {
  const pwd = String(password || '').trim()
  if (pwd.length < 10) throw new Error('Backup password must be at least 10 characters')
  const privKeyHex = await getPrivKey()
  if (!privKeyHex) throw new Error('Wallet must be unlocked before exporting a backup')
  return {
    version: 1,
    walletType: 'arkon-mainnet',
    createdAt: new Date().toISOString(),
    keyEnvelope: JSON.parse(await encryptPrivKeyWithPassword(privKeyHex, pwd)),
  }
}

export async function restoreFromEncryptedBackup(payload, password) {
  const pwd = String(password || '').trim()
  if (!payload || typeof payload !== 'object') throw new Error('Invalid backup file')
  if (payload.walletType !== 'arkon-mainnet' || !payload.keyEnvelope) throw new Error('Unsupported backup format')
  const privKeyHex = await decryptPrivKeyWithPassword(payload.keyEnvelope, pwd)
  return await restoreFromPrivKey(privKeyHex)
}

export async function listenForIncoming(cb) {
  const incoming = await waitForIncomingFunds(getWallet())
  let sats = 0
  if (incoming?.type === 'utxo') {
    sats = (incoming.coins || []).reduce((sum, c) => sum + Number(c.value || 0), 0)
  } else if (incoming?.type === 'vtxo') {
    sats = (incoming.newVtxos || []).reduce((sum, v) => sum + Number(v.value || 0), 0)
  }
  if (cb) await cb({ type: incoming?.type, sats, raw: incoming })
  return { type: incoming?.type, sats, raw: incoming }
}

export async function resetWallet() {
  const storage = await ensureStorage()
  await storage.removeItem(STORAGE_KEY)
  await storage.removeItem('arkade_wallet_privkey_mainnet_v1')
  try {
    const db = await openIDB()
    await new Promise((resolve, reject) => {
      const tx = db.transaction('keys', 'readwrite')
      const req = tx.objectStore('keys').delete(IDB_KEY_ID)
      req.onsuccess = () => resolve()
      req.onerror = e => reject(e.target.error)
    })
  } catch {}
  disposeSwaps().catch(() => {})
  clearAllState()
}

export async function restoreFromPrivKey(privKeyHex) {
  const hex = String(privKeyHex || '').trim()
  if (hex.length !== 64 || !/^[0-9a-fA-F]+$/.test(hex)) return false
  const storage = await ensureStorage()
  const encrypted = await encryptPrivKey(hex)
  await storage.setItem(STORAGE_KEY, encrypted)
  disposeSwaps().catch(() => {})
  setWallet(null)
  setManager(null)
  setSessionPrivKeyHex(hex)
  setPasswordUnlocked(false)
  return true
}

export const ARK_SERVER_URL = ARK_SERVER
export { ESPLORA_API_URL }
