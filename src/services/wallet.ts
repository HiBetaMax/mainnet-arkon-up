/**
 * services/wallet.ts — SDK bridge service
 *
 * Replaces all window.* globals from main.js. Every SDK call updates
 * the Zustand store directly. Components read from the store, never
 * from window or DOM.
 */

import useStore from '../store'
import {
  init,
  getBalance,
  getAddress,
  getBoardingAddress,
  getTransactionHistory,
  sendBitcoin as sdkSendBitcoin,
  sendBatch as sdkSendBatch,
  offboard as sdkOffboard,
  onboard as sdkOnboard,
  detectAddressType,
  getArkFees,
  getVtxoStatus,
  checkAndRenewVtxos,
  getRecoverableBalance,
  recoverVtxos,
  listenForIncoming,
  getPrivKey,
  restoreFromPrivKey,
  resetWallet as sdkResetWallet,
  hasPasswordEnabled,
  unlockWithPassword as sdkUnlock,
  lockWallet as sdkLock,
  enablePassword as sdkEnablePassword,
  disablePassword as sdkDisablePassword,
  exportEncryptedBackup,
  restoreFromEncryptedBackup,
  ARK_SERVER_URL,
  ESPLORA_API_URL,
} from '../wallet/index.js'
import {
  createLightningInvoice,
  payLightningInvoice,
  decodeLightningPaymentRequest,
  getLightningSwaps,
} from '../wallet/index.js'
import type { SendNetwork, TxDetail, LightningLogEntry } from '../store'

// ─── Guards ─────────────────────────────────────────────────────────────────

let _bootInProgress = false
let _watcherRunning = false
let _passwordPromptedThisSession = false
let _sendInProgressTimeout: ReturnType<typeof setTimeout> | null = null

// ─── Boot ───────────────────────────────────────────────────────────────────

export async function bootWallet(): Promise<void> {
  if (_bootInProgress) return
  _bootInProgress = true
  const store = useStore.getState()

  try {
    store.setBootState('booting')

    // Check password requirement
    const needsPassword = await hasPasswordEnabled()
    store.setPasswordEnabled(needsPassword)
    if (needsPassword && !_passwordPromptedThisSession) {
      _bootInProgress = false
      store.setBootState('splash') // Will show unlock gate
      return
    }

    // Initialize wallet SDK
    await init()

    // Fetch addresses
    const [arkAddr, boardingAddr] = await Promise.all([
      getAddress(),
      getBoardingAddress(),
    ])
    store.setAddresses(arkAddr, boardingAddr)

    // Parallel data refresh
    await Promise.all([
      refreshBalance(),
      refreshTransactions(),
      refreshBtcPrice(),
      refreshFeeRates(),
    ])

    // Auto-onboard if boarding balance > 0
    const bal = store.wallet // just refreshed
    if (bal.onchain > 0 && !store.onboardInProgress) {
      store.setOnboardInProgress(true)
      try {
        await sdkOnboard()
        await refreshBalance()
        await refreshTransactions()
      } catch (e) {
        console.warn('[ArkON] Auto-onboard failed:', e)
      } finally {
        store.setOnboardInProgress(false)
      }
    }

    store.setWalletReady(true)
    store.setBootState('ready')

    // Start background processes
    startPolling()
    startIncomingWatcher()
    startVtxoManager()

    console.log('[ArkON] Boot complete')
  } catch (err: any) {
    console.error('[ArkON] Boot failed:', err)
    if (err?.code === 'PASSWORD_REQUIRED') {
      store.setPasswordEnabled(true)
      store.setBootState('splash')
    } else {
      store.setBootError(err?.message || 'Boot failed')
      // Retry after 8s
      setTimeout(() => {
        _bootInProgress = false
        bootWallet()
      }, 8000)
    }
  } finally {
    _bootInProgress = false
  }
}

// ─── Balance ────────────────────────────────────────────────────────────────

export async function refreshBalance(): Promise<void> {
  try {
    const bal = await getBalance()
    const store = useStore.getState()

    let displaySats: number
    if (store.offboardInProgress) {
      displaySats = bal.offchain
    } else if (store.onboardInProgress) {
      displaySats = Math.max(bal.offchain, bal.onchain)
    } else {
      displaySats = bal.offchain + bal.onchain
    }

    store.setWallet({ sats: displaySats, offchain: bal.offchain, onchain: bal.onchain })
    console.log('[ArkON] Balance —', displaySats, '| off:', bal.offchain, '| on:', bal.onchain)
  } catch (e) {
    console.warn('[ArkON] Balance fetch failed:', e)
  }
}

// ─── Transactions ───────────────────────────────────────────────────────────

export async function refreshTransactions(): Promise<void> {
  try {
    const history = await getTransactionHistory()
    const registry: Record<string, TxDetail> = {}

    for (const tx of history) {
      // Match main.js txClass() logic — SDK returns uppercase types like 'RECEIVED', 'SENT'
      const t = String(tx.type || '').toLowerCase()
      const cls =
        (t.includes('receiv') || t === 'txreceived') ? 'in' :
        (t.includes('sent') || t === 'txsent') ? 'out' :
        t.includes('board') ? 'in' :
        (t.includes('exit') || t.includes('commit')) ? 'out' :
        tx.settled === false ? 'pnd' : 'out'
      const label =
        t.includes('board') ? 'Boarding deposit' :
        (t.includes('exit') || t.includes('commit')) ? 'Exit to on-chain' :
        cls === 'in' ? 'Received' :
        cls === 'pnd' ? 'Pending' : 'Sent'
      const statusLabel = tx.settled ? 'Settled' : 'Preconfirmed'

      registry[tx.id] = {
        ...tx,
        cls,
        label,
        statusLabel,
        note: localStorage.getItem(`arkon_tx_note_${tx.id}`) || '',
      }
    }

    useStore.getState().setTxRegistry(registry)
  } catch (e) {
    console.warn('[ArkON] Transaction fetch failed:', e)
  }
}

// ─── Prices ─────────────────────────────────────────────────────────────────

export async function refreshBtcPrice(): Promise<void> {
  try {
    const res = await fetch('https://api.kraken.com/0/public/Ticker?pair=XBTUSD,XBTEUR,XBTCHF')
    const json = await res.json()
    const r = json.result || {}

    const usd = parseFloat((r['XXBTZUSD'] || r['XBTUSD'] || {}).c?.[0])
    const eur = parseFloat((r['XXBTZEUR'] || r['XBTEUR'] || {}).c?.[0])
    const chf = parseFloat((r['XBTCHF'] || {}).c?.[0])

    const store = useStore.getState()
    if (usd > 1000) {
      store.setBtcUsd(usd)
      store.setLivePrices({
        USD: usd > 1000 ? usd : store.livePrices.USD,
        EUR: eur > 1000 ? eur : store.livePrices.EUR,
        CHF: chf > 1000 ? chf : store.livePrices.CHF,
      })
    }
    console.log('[ArkON] Prices — USD:', usd, 'EUR:', eur, 'CHF:', chf)
  } catch (e) {
    console.warn('[ArkON] Kraken price fetch failed:', e)
  }
}

// ─── Fee Rates ──────────────────────────────────────────────────────────────

export async function refreshFeeRates(): Promise<void> {
  try {
    const res = await fetch('https://mempool.space/api/v1/fees/recommended')
    const data = await res.json()
    useStore.getState().setFeeRates({
      fastest: data.fastestFee || 1,
      halfHour: data.halfHourFee || 1,
      hour: data.hourFee || 1,
      economy: data.economyFee || 1,
      minimum: data.minimumFee || 1,
    })
  } catch (e) {
    console.warn('[ArkON] Fee fetch failed:', e)
  }
}

// ─── Send ───────────────────────────────────────────────────────────────────

export async function sendPayment(
  address: string,
  amountSats: number,
  network: SendNetwork,
  feeRate?: number
): Promise<{ success: boolean; message: string; txid?: string }> {
  const store = useStore.getState()
  store.setSendInProgress(true)

  // Auto-clear send guard after 30s
  if (_sendInProgressTimeout) clearTimeout(_sendInProgressTimeout)
  _sendInProgressTimeout = setTimeout(() => {
    useStore.getState().setSendInProgress(false)
  }, 30000)

  try {
    if (network === 'lightning') {
      const decoded = decodeLightningPaymentRequest(address)
      const result = await payLightningInvoice({
        invoice: address,
        maxFeeSats: undefined,
      })

      // Log to lightning log
      store.addLightningLogEntry({
        id: Date.now().toString(),
        type: 'send',
        amount: amountSats || Number(decoded?.satoshis || 0),
        status: 'completed',
        timestamp: Date.now(),
        invoice: address,
      })

      await refreshBalance()
      await refreshTransactions()
      store.showToast('Lightning payment sent!')
      return { success: true, message: 'Lightning payment sent', txid: result?.txid }
    }

    if (network === 'bitcoin') {
      store.setOffboardInProgress(true)
      try {
        const result = await sdkOffboard({
          address,
          amount: amountSats,
          eventCallback: undefined,
        })
        await refreshBalance()
        await refreshTransactions()
        return { success: true, message: 'On-chain exit sent', txid: result }
      } finally {
        store.setOffboardInProgress(false)
      }
    }

    // Default: Ark send
    const result = await sdkSendBitcoin({ address, amount: amountSats })
    await refreshBalance()
    await refreshTransactions()
    return { success: true, message: 'Ark payment sent', txid: result }
  } catch (err: any) {
    console.error('[ArkON] Send failed:', err)
    return { success: false, message: err?.message || 'Send failed' }
  } finally {
    store.setSendInProgress(false)
    if (_sendInProgressTimeout) {
      clearTimeout(_sendInProgressTimeout)
      _sendInProgressTimeout = null
    }
  }
}

export async function sendBatch(
  recipients: Array<{ address: string; amount: number }>
): Promise<{ success: boolean; message: string; txid?: string }> {
  const store = useStore.getState()
  store.setSendInProgress(true)
  try {
    const txid = await sdkSendBatch(recipients)
    await refreshBalance()
    await refreshTransactions()
    return { success: true, message: 'Batch sent', txid }
  } catch (err: any) {
    return { success: false, message: err?.message || 'Batch send failed' }
  } finally {
    store.setSendInProgress(false)
  }
}

// ─── Lightning ──────────────────────────────────────────────────────────────

export async function generateInvoice(
  amount: number,
  description?: string
): Promise<{ invoice: string; swaps: any }> {
  const result = await createLightningInvoice({
    amount: Math.floor(Number(amount)),
    description: description?.trim() || undefined,
  })

  const store = useStore.getState()
  store.setLightningInvoice(result.invoice || result)
  store.setLightningInvoiceAmount(amount)

  store.addLightningLogEntry({
    id: Date.now().toString(),
    type: 'receive',
    amount,
    status: 'pending',
    timestamp: Date.now(),
    invoice: result.invoice || result,
  })

  return result
}

export { decodeLightningPaymentRequest, getLightningSwaps, detectAddressType }

// ─── Onboard / Offboard ─────────────────────────────────────────────────────

export async function doOnboard(eventCallback?: (event: any) => void): Promise<string> {
  const store = useStore.getState()
  if (store.onboardInProgress) {
    store.showToast('Onboarding already in progress\u2026')
    throw new Error('Onboard in progress')
  }
  store.setOnboardInProgress(true)
  try {
    const txid = await sdkOnboard(eventCallback)
    await refreshBalance()
    await refreshTransactions()
    return txid
  } finally {
    store.setOnboardInProgress(false)
  }
}

// ─── VTXO Management ────────────────────────────────────────────────────────

export { getVtxoStatus, checkAndRenewVtxos, getRecoverableBalance, recoverVtxos, getArkFees }

// ─── Password ───────────────────────────────────────────────────────────────

export async function unlockWithPassword(password: string): Promise<boolean> {
  const ok = await sdkUnlock(password)
  if (ok) {
    _passwordPromptedThisSession = true
    useStore.getState().setPasswordUnlocked(true)
  }
  return ok
}

export async function savePasswordSettings(opts: {
  enabled: boolean
  password?: string
  confirmPassword?: string
}): Promise<{ ok: boolean; error?: string }> {
  try {
    if (opts.enabled) {
      if (!opts.password || opts.password.length < 8) {
        return { ok: false, error: 'Password must be at least 8 characters' }
      }
      if (opts.password !== opts.confirmPassword) {
        return { ok: false, error: 'Passwords do not match' }
      }
      await sdkEnablePassword(opts.password)
      _passwordPromptedThisSession = true
      useStore.getState().setPasswordEnabled(true)
      useStore.getState().showToast('Password enabled')
    } else {
      await sdkDisablePassword()
      _passwordPromptedThisSession = false
      useStore.getState().setPasswordEnabled(false)
      useStore.getState().showToast('Password disabled')
    }
    return { ok: true }
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Password operation failed' }
  }
}

export function lockApp(): void {
  sdkLock()
  _passwordPromptedThisSession = false
  useStore.getState().setPasswordUnlocked(false)
}

// ─── Auto-lock ──────────────────────────────────────────────────────────────

const AUTO_LOCK_MS = 5 * 60 * 1000 // 5 minutes
let _autoLockTimer: ReturnType<typeof setTimeout> | null = null

export function resetAutoLockTimer(): void {
  if (_autoLockTimer) clearTimeout(_autoLockTimer)
  _autoLockTimer = setTimeout(async () => {
    const pwEnabled = await hasPasswordEnabled()
    if (pwEnabled) {
      lockApp()
    }
  }, AUTO_LOCK_MS)
}

export function startAutoLockListeners(): void {
  const events = ['click', 'keydown', 'pointerdown', 'touchstart']
  events.forEach((ev) => document.addEventListener(ev, resetAutoLockTimer, { passive: true }))

  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) {
      const pwEnabled = await hasPasswordEnabled()
      if (pwEnabled) lockApp()
    } else {
      resetAutoLockTimer()
    }
  })

  resetAutoLockTimer()
}

// ─── Backup / Restore ───────────────────────────────────────────────────────

export {
  getPrivKey,
  restoreFromPrivKey,
  exportEncryptedBackup,
  restoreFromEncryptedBackup,
  ARK_SERVER_URL,
  ESPLORA_API_URL,
}

export async function resetWallet(): Promise<void> {
  await sdkResetWallet()
}

// ─── Polling ────────────────────────────────────────────────────────────────

let _pollIntervals: ReturnType<typeof setInterval>[] = []

export function startPolling(): void {
  if (_pollIntervals.length > 0) return
  _pollIntervals.push(
    setInterval(refreshBtcPrice, 60_000),
    setInterval(refreshFeeRates, 5 * 60_000),
    setInterval(async () => {
      await refreshBalance()
      await refreshTransactions()
    }, 30_000)
  )
}

export function stopPolling(): void {
  _pollIntervals.forEach(clearInterval)
  _pollIntervals = []
}

// ─── Incoming Watcher ───────────────────────────────────────────────────────

export function startIncomingWatcher(): void {
  if (_watcherRunning) return
  _watcherRunning = true

  async function watch() {
    let errorOccurred = false
    try {
      await listenForIncoming(async ({ type, sats }: { type: string; sats: number }) => {
        const store = useStore.getState()
        console.log('[ArkON] Incoming —', type, sats, 'sats')

        if (type === 'utxo') {
          if (store.offboardInProgress) return
          if (store.onboardInProgress) {
            await refreshBalance()
            return
          }
          store.setOnboardInProgress(true)
          try {
            await sdkOnboard()
            await refreshBalance()
            await refreshTransactions()
            store.showToast(`Received ${sats.toLocaleString()} sats`)
          } catch {
            await refreshBalance()
            store.showToast(`${sats.toLocaleString()} sats arrived on-chain`)
          } finally {
            store.setOnboardInProgress(false)
          }
        } else {
          if (store.sendInProgress) return
          await refreshBalance()
          await refreshTransactions()
          store.showToast(`Received ${sats.toLocaleString()} sats`)
        }
      })
    } catch (e) {
      console.warn('[ArkON] Watcher error:', e)
      errorOccurred = true
    }
    setTimeout(watch, errorOccurred ? 5000 : 0)
  }

  watch()
}

// ─── VTXO Manager ───────────────────────────────────────────────────────────

export function startVtxoManager(): void {
  async function runRenewal() {
    try {
      const result = await checkAndRenewVtxos()
      if (result.renewed) {
        console.log(`[ArkON] Renewed ${result.count} VTXOs`)
        await refreshBalance()
        await refreshTransactions()
      }
    } catch (e) {
      console.warn('[ArkON] VTXO renewal error:', e)
    }
  }

  async function runRecovery() {
    try {
      const bal = await getRecoverableBalance()
      if (bal.recoverable > 0) {
        console.log(`[ArkON] Recovering ${bal.recoverable} sats from ${bal.vtxoCount} VTXOs`)
        await recoverVtxos()
        await refreshBalance()
        await refreshTransactions()
      }
    } catch (e) {
      console.warn('[ArkON] VTXO recovery error:', e)
    }
  }

  // Run immediately
  runRenewal()
  runRecovery()

  // Daily renewal, weekly recovery
  setInterval(runRenewal, 24 * 60 * 60 * 1000)
  setInterval(runRecovery, 7 * 24 * 60 * 60 * 1000)
}
