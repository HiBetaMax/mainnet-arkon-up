import useStore from '../../store'

export default function QRPage() {
  const qrTab = useStore((s) => s.qrTab)
  const setQrTab = useStore((s) => s.setQrTab)

  const handleTabChange = (tab: 'mine' | 'scan') => {
    setQrTab(tab)
    // Legacy compat: also call ui.js setQRTab
    if (typeof (window as any).setQRTab === 'function') {
      ;(window as any).setQRTab(tab)
    }
  }

  return (
    <div style={{ padding: '0 20px 28px' }}>
      <div className="pg-head">
        <div className="pg-title">QR Code</div>
        <div className="pg-sub">Scan or share your address</div>
      </div>

      {/* My QR / Scan QR tabs */}
      <div className="tab-toggle" style={{ marginBottom: 14 }}>
        <div
          className={`ttab${qrTab === 'mine' ? ' active' : ''}`}
          id="ttab-mine"
          onClick={() => handleTabChange('mine')}
        >
          My QR Code
        </div>
        <div
          className={`ttab${qrTab === 'scan' ? ' active' : ''}`}
          id="ttab-scan"
          onClick={() => handleTabChange('scan')}
        >
          Scan QR
        </div>
      </div>

      {/* My QR Panel */}
      <div id="qr-mine-panel" style={{ display: qrTab === 'mine' ? 'block' : 'none' }}>
        <div className="qr-type-row" style={{ marginBottom: 16 }}>
          {['ark', 'lightning', 'onchain'].map((t, i) => (
            <div
              key={t}
              className={`qtt${i === 0 ? ' active' : ''}`}
              onClick={(e) =>
                typeof (window as any).setAddrType === 'function' &&
                (window as any).setAddrType(e.currentTarget, t)
              }
            >
              {t === 'onchain' ? 'On-chain' : t.charAt(0).toUpperCase() + t.slice(1)}
            </div>
          ))}
        </div>

        {/* Static panel: Ark / On-chain */}
        <div id="qr-static-panel">
          <div className="sht-qr">
            <div className="sht-qr-inner">
              <div id="qr-main-canvas" />
            </div>
          </div>
          <div className="addr-blk">
            <div
              className="addr-lbl"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              Your address
              <button
                className="addr-reveal-btn"
                onClick={(e) =>
                  typeof (window as any).toggleAddrBlur === 'function' &&
                  (window as any).toggleAddrBlur('qr-addr-val', e.currentTarget)
                }
                title="Show/hide address"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            <div className="addr-val addr-masked" id="qr-addr-val">
              Loading address&hellip;
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button className="btnp" onClick={() => typeof (window as any).cpAddr === 'function' && (window as any).cpAddr()}>
              Copy
            </button>
            <button
              className="btns"
              style={{ margin: 0, background: 'var(--bg3)', border: 'none' }}
              onClick={() =>
                typeof (window as any).shareContent === 'function' &&
                (window as any).shareContent(
                  'Share Address',
                  document.getElementById('qr-addr-val')?.textContent?.trim(),
                  'ark'
                )
              }
            >
              Share
            </button>
          </div>
        </div>

        {/* Lightning panel */}
        <div id="qr-lightning-panel" style={{ display: 'none' }}>
          <div id="qr-ln-form-wrap">
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr2)', borderRadius: 'var(--r-md)', padding: 16, marginBottom: 14 }}>
              <div style={{ padding: '4px 0 10px', color: 'var(--t3)', fontSize: 12, lineHeight: 1.5 }}>
                Create a Lightning invoice that settles into your Ark wallet.
              </div>
              <div className="fld">
                <label className="flbl">
                  Amount (SATS) <span style={{ color: 'var(--red)' }}>*</span>
                </label>
                <div className="fwrap">
                  <input
                    className="finp"
                    id="qr-ln-amt"
                    placeholder="e.g. 21,000"
                    type="number"
                    onInput={() =>
                      typeof (window as any).updateQrLnPreview === 'function' && (window as any).updateQrLnPreview()
                    }
                    style={{ paddingRight: 20 }}
                  />
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 5 }} id="qr-ln-fiat">
                  Enter amount to see fiat equivalent
                </div>
              </div>
              <div className="fld">
                <label className="flbl">
                  Or enter in <span id="qr-ln-fiat-cur">USD</span>
                </label>
                <input
                  className="finp"
                  id="qr-ln-fiat-input"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  onInput={() =>
                    typeof (window as any).qrLnFiatToSats === 'function' && (window as any).qrLnFiatToSats()
                  }
                />
              </div>
              <div className="fld">
                <label className="flbl">Description (optional)</label>
                <input className="finp" id="qr-ln-memo" maxLength={120} placeholder="e.g. Coffee payment" />
              </div>
              <div id="qr-ln-gen-wrap">
                <button
                  className="btnp"
                  id="qr-ln-gen-btn"
                  onClick={() =>
                    typeof (window as any).genQrLnInvoice === 'function' && (window as any).genQrLnInvoice()
                  }
                  style={{ opacity: 0.5 }}
                >
                  Generate Lightning Invoice
                </button>
              </div>
            </div>
          </div>
          <div id="qr-ln-result" style={{ display: 'none' }}>
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr2)', borderRadius: 'var(--r-md)', padding: 16, marginBottom: 14 }}>
              <div className="sht-qr" style={{ marginBottom: 10 }}>
                <div className="sht-qr-inner">
                  <div id="qr-ln-canvas" />
                </div>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)' }} id="qr-ln-amt-display">
                  &mdash;
                </span>
                <span style={{ fontSize: 12, color: 'var(--t3)', marginLeft: 4 }}>SATS</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginBottom: 10 }} id="qr-ln-fiat-display" />
              <div id="qr-ln-status" style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 10 }}>
                Invoice ready &mdash; auto-claims into your Ark wallet after payment.
              </div>
              <div className="addr-row" style={{ marginBottom: 0 }}>
                <span className="addr-txt" id="qr-ln-invoice" style={{ wordBreak: 'break-all', fontSize: 11 }} />
                <div className="cpb" onClick={() => typeof (window as any).cpQrLnInvoice === 'function' && (window as any).cpQrLnInvoice()}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <button className="btnp" onClick={() => typeof (window as any).cpQrLnInvoice === 'function' && (window as any).cpQrLnInvoice()}>
                Copy
              </button>
              <button
                className="btns"
                style={{ margin: 0, background: 'var(--bg3)', border: 'none' }}
                onClick={() => typeof (window as any).shareQrLnInvoice === 'function' && (window as any).shareQrLnInvoice()}
              >
                Share
              </button>
            </div>
            <button
              className="btns"
              style={{ margin: 0 }}
              onClick={() => typeof (window as any).resetQrLnForm === 'function' && (window as any).resetQrLnForm()}
            >
              New Invoice
            </button>
          </div>
        </div>
      </div>

      {/* Scan Panel */}
      <div id="qr-scan-panel" style={{ display: qrTab === 'scan' ? 'block' : 'none' }}>
        <div className="sht-qr">
          <div className="sht-qr-inner">
            <div className="qr-scan-box">
              <div className="scan-line" />
              <div className="sc-corners">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="sc-hint">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M23 7V2h-5M1 7V2h5M23 17v5h-5M1 17v5h5" />
                </svg>
                <p>
                  Camera access needed
                  <br />
                  to scan QR codes
                </p>
              </div>
            </div>
          </div>
        </div>
        <button className="btnp" onClick={() => typeof (window as any).openQRScan === 'function' && (window as any).openQRScan('qr-page-result')}>
          Open Camera
        </button>
        <div id="qr-page-result" style={{ display: 'none', marginTop: 12 }}>
          <div style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 'var(--r-md)', padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', marginBottom: 6 }}>
              Scanned Address
            </div>
            <div id="qr-page-result-val" style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--t1)', wordBreak: 'break-all' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
