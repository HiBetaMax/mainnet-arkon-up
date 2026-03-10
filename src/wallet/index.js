/**
 * wallet.js — public wallet surface
 *
 * The implementation is intentionally split into focused modules so future
 * changes can stay localised:
 * - wallet-core.js      → wallet lifecycle, balances, VTXOs, backup flows
 * - wallet-lightning.js → Boltz swap creation/payment and provider fallback
 * - wallet-crypto.js    → encrypted key storage helpers
 * - wallet-state.js     → shared runtime state between modules
 */

export {
  init,
  hasPasswordEnabled,
  unlockWithPassword,
  lockWallet,
  enablePassword,
  disablePassword,
  getWallet,
  getVtxoManager,
  getBalance,
  getArkFees,
  getAddress,
  getBoardingAddress,
  detectAddressType,
  sendBitcoin,
  onboard,
  offboard,
  checkAndRenewVtxos,
  getVtxoStatus,
  getRecoverableBalance,
  recoverVtxos,
  getTransactionHistory,
  exportEncryptedBackup,
  restoreFromEncryptedBackup,
  getPrivKey,
  listenForIncoming,
  resetWallet,
  restoreFromPrivKey,
  ARK_SERVER_URL,
  ESPLORA_API_URL,
} from './core.js'

export {
  createLightningInvoice,
  payLightningInvoice,
  decodeLightningPaymentRequest,
  getLightningSwaps,
  BOLTZ_API_URL,
} from './lightning.js'
