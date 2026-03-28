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

  // Balance display is now managed by React HeroCard — prevent ui.js DOM overwrites
  w.walletUpdateDisplay = () => { /* no-op: React HeroCard manages balance display */ }
  w.toggleBalance = () => { useStore.getState().toggleBalanceHidden() }
  // applyCur: sync currency to store instead of writing to DOM
  w.applyCur = (c: string) => {
    if (c && c !== 'SATS') useStore.getState().setCurrency(c)
  }

  // QR generation is now handled by React QRPage — prevent ui.js duplicate
  w.initMainQR = () => { /* no-op: React QRPage manages QR generation */ }
  w.setAddrType = () => { /* no-op: React QRPage manages address type switching */ }

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

  // confirmSend — called by "Send Now" button in sendconfirm sheet
  // Reads from hidden inputs populated by ui.js doSend(), then executes via wallet.ts
  w.confirmSend = async () => {
    const rawAddress = (document.getElementById('sc-addr-full') as HTMLInputElement)?.value?.trim()
    const address = rawAddress ? rawAddress.replace(/^(ark|bitcoin|lightning):/i, '') : ''
    const amount = Math.floor(Number((document.getElementById('sc-amount-raw') as HTMLInputElement)?.value)) || 0
    const netType = ((document.getElementById('sc-network-type') as HTMLInputElement)?.value || 'ark').toLowerCase()

    if (!address) {
      useStore.getState().showToast('Missing address or invoice')
      return
    }

    const detected = detectAddressType(address)
    const routedType = detected !== 'unknown' ? detected : netType
    const network = routedType === 'bitcoin' ? 'bitcoin' as const
      : routedType === 'lightning' ? 'lightning' as const
      : 'ark' as const

    // For non-lightning, require amount
    if (network !== 'lightning' && (!amount || amount <= 0)) {
      useStore.getState().showToast('Missing or invalid amount')
      return
    }

    const btn = document.getElementById('sc-confirm-btn') as HTMLButtonElement | null
    const btnLabel = document.getElementById('sc-confirm-label')
    if (btn) {
      btn.disabled = true
      const iconEl = btn.querySelector('svg') as SVGElement | null
      if (iconEl) iconEl.style.animation = 'spin .6s linear infinite'
      if (btnLabel) btnLabel.textContent = 'Sending…'
    }

    try {
      const result = await sendPayment(address, amount, network)
      // Close sendconfirm sheet
      useStore.getState().closeSheet('sendconfirm')
      const el = document.getElementById('sheet-sendconfirm')
      if (el) el.classList.remove('open')

      if (result.success) {
        // Update send result sheet
        const iconWrap = document.getElementById('sres-icon')
        const iconSvg = document.getElementById('sres-icon-svg')
        const titleEl = document.getElementById('sres-title')
        const amtEl = document.getElementById('sres-amount')
        const sub = document.getElementById('sres-sub')
        if (iconWrap) iconWrap.style.background = 'var(--grns)'
        if (iconSvg) { iconSvg.style.color = 'var(--grn)'; iconSvg.innerHTML = '<polyline points="20 6 9 17 4 12"/>' }
        if (titleEl) titleEl.textContent = 'Payment Sent'
        if (amtEl) amtEl.textContent = (amount || 0).toLocaleString() + ' SATS'
        if (sub) sub.textContent = result.message
        useStore.getState().openSheet('sendresult')
        const sresEl = document.getElementById('sheet-sendresult')
        if (sresEl) sresEl.classList.add('open')
      } else {
        useStore.getState().showToast(result.message || 'Send failed')
      }
    } catch (err: any) {
      useStore.getState().closeSheet('sendconfirm')
      const el = document.getElementById('sheet-sendconfirm')
      if (el) el.classList.remove('open')

      const msg = err?.message || 'Payment failed'
      // Show result sheet with error
      const iconWrap = document.getElementById('sres-icon')
      const iconSvg = document.getElementById('sres-icon-svg')
      const titleEl = document.getElementById('sres-title')
      const amtEl = document.getElementById('sres-amount')
      const sub = document.getElementById('sres-sub')
      if (iconWrap) iconWrap.style.background = 'var(--reds)'
      if (iconSvg) { iconSvg.style.color = 'var(--red)'; iconSvg.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' }
      if (titleEl) titleEl.textContent = 'Payment Failed'
      if (amtEl) amtEl.textContent = (amount || 0).toLocaleString() + ' SATS'
      if (sub) sub.textContent = msg
      useStore.getState().openSheet('sendresult')
      const sresEl = document.getElementById('sheet-sendresult')
      if (sresEl) sresEl.classList.add('open')
    } finally {
      if (btn) {
        btn.disabled = false
        const iconEl = btn.querySelector('svg') as SVGElement | null
        if (iconEl) iconEl.style.animation = ''
        if (btnLabel) btnLabel.textContent = 'Send Now'
      }
    }
  }

  // Notification banner — ensure element exists for ui.js showNotification
  if (!document.getElementById('notif-banner')) {
    const banner = document.createElement('div')
    banner.id = 'notif-banner'
    banner.className = 'notif-banner'
    document.body.appendChild(banner)
  }
}
