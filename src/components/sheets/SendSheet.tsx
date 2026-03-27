import { useState, useCallback, useEffect, useRef } from 'react'
import SheetWrapper from './SheetWrapper'
import useStore from '../../store'
import { sendPayment, detectAddressType } from '../../services/wallet'
import type { SendNetwork } from '../../store'

type TabKey = 'ark' | 'lightning' | 'onchain' | 'saved'

const TAB_TO_NETWORK: Record<string, SendNetwork> = {
  ark: 'ark',
  lightning: 'lightning',
  onchain: 'bitcoin',
}

const PLACEHOLDERS: Record<TabKey, string> = {
  ark: 'ark1q\u2026',
  lightning: 'lnbc1\u2026',
  onchain: 'bc1\u2026',
  saved: 'ark1q\u2026',
}

const LABELS: Record<TabKey, string> = {
  ark: 'Ark Address',
  lightning: 'Lightning Invoice',
  onchain: 'Bitcoin Address',
  saved: 'Address',
}

function formatSats(n: number): string {
  return n.toLocaleString('en-US')
}

function satsToFiat(sats: number, price: number): string {
  if (!price || price <= 0) return '0.00'
  return (sats / 1e8 * price).toFixed(2)
}

function fiatToSats(fiat: number, price: number): number {
  if (!price || price <= 0) return 0
  return Math.round(fiat / price * 1e8)
}

function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case 'EUR': return '\u20AC'
    case 'CHF': return 'CHF '
    default: return '$'
  }
}

export default function SendSheet() {
  const wallet = useStore((s) => s.wallet)
  const livePrices = useStore((s) => s.livePrices)
  const currency = useStore((s) => s.currency)
  const balDisplayMode = useStore((s) => s.balDisplayMode)
  const feeRates = useStore((s) => s.feeRates)
  const sendNetwork = useStore((s) => s.sendNetwork)
  const sendAddress = useStore((s) => s.sendAddress)
  const sendAmountSats = useStore((s) => s.sendAmountSats)
  const sendAmountFiat = useStore((s) => s.sendAmountFiat)
  const sendInProgress = useStore((s) => s.sendInProgress)
  const sendFeeRate = useStore((s) => s.sendFeeRate)
  const closeSheet = useStore((s) => s.closeSheet)
  const setSendNetwork = useStore((s) => s.setSendNetwork)
  const setSendAddress = useStore((s) => s.setSendAddress)
  const setSendAmountSats = useStore((s) => s.setSendAmountSats)
  const setSendAmountFiat = useStore((s) => s.setSendAmountFiat)
  const setSendFeeRate = useStore((s) => s.setSendFeeRate)
  const resetSendForm = useStore((s) => s.resetSendForm)
  const showToast = useStore((s) => s.showToast)

  const [activeTab, setActiveTab] = useState<TabKey>('ark')
  const [showSaved, setShowSaved] = useState(false)
  const [selectedFeeLevel, setSelectedFeeLevel] = useState<'slow' | 'medium' | 'fast'>('medium')
  const [satsInputVal, setSatsInputVal] = useState('')
  const [fiatInputVal, setFiatInputVal] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const price = (livePrices as Record<string, number>)[currency] || livePrices.USD || 0
  const currSymbol = getCurrencySymbol(currency)

  // Sync activeTab from store sendNetwork on mount
  useEffect(() => {
    if (sendNetwork === 'bitcoin') setActiveTab('onchain')
    else if (sendNetwork === 'lightning') setActiveTab('lightning')
    else setActiveTab('ark')
  }, [])

  // ─── Tab selection ───────────────────────────────────────────────────

  const selectTab = useCallback((tab: TabKey) => {
    setActiveTab(tab)
    if (tab === 'saved') {
      setShowSaved(true)
      // Fallback to ui.js for saved address rendering
      if (typeof (window as any).toggleSavedView === 'function') {
        (window as any).toggleSavedView()
      }
      if (typeof (window as any).renderFavList === 'function') {
        (window as any).renderFavList()
      }
    } else {
      setShowSaved(false)
      const network = TAB_TO_NETWORK[tab]
      if (network) setSendNetwork(network)
    }
  }, [setSendNetwork])

  // ─── Address auto-detect ────────────────────────────────────────────

  const handleAddressInput = useCallback((value: string) => {
    setSendAddress(value)
    if (value.length > 3) {
      try {
        const detected = detectAddressType(value)
        if (detected === 'ark') {
          setActiveTab('ark')
          setSendNetwork('ark')
        } else if (detected === 'bitcoin') {
          setActiveTab('onchain')
          setSendNetwork('bitcoin')
        } else if (detected === 'lightning') {
          setActiveTab('lightning')
          setSendNetwork('lightning')
        }
      } catch {
        // detection failed, keep current network
      }
    }
  }, [setSendAddress, setSendNetwork])

  // ─── Amount helpers ────────────────────────────────────────────────

  const updateFromSats = useCallback((raw: string) => {
    setSatsInputVal(raw)
    const sats = parseInt(raw.replace(/,/g, ''), 10) || 0
    setSendAmountSats(sats)
    const fiatVal = satsToFiat(sats, price)
    setFiatInputVal(fiatVal)
    setSendAmountFiat(fiatVal)
  }, [price, setSendAmountSats, setSendAmountFiat])

  const updateFromFiat = useCallback((raw: string) => {
    setFiatInputVal(raw)
    const fiat = parseFloat(raw.replace(/,/g, '')) || 0
    setSendAmountFiat(raw)
    const sats = fiatToSats(fiat, price)
    setSatsInputVal(sats > 0 ? sats.toString() : '')
    setSendAmountSats(sats)
  }, [price, setSendAmountSats, setSendAmountFiat])

  const handleMax = useCallback(() => {
    const maxSats = wallet.sats
    setSatsInputVal(maxSats.toString())
    setSendAmountSats(maxSats)
    const fiatVal = satsToFiat(maxSats, price)
    setFiatInputVal(fiatVal)
    setSendAmountFiat(fiatVal)
  }, [wallet.sats, price, setSendAmountSats, setSendAmountFiat])

  // ─── Fee helpers ──────────────────────────────────────────────────

  const feeRateForLevel = (level: 'slow' | 'medium' | 'fast'): number => {
    if (!feeRates) return level === 'slow' ? 6 : level === 'medium' ? 12 : 24
    switch (level) {
      case 'slow': return feeRates.hour
      case 'medium': return feeRates.halfHour
      case 'fast': return feeRates.fastest
    }
  }

  const feeTimeForLevel = (level: 'slow' | 'medium' | 'fast'): string => {
    switch (level) {
      case 'slow': return '~1 hour'
      case 'medium': return '~10 min'
      case 'fast': return '~1-2 min'
    }
  }

  const selectFeeLevel = useCallback((level: 'slow' | 'medium' | 'fast') => {
    setSelectedFeeLevel(level)
    setSendFeeRate(feeRateForLevel(level))
  }, [feeRates, setSendFeeRate])

  // Estimated fee in sats (rough: 155 vbytes typical Ark/BTC tx)
  const estimatedVbytes = 155
  const currentFeeRate = feeRateForLevel(selectedFeeLevel)
  const estimatedFeeSats = estimatedVbytes * currentFeeRate
  const estimatedFeeFiat = satsToFiat(estimatedFeeSats, price)

  // ─── Confirm send ──────────────────────────────────────────────────

  const handleConfirmSend = useCallback(async () => {
    if (sendInProgress) return

    const addr = sendAddress.trim()
    if (!addr) {
      showToast('Please enter an address')
      return
    }
    if (sendAmountSats <= 0) {
      showToast('Please enter an amount')
      return
    }
    if (sendAmountSats > wallet.sats) {
      showToast('Insufficient balance')
      return
    }

    try {
      const result = await sendPayment(
        addr,
        sendAmountSats,
        sendNetwork,
        sendNetwork === 'bitcoin' ? currentFeeRate : undefined
      )
      if (result.success) {
        showToast(result.message)
        resetSendForm()
        setSatsInputVal('')
        setFiatInputVal('')
        closeSheet('send')
      } else {
        showToast(result.message || 'Send failed')
      }
    } catch (err) {
      console.error('[SendSheet] sendPayment error, trying fallback:', err)
      if (typeof (window as any).confirmSend === 'function') {
        (window as any).confirmSend()
      } else {
        showToast('Send failed')
      }
    }
  }, [
    sendInProgress, sendAddress, sendAmountSats, wallet.sats,
    sendNetwork, currentFeeRate, showToast, resetSendForm, closeSheet,
  ])

  // ─── Cancel ────────────────────────────────────────────────────────

  const handleCancel = useCallback(() => {
    resetSendForm()
    setSatsInputVal('')
    setFiatInputVal('')
    closeSheet('send')
  }, [resetSendForm, closeSheet])

  // ─── QR & Upload fallbacks ────────────────────────────────────────

  const handleQrScan = useCallback(() => {
    if (typeof (window as any).openQRScan === 'function') {
      (window as any).openQRScan()
    }
  }, [])

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (typeof (window as any).handleInvoiceUpload === 'function') {
      (window as any).handleInvoiceUpload(e.target)
    }
  }, [])

  // ─── Render: Amount fields ────────────────────────────────────────

  const renderAmountFields = () => {
    const fiatField = (
      <div className="fld">
        <label className="flbl">Amount ({currency})</label>
        <div className="fwrap">
          <input
            className="finp"
            id="s-fiat"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={fiatInputVal}
            onChange={(e) => updateFromFiat(e.target.value)}
          />
          <button className="fmax" onClick={handleMax}>MAX</button>
        </div>
      </div>
    )

    const satsField = (
      <div className="fld">
        <label className="flbl">Amount (sats)</label>
        <div className="fwrap">
          <input
            className="finp"
            id="s-amt"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={satsInputVal}
            onChange={(e) => updateFromSats(e.target.value)}
          />
          <button className="fmax" onClick={handleMax}>MAX</button>
        </div>
      </div>
    )

    switch (balDisplayMode) {
      case 'fiat':
        return (
          <>
            {fiatField}
            <input type="hidden" id="s-amt" value={sendAmountSats} />
          </>
        )
      case 'sats':
        return satsField
      case 'both':
      default:
        return (
          <>
            {fiatField}
            {satsField}
          </>
        )
    }
  }

  // ─── Render: Fee sections ─────────────────────────────────────────

  const renderFeeSections = () => {
    const networkTab = activeTab === 'saved' ? 'ark' : activeTab

    return (
      <>
        {/* On-chain fees */}
        <div
          id="fee-section-onchain"
          style={{ display: networkTab === 'onchain' ? 'block' : 'none' }}
        >
          <div className="fld">
            <label className="flbl">Network Fee</label>
            <div className="fee-grid">
              <div
                className={`fo${selectedFeeLevel === 'slow' ? ' active' : ''}`}
                onClick={() => selectFeeLevel('slow')}
              >
                <div className="fo-nm">SLOW</div>
                <div className="fo-r">{feeRateForLevel('slow')} sat/vB</div>
                <div className="fo-t">{feeTimeForLevel('slow')}</div>
              </div>
              <div
                className={`fo${selectedFeeLevel === 'medium' ? ' active' : ''}`}
                onClick={() => selectFeeLevel('medium')}
              >
                <div className="fo-nm">MEDIUM</div>
                <div className="fo-r">{feeRateForLevel('medium')} sat/vB</div>
                <div className="fo-t">{feeTimeForLevel('medium')}</div>
              </div>
              <div
                className={`fo${selectedFeeLevel === 'fast' ? ' active' : ''}`}
                onClick={() => selectFeeLevel('fast')}
              >
                <div className="fo-nm">FAST</div>
                <div className="fo-r">{feeRateForLevel('fast')} sat/vB</div>
                <div className="fo-t">{feeTimeForLevel('fast')}</div>
              </div>
            </div>
          </div>
          <div className="fsm">
            <div className="fl">
              <span className="fl-l">Estimated fee</span>
              <span className="fl-v">
                ~{formatSats(estimatedFeeSats)} SATS ({currSymbol}{estimatedFeeFiat})
              </span>
            </div>
            <div className="fl">
              <span className="fl-l">Estimated time</span>
              <span className="fl-v">{feeTimeForLevel(selectedFeeLevel)}</span>
            </div>
          </div>
        </div>

        {/* Lightning fees */}
        <div
          id="fee-section-lightning"
          style={{ display: networkTab === 'lightning' ? 'block' : 'none' }}
        >
          <div className="fsm">
            <div className="fl">
              <span className="fl-l">Routing fee</span>
              <span className="fl-v">~1-10 SATS (0.01%)</span>
            </div>
            <div className="fl">
              <span className="fl-l">Settlement</span>
              <span className="fl-v" style={{ color: 'var(--grn)' }}>Instant</span>
            </div>
          </div>
        </div>

        {/* Ark fees */}
        <div
          id="fee-section-ark"
          style={{ display: networkTab === 'ark' ? 'block' : 'none' }}
        >
          <div className="fsm">
            <div className="fl">
              <span className="fl-l">Service fee</span>
              <span className="fl-v">~0 SATS (batched)</span>
            </div>
            <div className="fl">
              <span className="fl-l">Settlement</span>
              <span className="fl-v" style={{ color: 'var(--grn)' }}>Instant off-chain</span>
            </div>
            <div className="fl">
              <span className="fl-l">Round time</span>
              <span className="fl-v">~5 seconds</span>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────

  const availableFiat = satsToFiat(wallet.sats, price)

  return (
    <SheetWrapper id="send" title="Send Bitcoin">
      {/* Network tab row */}
      <div className="qr-type-row" style={{ marginBottom: 14 }} id="snd-net-row">
        <div
          className={`qtt${activeTab === 'ark' ? ' active' : ''}`}
          id="snd-net-btn-ark"
          onClick={() => selectTab('ark')}
        >
          Ark
        </div>
        <div
          className={`qtt${activeTab === 'lightning' ? ' active' : ''}`}
          id="snd-net-btn-lightning"
          onClick={() => selectTab('lightning')}
        >
          Lightning
        </div>
        <div
          className={`qtt${activeTab === 'onchain' ? ' active' : ''}`}
          id="snd-net-btn-onchain"
          onClick={() => selectTab('onchain')}
        >
          On-chain
        </div>
        <div
          className={`qtt${activeTab === 'saved' ? ' active' : ''}`}
          id="snd-net-btn-saved"
          onClick={() => selectTab('saved')}
        >
          Saved
        </div>
      </div>

      <input type="hidden" id="snd-net" value={sendNetwork} readOnly />

      {/* Saved addresses view (populated by ui.js fallback) */}
      <div id="fav-list-view" style={{ display: showSaved ? 'block' : 'none' }}>
        <div
          id="fav-list-items"
          style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
        />
        <div
          id="fav-empty"
          style={{
            display: 'none',
            textAlign: 'center',
            padding: '32px 16px',
            color: 'var(--t3)',
            fontSize: 13,
          }}
        >
          No saved addresses yet.
          <br />
          <span style={{ fontSize: 11, color: 'var(--t3)', opacity: 0.7 }}>
            Send to an address and save it after payment
          </span>
        </div>
      </div>

      {/* Send form area */}
      <div id="send-form-area" style={{ display: showSaved ? 'none' : 'block' }}>
        {/* Address field */}
        <div className="fld">
          <label className="flbl" id="snd-addr-lbl">
            {LABELS[activeTab]}
          </label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              className="finp"
              id="s-addr"
              type="text"
              placeholder={PLACEHOLDERS[activeTab]}
              style={{ flex: 1 }}
              value={sendAddress}
              onChange={(e) => handleAddressInput(e.target.value)}
            />
            <button
              onClick={handleQrScan}
              style={{
                flexShrink: 0,
                width: 46,
                height: 46,
                borderRadius: 'var(--r-md)',
                background: 'var(--accs)',
                border: '1px solid var(--acc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--acc2)',
              }}
              title="Scan QR"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ width: 18, height: 18 }}
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="3" height="3" />
                <rect x="18" y="14" width="3" height="3" />
                <rect x="14" y="18" width="3" height="3" />
                <rect x="18" y="18" width="3" height="3" />
              </svg>
            </button>
            <button
              onClick={handleUpload}
              style={{
                flexShrink: 0,
                width: 46,
                height: 46,
                borderRadius: 'var(--r-md)',
                background: 'var(--accs)',
                border: '1px solid var(--acc)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--acc2)',
              }}
              title="Upload invoice"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ width: 18, height: 18 }}
              >
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              id="invoice-upload-input"
              accept="image/*,.pdf,.txt"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* Available balance */}
        <div
          className="fsm"
          style={{ marginBottom: 8 }}
        >
          <div className="fl">
            <span className="fl-l">Available</span>
            <span className="fl-v">
              {formatSats(wallet.sats)} SATS ({currSymbol}{availableFiat})
            </span>
          </div>
        </div>

        {/* Amount fields */}
        <div id="send-amt-wrap">
          {renderAmountFields()}
        </div>

        {/* Fee sections */}
        {renderFeeSections()}

        {/* Confirm */}
        <button
          className="btnp"
          onClick={handleConfirmSend}
          disabled={sendInProgress}
          style={sendInProgress ? { opacity: 0.6, pointerEvents: 'none' } : undefined}
        >
          {sendInProgress ? 'Sending\u2026' : 'Confirm Send'}
        </button>

        {/* Cancel */}
        <button className="btns" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </SheetWrapper>
  )
}
