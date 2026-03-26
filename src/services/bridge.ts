/**
 * services/bridge.ts — Window bridge for backward compatibility
 *
 * Syncs Zustand store state to window.* globals so that ui.js functions
 * (charts, games, invoice builder, etc.) can still read wallet data.
 *
 * This is a transitional module — as ui.js features are migrated to React,
 * these bridges should be removed.
 */

import useStore from '../store'
import {
  sendPayment,
  sendBatch,
  generateInvoice,
  refreshBalance,
  refreshTransactions,
  refreshBtcPrice,
  refreshFeeRates,
  detectAddressType,
  decodeLightningPaymentRequest,
  getLightningSwaps,
  getPrivKey,
  restoreFromPrivKey,
  resetWallet,
  savePasswordSettings,
  unlockWithPassword,
  lockApp,
  getArkFees,
  getVtxoStatus,
  checkAndRenewVtxos,
  getRecoverableBalance,
  recoverVtxos,
  doOnboard,
  ARK_SERVER_URL,
  ESPLORA_API_URL,
} from './wallet'

const w = window as any

/**
 * Initialize the window bridge.
 * Call once after React mounts (in App.tsx useEffect).
 */
export function initWindowBridge(): void {
  // ── Sync store state to window on every change ──
  const syncToWindow = () => {
    const s = useStore.getState()
    w._wallet = { sats: s.wallet.sats, offchain: s.wallet.offchain, onchain: s.wallet.onchain }
    w._arkAddr = s.arkAddress
    w._boardingAddr = s.boardingAddress
    w._btcUsd = s.btcUsd
    w._livePrices = s.livePrices
    w._feeRates = s.feeRates
  }

  // Sync immediately + on every store change
  syncToWindow()
  useStore.subscribe(syncToWindow)

  // ── Expose service functions on window for ui.js ──

  // SDK send wrapper (with sendInProgress guard)
  w._sdkSendBitcoin = async ({ address, amount }: { address: string; amount: number }) => {
    return sendPayment(address, amount, 'ark')
  }
  w._sdkSendBatch = async (recipients: Array<{ address: string; amount: number }>) => {
    return sendBatch(recipients)
  }
  w._setSendInProgress = (val: boolean) => {
    useStore.getState().setSendInProgress(val)
  }

  // Lightning
  w._generateLightningInvoice = async ({ amount, description }: { amount: number; description?: string }) => {
    return generateInvoice(amount, description)
  }
  w._getLightningSwaps = getLightningSwaps
  w._decodeLightningInvoice = decodeLightningPaymentRequest

  // Refresh functions
  w._refreshTransactions = refreshTransactions
  w._refreshBalance = refreshBalance
  w._refreshBtcPrice = refreshBtcPrice
  w._refreshFeeRates = refreshFeeRates

  // Address detection
  w._detectAddressType = detectAddressType

  // Password settings
  w._savePasswordSettings = async (enabled: boolean, password?: string, confirmPassword?: string) => {
    return savePasswordSettings({ enabled, password, confirmPassword })
  }
  w._syncPasswordToggle = () => {
    const enabled = useStore.getState().passwordEnabled
    document.querySelectorAll('[data-password-toggle]').forEach((el: any) => {
      el.classList.toggle('on', enabled)
    })
    const statusEls = ['password-status-text', 'sec-password-status', 'password-sheet-status']
    statusEls.forEach((id) => {
      const el = document.getElementById(id)
      if (el) el.textContent = enabled ? 'Password enabled' : 'No password required'
    })
  }

  // Backup / Restore
  w._restoreFromPrivKey = restoreFromPrivKey
  w._revealPrivKey = async () => {
    const key = await getPrivKey()
    const el = document.getElementById('backup-privkey')
    if (el) el.textContent = key
    return key
  }
  w._copyPrivKey = async () => {
    const el = document.getElementById('backup-privkey')
    if (el?.textContent) {
      await navigator.clipboard.writeText(el.textContent)
      useStore.getState().showToast('Private key copied')
    }
  }

  // VTXO management
  w._getVtxoStatus = getVtxoStatus
  w._checkAndRenewVtxos = checkAndRenewVtxos
  w._getRecoverableBalance = getRecoverableBalance
  w._recoverVtxos = recoverVtxos
  w._getArkFees = getArkFees
  w.doOnboard = async () => doOnboard()

  // Server URLs
  w._ARK_SERVER_URL = ARK_SERVER_URL
  w._ESPLORA_API_URL = ESPLORA_API_URL

  // Boot entry point (no-op now — boot is handled by App.tsx directly)
  w._bootApp = () => {
    console.log('[Bridge] _bootApp called but boot is now managed by React')
  }

  // Store actions exposed for ui.js
  w._storeGetState = () => useStore.getState()
  w._storeSetWallet = (wallet: any) => useStore.getState().setWallet(wallet)

  // confirmSend bridge — ui.js doSend() calls this
  w.confirmSend = async () => {
    const store = useStore.getState()
    const addr = (document.getElementById('s-addr') as HTMLInputElement)?.value?.trim()
    const amtEl = document.getElementById('s-amt') as HTMLInputElement
    const amt = parseInt(amtEl?.value) || 0

    if (!addr) {
      store.showToast('Enter an address')
      return
    }
    if (amt <= 0) {
      store.showToast('Enter an amount')
      return
    }

    const network = store.sendNetwork
    store.setSendConfirmData({
      address: addr,
      amountSats: amt,
      network,
      fiatAmount: store.sendAmountFiat,
      fiatCurrency: store.currency,
    })
    store.openSheet('sendconfirm')
    if (typeof w.openSheet === 'function') w.openSheet('sendconfirm')
  }
}
