import { useState, useCallback, useMemo } from 'react'
import SheetWrapper from './SheetWrapper'
import useStore from '../../store'

function TxIcon({ cls }: { cls: string }) {
  if (cls === 'in') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 28, height: 28 }}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </svg>
    )
  }
  if (cls === 'pnd') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 28, height: 28 }}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 28, height: 28 }}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  )
}

export default function TxDetailSheet() {
  const selectedTxId = useStore((s) => s.selectedTxId)
  const txRegistry = useStore((s) => s.txRegistry)
  const currency = useStore((s) => s.currency)
  const livePrices = useStore((s) => s.livePrices)
  const btcUsd = useStore((s) => s.btcUsd)
  const showToast = useStore((s) => s.showToast)

  const tx = selectedTxId ? txRegistry[selectedTxId] : null

  const [noteVal, setNoteVal] = useState('')
  const [noteLoaded, setNoteLoaded] = useState<string | null>(null)

  // Load saved note when tx changes
  const noteKey = tx ? `arkade_txnote_${tx.txid || tx.id}` : ''
  if (noteKey && noteKey !== noteLoaded) {
    setNoteVal(localStorage.getItem(noteKey) || '')
    setNoteLoaded(noteKey)
  }

  const sym = currency === 'EUR' ? '\u20AC' : currency === 'CHF' ? 'CHF ' : '$'
  const price = (livePrices as Record<string, number>)?.[currency] || btcUsd || 0

  const fiatNow = useMemo(() => {
    if (!tx || !price) return `${sym}0.00`
    return `${sym}${((tx.amount * price) / 1e8).toFixed(2)}`
  }, [tx, price, sym])

  const sign = tx?.cls === 'in' ? '+' : '\u2212'

  const explorerUrl = useMemo(() => {
    if (!tx) return null
    if (tx.commitmentTxid) return `https://mempool.space/tx/${tx.commitmentTxid}`
    if (tx.boardingTxid) return `https://mempool.space/tx/${tx.boardingTxid}`
    if (tx.arkTxid) return `https://arkade.space/tx/${tx.arkTxid}`
    return null
  }, [tx])

  const handleCopyTxid = useCallback(async () => {
    const id = tx?.txid || tx?.id
    if (!id) return
    try {
      await navigator.clipboard.writeText(id)
      showToast('Transaction ID copied')
    } catch {
      showToast('Copy failed')
    }
  }, [tx, showToast])

  const handleSaveNote = useCallback(() => {
    if (!noteKey) return
    const trimmed = noteVal.trim()
    if (trimmed) {
      localStorage.setItem(noteKey, trimmed)
    } else {
      localStorage.removeItem(noteKey)
    }
    showToast('Note saved')
  }, [noteKey, noteVal, showToast])

  if (!tx) {
    return <SheetWrapper id="txdetail" title="Transaction Detail"><div /></SheetWrapper>
  }

  const dateStr = tx.date
    ? tx.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Pending'
  const timeStr = tx.date
    ? tx.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '\u2014'

  return (
    <SheetWrapper id="txdetail" title="Transaction Detail">
      {/* Status header */}
      <div className="tx-detail-status">
        <div className={`tds-icon ${tx.cls || ''}`}>
          <TxIcon cls={tx.cls || 'out'} />
        </div>
        <div className={`tds-title ${tx.cls || ''}`}>
          {sign}{tx.amount.toLocaleString()} sats
        </div>
        <div className="tds-sub">
          {sign}{fiatNow}{' '}
          <span style={{ fontSize: 11, opacity: 0.55 }}>current value</span>
        </div>
        <div className={`tds-badge ${tx.settled ? 'confirmed' : 'pending'}`}>
          <div className="badge-dot" />
          {tx.statusLabel || (tx.settled ? 'Settled' : 'Preconfirmed')}
        </div>
      </div>

      {/* Details card */}
      <div className="tx-details-card">
        <div className="tdrow">
          <span className="tdlbl">Type</span>
          <span className="tdval">{tx.label}</span>
        </div>
        <div className="tdrow">
          <span className="tdlbl">Network</span>
          <span className="tdval">{tx.network}</span>
        </div>
        <div className="tdrow">
          <span className="tdlbl">Date</span>
          <span className="tdval">{dateStr}</span>
        </div>
        <div className="tdrow">
          <span className="tdlbl">Time</span>
          <span className="tdval">{timeStr}</span>
        </div>
        <div className="tdrow">
          <span className="tdlbl">Status</span>
          <span className={`tdval ${tx.settled ? 'green' : 'amber'}`}>
            {tx.statusLabel || (tx.settled ? 'Settled' : 'Preconfirmed')}
          </span>
        </div>
      </div>

      {/* Value card */}
      <div className="tx-details-card">
        <div className="tdrow">
          <span className="tdlbl">{tx.cls === 'in' ? 'You received' : 'You sent'}</span>
          <span className={`tdval ${tx.cls || ''}`}>
            {sign}{tx.amount.toLocaleString()} sats
          </span>
        </div>
        <div className="tdrow">
          <span className="tdlbl">Current value</span>
          <span className="tdval">{sign}{fiatNow}</span>
        </div>
      </div>

      {/* Transaction ID */}
      {(tx.txid || tx.id) && (
        <div className="tx-details-card">
          <div
            className="tdrow"
            style={{
              flexDirection: 'column',
              gap: 10,
              alignItems: 'stretch',
            }}
          >
            <span className="tdlbl">Transaction ID</span>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--bg3)',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: 'var(--t2)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                {tx.txid || tx.id}
              </span>
              <button
                onClick={handleCopyTxid}
                title="Copy"
                style={{
                  flexShrink: 0,
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'var(--accs)',
                  border: '1px solid var(--acc)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--acc2)',
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ width: 13, height: 13 }}
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </button>
            </div>
          </div>
          {explorerUrl && (
            <div style={{ padding: '0 16px 14px' }}>
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: 10,
                  background: 'var(--accs)',
                  border: '1px solid var(--acc)',
                  borderRadius: 'var(--r-md)',
                  color: 'var(--acc2)',
                  fontSize: 13,
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ width: 13, height: 13 }}
                >
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                View on Explorer
              </a>
            </div>
          )}
        </div>
      )}

      {/* Note */}
      <div className="tx-details-card" style={{ paddingBottom: 6 }}>
        <div
          className="tdrow"
          style={{
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 8,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span className="tdlbl">Note</span>
          </div>
          <textarea
            placeholder="Add a note for this transaction\u2026"
            value={noteVal}
            onChange={(e) => setNoteVal(e.target.value)}
            style={{
              width: '100%',
              minHeight: 64,
              background: 'var(--bg3)',
              border: '1.5px solid var(--bdr)',
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 13,
              color: 'var(--t1)',
              resize: 'none',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSaveNote}
            style={{
              height: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: 'var(--accs)',
              border: '1px solid var(--acc)',
              borderRadius: 10,
              color: 'var(--acc2)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ width: 13, height: 13 }}
            >
              <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save note
          </button>
        </div>
      </div>
    </SheetWrapper>
  )
}
