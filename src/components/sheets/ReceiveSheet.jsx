import SheetWrapper from './SheetWrapper'

export default function ReceiveSheet() {
  return (
    <SheetWrapper id="receive" title="Receive Bitcoin">
      <div className="qr-type-row" style={{ marginBottom: 16 }}>
        <div className="qtt active" id="rcv-tab-ark" onClick={() => typeof setRcvType === 'function' && setRcvType(document.getElementById('rcv-tab-ark'), 'ark')}>Ark</div>
        <div className="qtt" id="rcv-tab-lightning" onClick={() => typeof setRcvType === 'function' && setRcvType(document.getElementById('rcv-tab-lightning'), 'lightning')}>Lightning</div>
        <div className="qtt" id="rcv-tab-onchain" onClick={() => typeof setRcvType === 'function' && setRcvType(document.getElementById('rcv-tab-onchain'), 'onchain')}>On-chain</div>
      </div>
      <div id="rcv-onchain-panel">
        <div className="sht-qr"><div className="sht-qr-inner"><div id="rcv-qr" /></div></div>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 6px' }}>
          <span id="rcv-addr-lbl">Ark Address</span>
          <button className="addr-reveal-btn" onClick={() => typeof toggleAddrBlur === 'function' && toggleAddrBlur('rcv-addr', event?.currentTarget)} title="Show/hide address">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
          </button>
        </div>
        <div className="addr-row">
          <span className="addr-txt addr-masked" id="rcv-addr">Loading&hellip;</span>
          <div className="cpb" onClick={() => typeof cpTxt === 'function' && cpTxt('rcv-addr')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg></div>
        </div>
        <div id="rcv-amt-wrap" />
        <button className="btnp" id="rcv-copy-btn" onClick={() => typeof cpTxt === 'function' && cpTxt('rcv-addr')}>Copy Ark Address</button>
        <button className="btns" onClick={() => typeof shareContent === 'function' && shareContent('Share Address', document.getElementById('rcv-addr')?.textContent?.trim(), 'ark')}>Share</button>
      </div>
      <div id="rcv-lightning-panel" style={{ display: 'none' }}>
        <div id="ln-form-wrap">
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr2)', borderRadius: 'var(--r-md)', padding: 16, marginBottom: 14 }}>
            <div style={{ padding: '4px 0 10px', color: 'var(--t3)', fontSize: 12, lineHeight: 1.5 }}>Create a real Lightning invoice that settles into your Ark wallet through Arkade/Boltz.</div>
            <div id="rcv-ln-amt-wrap" />
            <div className="fld"><label className="flbl">Description (optional)</label><input className="finp" id="ln-memo" maxLength={120} placeholder="e.g. Coffee payment" /></div>
            <div id="ln-gen-wrap"><button className="btnp" id="ln-gen-btn" onClick={() => typeof genLnInvoice === 'function' && genLnInvoice()} disabled>Generate Lightning Invoice</button></div>
          </div>
        </div>
        <div id="ln-invoice-area" style={{ display: 'none' }}>
          <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr2)', borderRadius: 'var(--r-md)', padding: 16, marginBottom: 14 }}>
            <div className="sht-qr"><div className="sht-qr-inner"><div id="rcv-ln-qr" /></div></div>
            <div id="ln-invoice-amt-label" style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, color: 'var(--t1)', marginBottom: 4 }}>
              <span id="ln-invoice-amt-display">&mdash;</span> <span style={{ fontSize: 12, color: 'var(--t3)' }}>SATS</span>
            </div>
            <div id="ln-invoice-fiat-label" style={{ fontSize: 11, color: 'var(--t3)', textAlign: 'center', marginBottom: 10 }} />
            <div id="ln-status" style={{ display: 'none', fontSize: 12, color: 'var(--t3)', textAlign: 'center', marginBottom: 10 }}>Invoice ready &mdash; auto-claims into your Ark wallet after payment.</div>
            <div className="addr-row"><span className="addr-txt" id="ln-invoice-val">&mdash;</span><div className="cpb" onClick={() => typeof cpTxt === 'function' && cpTxt('ln-invoice-val')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg></div></div>
          </div>
          <button className="btnp" onClick={() => typeof cpTxt === 'function' && cpTxt('ln-invoice-val')} style={{ marginBottom: 10 }}>Copy Invoice</button>
          <button className="btns" onClick={() => typeof resetLnInvoiceForm === 'function' && resetLnInvoiceForm()}>New Invoice</button>
        </div>
      </div>
    </SheetWrapper>
  )
}
