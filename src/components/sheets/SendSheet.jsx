import SheetWrapper from './SheetWrapper'

export default function SendSheet() {
  return (
    <SheetWrapper id="send" title="Send Bitcoin">
      <div className="qr-type-row" style={{ marginBottom: 14 }} id="snd-net-row">
        <div className="qtt active" id="snd-net-btn-ark" onClick={() => typeof selectSendNet === 'function' && selectSendNet('ark', document.getElementById('snd-net-btn-ark'))}>Ark</div>
        <div className="qtt" id="snd-net-btn-lightning" onClick={() => typeof selectSendNet === 'function' && selectSendNet('lightning', document.getElementById('snd-net-btn-lightning'))}>Lightning</div>
        <div className="qtt" id="snd-net-btn-onchain" onClick={() => typeof selectSendNet === 'function' && selectSendNet('onchain', document.getElementById('snd-net-btn-onchain'))}>On-chain</div>
        <div className="qtt" id="snd-net-btn-saved" onClick={() => typeof toggleSavedView === 'function' && toggleSavedView(document.getElementById('snd-net-btn-saved'))}>Saved</div>
      </div>
      <input type="hidden" id="snd-net" defaultValue="ark" />
      <div id="fav-list-view" style={{ display: 'none' }}>
        <div id="fav-list-items" style={{ display: 'flex', flexDirection: 'column', gap: 8 }} />
        <div id="fav-empty" style={{ display: 'none', textAlign: 'center', padding: '32px 16px', color: 'var(--t3)', fontSize: 13 }}>
          No saved addresses yet.<br /><span style={{ fontSize: 11, color: 'var(--t3)', opacity: 0.7 }}>Send to an address and save it after payment</span>
        </div>
      </div>
      <div id="send-form-area">
        <div className="fld">
          <label className="flbl" id="snd-addr-lbl">Ark Address</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="finp" id="s-addr" placeholder="ark1q&hellip;" type="text" style={{ flex: 1 }} onInput={(e) => typeof autoDetectSendNet === 'function' && autoDetectSendNet(e.target.value)} />
            <button onClick={() => typeof openQRScan === 'function' && openQRScan()} style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 'var(--r-md)', background: 'var(--accs)', border: '1px solid var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--acc2)' }} title="Scan QR">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="3" height="3" /><rect x="18" y="14" width="3" height="3" /><rect x="14" y="18" width="3" height="3" /><rect x="18" y="18" width="3" height="3" /></svg>
            </button>
            <button onClick={() => document.getElementById('invoice-upload-input')?.click()} style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 'var(--r-md)', background: 'var(--accs)', border: '1px solid var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--acc2)' }} title="Upload invoice">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
            </button>
            <input type="file" id="invoice-upload-input" accept="image/*,.pdf,.txt" style={{ display: 'none' }} onChange={(e) => typeof handleInvoiceUpload === 'function' && handleInvoiceUpload(e.target)} />
          </div>
        </div>
        <div id="send-amt-wrap" />
        <div id="fee-section-onchain" style={{ display: 'none' }}>
          <div className="fld"><label className="flbl">Network Fee</label>
            <div className="fee-grid">
              <div className="fo" onClick={(e) => typeof selFee === 'function' && selFee(e.currentTarget)}><div className="fo-nm">SLOW</div><div className="fo-r">6 sat/vB</div><div className="fo-t">~1 hour</div></div>
              <div className="fo active" onClick={(e) => typeof selFee === 'function' && selFee(e.currentTarget)}><div className="fo-nm">MEDIUM</div><div className="fo-r">12 sat/vB</div><div className="fo-t">~10 min</div></div>
              <div className="fo" onClick={(e) => typeof selFee === 'function' && selFee(e.currentTarget)}><div className="fo-nm">FAST</div><div className="fo-r">24 sat/vB</div><div className="fo-t">~1-2 min</div></div>
            </div>
          </div>
          <div className="fsm"><div className="fl"><span className="fl-l">Estimated fee</span><span className="fl-v">~1,860 SATS ($1.79)</span></div><div className="fl"><span className="fl-l">Estimated time</span><span className="fl-v">~10 minutes</span></div></div>
        </div>
        <div id="fee-section-lightning" style={{ display: 'none' }}>
          <div className="fsm"><div className="fl"><span className="fl-l">Routing fee</span><span className="fl-v">~1-10 SATS (0.01%)</span></div><div className="fl"><span className="fl-l">Settlement</span><span className="fl-v" style={{ color: 'var(--grn)' }}>Instant</span></div></div>
        </div>
        <div id="fee-section-ark">
          <div className="fsm"><div className="fl"><span className="fl-l">Service fee</span><span className="fl-v">~0 SATS (batched)</span></div><div className="fl"><span className="fl-l">Settlement</span><span className="fl-v" style={{ color: 'var(--grn)' }}>Instant off-chain</span></div><div className="fl"><span className="fl-l">Round time</span><span className="fl-v">~5 seconds</span></div></div>
        </div>
        <button className="btnp" onClick={() => typeof doSend === 'function' && doSend()}>Confirm Send</button>
        <button className="btns" onClick={() => typeof closeSheet === 'function' && closeSheet('send')}>Cancel</button>
      </div>
    </SheetWrapper>
  )
}
