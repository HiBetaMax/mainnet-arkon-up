import { useMemo } from 'react'
import useStore from '../../store'

export default function HeroCard() {
  const wallet = useStore((s) => s.wallet)
  const balanceHidden = useStore((s) => s.balanceHidden)
  const toggleBalanceHidden = useStore((s) => s.toggleBalanceHidden)
  const balDisplayMode = useStore((s) => s.balDisplayMode)
  const currency = useStore((s) => s.currency)
  const livePrices = useStore((s) => s.livePrices)
  const btcUsd = useStore((s) => s.btcUsd)

  const { mainDisplay, subDisplay } = useMemo(() => {
    const sats = wallet.sats
    const price = livePrices[currency as keyof typeof livePrices] || btcUsd || 0
    const fiatVal = price > 0 ? (sats * price) / 1e8 : 0
    const fiatStr = fiatVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const satsStr = sats.toLocaleString()

    if (balDisplayMode === 'sats') {
      return { mainDisplay: satsStr, subDisplay: 'SATS' }
    }
    if (balDisplayMode === 'fiat') {
      return { mainDisplay: `$${fiatStr}`, subDisplay: currency }
    }
    // both
    return { mainDisplay: satsStr, subDisplay: `$${fiatStr} ${currency}` }
  }, [wallet.sats, balDisplayMode, currency, livePrices, btcUsd])

  return (
    <div style={{ padding: '8px 0 0' }}>
      <div className="hero">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <div className="hero-bal-lbl" style={{ marginBottom: 0 }}>
            Total Balance
          </div>
          <button
            className={`hero-eye${balanceHidden ? ' hidden' : ''}`}
            id="eye-btn"
            onClick={toggleBalanceHidden}
            aria-label="Toggle balance visibility"
          >
            <svg
              id="eye-open"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ display: balanceHidden ? 'none' : 'block' }}
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg
              id="eye-closed"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ display: balanceHidden ? 'block' : 'none' }}
            >
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </button>
        </div>
        <div
          className={`hero-amount${balanceHidden ? ' blurred' : ''}`}
          id="bal-main"
        >
          {mainDisplay}
        </div>
        <div
          className={`hero-sub${balanceHidden ? ' blurred' : ''}`}
          id="bal-sub"
          style={{
            fontSize: 11,
            letterSpacing: '.04em',
            textTransform: 'uppercase',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          {subDisplay}
        </div>
      </div>
    </div>
  )
}
