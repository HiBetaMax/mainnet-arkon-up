import { ArkadeSwaps, BoltzSwapProvider, decodeInvoice } from '@arkade-os/boltz-swap'
import { BOLTZ_APIS, BOLTZ_NETWORK } from './config.js'
import { getWalletState, setActiveBoltzApi, setSwaps } from './state.js'
import { init } from './core.js'

async function buildSwaps(apiUrl) {
  const wallet = await init()
  const swapProvider = new BoltzSwapProvider({
    apiUrl,
    network: BOLTZ_NETWORK,
    referralId: 'arkade',
  })
  setActiveBoltzApi(apiUrl)
  return new ArkadeSwaps({ wallet, swapProvider, swapManager: true })
}

export async function disposeSwaps() {
  const { swaps } = getWalletState()
  if (swaps && typeof swaps.dispose === 'function') {
    try { await swaps.dispose() } catch {}
  }
  setSwaps(null)
}

async function getSwaps(forceNew = false, preferredApi = null) {
  const { swaps, activeBoltzApi } = getWalletState()
  const targetApi = preferredApi || activeBoltzApi || BOLTZ_APIS[0]
  if (swaps && !forceNew && targetApi === activeBoltzApi) return swaps
  if (forceNew) await disposeSwaps()
  const nextSwaps = await buildSwaps(targetApi)
  setSwaps(nextSwaps)
  return nextSwaps
}

async function withSwapApiFallback(fn) {
  let lastErr = null
  for (const apiUrl of BOLTZ_APIS) {
    try {
      const swaps = await getSwaps(lastErr !== null, apiUrl)
      return await fn(swaps, apiUrl)
    } catch (err) {
      lastErr = err
      const msg = String(err?.message || err || '')
      const isFetchy = /fetch|network|cors|load failed|failed to fetch/i.test(msg)
      if (!isFetchy) throw err
    }
  }
  throw lastErr || new Error('Lightning provider unavailable')
}

export async function createLightningInvoice({ amount, description }) {
  return await withSwapApiFallback(async swaps => {
    return await swaps.createLightningInvoice({
      amount: Math.floor(Number(amount)),
      description: String(description || '').trim() || undefined,
    })
  })
}

export async function payLightningInvoice({ invoice, maxFeeSats }) {
  return await withSwapApiFallback(async swaps => {
    return await swaps.sendLightningPayment({
      invoice: String(invoice || '').trim(),
      maxFeeSats: maxFeeSats == null ? undefined : Math.floor(Number(maxFeeSats)),
    })
  })
}

export function decodeLightningPaymentRequest(invoice) {
  return decodeInvoice(String(invoice || '').trim())
}

export async function getLightningSwaps() {
  return await getSwaps()
}

export const BOLTZ_API_URL = BOLTZ_APIS[0]
