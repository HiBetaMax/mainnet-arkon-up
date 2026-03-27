import { create } from 'zustand'

// ─── Types ──────────────────────────────────────────────────────────────────

export type BootState = 'splash' | 'booting' | 'ready'
export type Page = 'home' | 'qr' | 'apps' | 'transactions' | 'settings'
export type SendNetwork = 'ark' | 'bitcoin' | 'lightning'
export type AddressType = 'ark' | 'onchain' | 'lightning'
export type BalDisplayMode = 'sats' | 'fiat' | 'both'
export type TxFilter = 'all' | 'in' | 'out' | 'ln' | 'pnd'
export type ChartRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'
export type QrTab = 'mine' | 'scan'
export type ExportFormat = 'csv' | 'pdf'
export type ExportPreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom'
export type InvPayMethod = 'ark' | 'bitcoin' | 'lightning' | 'any'
export type ShareType = 'ark' | 'lightning' | 'onchain' | 'invoice' | 'address'

export interface WalletBalance {
  sats: number
  offchain: number
  onchain: number
}

export interface LivePrices {
  USD: number
  EUR: number
  CHF: number
}

export interface FeeRates {
  fastest: number
  halfHour: number
  hour: number
  economy: number
  minimum: number
}

export interface TxDetail {
  id: string
  type: string
  amount: number
  createdAt: string | number
  date: Date | null
  network: string
  settled?: boolean
  txid?: string
  arkTxid?: string | null
  boardingTxid?: string | null
  commitmentTxid?: string | null
  label?: string
  cls?: string
  statusLabel?: string
  note?: string
  [key: string]: unknown
}

export interface LightningLogEntry {
  id: string
  type: 'receive' | 'send'
  amount: number
  status: string
  timestamp: number
  invoice?: string
  [key: string]: unknown
}

export interface SavedAddress {
  address: string
  label: string
  network: SendNetwork
  favorite: boolean
  timestamp: number
}

export interface InvItem {
  description: string
  quantity: number
  unitPrice: number
}

export interface InvContact {
  name: string
  email?: string
  address?: string
  timestamp: number
}

export interface NotifPrefs {
  received: boolean
  sent: boolean
  failed: boolean
  price: boolean
  lightning?: boolean
  settlement?: boolean
}

export interface ChartPoint {
  timestamp: number
  price: number
}

export interface SendConfirmData {
  address: string
  amountSats: number
  network: SendNetwork
  feeRate?: number
  feeSats?: number
  fiatAmount?: string
  fiatCurrency?: string
}

export interface ShareData {
  title: string
  value: string
  type: ShareType
}

// ─── Store ──────────────────────────────────────────────────────────────────

export interface AppState {
  // ── Boot ──
  bootState: BootState
  bootError: string | null
  splashStep: number

  // ── Wallet ──
  wallet: WalletBalance
  arkAddress: string
  boardingAddress: string
  walletName: string
  hasExistingWallet: boolean
  walletReady: boolean

  // ── Password / Lock ──
  passwordEnabled: boolean
  passwordUnlocked: boolean

  // ── Prices ──
  btcUsd: number | null
  livePrices: LivePrices
  chartBasePrice: number | null

  // ── Fee Rates ──
  feeRates: FeeRates | null

  // ── Navigation ──
  activePage: Page
  openSheets: string[]
  activeGame: string | null

  // ── Display Preferences ──
  balanceHidden: boolean
  balDisplayMode: BalDisplayMode
  currency: string
  theme: 'dark' | 'light'
  colorScheme: string

  // ── Transactions ──
  txRegistry: Record<string, TxDetail>
  txFilter: TxFilter
  selectedTxId: string | null
  txNotes: Record<string, string>

  // ── Chart ──
  chartRange: ChartRange
  chartData: ChartPoint[]
  chartPctCache: Record<string, number>
  chartHighLow: { high: number; low: number } | null

  // ── Send ──
  sendNetwork: SendNetwork
  sendAddress: string
  sendAmountSats: number
  sendAmountFiat: string
  sendFeeRate: number
  sendInProgress: boolean
  offboardInProgress: boolean
  onboardInProgress: boolean
  sendConfirmData: SendConfirmData | null

  // ── Receive ──
  receiveTab: AddressType
  lightningInvoice: string | null
  lightningInvoiceAmount: number

  // ── QR Page ──
  qrTab: QrTab
  qrAddressType: AddressType
  qrLightningInvoice: string | null

  // ── Share ──
  shareData: ShareData | null

  // ── Lightning Log ──
  lightningLog: LightningLogEntry[]

  // ── Export ──
  exportPreset: ExportPreset
  exportFormat: ExportFormat
  exportDateFrom: string
  exportDateTo: string

  // ── Invoice Generator ──
  invStep: number
  invItems: InvItem[]
  invPayMethod: InvPayMethod
  invCurrency: string
  invColor: string
  invContacts: InvContact[]

  // ── Notifications ──
  notifPrefs: NotifPrefs
  toastMessage: string | null
  toastTimer: ReturnType<typeof setTimeout> | null

  // ── Apps ──
  appsFilter: string

  // ── Saved Addresses ──
  savedAddresses: SavedAddress[]

  // ═══ Actions ═══

  // Boot
  setBootState: (state: BootState) => void
  setBootError: (error: string | null) => void
  setSplashStep: (step: number) => void

  // Wallet
  setWallet: (wallet: WalletBalance) => void
  setAddresses: (ark: string, boarding: string) => void
  setArkAddress: (addr: string) => void
  setBoardingAddress: (addr: string) => void
  setWalletName: (name: string) => void
  setHasExistingWallet: (has: boolean) => void
  setWalletReady: (ready: boolean) => void
  setPasswordEnabled: (enabled: boolean) => void
  setPasswordUnlocked: (unlocked: boolean) => void

  // Prices
  setBtcUsd: (price: number) => void
  setLivePrices: (prices: LivePrices) => void
  setChartBasePrice: (price: number) => void
  setFeeRates: (rates: FeeRates | null) => void

  // Navigation
  setActivePage: (page: Page) => void
  openSheet: (id: string) => void
  closeSheet: (id: string) => void
  closeAllSheets: () => void
  setActiveGame: (game: string | null) => void

  // Display
  setBalanceHidden: (hidden: boolean) => void
  toggleBalanceHidden: () => void
  setBalDisplayMode: (mode: BalDisplayMode) => void
  setCurrency: (currency: string) => void
  setTheme: (theme: 'dark' | 'light') => void
  setColorScheme: (scheme: string) => void

  // Transactions
  setTxRegistry: (registry: Record<string, TxDetail>) => void
  upsertTx: (id: string, tx: TxDetail) => void
  setTxFilter: (filter: TxFilter) => void
  setSelectedTxId: (id: string | null) => void
  setTxNote: (txId: string, note: string) => void

  // Chart
  setChartRange: (range: ChartRange) => void
  setChartData: (data: ChartPoint[]) => void
  setChartPctCache: (cache: Record<string, number>) => void
  setChartHighLow: (hl: { high: number; low: number } | null) => void

  // Send
  setSendNetwork: (network: SendNetwork) => void
  setSendAddress: (address: string) => void
  setSendAmountSats: (amount: number) => void
  setSendAmountFiat: (amount: string) => void
  setSendFeeRate: (rate: number) => void
  setSendInProgress: (inProgress: boolean) => void
  setOffboardInProgress: (inProgress: boolean) => void
  setOnboardInProgress: (inProgress: boolean) => void
  setSendConfirmData: (data: SendConfirmData | null) => void
  resetSendForm: () => void

  // Receive
  setReceiveTab: (tab: AddressType) => void
  setLightningInvoice: (invoice: string | null) => void
  setLightningInvoiceAmount: (amount: number) => void

  // QR
  setQrTab: (tab: QrTab) => void
  setQrAddressType: (type: AddressType) => void
  setQrLightningInvoice: (invoice: string | null) => void

  // Share
  setShareData: (data: ShareData | null) => void

  // Lightning Log
  setLightningLog: (log: LightningLogEntry[]) => void
  addLightningLogEntry: (entry: LightningLogEntry) => void

  // Export
  setExportPreset: (preset: ExportPreset) => void
  setExportFormat: (format: ExportFormat) => void
  setExportDateFrom: (date: string) => void
  setExportDateTo: (date: string) => void

  // Invoice
  setInvStep: (step: number) => void
  setInvItems: (items: InvItem[]) => void
  addInvItem: (item: InvItem) => void
  removeInvItem: (index: number) => void
  setInvPayMethod: (method: InvPayMethod) => void
  setInvCurrency: (currency: string) => void
  setInvColor: (color: string) => void
  setInvContacts: (contacts: InvContact[]) => void

  // Notifications
  setNotifPrefs: (prefs: NotifPrefs) => void
  showToast: (message: string, duration?: number) => void
  clearToast: () => void

  // Apps
  setAppsFilter: (filter: string) => void

  // Saved Addresses
  setSavedAddresses: (addresses: SavedAddress[]) => void
  addSavedAddress: (address: SavedAddress) => void
  removeSavedAddress: (address: string) => void
  toggleFavorite: (address: string) => void
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

// ─── Create Store ───────────────────────────────────────────────────────────

const useStore = create<AppState>((set, get) => ({
  // ── Boot ──
  bootState: 'splash',
  bootError: null,
  splashStep: 1,

  // ── Wallet ──
  wallet: { sats: 0, offchain: 0, onchain: 0 },
  arkAddress: 'Connecting\u2026',
  boardingAddress: 'Connecting\u2026',
  walletName: localStorage.getItem('arkade_wallet_name') || 'My Wallet',
  hasExistingWallet: false,
  walletReady: false,

  // ── Password ──
  passwordEnabled: false,
  passwordUnlocked: false,

  // ── Prices ──
  btcUsd: null,
  livePrices: { USD: 0, EUR: 0, CHF: 0 },
  chartBasePrice: null,
  feeRates: null,

  // ── Navigation ──
  activePage: 'home',
  openSheets: [],
  activeGame: null,

  // ── Display ──
  balanceHidden: false,
  balDisplayMode: (localStorage.getItem('arkon_bal_display') as BalDisplayMode) || 'both',
  currency: localStorage.getItem('arkon_currency') || 'USD',
  theme: (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') || 'dark',
  colorScheme: localStorage.getItem('arkon_color_scheme') || 'blue',

  // ── Transactions ──
  txRegistry: {},
  txFilter: 'all',
  selectedTxId: null,
  txNotes: {},

  // ── Chart ──
  chartRange: '1W',
  chartData: [],
  chartPctCache: {},
  chartHighLow: null,

  // ── Send ──
  sendNetwork: 'ark',
  sendAddress: '',
  sendAmountSats: 0,
  sendAmountFiat: '',
  sendFeeRate: 0,
  sendInProgress: false,
  offboardInProgress: false,
  onboardInProgress: false,
  sendConfirmData: null,

  // ── Receive ──
  receiveTab: 'ark',
  lightningInvoice: null,
  lightningInvoiceAmount: 0,

  // ── QR ──
  qrTab: 'mine',
  qrAddressType: 'ark',
  qrLightningInvoice: null,

  // ── Share ──
  shareData: null,

  // ── Lightning ──
  lightningLog: [],

  // ── Export ──
  exportPreset: 'all',
  exportFormat: 'csv',
  exportDateFrom: '',
  exportDateTo: '',

  // ── Invoice ──
  invStep: 1,
  invItems: [{ description: '', quantity: 1, unitPrice: 0 }],
  invPayMethod: 'any',
  invCurrency: 'USD',
  invColor: '#2563eb',
  invContacts: [],

  // ── Notifications ──
  notifPrefs: loadJson<NotifPrefs>('notif_prefs', {
    received: true,
    sent: true,
    failed: true,
    price: false,
  }),
  toastMessage: null,
  toastTimer: null,

  // ── Apps ──
  appsFilter: 'all',

  // ── Saved Addresses ──
  savedAddresses: [],

  // ═══ Actions ═══

  // Boot
  setBootState: (bootState) => set({ bootState }),
  setBootError: (bootError) => set({ bootError }),
  setSplashStep: (splashStep) => set({ splashStep }),

  // Wallet
  setWallet: (wallet) => set({ wallet }),
  setAddresses: (ark, boarding) => set({ arkAddress: ark, boardingAddress: boarding }),
  setArkAddress: (arkAddress) => set({ arkAddress }),
  setBoardingAddress: (boardingAddress) => set({ boardingAddress }),
  setWalletName: (name) => {
    localStorage.setItem('arkade_wallet_name', name)
    set({ walletName: name })
  },
  setHasExistingWallet: (hasExistingWallet) => set({ hasExistingWallet }),
  setWalletReady: (walletReady) => set({ walletReady }),
  setPasswordEnabled: (passwordEnabled) => set({ passwordEnabled }),
  setPasswordUnlocked: (passwordUnlocked) => set({ passwordUnlocked }),

  // Prices
  setBtcUsd: (btcUsd) => set({ btcUsd }),
  setLivePrices: (livePrices) => set({ livePrices }),
  setChartBasePrice: (chartBasePrice) => set({ chartBasePrice }),
  setFeeRates: (feeRates) => set({ feeRates }),

  // Navigation
  setActivePage: (activePage) => set({ activePage }),
  openSheet: (id) =>
    set((s) => ({
      openSheets: s.openSheets.includes(id) ? s.openSheets : [...s.openSheets, id],
    })),
  closeSheet: (id) =>
    set((s) => ({
      openSheets: s.openSheets.filter((x) => x !== id),
    })),
  closeAllSheets: () => set({ openSheets: [] }),
  setActiveGame: (activeGame) => set({ activeGame }),

  // Display
  setBalanceHidden: (balanceHidden) => set({ balanceHidden }),
  toggleBalanceHidden: () => set((s) => ({ balanceHidden: !s.balanceHidden })),
  setBalDisplayMode: (mode) => {
    localStorage.setItem('arkon_bal_display', mode)
    set({ balDisplayMode: mode })
  },
  setCurrency: (currency) => {
    localStorage.setItem('arkon_currency', currency)
    set({ currency })
  },
  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    set({ theme })
  },
  setColorScheme: (scheme) => {
    localStorage.setItem('arkon_color_scheme', scheme)
    if (scheme === 'blue') document.documentElement.removeAttribute('data-scheme')
    else document.documentElement.setAttribute('data-scheme', scheme)
    set({ colorScheme: scheme })
  },

  // Transactions
  setTxRegistry: (txRegistry) => set({ txRegistry }),
  upsertTx: (id, tx) =>
    set((s) => ({
      txRegistry: { ...s.txRegistry, [id]: tx },
    })),
  setTxFilter: (txFilter) => set({ txFilter }),
  setSelectedTxId: (selectedTxId) => set({ selectedTxId }),
  setTxNote: (txId, note) => {
    localStorage.setItem(`arkon_tx_note_${txId}`, note)
    set((s) => ({ txNotes: { ...s.txNotes, [txId]: note } }))
  },

  // Chart
  setChartRange: (chartRange) => set({ chartRange }),
  setChartData: (chartData) => set({ chartData }),
  setChartPctCache: (chartPctCache) => set({ chartPctCache }),
  setChartHighLow: (chartHighLow) => set({ chartHighLow }),

  // Send
  setSendNetwork: (sendNetwork) => set({ sendNetwork }),
  setSendAddress: (sendAddress) => set({ sendAddress }),
  setSendAmountSats: (sendAmountSats) => set({ sendAmountSats }),
  setSendAmountFiat: (sendAmountFiat) => set({ sendAmountFiat }),
  setSendFeeRate: (sendFeeRate) => set({ sendFeeRate }),
  setSendInProgress: (sendInProgress) => set({ sendInProgress }),
  setOffboardInProgress: (offboardInProgress) => set({ offboardInProgress }),
  setOnboardInProgress: (onboardInProgress) => set({ onboardInProgress }),
  setSendConfirmData: (sendConfirmData) => set({ sendConfirmData }),
  resetSendForm: () =>
    set({
      sendAddress: '',
      sendAmountSats: 0,
      sendAmountFiat: '',
      sendFeeRate: 0,
      sendNetwork: 'ark',
      sendConfirmData: null,
    }),

  // Receive
  setReceiveTab: (receiveTab) => set({ receiveTab }),
  setLightningInvoice: (lightningInvoice) => set({ lightningInvoice }),
  setLightningInvoiceAmount: (lightningInvoiceAmount) => set({ lightningInvoiceAmount }),

  // QR
  setQrTab: (qrTab) => set({ qrTab }),
  setQrAddressType: (qrAddressType) => set({ qrAddressType }),
  setQrLightningInvoice: (qrLightningInvoice) => set({ qrLightningInvoice }),

  // Share
  setShareData: (shareData) => {
    set({ shareData })
    if (shareData) get().openSheet('share')
  },

  // Lightning Log
  setLightningLog: (lightningLog) => set({ lightningLog }),
  addLightningLogEntry: (entry) =>
    set((s) => ({
      lightningLog: [entry, ...s.lightningLog],
    })),

  // Export
  setExportPreset: (exportPreset) => set({ exportPreset }),
  setExportFormat: (exportFormat) => set({ exportFormat }),
  setExportDateFrom: (exportDateFrom) => set({ exportDateFrom }),
  setExportDateTo: (exportDateTo) => set({ exportDateTo }),

  // Invoice
  setInvStep: (invStep) => set({ invStep }),
  setInvItems: (invItems) => set({ invItems }),
  addInvItem: (item) => set((s) => ({ invItems: [...s.invItems, item] })),
  removeInvItem: (index) =>
    set((s) => ({
      invItems: s.invItems.filter((_, i) => i !== index),
    })),
  setInvPayMethod: (invPayMethod) => set({ invPayMethod }),
  setInvCurrency: (invCurrency) => set({ invCurrency }),
  setInvColor: (invColor) => set({ invColor }),
  setInvContacts: (invContacts) => set({ invContacts }),

  // Notifications
  setNotifPrefs: (prefs) => {
    localStorage.setItem('notif_prefs', JSON.stringify(prefs))
    set({ notifPrefs: prefs })
  },
  showToast: (message, duration = 2400) => {
    const prev = get().toastTimer
    if (prev) clearTimeout(prev)
    const timer = setTimeout(() => set({ toastMessage: null, toastTimer: null }), duration)
    set({ toastMessage: message, toastTimer: timer })
  },
  clearToast: () => {
    const prev = get().toastTimer
    if (prev) clearTimeout(prev)
    set({ toastMessage: null, toastTimer: null })
  },

  // Apps
  setAppsFilter: (appsFilter) => set({ appsFilter }),

  // Saved Addresses
  setSavedAddresses: (savedAddresses) => set({ savedAddresses }),
  addSavedAddress: (address) =>
    set((s) => ({
      savedAddresses: [...s.savedAddresses, address],
    })),
  removeSavedAddress: (addr) =>
    set((s) => ({
      savedAddresses: s.savedAddresses.filter((a) => a.address !== addr),
    })),
  toggleFavorite: (addr) =>
    set((s) => ({
      savedAddresses: s.savedAddresses.map((a) =>
        a.address === addr ? { ...a, favorite: !a.favorite } : a
      ),
    })),
}))

export default useStore
