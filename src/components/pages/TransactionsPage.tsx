import { useState, useMemo, useCallback } from 'react'
import useStore from '../../store'
import type { TxFilter, TxDetail } from '../../store'
import { refreshTransactions } from '../../services/wallet'

const FILTERS: { id: TxFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'in', label: 'Received' },
  { id: 'out', label: 'Sent' },
  { id: 'ln', label: 'Lightning' },
  { id: 'pnd', label: 'Pending' },
]

const PAGE_SIZE = 20

function formatSats(sats: number): string {
  return Math.abs(sats).toLocaleString() + ' sats'
}

function formatFiat(
  sats: number,
  currency: string,
  livePrices: Record<string, number>,
  btcUsd: number
): string {
  const absSats = Math.abs(sats)
  const price = livePrices[currency] || btcUsd || 0
  const fiatVal = price > 0 ? (absSats * price) / 1e8 : 0
  const fiatStr = fiatVal.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const sym = currency === 'EUR' ? '\u20AC' : currency === 'CHF' ? 'CHF ' : '$'
  return `${sym}${fiatStr}`
}

function TxIcon({ cls }: { cls: string }) {
  if (cls === 'in') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="19 12 12 19 5 12" />
      </svg>
    )
  }
  if (cls === 'pnd') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  )
}

export default function TransactionsPage() {
  const txRegistry = useStore((s) => s.txRegistry)
  const txFilter = useStore((s) => s.txFilter)
  const setTxFilter = useStore((s) => s.setTxFilter)
  const setSelectedTxId = useStore((s) => s.setSelectedTxId)
  const openSheet = useStore((s) => s.openSheet)
  const currency = useStore((s) => s.currency)
  const livePrices = useStore((s) => s.livePrices)
  const btcUsd = useStore((s) => s.btcUsd)

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [refreshing, setRefreshing] = useState(false)

  // Sort and filter transactions
  const allTxs = useMemo(() => {
    return Object.values(txRegistry).sort((a, b) => {
      const da = a.date ? a.date.getTime() : 0
      const db = b.date ? b.date.getTime() : 0
      return db - da
    })
  }, [txRegistry])

  const filteredTxs = useMemo(() => {
    if (txFilter === 'all') return allTxs
    return allTxs.filter((tx) => {
      if (txFilter === 'pnd') return !tx.settled
      if (txFilter === 'ln') return tx.network?.toLowerCase().includes('lightning')
      return tx.cls === txFilter
    })
  }, [allTxs, txFilter])

  const visibleTxs = useMemo(
    () => filteredTxs.slice(0, visibleCount),
    [filteredTxs, visibleCount]
  )

  const hasMore = visibleCount < filteredTxs.length

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await refreshTransactions()
    } finally {
      setRefreshing(false)
    }
  }, [])

  const handleTxClick = useCallback(
    (tx: TxDetail) => {
      setSelectedTxId(tx.id)
      openSheet('txdetail')
      // Also add CSS class since SheetWrapper uses class-based visibility
      const el = document.getElementById('sheet-txdetail')
      if (el) el.classList.add('open')
    },
    [setSelectedTxId, openSheet]
  )

  return (
    <div style={{ padding: '0 20px 28px' }}>
      {/* Header */}
      <div
        className="pg-head"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div className="pg-title">Transactions</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() =>
              typeof (window as any).openExportSheet === 'function' &&
              (window as any).openExportSheet()
            }
            style={{
              background: 'var(--accs)',
              border: '1px solid var(--acc)',
              borderRadius: 10,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--acc2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{ width: 13, height: 13 }}
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            id="tx-refresh-btn"
            style={{
              background: 'var(--bg3)',
              border: '1px solid var(--bdr2)',
              borderRadius: 10,
              padding: '7px 14px',
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--t2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <svg
              id="tx-refresh-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              style={{
                width: 13,
                height: 13,
                animation: refreshing ? 'spin 1s linear infinite' : undefined,
              }}
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="fscroll">
        {FILTERS.map((f) => (
          <div
            key={f.id}
            className={`ftg${txFilter === f.id ? ' active' : ''}`}
            onClick={() => {
              setTxFilter(f.id)
              setVisibleCount(PAGE_SIZE)
            }}
          >
            {f.label}
          </div>
        ))}
      </div>

      {/* Transaction list */}
      <div className="txcard" id="tx-list">
        {visibleTxs.length === 0 ? (
          <div
            style={{
              padding: '28px 16px',
              textAlign: 'center',
              color: 'var(--t3)',
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{
                width: 32,
                height: 32,
                margin: '0 auto 10px',
                display: 'block',
                opacity: 0.4,
              }}
            >
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <div style={{ fontSize: 13 }}>
              {txFilter === 'all'
                ? 'No transactions yet'
                : `No ${FILTERS.find((f) => f.id === txFilter)?.label.toLowerCase()} transactions`}
            </div>
          </div>
        ) : (
          visibleTxs.map((tx) => (
            <div
              key={tx.id}
              className="txr"
              data-type={tx.cls}
              onClick={() => handleTxClick(tx)}
              style={{ cursor: 'pointer' }}
            >
              <div className={`txico ${tx.cls || ''}`}>
                <TxIcon cls={tx.cls || 'out'} />
              </div>
              <div className="txinf">
                <div className="txnm">{tx.label}</div>
                <div className="txmt">
                  {tx.date
                    ? tx.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Pending'}
                  {tx.date
                    ? ` \u00B7 ${tx.date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : ''}
                  {!tx.settled ? ' \u00B7 Pending' : ''}
                </div>
              </div>
              <div className="txamt">
                <div className={`txb ${tx.cls || ''}`}>
                  {tx.cls === 'in' ? '+' : '\u2212'}
                  {formatSats(tx.amount)}
                </div>
                <div className="txf">
                  {tx.cls === 'in' ? '+' : '\u2212'}
                  {formatFiat(
                    tx.amount,
                    currency,
                    livePrices as unknown as Record<string, number>,
                    btcUsd ?? 0
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div style={{ marginTop: 14 }}>
          <button
            className="btns"
            style={{
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ width: 15, height: 15 }}
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
            Load More ({filteredTxs.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {!hasMore && filteredTxs.length > PAGE_SIZE && (
        <div
          style={{
            textAlign: 'center',
            padding: '16px 0',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>
            You've reached the beginning
          </span>
        </div>
      )}
    </div>
  )
}
