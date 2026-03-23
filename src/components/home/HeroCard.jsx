/**
 * HeroCard — balance display with React-controlled eye toggle.
 * ui.js toggleBalance() still handles the blurred class on bal-main/bal-sub,
 * but the eye icon swap is now React state so re-renders don't reset it.
 */
import { useState, useCallback } from 'react'

export default function HeroCard() {
  const [hidden, setHidden] = useState(false)

  const handleToggle = useCallback(() => {
    setHidden(prev => !prev)
    // Still call ui.js toggleBalance for the blur class on bal-main/bal-sub
    if (typeof toggleBalance === 'function') toggleBalance()
  }, [])

  return (
    <div style={{ padding: '8px 0 0' }}>
      <div className="hero">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div className="hero-bal-lbl" style={{ marginBottom: 0 }}>Total Balance</div>
          <button className={`hero-eye${hidden ? ' hidden' : ''}`} id="eye-btn" onClick={handleToggle} aria-label="Toggle balance visibility">
            <svg id="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: hidden ? 'none' : 'block' }}>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <svg id="eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ display: hidden ? 'block' : 'none' }}>
              <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          </button>
        </div>
        <div className={`hero-amount${hidden ? ' blurred' : ''}`} id="bal-main">0</div>
        <div className={`hero-sub${hidden ? ' blurred' : ''}`} id="bal-sub" style={{ fontSize: 11, letterSpacing: '.04em', textTransform: 'uppercase', fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>SATS</div>
      </div>
    </div>
  )
}
