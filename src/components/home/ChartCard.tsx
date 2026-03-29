/**
 * ChartCard — chart display with range selector.
 * The canvas rendering is still handled by ui.js drawChart / chart logic.
 * React controls the range buttons and header display.
 */
import useStore from '../../store'

const RANGES = ['24H', '7D', '1M', '1Y'] as const

export default function ChartCard() {
  const btcUsd = useStore((s) => s.btcUsd)
  const currency = useStore((s) => s.currency)
  const livePrices = useStore((s) => s.livePrices)
  const chartRange = useStore((s) => s.chartRange)

  const price = livePrices[currency as keyof typeof livePrices] || btcUsd || 0
  const sym = currency === 'EUR' ? '\u20AC' : currency === 'CHF' ? 'CHF ' : '$'
  const priceStr = price > 0 ? `${sym}${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : `${sym}0`

  const handleRange = (r: string) => {
    // Legacy compat: call ui.js chart range setter via DOM click
    const el = document.querySelector(`[data-range="${r}"]`) as HTMLElement | null
    if (el && typeof (window as any).setChartRange === 'function') {
      ;(window as any).setChartRange(el)
    }
  }

  return (
    <div className="chart-card" id="chart-card">
      <div className="chart-meta">
        <div>
          <div
            id="tick-label"
            style={{
              fontSize: 10,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '.07em',
              color: 'var(--t3)',
              marginBottom: 3,
            }}
          >
            BTC / {currency}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: 'var(--t1)',
              letterSpacing: '-.02em',
              lineHeight: 1,
            }}
            id="tick-price"
          >
            {priceStr}
          </div>
          <div className="tc up" id="tick-change" style={{ fontSize: 11, fontWeight: 600, marginTop: 3 }}>
            +0% today
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="chart-val"
            id="chart-pct"
            style={{
              fontSize: 12,
              padding: '4px 9px',
              borderRadius: 'var(--r-pill)',
              background: 'var(--grns)',
            }}
          >
            +0%
          </span>
          <button
            onClick={() => {
              if (typeof (window as any).openChartExpand === 'function') {
                ;(window as any).openChartExpand()
              }
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: 'var(--bg3)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--t3)',
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}>
              <polyline points="15 3 21 3 21 9" />
              <polyline points="9 21 3 21 3 15" />
              <line x1="21" y1="3" x2="14" y2="10" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
          </button>
        </div>
      </div>
      <div className="chart-area" id="chart-svg-wrap" style={{ position: 'relative', height: 80 }}>
        <canvas
          id="chart-canvas"
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair', touchAction: 'none' }}
        />
        <div
          id="chart-tooltip"
          style={{
            display: 'none',
            position: 'absolute',
            top: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10,8,30,0.92)',
            border: '1px solid rgba(107,82,245,0.4)',
            borderRadius: 8,
            padding: '5px 10px',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            zIndex: 10,
          }}
        >
          <div id="chart-tt-price" style={{ fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'center' }} />
          <div id="chart-tt-date" style={{ fontSize: 10, color: '#888', textAlign: 'center', marginTop: 1 }} />
        </div>
        <div
          id="chart-cursor"
          style={{
            display: 'none',
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(107,82,245,0.6)',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 2, marginTop: 10 }}>
        {RANGES.map((r) => (
          <div
            key={r}
            className={`crt${r === '24H' ? ' active' : ''}`}
            data-range={r}
            onClick={() => handleRange(r)}
          >
            {r}
          </div>
        ))}
      </div>
    </div>
  )
}
