import { useMemo } from 'react'
import useStore from '../../store'

function formatFiat(sats: number, currency: string, livePrices: Record<string, number>, btcUsd: number): string {
  const absSats = Math.abs(sats)
  const price = livePrices[currency] || btcUsd || 0
  const fiatVal = price > 0 ? (absSats * price / 1e8) : 0
  const fiatStr = fiatVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const sym = currency === 'EUR' ? '€' : currency === 'CHF' ? 'CHF ' : '$'
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

  return (
    <div className="section">
      <div className="sh">
        <span className="sh-t">Recent</span>
        <span className="sh-l" onClick={() => setActivePage('transactions')}>
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
              className="txr"
              data-type={tx.cls}
              onClick={() => {
                useStore.getState().setSelectedTxId(tx.id)
                useStore.getState().openSheet('txdetail')
                const el = document.getElementById('sheet-txdetail')
                if (el) el.classList.add('open')
              }}
              style={{ cursor: 'pointer' }}
            >
              <div className={`txico ${tx.cls || ''}`}>
                <TxIcon cls={tx.cls || 'out'} />
              </div>
              <div className="txinf">
                <div className="txnm">{tx.label}</div>
                <div className="txmt">
                  {tx.date
                    ? tx.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    : 'Pending'}
                  {tx.date
                    ? ` \u00B7 ${tx.date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                    : ''}
                  {' \u00B7 '}
                  {tx.network || 'Ark'}
                </div>
              </div>
              <div className="txamt">
                {balDisplayMode !== 'fiat' && (
                  <div className={`txb ${tx.cls || ''}`}>
                    {tx.cls === 'in' ? '+' : '\u2212'}
                    {Math.abs(tx.amount).toLocaleString()} sats
                  </div>
                )}
                {balDisplayMode === 'fiat' && (
                  <div className={`txb ${tx.cls || ''}`}>
                    {tx.cls === 'in' ? '+' : '\u2212'}
                    {formatFiat(tx.amount, currency, livePrices as unknown as Record<string, number>, btcUsd ?? 0)}
                  </div>
                )}
                {balDisplayMode === 'both' && (
                  <div className="txf">
                    {tx.cls === 'in' ? '+' : '\u2212'}
                    {formatFiat(tx.amount, currency, livePrices as unknown as Record<string, number>, btcUsd ?? 0)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
