/**
 * QRPage — purely structural.
 * ui.js setAddrType() controls panel visibility and tab active state via DOM.
 * React does NOT control panel visibility.
 */
export default function QRPage() {
  return (
    <div style={{ padding: '0 20px 28px' }}>
      <div className="pg-head"><div className="pg-title">QR Code</div><div className="pg-sub">Scan or share your address</div></div>

      {/* My QR / Scan QR tabs */}
      <div className="toggle-tabs" style={{ marginBottom: 14 }}>
        <div className="ttab active" id="ttab-mine" onClick={() => typeof setQRTab === 'function' && setQRTab('mine')}>My QR Code</div>
        <div className="ttab" id="ttab-scan" onClick={() => typeof setQRTab === 'function' && setQRTab('scan')}>Scan QR</div>
      </div>

      {/* ── My QR Panel ── */}
      <div id="qr-mine-panel">
      <div className="qr-type-row" style={{ marginBottom: 16 }}>
        {['ark', 'lightning', 'onchain'].map((t, i) => (
          <div key={t} className={`qtt${i === 0 ? ' active' : ''}`} onClick={(e) => typeof setAddrType === 'function' && setAddrType(e.currentTarget, t)}>{t === 'onchain' ? 'On-chain' : t.charAt(0).toUpperCase() + t.slice(1)}</div>
        ))}
      </div>

      {/* Static panel: Ark / On-chain */}
      <div id="qr-static-panel">
        <div className="qr-ring"><div className="qr-ring-inner"><div className="qr-canvas-wrap" id="qr-main-canvas" /></div></div>
        <div className="addr-blk">
          <div className="addr-lbl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Your address
            <button className="addr-reveal-btn" onClick={(e) => typeof toggleAddrBlur === 'function' && toggleAddrBlur('qr-addr-val', e.currentTarget)} title="Show/hide address">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
            </button>
          </div>
          <div className="addr-val addr-masked" id="qr-addr-val">Loading address&hellip;</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button className="btnp" onClick={() => typeof cpAddr === 'function' && cpAddr()}>Copy</button>
          <button className="btns" style={{ margin: 0, background: 'var(--bg3)', border: 'none' }} onClick={() => typeof shareContent === 'function' && shareContent('Share Address', document.getElementById('qr-addr-val')?.textContent?.trim(), 'ark')}>Share</button>
        </div>
      </div>

      {/* Lightning panel */}
      <div id="qr-lightning-panel" style={{ display: 'none' }}>
        <div id="qr-ln-form-wrap">
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr2)', borderRadius: 'var(--r-md)', padding: 16, marginBottom: 14 }}>
            <div style={{ padding: '4px 0 10px', color: 'var(--t3)', fontSize: 12, lineHeight: 1.5 }}>Create a Lightning invoice that settles into your Ark wallet.</div>
            <div className="fld">
              <label className="flbl">Amount (SATS) <span style={{ color: 'var(--red)' }}>*</span></label>
              <div className="fwrap"><input className="finp" id="qr-ln-amt" placeholder="e.g. 21,000" type="number" onInput={() => typeof updateQrLnPreview === 'function' && updateQrLnPreview()} style={{ paddingRight: 20 }} /></div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 5 }} id="qr-ln-fiat">Enter amount to see fiat equivalent</div>
            </div>
            <div className="fld">
              <label className="flbl">Or enter in <span id="qr-ln-fiat-cur">USD</span></label>
              <input className="finp" id="qr-ln-fiat-input" placeholder="0.00" type="number" step="0.01" onInput={() => typeof qrLnFiatToSats === 'function' && qrLnFiatToSats()} />
            </div>
            <div className="fld">
              <label className="flbl">Description (optional)</label>
              <input className="finp" id="qr-ln-memo" maxLength={120} placeholder="e.g. Coffee payment" />
            </div>
            <div id="qr-ln-gen-wrap">
              <button className="btnp" id="qr-ln-gen-btn" onClick={() => typeof genQrLnInvoice === 'function' && genQrLnInvoice()} disabled style={{ opacity: 0.5 }}>Generate Lightning Invoice</button>
            </div>
          </div>
        </div>
        <div id="qr-ln-result" style={{ display: 'none' }}>
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr2)', borderRadius: 'var(--r-md)', padding: 16, marginBottom: 14 }}>
            <div className="qr-ring" style={{ marginBottom: 10 }}><div className="qr-ring-inner"><div className="qr-canvas-wrap"><div id="qr-ln-canvas" /></div></div></div>
            <div style={{ textAlign: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--t1)' }} id="qr-ln-amt-display">&mdash;</span>
              <span style={{ fontSize: 12, color: 'var(--t3)', marginLeft: 4 }}>SATS</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginBottom: 10 }} id="qr-ln-fiat-display" />
            <div id="qr-ln-status" style={{ fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 10 }}>Invoice ready &mdash; auto-claims into your Ark wallet after payment.</div>
            <div className="addr-row" style={{ marginBottom: 0 }}>
              <span className="addr-txt" id="qr-ln-invoice" style={{ wordBreak: 'break-all', fontSize: 11 }} />
              <div className="cpb" onClick={() => typeof cpQrLnInvoice === 'function' && cpQrLnInvoice()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <button className="btnp" onClick={() => typeof cpQrLnInvoice === 'function' && cpQrLnInvoice()}>Copy</button>
            <button className="btns" style={{ margin: 0, background: 'var(--bg3)', border: 'none' }} onClick={() => typeof shareQrLnInvoice === 'function' && shareQrLnInvoice()}>Share</button>
          </div>
          <button className="btns" style={{ margin: 0 }} onClick={() => typeof resetQrLnForm === 'function' && resetQrLnForm()}>New Invoice</button>
        </div>
      </div>

      </div>{/* end qr-mine-panel */}

      {/* Scan Panel */}
      <div id="qr-scan-panel" style={{ display: 'none' }}>
        <div className="qr-ring"><div className="qr-ring-inner"><div className="qr-scan-box"><div className="scan-line" /><div className="sc-corners"><span /><span /><span /><span /></div><div className="sc-hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 7V2h-5M1 7V2h5M23 17v5h-5M1 17v5h5" /></svg><p>Camera access needed<br />to scan QR codes</p></div></div></div></div>
        <button className="btnp" onClick={() => typeof openQRScan === 'function' && openQRScan('qr-page-result')}>Open Camera</button>
        <div id="qr-page-result" style={{ display: 'none', marginTop: 12 }}>
          <div style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 'var(--r-md)', padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', marginBottom: 6 }}>Scanned Address</div>
            <div id="qr-page-result-val" style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--t1)', wordBreak: 'break-all' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
