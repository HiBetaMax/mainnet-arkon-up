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
  bootWallet,
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
  startAutoLockListeners,
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
  // Signal that React is managing the boot — prevents main.js boot() from running
  w.__REACT_BOOT_ACTIVE = true

  // ── Sync store state to window on every change ──
  const syncToWindow = () => {
    const s = useStore.getState()
    w._wallet = { sats: s.wallet.sats, offchain: s.wallet.offchain, onchain: s.wallet.onchain }
    w._arkAddr = s.arkAddress
    w._boardingAddr = s.boardingAddress
    w._btcUsd = s.btcUsd
    w._livePrices = s.livePrices
    w._feeRates = s.feeRates
    // Sync display settings so ui.js reads the correct values
    w.balDisplayMode = s.balDisplayMode
    // Keep ui.js ARK_ADDR in sync for QR page
    w.ARK_ADDR = s.arkAddress
    w.BOARDING_ADDR = s.boardingAddress
  }

  // Sync immediately + on every store change
  syncToWindow()
  useStore.subscribe(syncToWindow)

  // ── Override ui.js functions that would destroy React-managed DOM ──
  // Send/Receive sheets are now full React components — prevent innerHTML injection
  w.updateSendAmountFields = () => { /* no-op: React SendSheet manages its own DOM */ }
  w.updateRcvAmountFields = () => { /* no-op: React ReceiveSheet manages its own DOM */ }

  // QR generation is now handled by React QRPage useEffect — prevent ui.js duplicate
  w.initMainQR = () => { /* no-op: React QRPage manages QR generation */ }

  // Override openSheet to use Zustand for React-managed sheets
  // Wait for ui.js to register its openSheet first, then wrap it
  const patchOpenSheet = () => {
    const uiOpenSheet = w.openSheet
    w.openSheet = (id: string) => {
      // Always sync to Zustand store
      useStore.getState().openSheet(id)
      // For send/receive, ONLY add the CSS class — don't call innerHTML functions
      if (id === 'send' || id === 'receive') {
        const el = document.getElementById('sheet-' + id)
        if (el) el.classList.add('open')
        return
      }
      // For all other sheets, call the original ui.js openSheet
      if (typeof uiOpenSheet === 'function') {
        try { uiOpenSheet(id) } catch { /* sheet may not have a ui.js handler */ }
      } else {
        const el = document.getElementById('sheet-' + id)
        if (el) el.classList.add('open')
      }
    }
  }
  // ui.js sets window.openSheet at import time, so it should be available now
  // But use a microtask to ensure all imports have completed
  Promise.resolve().then(patchOpenSheet)

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

  // Refresh functions — override both underscore and bare names so main.js
  // and ui.js stray calls route through wallet.ts → Zustand store
  w._refreshTransactions = refreshTransactions
  w._refreshBalance = refreshBalance
  w._refreshBtcPrice = refreshBtcPrice
  w._refreshFeeRates = refreshFeeRates
  w.refreshTransactionsPage = () => refreshTransactions()
  w.refreshTransactions = () => refreshTransactions()

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

  // Boot entry point — called by SplashScreen after new wallet creation/restore.
  // Routes through wallet.ts bootWallet() instead of main.js boot() to avoid
  // double-init and ensure all state flows through Zustand.
  w._bootApp = () => {
    console.log('[Bridge] _bootApp → bootWallet()')
    bootWallet().then(() => {
      startAutoLockListeners()
      // Sync addresses to ui.js after boot
      const store = useStore.getState()
      if (typeof w._setLiveAddresses === 'function') {
        w._setLiveAddresses(store.arkAddress, store.boardingAddress)
      }
    }).catch((err: any) => {
      console.error('[Bridge] bootWallet failed:', err)
    })
  }

  // Transaction page — React manages these now
  w.setFil = () => { /* no-op: React TransactionsPage handles filtering */ }
  w.loadMoreTx = () => { /* no-op: React TransactionsPage handles pagination */ }
  w.loadMoreTx2 = () => { /* no-op */ }
  w.showLiveTxDetail = (rowId: string) => {
    // Map main.js rowId (e.g. 'tx_live_0') to actual tx id in store
    const reg = w._TX_REGISTRY?.[rowId]
    const txId = reg?.txid || rowId
    useStore.getState().setSelectedTxId(txId)
    useStore.getState().openSheet('txdetail')
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
