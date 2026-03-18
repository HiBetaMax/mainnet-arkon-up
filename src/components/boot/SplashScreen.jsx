import { useState, useCallback, useRef } from 'react'
import useStore from '../../store'

export default function SplashScreen() {
  const splashStep = useStore((s) => s.splashStep)
  const setSplashStep = useStore((s) => s.setSplashStep)
  const [hiding, setHiding] = useState(false)
  const [backupChecked, setBackupChecked] = useState(false)
  const [restoreError, setRestoreError] = useState('')
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const newKeyRef = useRef(null)
  const restoreInputRef = useRef(null)

  const generateKey = useCallback(() => {
    const bytes = new Uint8Array(32)
    crypto.getRandomValues(bytes)
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
    newKeyRef.current = hex
    return hex
  }, [])

  const advSplash = useCallback((step) => {
    if (step === 3) generateKey()
    setSplashStep(step)
  }, [setSplashStep, generateKey])

  const splashDone = useCallback(() => {
    setHiding(true)
    setTimeout(() => {
      useStore.getState().setBootState('booting')
      // Wait for _bootApp to be ready (main.js may still be loading)
      function tryBoot() {
        if (typeof window._bootApp === 'function') {
          window._bootApp()
        } else {
          setTimeout(tryBoot, 100)
        }
      }
      tryBoot()
    }, 500)
  }, [])

  const finishCreate = useCallback(async () => {
    if (!newKeyRef.current) { window.showToast('Key not generated yet'); return }
    setCreating(true)
    try {
      if (typeof window._restoreFromPrivKey !== 'function') throw new Error('Wallet not ready')
      const ok = await window._restoreFromPrivKey(newKeyRef.current)
      if (!ok) throw new Error('Key storage failed')
      newKeyRef.current = null
      splashDone()
    } catch (e) {
      console.error('[ArkON] Failed to save key:', e)
      window.showToast('Error saving wallet key')
      setCreating(false)
    }
  }, [splashDone])

  const doRestore = useCallback(async () => {
    const hex = restoreInputRef.current?.value?.trim() || ''
    if (hex.length !== 64 || !/^[0-9a-fA-F]+$/.test(hex)) {
      setRestoreError('Please enter a valid 64-character hex private key.')
      return
    }
    setRestoring(true)
    setRestoreError('')
    try {
      if (typeof window._restoreFromPrivKey !== 'function') throw new Error('Wallet not ready')
      const ok = await window._restoreFromPrivKey(hex)
      if (!ok) {
        setRestoreError('Invalid private key — check the value and try again.')
        setRestoring(false)
        return
      }
      splashDone()
    } catch (e) {
      setRestoreError('Restore failed: ' + (e.message || 'unknown error'))
      setRestoring(false)
    }
  }, [splashDone])

  const bootState = useStore((s) => s.bootState)
  if (bootState !== 'splash') return null

  return (
    <div id="splash" className={hiding ? 'hide' : ''}>
      <div className="splash-screens">
        {/* Screen 1 — Loading */}
        <div className={`sp-screen${splashStep === 1 ? ' active' : ''}`} id="sp1">
          <div style={{ animation: 'bob 4s ease-in-out infinite' }}>
            <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 88, height: 88 }}>
              <rect width="88" height="88" rx="24" fill="rgba(255,255,255,0.12)" />
              <rect x="16" y="28" width="56" height="34" rx="6" fill="white" fillOpacity="0.9" />
              <rect x="26" y="18" width="10" height="12" rx="3" fill="white" fillOpacity="0.65" />
              <rect x="52" y="18" width="10" height="12" rx="3" fill="white" fillOpacity="0.65" />
              <circle cx="33" cy="44" r="5" fill="#0e3a8a" />
              <circle cx="55" cy="44" r="5" fill="#0e3a8a" />
              <rect x="40" y="52" width="8" height="5" rx="2" fill="#0e3a8a" />
              <rect x="8" y="44" width="8" height="8" rx="2" fill="white" fillOpacity="0.5" />
              <rect x="72" y="44" width="8" height="8" rx="2" fill="white" fillOpacity="0.5" />
            </svg>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginTop: 18 }}>ArkON</div>
          <div className="sp-loader" style={{ marginTop: 28 }}>
            <div className="sp-loader-bar" id="loader-bar" />
          </div>
        </div>

        {/* Screen 2 — Onboarding Choice */}
        <div className={`sp-screen${splashStep === 2 ? ' active' : ''}`} id="sp2">
          <div style={{ animation: 'bob 4s ease-in-out infinite' }}>
            <svg viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 88, height: 88 }}>
              <rect width="88" height="88" rx="24" fill="rgba(255,255,255,0.12)" />
              <rect x="16" y="28" width="56" height="34" rx="6" fill="white" fillOpacity="0.9" />
              <rect x="26" y="18" width="10" height="12" rx="3" fill="white" fillOpacity="0.65" />
              <rect x="52" y="18" width="10" height="12" rx="3" fill="white" fillOpacity="0.65" />
              <circle cx="33" cy="44" r="5" fill="#0e3a8a" />
              <circle cx="55" cy="44" r="5" fill="#0e3a8a" />
              <rect x="40" y="52" width="8" height="5" rx="2" fill="#0e3a8a" />
              <rect x="8" y="44" width="8" height="8" rx="2" fill="white" fillOpacity="0.5" />
              <rect x="72" y="44" width="8" height="8" rx="2" fill="white" fillOpacity="0.5" />
            </svg>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginTop: 18 }}>ArkON</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            {['Instant payments', 'Non-custodial', 'Your keys'].map(t => (
              <span key={t} style={{ padding: '6px 14px', borderRadius: 50, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>{t}</span>
            ))}
          </div>
          <div style={{ width: '100%', maxWidth: 320, marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn-cta" onClick={() => advSplash(3)}>Create New Wallet</button>
            <button className="btn-ghost" onClick={() => advSplash(4)}>Restore Existing Wallet</button>
          </div>
        </div>

        {/* Screen 3 — Create Wallet Backup */}
        <div className={`sp-screen${splashStep === 3 ? ' active' : ''}`} id="sp3">
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Your Private Key</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 18, textAlign: 'center', maxWidth: 300 }}>
            This is the only way to access your wallet. Back it up securely.
          </div>
          <div id="sp-new-key-display" style={{ fontFamily: 'monospace', fontSize: 11, color: '#fff', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '14px 16px', wordBreak: 'break-all', userSelect: 'all', maxWidth: 320, textAlign: 'center', lineHeight: 1.6 }}>
            {newKeyRef.current || ''}
          </div>
          <div style={{ background: 'rgba(224,149,61,0.12)', border: '1px solid rgba(224,149,61,0.3)', borderRadius: 10, padding: '10px 14px', marginTop: 14, maxWidth: 320 }}>
            <div style={{ fontSize: 11, color: '#e0953d', fontWeight: 600 }}>Never share your private key with anyone.</div>
          </div>
          <label id="sp-backup-label" style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, cursor: 'pointer' }}>
            <input type="checkbox" id="sp-backup-check" checked={backupChecked} onChange={(e) => setBackupChecked(e.target.checked)} style={{ width: 18, height: 18, accentColor: '#3b82f6' }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>I have backed up my private key</span>
          </label>
          <button
            id="sp-create-continue"
            className="btn-cta"
            disabled={!backupChecked || creating}
            onClick={finishCreate}
            style={{ marginTop: 18, width: '100%', maxWidth: 320, opacity: backupChecked ? 1 : 0.3 }}
          >
            {creating ? 'Creating wallet\u2026' : 'Continue'}
          </button>
        </div>

        {/* Screen 4 — Restore Wallet */}
        <div className={`sp-screen${splashStep === 4 ? ' active' : ''}`} id="sp4">
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Restore Wallet</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 18, textAlign: 'center', maxWidth: 300 }}>
            Enter your 64-character hex private key to restore your wallet.
          </div>
          <input
            ref={restoreInputRef}
            className="sp-input"
            id="sp-restore-key"
            type="password"
            autoComplete="off"
            placeholder="Paste your 64-char hex private key\u2026"
            onInput={() => setRestoreError('')}
            style={{ width: '100%', maxWidth: 320 }}
          />
          <div id="sp-restore-err" style={{ color: '#ff6b6b', fontSize: 12, marginTop: 8, minHeight: 18, textAlign: 'center' }}>
            {restoreError}
          </div>
          <button
            id="sp-restore-btn"
            className="btn-cta"
            onClick={doRestore}
            disabled={restoring}
            style={{ marginTop: 12, width: '100%', maxWidth: 320 }}
          >
            {restoring ? 'Restoring\u2026' : 'Restore Wallet'}
          </button>
        </div>
      </div>

      {/* Footer dots */}
      <div id="sp-footer" style={{ visibility: splashStep >= 2 ? 'visible' : 'hidden' }}>
        <div id="sp-dots" style={{ display: 'flex', gap: 6, justifyContent: 'center', paddingBottom: 32 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="sp-dot" style={{
              width: splashStep === i ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: splashStep === i ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.25)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>
      </div>
    </div>
  )
}
