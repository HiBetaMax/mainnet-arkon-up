# ArkON — Bitcoin Wallet on Ark Protocol

ArkON is a non-custodial Bitcoin wallet built on the [Ark protocol](https://arkade.computer). It supports instant off-chain payments, Lightning Network swaps, and on-chain transactions — all from a single mobile-first PWA.

## Tech Stack

- **React 19** + **ReactDOM 19** — Component-based UI
- **Zustand 5** — Global state management (single flat store)
- **Vite 5** — Build tool with HMR
- **vite-plugin-singlefile** — Bundles everything into a single HTML file for PWA deployment
- **@arkade-os/sdk** — Ark protocol wallet SDK (mainnet)
- **@arkade-os/boltz-swap** — Lightning swaps via Boltz.exchange

## Project Structure

```
src/
├── main.jsx                    # React entry point
├── App.jsx                     # Root component (boot orchestration)
├── main.js                     # SDK bridge (wallet logic, DOM ↔ SDK)
├── store/
│   └── index.js                # Zustand store (all app state)
├── styles/
│   ├── global.css              # Design tokens, themes, all component CSS
│   ├── splash.css              # Splash + SDK loading overlay CSS
│   └── unlock.css              # Password unlock gate CSS
├── components/
│   ├── boot/
│   │   ├── SplashScreen.jsx    # 4-screen onboarding flow
│   │   ├── UnlockGate.jsx      # Password-protected unlock
│   │   └── SdkLoading.jsx      # "Connecting to Ark" overlay
│   ├── layout/
│   │   ├── TopBar.jsx          # Logo + notification + profile
│   │   ├── BottomNav.jsx       # 5-tab navigation
│   │   └── Content.jsx         # Page router (activePage state)
│   ├── home/
│   │   ├── HeroCard.jsx        # Balance display with show/hide
│   │   ├── MainActions.jsx     # Send + Receive buttons
│   │   ├── ChartCard.jsx       # BTC price chart (canvas)
│   │   └── RecentTx.jsx        # Last 3 transactions
│   ├── pages/
│   │   ├── HomePage.jsx        # Composes home/* components
│   │   ├── QRPage.jsx          # QR display/scan + Lightning invoice
│   │   ├── TransactionsPage.jsx # Full history with filters
│   │   ├── AppsPage.jsx        # Finance, collectibles, games grid
│   │   └── SettingsPage.jsx    # Profile, preferences, security
│   ├── sheets/
│   │   ├── SheetWrapper.jsx    # Reusable overlay + sheet component
│   │   ├── SendSheet.jsx       # Send (Ark/Lightning/On-chain)
│   │   ├── ReceiveSheet.jsx    # Receive (Ark/Lightning/On-chain)
│   │   └── AllSheets.jsx       # All 23 sheet modals
│   └── shared/
│       └── Toast.jsx           # Toast notification pill
├── utils/
│   ├── escapeHtml.js           # XSS prevention
│   ├── clipboard.js            # Copy with auto-clear
│   ├── storage.js              # localStorage JSON helpers
│   └── formatters.js           # Sats/fiat formatting
├── wallet/                     # SDK wrapper modules
│   ├── core.js, state.js, config.js, crypto.js
│   ├── lightning.js
│   └── index.js
└── lightning/
    └── log.js                  # Lightning swap log
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (via Corepack: `corepack enable`)

### Development

```bash
pnpm install       # Install dependencies
pnpm dev           # Start dev server with HMR
pnpm build         # Build for production (single-file)
pnpm preview       # Preview production build
```

### Build Output

The build produces a single `dist/index.html` (~310KB, ~85KB gzipped) containing all HTML, CSS, and JS inline. Deployed as a PWA.

## Architecture

### State Management (Zustand)

Single flat store at `src/store/index.js`. Accessible inside React via `useStore()` hook, outside React via `useStore.getState()`.

Key sections: Wallet, Prices, UI Navigation, Display Preferences, Transactions, Chart, Send State, Boot.

### Navigation

No React Router. `activePage` string in Zustand (`home | apps | qr | transactions | settings`). The `Content` component renders all pages, showing only the active one.

### Sheet System

23 bottom sheets managed via `openSheets[]` in Zustand. `SheetWrapper` handles open/close animation, click-outside dismiss, and escape key.

### SDK Bridge (`main.js`)

1600-line bridge between React UI and `@arkade-os/sdk`:
- Exposes wallet functions via `window.*` globals
- Boot sequence: init → addresses → balance → transactions → polling
- Incoming payment watcher with dedup
- Auto-onboard for boarding UTXOs
- Security: auto-lock, visibility change lock

### Themes

Dark/light mode + 5 color schemes (blue, red, green, orange, purple). Controlled via CSS variables + `data-theme`/`data-scheme` on `<html>`.

## Security

- **CSP** — Strict Content Security Policy in `index.html`
- **Non-extractable CryptoKeys** — AES-256-GCM in IndexedDB
- **PBKDF2** — 250K iterations for password-derived keys
- **Auto-lock** — 5-minute inactivity + lock on tab switch
- **XSS prevention** — `escapeHtml()` for user content
- **Key zeroing** — Private key nulled from memory after use

## Networks

| Network | Method | Speed |
|---------|--------|-------|
| Ark | `sendBitcoin()` — off-chain batched | ~5 seconds |
| Lightning | Boltz swap (Ark → LN) | Instant |
| On-chain | `offboard()` — collaborative exit | ~10 min |
