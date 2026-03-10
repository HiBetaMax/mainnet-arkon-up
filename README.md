# ArkON

ArkON is a Vite-based Bitcoin wallet UI for Ark/Arkade flows with Lightning and on-chain support, optimized for deployment on Vercel.

## Features

- Ark wallet creation, restore, backup, and password-gated unlock flow
- On-chain receive and send flows
- Lightning invoice generation and Lightning payment support through Boltz
- Local Lightning activity log with pending, completed, and failed states
- Auto-lock timer and password hardening for client-side wallet access
- Service worker registration for production app-shell caching
- Modular wallet code split for easier maintenance

## Code structure

```text
src/
  main.js                        # app orchestration and UI glue
  service-worker-registration.js # register /sw.js in production
  lightning/
    log.js                       # Lightning log storage + status normalization
  wallet/
    index.js                     # public wallet API barrel
    core.js                      # wallet lifecycle, backup, restore, balances
    lightning.js                 # Boltz / Lightning integration
    crypto.js                    # password and encryption helpers
    state.js                     # in-memory shared runtime state
    config.js                    # wallet and provider constants
public/
  sw.js                          # service worker
```

## Lightning log behavior

The Lightning log is intentionally conservative.

- Newly created receive invoices are stored as `Pending`
- Ambiguous provider states such as `paid` or `received` on inbound flows stay `Pending`
- Inbound flows only become `Received` when the status looks final, such as `completed`, `settled`, `claimed`, or `confirmed`
- Outbound flows become `Sent` only on final send-like states
- Failures are shown as `Failed`

This avoids showing `Received` too early when a Boltz swap is still in progress.

## Security notes

- No wallet secrets are written to the service worker
- Password and encryption helpers remain isolated in `src/wallet/crypto.js`
- The service worker is registered only in production
- The Lightning log stores UI metadata in local storage, not wallet secrets

## Deployment

This project is meant to run on Vercel.

Required files:

- `package.json`
- `package-lock.json`
- `vite.config.js`
- `index.html`
- `src/`
- `public/`

Typical deploy settings:

- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

## Local development

```bash
npm install
npm run dev
```
