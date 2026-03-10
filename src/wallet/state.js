let wallet = null
let manager = null
let storage = null
let sessionPrivKeyHex = null
let passwordUnlocked = false
let swaps = null
let activeBoltzApi = null

export function getWalletState() {
  return { wallet, manager, storage, sessionPrivKeyHex, passwordUnlocked, swaps, activeBoltzApi }
}

export function setWallet(value) { wallet = value }
export function setManager(value) { manager = value }
export function setStorage(value) { storage = value }
export function setSessionPrivKeyHex(value) { sessionPrivKeyHex = value }
export function setPasswordUnlocked(value) { passwordUnlocked = value }
export function setSwaps(value) { swaps = value }
export function setActiveBoltzApi(value) { activeBoltzApi = value }

export function clearRuntimeState() {
  wallet = null
  manager = null
  sessionPrivKeyHex = null
  passwordUnlocked = false
  swaps = null
}

export function clearAllState() {
  clearRuntimeState()
  storage = null
  activeBoltzApi = null
}
