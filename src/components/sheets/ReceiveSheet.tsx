import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import SheetWrapper from './SheetWrapper'
import useStore from '../../store'
import { generateInvoice } from '../../services/wallet'

/* ── helpers ─────────────────────────────────────────────────────────────── */

function satsToFiat(sats: number, price: number): string {
  if (!price || !sats) return '0.00'
  return ((sats / 1e8) * price).toFixed(2)
}

function fiatToSats(fiat: number, price: number): number {
  if (!price || !fiat) return 0
  return Math.round((fiat / price) * 1e8)
}

function formatSats(n: number): string {
  return n.toLocaleString('en-US')
}

/* ── QR helper ───────────────────────────────────────────────────────────── */

function renderQR(el: HTMLElement | null, text: string) {
  if (!el) return
  el.innerHTML = ''
  if (!text) return
  try {
    new (window as any).QRCode(el, {
      text,
      width: 168,
      height: 168,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: (window as any).QRCode.CorrectLevel.M,
    })
  } catch {
    /* QRCode lib not loaded yet */
  }
}

/* ── SVG icons (inline to avoid external deps) ──────────────────────────── */

const CopyIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
  </svg>
)

const EyeIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

/* ── Amount Fields sub-component ─────────────────────────────────────────── */

interface AmountFieldsProps {
  idPrefix: string
  satValue: number
  onSatChange: (v: number) => void
  fiatValue: string
  onFiatChange: (v: string) => void
}

function AmountFields({ idPrefix, satValue, onSatChange, fiatValue, onFiatChange }: AmountFieldsProps) {
  const { balDisplayMode, currency, livePrices } = useStore()
  const price = (livePrices as Record<string, number>)[currency] ?? livePrices.USD

  const handleSatsInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/,/g, '')
      const n = parseInt(raw, 10) || 0
      onSatChange(n)
      onFiatChange(satsToFiat(n, price))
    },
    [price, onSatChange, onFiatChange],
  )

  const handleFiatInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value
      onFiatChange(v)
      const n = parseFloat(v) || 0
      onSatChange(fiatToSats(n, price))
    },
    [price, onSatChange, onFiatChange],
  )

  if (balDisplayMode === 'sats') {
    return (
      <div className="fld">
        <label className="flbl">Amount (SATS)</label>
        <div className="fwrap">
          <input
            className="finp"
            id={`${idPrefix}-sats`}
            type="number"
            placeholder="0"
            value={satValue || ''}
            onChange={handleSatsInput}
          />
        </div>
      </div>
    )
  }

  if (balDisplayMode === 'fiat') {
    return (
      <div className="fld">
        <label className="flbl">Amount ({currency})</label>
        <div className="fwrap">
          <input
            className="finp"
            id={`${idPrefix}-fiat`}
            type="number"
            placeholder="0.00"
            value={fiatValue}
            onChange={handleFiatInput}
            step="0.01"
          />
        </div>
        {satValue > 0 && (
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 5 }}>
            {formatSats(satValue)} sats
          </div>
        )}
      </div>
    )
  }

  /* both */
  return (
    <>
      <div className="fld">
        <label className="flbl">Amount ({currency})</label>
        <div className="fwrap">
          <input
            className="finp"
            id={`${idPrefix}-fiat`}
            type="number"
            placeholder="0.00"
            value={fiatValue}
            onChange={handleFiatInput}
            step="0.01"
          />
        </div>
      </div>
      <div className="fld">
        <label className="flbl">Amount (SATS)</label>
        <div className="fwrap">
          <input
            className="finp"
            id={`${idPrefix}-sats`}
            type="number"
            placeholder="0"
            value={satValue || ''}
            onChange={handleSatsInput}
          />
        </div>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  ReceiveSheet                                                            */
/* ══════════════════════════════════════════════════════════════════════════ */

export default function ReceiveSheet() {
  const {
    receiveTab,
    setReceiveTab,
    arkAddress,
    boardingAddress,
    wallet,
    balDisplayMode,
    currency,
    livePrices,
    showToast,
    setLightningInvoice,
    setLightningInvoiceAmount,
    openSheets,
  } = useStore()

  const isOpen = openSheets.includes('receive')

  const price = useMemo(
    () => (livePrices as Record<string, number>)[currency] ?? livePrices.USD,
    [livePrices, currency],
  )

  /* ── Ark local state ────────────────────────────────────────────────── */
  const [arkAddrVisible, setArkAddrVisible] = useState(false)
  const [arkSats, setArkSats] = useState(0)
  const [arkFiat, setArkFiat] = useState('')
  const arkQrRef = useRef<HTMLDivElement>(null)

  /* ── On-chain local state ───────────────────────────────────────────── */
  const [onchainAddrVisible, setOnchainAddrVisible] = useState(false)
  const [onchainSats, setOnchainSats] = useState(0)
  const [onchainFiat, setOnchainFiat] = useState('')
  const onchainQrRef = useRef<HTMLDivElement>(null)

  /* ── Lightning local state ──────────────────────────────────────────── */
  const [invoiceAmount, setInvoiceAmount] = useState('')
  const [invoiceFiatAmount, setInvoiceFiatAmount] = useState('')
  const [invoiceDescription, setInvoiceDescription] = useState('')
  const [generatedInvoice, setGeneratedInvoice] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [lnInvoiceVisible, setLnInvoiceVisible] = useState(false)
  const lnQrRef = useRef<HTMLDivElement>(null)

  const invoiceAmountNum = useMemo(() => parseInt(invoiceAmount, 10) || 0, [invoiceAmount])

  const lnFiatPreview = useMemo(() => {
    if (!invoiceAmountNum) return 'Enter amount to see fiat equivalent'
    const sym = currency === 'EUR' ? '€' : currency === 'CHF' ? 'CHF ' : '$'
    return `≈ ${sym}${satsToFiat(invoiceAmountNum, price)} ${currency}`
  }, [invoiceAmountNum, currency, price])

  const handleLnSatsInput = useCallback((val: string) => {
    setInvoiceAmount(val)
    const sats = parseInt(val, 10) || 0
    if (price > 0) setInvoiceFiatAmount(satsToFiat(sats, price))
  }, [price])

  const handleLnFiatInput = useCallback((val: string) => {
    setInvoiceFiatAmount(val)
    const fiat = parseFloat(val) || 0
    const sats = fiatToSats(fiat, price)
    setInvoiceAmount(sats > 0 ? String(sats) : '')
  }, [price])

  const arkReady = arkAddress && !arkAddress.startsWith('Connecting')
  const onchainReady = boardingAddress && !boardingAddress.startsWith('Connecting')

  /* ── QR effects ─────────────────────────────────────────────────────── */
  useEffect(() => {
    if (isOpen && receiveTab === 'ark' && arkReady) renderQR(arkQrRef.current, arkAddress)
  }, [isOpen, receiveTab, arkReady, arkAddress])

  useEffect(() => {
    if (isOpen && receiveTab === 'onchain' && onchainReady) renderQR(onchainQrRef.current, boardingAddress)
  }, [isOpen, receiveTab, onchainReady, boardingAddress])

  useEffect(() => {
    if (isOpen && generatedInvoice) renderQR(lnQrRef.current, generatedInvoice)
  }, [isOpen, generatedInvoice])

  /* ── Clipboard helper ───────────────────────────────────────────────── */
  const copyToClipboard = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text)
        showToast(`${label} copied`)
      } catch {
        showToast('Copy failed')
      }
    },
    [showToast],
  )

  /* ── Lightning invoice generation ───────────────────────────────────── */
  const handleGenerateInvoice = useCallback(async () => {
    if (!invoiceAmountNum || generating) return
    setGenerating(true)
    try {
      const { invoice } = await generateInvoice(invoiceAmountNum, invoiceDescription || undefined)
      setGeneratedInvoice(invoice)
      setLightningInvoice(invoice)
      setLightningInvoiceAmount(invoiceAmountNum)
    } catch (err: any) {
      showToast(err?.message || 'Invoice generation failed')
    } finally {
      setGenerating(false)
    }
  }, [invoiceAmountNum, invoiceDescription, generating, showToast, setLightningInvoice, setLightningInvoiceAmount])

  const resetLnForm = useCallback(() => {
    setGeneratedInvoice(null)
    setInvoiceAmount('')
    setInvoiceDescription('')
    setLnInvoiceVisible(false)
  }, [])

  /* ── Share helper ───────────────────────────────────────────────────── */
  const handleShare = useCallback(
    (title: string, text: string, type: string) => {
      if (typeof (window as any).shareContent === 'function') {
        ;(window as any).shareContent(title, text, type)
      }
    },
    [],
  )

  /* ════════════════════════════════════════════════════════════════════ */
  /*  Render                                                            */
  /* ════════════════════════════════════════════════════════════════════ */

  return (
    <SheetWrapper id="receive" title="Receive Bitcoin">
      {/* ── Tab selector ─────────────────────────────────────────────── */}
      <div className="qr-type-row" style={{ marginBottom: 16 }}>
        <div
          className={`qtt${receiveTab === 'ark' ? ' active' : ''}`}
          id="rcv-tab-ark"
          onClick={() => setReceiveTab('ark')}
        >
          Ark
        </div>
        <div
          className={`qtt${receiveTab === 'lightning' ? ' active' : ''}`}
          id="rcv-tab-lightning"
          onClick={() => setReceiveTab('lightning')}
        >
          Lightning
        </div>
        <div
          className={`qtt${receiveTab === 'onchain' ? ' active' : ''}`}
          id="rcv-tab-onchain"
          onClick={() => setReceiveTab('onchain')}
        >
          On-chain
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  ARK PANEL                                                    */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div
        id="rcv-onchain-panel"
        style={{ display: receiveTab === 'ark' ? undefined : 'none' }}
      >
        {/* QR */}
        <div className="sht-qr">
          <div className="sht-qr-inner">
            <div id="rcv-qr" ref={arkQrRef} />
          </div>
        </div>

        {/* Address label row */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            color: 'var(--t3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: '10px 0 6px',
          }}
        >
          <span id="rcv-addr-lbl">Ark Address</span>
          <button
            className="addr-reveal-btn"
            onClick={() => setArkAddrVisible((v) => !v)}
            title="Show/hide address"
          >
            {EyeIcon}
          </button>
        </div>

        {/* Address row */}
        <div className="addr-row">
          <span
            className={`addr-txt${arkAddrVisible ? '' : ' addr-masked'}`}
            id="rcv-addr"
          >
            {arkAddress}
          </span>
          <div className="cpb" onClick={() => copyToClipboard(arkAddress, 'Address')}>
            {CopyIcon}
          </div>
        </div>

        {/* Amount fields */}
        <div id="rcv-amt-wrap">
          <AmountFields
            idPrefix="rcv-ark"
            satValue={arkSats}
            onSatChange={setArkSats}
            fiatValue={arkFiat}
            onFiatChange={setArkFiat}
          />
        </div>

        {/* Buttons */}
        <button
          className="btnp"
          id="rcv-copy-btn"
          onClick={() => copyToClipboard(arkAddress, 'Ark Address')}
        >
          Copy Ark Address
        </button>
        <button
          className="btns"
          onClick={() => handleShare('Share Address', arkAddress, 'ark')}
        >
          Share
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  LIGHTNING PANEL                                              */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div
        id="rcv-lightning-panel"
        style={{ display: receiveTab === 'lightning' ? undefined : 'none' }}
      >
        {/* ── Invoice form ─────────────────────────────────────────── */}
        <div id="ln-form-wrap" style={{ display: generatedInvoice ? 'none' : undefined }}>
          <div
            style={{
              background: 'var(--bg3)',
              border: '1px solid var(--bdr2)',
              borderRadius: 'var(--r-md)',
              padding: 16,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                padding: '4px 0 10px',
                color: 'var(--t3)',
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              Create a real Lightning invoice that settles into your Ark wallet through
              Arkade/Boltz.
            </div>

            {/* Fiat input — shown in 'fiat' and 'both' modes */}
            {balDisplayMode !== 'sats' && (
              <div className="fld">
                <label className="flbl">
                  Amount ({currency}) {balDisplayMode === 'fiat' && <span style={{ color: 'var(--red)' }}>*</span>}
                </label>
                <div className="fwrap">
                  <input
                    className="finp"
                    id="ln-req-fiat"
                    placeholder="0.00"
                    type="number"
                    step="0.01"
                    value={invoiceFiatAmount}
                    onChange={(e) => handleLnFiatInput(e.target.value)}
                    style={{ paddingRight: 56 }}
                  />
                  <span
                    className="fmax"
                    style={{ fontSize: 10, right: 6 }}
                    onClick={() => {
                      const max = wallet.offchain || wallet.sats || 0
                      setInvoiceAmount(String(max))
                      setInvoiceFiatAmount(satsToFiat(max, price))
                    }}
                  >
                    MAX
                  </span>
                </div>
                {balDisplayMode === 'fiat' && invoiceAmountNum > 0 && (
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 5 }}>
                    ≈ {formatSats(invoiceAmountNum)} SATS
                  </div>
                )}
              </div>
            )}

            {/* Sats input — shown in 'sats' and 'both' modes */}
            {balDisplayMode !== 'fiat' && (
              <div className="fld">
                <label className="flbl">
                  Amount (SATS) {balDisplayMode === 'sats' && <span style={{ color: 'var(--red)' }}>*</span>}
                </label>
                <div className="fwrap">
                  <input
                    className="finp"
                    id="ln-req-amt"
                    placeholder="e.g. 21,000"
                    type="number"
                    value={invoiceAmount}
                    onChange={(e) => handleLnSatsInput(e.target.value)}
                    style={{ paddingRight: 56 }}
                  />
                  <span
                    className="fmax"
                    onClick={() => {
                      const max = wallet.offchain || wallet.sats || 0
                      handleLnSatsInput(String(max))
                    }}
                  >
                    MAX
                  </span>
                </div>
                <div
                  style={{ fontSize: 11, color: 'var(--t3)', marginTop: 5 }}
                  id="ln-fiat-preview"
                >
                  {lnFiatPreview}
                </div>
              </div>
            )}

            {/* Hidden input for fiat-only mode so invoiceAmount is always set */}
            {balDisplayMode === 'fiat' && (
              <input type="hidden" id="ln-req-amt" value={invoiceAmount} />
            )}

            <div className="fld">
              <label className="flbl">Description (optional)</label>
              <input
                className="finp"
                id="ln-memo"
                maxLength={120}
                placeholder="e.g. Coffee payment"
                value={invoiceDescription}
                onChange={(e) => setInvoiceDescription(e.target.value)}
              />
            </div>

            <div id="ln-gen-wrap">
              <button
                className="btnp"
                id="ln-gen-btn"
                disabled={!invoiceAmountNum || generating}
                onClick={handleGenerateInvoice}
                style={{ opacity: !invoiceAmountNum ? 0.5 : 1 }}
              >
                {generating ? 'Generating...' : 'Generate Lightning Invoice'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Invoice display ──────────────────────────────────────── */}
        <div
          id="ln-invoice-area"
          style={{ display: generatedInvoice ? undefined : 'none' }}
        >
          <div
            style={{
              background: 'var(--bg3)',
              border: '1px solid var(--bdr2)',
              borderRadius: 'var(--r-md)',
              padding: 16,
              marginBottom: 14,
            }}
          >
            {/* QR */}
            <div className="sht-qr">
              <div className="sht-qr-inner">
                <div id="rcv-ln-qr" ref={lnQrRef} />
              </div>
            </div>

            {/* Amount display */}
            <div
              style={{
                textAlign: 'center',
                fontSize: 18,
                fontWeight: 800,
                color: 'var(--t1)',
                marginBottom: 4,
              }}
            >
              <span id="ln-invoice-amt-display">
                {formatSats(invoiceAmountNum)}
              </span>{' '}
              <span style={{ fontSize: 12, color: 'var(--t3)' }}>SATS</span>
            </div>

            <div
              id="ln-invoice-fiat-label"
              style={{
                fontSize: 11,
                color: 'var(--t3)',
                textAlign: 'center',
                marginBottom: 10,
              }}
            >
              ~ {currency} {satsToFiat(invoiceAmountNum, price)}
            </div>

            <div
              id="ln-status"
              style={{
                fontSize: 12,
                color: 'var(--t3)',
                textAlign: 'center',
                marginBottom: 10,
              }}
            >
              Invoice ready &mdash; auto-claims into your Ark wallet after payment.
            </div>

            {/* Invoice string */}
            <div className="addr-row">
              <span
                className={`addr-txt${lnInvoiceVisible ? '' : ' addr-masked'}`}
                id="ln-invoice-val"
              >
                {generatedInvoice ?? '\u2014'}
              </span>
              <div
                className="cpb"
                onClick={() =>
                  generatedInvoice && copyToClipboard(generatedInvoice, 'Invoice')
                }
              >
                {CopyIcon}
              </div>
            </div>
          </div>

          <button
            className="btnp"
            onClick={() =>
              generatedInvoice && copyToClipboard(generatedInvoice, 'Invoice')
            }
            style={{ marginBottom: 10 }}
          >
            Copy Invoice
          </button>
          <button className="btns" onClick={resetLnForm}>
            New Invoice
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/*  ON-CHAIN PANEL                                               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div style={{ display: receiveTab === 'onchain' ? undefined : 'none' }}>
        {/* QR */}
        <div className="sht-qr">
          <div className="sht-qr-inner">
            <div ref={onchainQrRef} />
          </div>
        </div>

        {/* Address label row */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            color: 'var(--t3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: '10px 0 6px',
          }}
        >
          <span>Boarding Address</span>
          <button
            className="addr-reveal-btn"
            onClick={() => setOnchainAddrVisible((v) => !v)}
            title="Show/hide address"
          >
            {EyeIcon}
          </button>
        </div>

        {/* Address row */}
        <div className="addr-row">
          <span className={`addr-txt${onchainAddrVisible ? '' : ' addr-masked'}`}>
            {boardingAddress}
          </span>
          <div
            className="cpb"
            onClick={() => copyToClipboard(boardingAddress, 'Address')}
          >
            {CopyIcon}
          </div>
        </div>

        {/* Amount fields */}
        <AmountFields
          idPrefix="rcv-onchain"
          satValue={onchainSats}
          onSatChange={setOnchainSats}
          fiatValue={onchainFiat}
          onFiatChange={setOnchainFiat}
        />

        {/* Buttons */}
        <button
          className="btnp"
          onClick={() => copyToClipboard(boardingAddress, 'Boarding Address')}
        >
          Copy Boarding Address
        </button>
        <button
          className="btns"
          onClick={() => handleShare('Share Address', boardingAddress, 'onchain')}
        >
          Share
        </button>
      </div>
    </SheetWrapper>
  )
}
