import { create } from 'zustand'

const useStore = create((set, get) => ({
  // ── Wallet ──
  wallet: { sats: 0, offchain: 0, onchain: 0 },
  arkAddress: 'Connecting…',
  boardingAddress: 'Connecting…',
  walletName: localStorage.getItem('arkade_wallet_name') || 'My Wallet',
  hasExistingWallet: false,
  passwordEnabled: false,
  passwordUnlocked: false,
  walletReady: false,

  // ── Prices ──
  btcUsd: null,
  livePrices: { USD: 96420, EUR: 88640, CHF: 85910 },
  feeRates: null,

  // ── UI Navigation ──
  activePage: 'home',
  openSheets: [],
  activeGame: null,

  // ── Display Preferences ──
  balanceHidden: false,
  balDisplayMode: 'both',
  currency: localStorage.getItem('arkon_currency') || 'USD',
  theme: document.documentElement.getAttribute('data-theme') || 'dark',
  colorScheme: localStorage.getItem('arkon_color_scheme') || 'blue',

  // ── Transactions ──
  txRegistry: {},
  txFilter: 'all',

  // ── Chart ──
  chartRange: '24H',
  chartData: [],
  chartPctCache: {},
  chartBasePrice: null,

  // ── Send State ──
  sendInProgress: false,
  offboardInProgress: false,
  onboardInProgress: false,
  sendNetwork: 'ark',

  // ── Lightning ──
  lightningLog: [],

  // ── Notifications ──
  notifPrefs: (() => {
    try { return JSON.parse(localStorage.getItem('notif_prefs')) || { received: true, sent: true, failed: true, price: false } }
    catch { return { received: true, sent: true, failed: true, price: false } }
  })(),
  toastMessage: null,
  toastTimer: null,

  // ── Boot ──
  bootState: 'splash',
  bootError: null,
  splashStep: 1,

  // ── Actions: Navigation ──
  setActivePage: (page) => set({ activePage: page }),
  openSheet: (id) => set((s) => ({
    openSheets: s.openSheets.includes(id) ? s.openSheets : [...s.openSheets, id],
  })),
  closeSheet: (id) => set((s) => ({
    openSheets: s.openSheets.filter((x) => x !== id),
  })),
  closeAllSheets: () => set({ openSheets: [] }),

  // ── Actions: Wallet ──
  setWallet: (w) => set({ wallet: w }),
  setAddresses: (ark, boarding) => set({ arkAddress: ark, boardingAddress: boarding }),
  setWalletReady: (ready) => set({ walletReady: ready }),
  setHasExistingWallet: (v) => set({ hasExistingWallet: v }),

  // ── Actions: Boot ──
  setBootState: (state) => set({ bootState: state }),
  setBootError: (err) => set({ bootError: err }),
  setSplashStep: (step) => set({ splashStep: step }),

  // ── Actions: Display ──
  toggleBalanceHidden: () => set((s) => ({ balanceHidden: !s.balanceHidden })),
  setBalDisplayMode: (mode) => set({ balDisplayMode: mode }),
  setCurrency: (c) => {
    localStorage.setItem('arkon_currency', c)
    set({ currency: c })
  },
  setTheme: (t) => {
    document.documentElement.setAttribute('data-theme', t)
    set({ theme: t })
  },
  setColorScheme: (scheme) => {
    localStorage.setItem('arkon_color_scheme', scheme)
    if (scheme === 'blue') document.documentElement.removeAttribute('data-scheme')
    else document.documentElement.setAttribute('data-scheme', scheme)
    set({ colorScheme: scheme })
  },

  // ── Actions: Prices ──
  setBtcUsd: (p) => set({ btcUsd: p }),
  setLivePrices: (prices) => set({ livePrices: prices }),
  setFeeRates: (rates) => set({ feeRates: rates }),

  // ── Actions: Transactions ──
  setTxRegistry: (reg) => set({ txRegistry: reg }),
  setTxFilter: (f) => set({ txFilter: f }),

  // ── Actions: Chart ──
  setChartRange: (r) => set({ chartRange: r }),
  setChartData: (d) => set({ chartData: d }),

  // ── Actions: Send ──
  setSendInProgress: (v) => set({ sendInProgress: v }),
  setOffboardInProgress: (v) => set({ offboardInProgress: v }),
  setOnboardInProgress: (v) => set({ onboardInProgress: v }),
  setSendNetwork: (n) => set({ sendNetwork: n }),

  // ── Actions: Notifications ──
  setNotifPrefs: (prefs) => {
    localStorage.setItem('notif_prefs', JSON.stringify(prefs))
    set({ notifPrefs: prefs })
  },
  showToast: (msg) => {
    const { toastTimer } = get()
    if (toastTimer) clearTimeout(toastTimer)
    const timer = setTimeout(() => set({ toastMessage: null, toastTimer: null }), 2400)
    set({ toastMessage: msg, toastTimer: timer })
  },

  // ── Actions: Wallet Name ──
  setWalletName: (name) => {
    localStorage.setItem('arkade_wallet_name', name)
    set({ walletName: name })
  },

  // ── Actions: Game ──
  setActiveGame: (g) => set({ activeGame: g }),
}))

export default useStore
