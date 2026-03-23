import { useState, useCallback, useRef } from 'react'
import useStore from '../../store/index.ts'

export default function SplashScreen() {
  const splashStep = useStore((s) => s.splashStep)
  const setSplashStep = useStore((s) => s.setSplashStep)
  const [hiding, setHiding] = useState(false)
  const [restoreError, setRestoreError] = useState('')
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [backupChecked, setBackupChecked] = useState(false)
  const restoreInputRef = useRef<HTMLInputElement>(null)

  const splashDone = useCallback(() => {
    setHiding(true)
    setTimeout(() => {
      useStore.getState().setBootState('booting')
      let retries = 0
      function tryBoot() {
        if (typeof (window as any)._bootApp === 'function') {
          ;(window as any)._bootApp()
        } else if (retries < 100) {
          retries++
          setTimeout(tryBoot, 100)
        } else {
          console.error('[ArkON] _bootApp not available after 10s')
        }
      }
      tryBoot()
    }, 500)
  }, [])

  const handleCreate = useCallback(async () => {
    setCreating(true)
    try {
      const bytes = new Uint8Array(32)
      crypto.getRandomValues(bytes)
      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      if (typeof (window as any)._restoreFromPrivKey !== 'function') throw new Error('Wallet not ready')
      const ok = await (window as any)._restoreFromPrivKey(hex)
      if (!ok) throw new Error('Key storage failed')

      // Show backup agreement step
      setSplashStep(3)
      setCreating(false)
    } catch (e: any) {
      console.error('[ArkON] Failed to create wallet:', e)
      useStore.getState().showToast('Error creating wallet')
      setCreating(false)
    }
  }, [setSplashStep])

  const handleBackupContinue = useCallback(() => {
    splashDone()
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
      if (typeof (window as any)._restoreFromPrivKey !== 'function') throw new Error('Wallet not ready')
      const ok = await (window as any)._restoreFromPrivKey(hex)
      if (!ok) {
        setRestoreError('Invalid private key — check the value and try again.')
        setRestoring(false)
        return
      }
      splashDone()
    } catch (e: any) {
      setRestoreError('Restore failed: ' + (e?.message || 'unknown error'))
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
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginTop: 18 }}>
            ArkON
          </div>
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
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginTop: 18 }}>
            ArkON
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
            {['Instant payments', 'Non-custodial', 'Your keys'].map((t) => (
              <span key={t} style={{ padding: '6px 14px', borderRadius: 50, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 600 }}>
                {t}
              </span>
            ))}
          </div>
          <div style={{ width: '100%', maxWidth: 320, marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn-cta" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating wallet\u2026' : 'Create New Wallet'}
            </button>
            <button className="btn-ghost" onClick={() => setSplashStep(4)} disabled={creating}>
              Restore Existing Wallet
            </button>
          </div>
        </div>

        {/* Screen 3 — Backup Agreement */}
        <div className={`sp-screen${splashStep === 3 ? ' active' : ''}`} id="sp3" style={{ justifyContent: 'center', gap: 0, padding: '0 8px', width: '100%' }}>
          <div style={{ width: 52, height: 52, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: 16 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" style={{ width: 24, height: 24 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-.01em', marginBottom: 6, textAlign: 'center' }}>
            Back up your wallet
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, textAlign: 'center', maxWidth: 290, marginBottom: 20 }}>
            Your private key is stored securely on this device. You can view it any time from Settings → Backup.
          </div>

          <div className="sp-scroll" style={{ maxWidth: 340, width: '100%' }}>
            {/* Warning banner */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'rgba(245,166,35,0.12)', border: '1px solid rgba(245,166,35,0.35)', borderRadius: 13, padding: '12px 14px', marginBottom: 16 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2" style={{ width: 18, height: 18, flexShrink: 0, marginTop: 1 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div style={{ fontSize: 12, color: '#f5a623', lineHeight: 1.5 }}>
                Never share this key. Anyone with it has full access to your funds.
              </div>
            </div>

            <div style={{ background: 'rgba(59,130,246,0.10)', border: '1px solid rgba(59,130,246,0.30)', borderRadius: 13, padding: '12px 14px', marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', lineHeight: 1.6 }}>
                After setup, go to <strong>Settings → Backup</strong> to reveal and write down your 64-character hex private key. Store it somewhere safe and offline.
              </div>
            </div>

            {/* Backup confirmation checkbox */}
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                cursor: 'pointer',
                padding: '13px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: `1.5px solid ${backupChecked ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 13,
                marginBottom: 16,
                transition: 'border-color .2s',
              }}
            >
              <input
                type="checkbox"
                checked={backupChecked}
                onChange={(e) => setBackupChecked(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 1, flexShrink: 0, accentColor: '#3b82f6', cursor: 'pointer' }}
              />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>
                I understand I need to write down my private key from Settings → Backup
              </span>
            </label>

            <button
              onClick={handleBackupContinue}
              disabled={!backupChecked}
              style={{
                width: '100%',
                minHeight: 52,
                borderRadius: 14,
                background: backupChecked ? 'linear-gradient(135deg,#2563eb,#0e3a8a)' : 'rgba(59,130,246,0.3)',
                border: `1.5px solid ${backupChecked ? '#2563eb' : 'rgba(59,130,246,0.4)'}`,
                color: backupChecked ? '#fff' : 'rgba(255,255,255,0.4)',
                fontSize: 14,
                fontWeight: 700,
                cursor: backupChecked ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all .2s',
                boxShadow: backupChecked ? '0 6px 24px rgba(37,99,235,0.35)' : 'none',
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 15, height: 15 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Continue to Wallet
            </button>
            <button
              onClick={() => setSplashStep(2)}
              style={{ width: '100%', minHeight: 44, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', marginTop: 6, padding: 10 }}
            >
              ← Back
            </button>
          </div>
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
          <button
            onClick={() => setSplashStep(2)}
            style={{ width: '100%', maxWidth: 320, minHeight: 44, background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', marginTop: 6, padding: 10 }}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Footer dots */}
      <div id="sp-footer" style={{ visibility: splashStep >= 2 ? 'visible' : 'hidden' }}>
        <div id="sp-dots" style={{ display: 'flex', gap: 6, justifyContent: 'center', paddingBottom: 32 }}>
          {[2, 3, 4].map((i) => (
            <div
              key={i}
              className="sp-dot"
              style={{
                width: splashStep === i ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: splashStep === i ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.25)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
