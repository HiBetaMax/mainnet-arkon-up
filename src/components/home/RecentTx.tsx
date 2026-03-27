import { useMemo, useCallback } from 'react'
import useStore from '../../store'

function formatTxAmount(sats: number, balDisplayMode: string, currency: string, livePrices: Record<string, number>, btcUsd: number): string {
  const absSats = Math.abs(sats)
  const price = livePrices[currency] || btcUsd || 0
  const fiatVal = price > 0 ? (absSats * price / 1e8) : 0
  const fiatStr = fiatVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const sym = currency === 'EUR' ? '€' : currency === 'CHF' ? 'CHF ' : '$'

  if (balDisplayMode === 'fiat') {
    return `${sym}${fiatStr}`
  }
  if (balDisplayMode === 'both') {
    return `${absSats.toLocaleString()} sats · ${sym}${fiatStr}`
  }
  return `${absSats.toLocaleString()} sats`
}

export default function RecentTx() {
  const txRegistry = useStore((s) => s.txRegistry)
  const setActivePage = useStore((s) => s.setActivePage)
  const balDisplayMode = useStore((s) => s.balDisplayMode)
  const currency = useStore((s) => s.currency)
  const livePrices = useStore((s) => s.livePrices)
  const btcUsd = useStore((s) => s.btcUsd)

  const recentTxs = useMemo(() => {
    return Object.values(txRegistry)
      .sort((a, b) => {
        const da = a.date ? a.date.getTime() : 0
        const db = b.date ? b.date.getTime() : 0
        return db - da
      })
      .slice(0, 5)
  }, [txRegistry])

  const handleSeeAll = () => {
    setActivePage('transactions')
  }

  return (
    <div className="section">
      <div className="sh">
        <span className="sh-t">Recent</span>
        <span className="sh-l" onClick={handleSeeAll}>
          See all
        </span>
      </div>
      <div className="txcard" id="home-tx-list">
        {recentTxs.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--t3)',
              fontSize: 13,
              padding: '18px 0',
            }}
          >
            No transactions yet
          </div>
        ) : (
          recentTxs.map((tx) => (
            <div
              key={tx.id}
              className={`tx-row ${tx.cls || ''}`}
              onClick={() => {
                useStore.getState().setSelectedTxId(tx.id)
                useStore.getState().openSheet('txdetail')
                if (typeof (window as any).openSheet === 'function') {
                  (window as any).openSheet('txdetail')
                }
              }}
            >
              <div className="tx-icon">
                {tx.cls === 'in' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                    <line x1="12" y1="19" x2="12" y2="5" />
                    <polyline points="5 12 12 5 19 12" />
                  </svg>
                )}
              </div>
              <div className="tx-info">
                <div className="tx-label">{tx.label}</div>
                <div className="tx-meta">
                  {tx.date
                    ? tx.date.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Pending'}
                  {' \u00b7 '}
                  {tx.network}
                </div>
              </div>
              <div className={`tx-amt ${tx.cls || ''}`}>
                {tx.cls === 'in' ? '+' : '-'}
                {formatTxAmount(tx.amount, balDisplayMode, currency, livePrices as unknown as Record<string, number>, btcUsd ?? 0)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
