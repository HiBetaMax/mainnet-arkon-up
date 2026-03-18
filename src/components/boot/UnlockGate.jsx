import { useState, useRef, useCallback } from 'react'

export default function UnlockGate() {
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const inputRef = useRef(null)
  const gateRef = useRef(null)

  const handleSubmit = useCallback(async () => {
    const password = inputRef.current?.value?.trim() || ''
    if (!password) {
      setError('Enter your wallet password')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      // main.js wires this up via submitUnlockGate()
      // But we also handle it here for React flow
      if (typeof window._unlockWallet === 'function') {
        await window._unlockWallet(password)
        gateRef.current?.classList.remove('open')
        inputRef.current.value = ''
      }
    } catch {
      setError('Incorrect password')
    } finally {
      setSubmitting(false)
    }
  }, [])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleSubmit()
  }, [handleSubmit])

  return (
    <div id="wallet-unlock-gate" className="wallet-unlock-gate" ref={gateRef} aria-hidden="true">
      <div className="wallet-unlock-card">
        <div className="wallet-unlock-brand">ArkON</div>
        <div className="wallet-unlock-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="4" y="11" width="16" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 1 1 8 0v3" />
          </svg>
        </div>
        <div className="wallet-unlock-title">Unlock your wallet</div>
        <div className="wallet-unlock-subtitle">This wallet is password protected. Enter your password to open your wallet and continue.</div>
        <input
          ref={inputRef}
          id="wallet-unlock-password"
          className="wallet-unlock-input"
          type="password"
          placeholder="Wallet password"
          autoComplete="current-password"
          onKeyDown={handleKeyDown}
        />
        <div id="wallet-unlock-error" className="wallet-unlock-error">{error}</div>
        <button
          id="wallet-unlock-submit"
          className="wallet-unlock-button"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Unlocking\u2026' : 'Unlock'}
        </button>
      </div>
    </div>
  )
}
