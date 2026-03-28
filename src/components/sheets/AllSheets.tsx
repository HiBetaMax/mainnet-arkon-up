import SheetWrapper from './SheetWrapper'
import SendSheet from './SendSheet'
import ReceiveSheet from './ReceiveSheet'
import TxDetailSheetComponent from './TxDetailSheet'
import useStore from '../../store'
import type { BalDisplayMode } from '../../store'

/* ─── Personalize ─── */
function PersonalizeSheet() {
  const { balDisplayMode, setBalDisplayMode, currency, setCurrency, chartsEnabled, setChartsEnabled, showToast } = useStore()

  const handleBalDisplay = (mode: BalDisplayMode) => {
    setBalDisplayMode(mode)
    const labels: Record<string, string> = { fiat: 'Fiat only', both: 'Fiat + Sats', sats: 'Sats only' }
    showToast('Home balance: ' + labels[mode])
  }

  const handleCurrency = (val: string) => {
    setCurrency(val)
    // Update ui.js chart currency only (not balance DOM elements)
    setTimeout(() => {
      const w = window as any
      if (typeof w.switchChartCurrency === 'function') {
        try { w.switchChartCurrency(val) } catch { /* chart may not be initialized */ }
      }
    }, 0)
  }

  return (
    <SheetWrapper id="personalize" title="Personalize Your Wallet">
      <div className="slist">
        {/* Dark mode row */}
        <div className="sr" style={{ cursor: 'default' }}>
          <div className="sr-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" /></svg>
          </div>
          <div className="sr-text"><div className="sr-nm">Dark Mode</div></div>
          <div className="tog on" id="dm-tog" onClick={() => typeof (window as any).toggleDark === 'function' && (window as any).toggleDark()} />
        </div>
        {/* Balance display mode */}
        <div className="sr" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="sr-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>
            </div>
            <div className="sr-text"><div className="sr-nm">Home Balance</div><div className="sr-sb">Choose what to show on the home screen</div></div>
          </div>
          <div className="bdm-row" style={{ marginLeft: 46 }}>
            <button className={`bdm-opt${balDisplayMode === 'fiat' ? ' active' : ''}`} data-bdm="fiat" onClick={() => handleBalDisplay('fiat')}>Fiat</button>
            <button className={`bdm-opt${balDisplayMode === 'both' ? ' active' : ''}`} data-bdm="both" onClick={() => handleBalDisplay('both')}>Both</button>
            <button className={`bdm-opt${balDisplayMode === 'sats' ? ' active' : ''}`} data-bdm="sats" onClick={() => handleBalDisplay('sats')}>Sats</button>
          </div>
        </div>
        {/* Currency row */}
        <div className="sr" style={{ cursor: 'default', display: balDisplayMode === 'sats' ? 'none' : undefined }}>
          <div className="sr-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
          </div>
          <div className="sr-text"><div className="sr-nm">Currency</div></div>
          <select className="cur-setting-sel" id="cur-settings-sel" value={currency} onChange={(e) => handleCurrency(e.target.value)}>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="CHF">CHF</option>
          </select>
        </div>
        {/* Sats locked row */}
        <div className="sr" style={{ display: balDisplayMode === 'sats' ? 'flex' : 'none', cursor: 'default' }}>
          <div className="sr-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>
          </div>
          <div className="sr-text"><div className="sr-nm">Currency</div></div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--acc2)', background: 'var(--accs)', padding: '5px 12px', borderRadius: 'var(--r-pill)' }}>SATS</span>
        </div>
        {/* Charts toggle */}
        <div className="sr" style={{ cursor: 'default' }}>
          <div className="sr-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
          </div>
          <div className="sr-text"><div className="sr-nm">Price Chart</div><div className="sr-sb">Show BTC chart on home screen</div></div>
          <div className={`tog${chartsEnabled ? ' on' : ''}`} onClick={() => { setChartsEnabled(!chartsEnabled); showToast(chartsEnabled ? 'Chart hidden' : 'Chart visible') }} />
        </div>
        {/* Color Scheme */}
        <div className="sr" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="sr-ic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /></svg>
            </div>
            <div className="sr-text"><div className="sr-nm">Color Scheme</div><div className="sr-sb">Choose your accent color</div></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginLeft: 46, flexWrap: 'wrap' }} id="scheme-picker">
            {[
              { name: 'red', bg: '#ef4444' },
              { name: 'green', bg: '#22c55e' },
              { name: 'orange', bg: '#f97316' },
              { name: 'blue', bg: '#3b82f6' },
              { name: 'purple', bg: '#a855f7' },
            ].map(s => (
              <button key={s.name} onClick={() => typeof (window as any).setColorScheme === 'function' && (window as any).setColorScheme(s.name)} data-scheme-btn={s.name}
                style={{ width: 36, height: 36, borderRadius: '50%', background: s.bg, border: '3px solid transparent', cursor: 'pointer', transition: 'border-color .15s' }} />
            ))}
          </div>
        </div>
      </div>
    </SheetWrapper>
  )
}

/* ─── Backup ─── */
function BackupSheet() {
  return (
    <SheetWrapper id="backup" title="Backup Wallet" maxHeight="92vh">
      <div id="backup-body" style={{ overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--t3)' }}>Loading…</div>
      </div>
    </SheetWrapper>
  )
}

/* ─── About ─── */
function AboutSheet() {
  const CopyBtn = ({ text }) => (
    <button onClick={() => navigator.clipboard.writeText(text).then(() => typeof (window as any).showToast === 'function' && (window as any).showToast('Copied ✓'))}
      style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, background: 'var(--accs)', border: '1px solid var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--acc2)' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
    </button>
  )
  return (
    <SheetWrapper id="about" title="About ArkON">
      <div style={{ textAlign: 'center', padding: '24px 0 20px' }}>
        <div style={{ width: 64, height: 64, background: 'var(--accs)', border: '2px solid var(--acc)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 30, height: 30, color: 'var(--acc2)' }}><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-.02em' }}>ArkON</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 4 }}>Version 34 · Open source</div>
      </div>
      <div className="slist" style={{ marginBottom: 16 }}>
        <div className="sr" style={{ cursor: 'default' }}>
          <div className="sr-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg></div>
          <div className="sr-text">
            <div className="sr-nm">Ark Server</div>
            <div className="sr-sb" id="about-ark-url">arkade.computer</div>
          </div>
          <CopyBtn text="https://arkade.computer" />
        </div>
        <div className="sr" style={{ cursor: 'default' }}>
          <div className="sr-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg></div>
          <div className="sr-text">
            <div className="sr-nm">Block Explorer</div>
            <div className="sr-sb" id="about-esplora-url">mempool.space/api</div>
          </div>
          <CopyBtn text="https://mempool.space/api" />
        </div>
        <div className="sr" style={{ cursor: 'default' }}>
          <div className="sr-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></div>
          <div className="sr-text"><div className="sr-nm">Network</div><div className="sr-sb">Bitcoin Mainnet</div></div>
        </div>
        <div className="sr" onClick={() => window.open('https://arkade.sh', '_blank', 'noopener,noreferrer')}>
          <div className="sr-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg></div>
          <div className="sr-text"><div className="sr-nm">Website</div><div className="sr-sb">arkade.sh</div></div>
          <span className="sr-ch">›</span>
        </div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--t3)', paddingBottom: 8 }}>Built on the Ark Protocol · Bitcoin Mainnet</div>
    </SheetWrapper>
  )
}

/* ─── Notifications ─── */
function NotificationsSheet() {
  const rows = [
    { id: 'received', name: 'Payment Received', sub: 'Alert when bitcoin arrives in your wallet', on: true },
    { id: 'sent', name: 'Payment Sent', sub: 'Confirm when your payment is broadcast', on: true },
    { id: 'failed', name: 'Failed Transactions', sub: 'Alert if a payment or send fails', on: true },
    { id: 'price', name: 'Price Alerts', sub: 'Notify on significant BTC price moves', on: false },
  ]
  return (
    <SheetWrapper id="notifications" title="Notifications">
      <div className="notif-settings-panel">
        {rows.map(r => (
          <div className="notif-row" key={r.id}>
            <div className="notif-row-info">
              <div className="notif-row-nm">{r.name}</div>
              <div className="notif-row-sb">{r.sub}</div>
            </div>
            <div className={`tog${r.on ? ' on' : ''}`} id={`notif-tog-${r.id}`} onClick={(e) => typeof (window as any).toggleNotifPref === 'function' && (window as any).toggleNotifPref(r.id, e.currentTarget)} />
          </div>
        ))}
      </div>
    </SheetWrapper>
  )
}

/* ─── Server Info ─── */
function ServerInfoSheet() {
  const CopyBtn2 = ({ getText }) => (
    <button onClick={() => navigator.clipboard.writeText(getText()).then(() => typeof (window as any).showToast === 'function' && (window as any).showToast('Copied ✓'))}
      style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, background: 'var(--accs)', border: '1px solid var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--acc2)' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
    </button>
  )
  return (
    <SheetWrapper id="serverinfo" title="Server Configuration" zIndex={520}>
      <div className="slist" style={{ marginBottom: 20 }}>
        {/* Ark Server */}
        <div className="sr" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="sr-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg></div>
            <div className="sr-text"><div className="sr-nm">Ark Server</div><div className="sr-sb">Off-chain VTXO management</div></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg3)', borderRadius: 10, padding: '10px 12px', marginLeft: 0 }}>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--acc2)', flex: 1 }} id="srv-ark-url">https://arkade.computer</span>
            <CopyBtn2 getText={() => window._ARK_SERVER_URL || 'https://arkade.computer'} />
          </div>
        </div>
        {/* Esplora */}
        <div className="sr" style={{ cursor: 'default', flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="sr-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg></div>
            <div className="sr-text"><div className="sr-nm">Esplora (Block Explorer API)</div><div className="sr-sb">On-chain UTXO & tx lookup</div></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg3)', borderRadius: 10, padding: '10px 12px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--acc2)', flex: 1 }} id="srv-esplora-url">https://mempool.space/api</span>
            <CopyBtn2 getText={() => window._ESPLORA_API_URL || 'https://mempool.space/api'} />
          </div>
        </div>
        {/* Status */}
        <div className="sr" style={{ cursor: 'default' }}>
          <div className="sr-ic" style={{ background: 'var(--grns)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--grn)' }}><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          </div>
          <div className="sr-text"><div className="sr-nm">Status</div><div className="sr-sb" id="srv-status">Connected</div></div>
        </div>
      </div>
    </SheetWrapper>
  )
}

/* ─── Export Transactions ─── */
function ExportSheet() {
  return (
    <SheetWrapper id="export" title="Export Transactions">
      {/* Date range presets */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Date Range</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }} id="export-preset-grid">
          <button className="export-preset active" data-preset="30d" onClick={(e) => typeof (window as any).selectExportPreset === 'function' && (window as any).selectExportPreset(e.currentTarget, '30d')}>Last 30 Days</button>
          <button className="export-preset" data-preset="month" onClick={(e) => typeof (window as any).selectExportPreset === 'function' && (window as any).selectExportPreset(e.currentTarget, 'month')}>Last Month</button>
          <button className="export-preset" data-preset="quarter" onClick={(e) => typeof (window as any).selectExportPreset === 'function' && (window as any).selectExportPreset(e.currentTarget, 'quarter')}>Last Quarter</button>
          <button className="export-preset" data-preset="year" onClick={(e) => typeof (window as any).selectExportPreset === 'function' && (window as any).selectExportPreset(e.currentTarget, 'year')}>Last Year</button>
          <button className="export-preset" data-preset="all" onClick={(e) => typeof (window as any).selectExportPreset === 'function' && (window as any).selectExportPreset(e.currentTarget, 'all')} style={{ gridColumn: 'span 2' }}>All Time</button>
        </div>
      </div>
      {/* Custom date range */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Custom Range</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="fld" style={{ margin: 0 }}>
            <label className="flbl" style={{ fontSize: 11 }}>From</label>
            <input className="finp" type="date" id="export-from" style={{ fontSize: 13 }} onInput={() => typeof (window as any).selectExportPreset === 'function' && (window as any).selectExportPreset(null, 'custom')} />
          </div>
          <div className="fld" style={{ margin: 0 }}>
            <label className="flbl" style={{ fontSize: 11 }}>To</label>
            <input className="finp" type="date" id="export-to" style={{ fontSize: 13 }} onInput={() => typeof (window as any).selectExportPreset === 'function' && (window as any).selectExportPreset(null, 'custom')} />
          </div>
        </div>
      </div>
      {/* Format */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Format</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button className="export-preset active" id="export-fmt-csv" onClick={() => typeof (window as any).selectExportFmt === 'function' && (window as any).selectExportFmt('csv')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle', marginRight: 4 }}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M3 15h18M9 3v18" /></svg>
            CSV
          </button>
          <button className="export-preset" id="export-fmt-pdf" onClick={() => typeof (window as any).selectExportFmt === 'function' && (window as any).selectExportFmt('pdf')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14, display: 'inline', verticalAlign: 'middle', marginRight: 4 }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
            PDF
          </button>
        </div>
      </div>
      {/* Summary preview */}
      <div id="export-preview" style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 'var(--r-md)', padding: '12px 14px', marginBottom: 20, fontSize: 12, color: 'var(--t2)', lineHeight: 1.8 }}>
        <div style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 6 }} id="export-preview-title">Select a range to preview</div>
        <div id="export-preview-body" style={{ color: 'var(--t3)' }}>—</div>
      </div>
      <button className="btnp" onClick={() => typeof (window as any).runExport === 'function' && (window as any).runExport()} id="export-run-btn" style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16, flexShrink: 0 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
        <span id="export-run-label">Download Export</span>
      </button>
      <button className="btns" onClick={() => typeof (window as any).closeSheet === 'function' && (window as any).closeSheet('export')}>Cancel</button>
    </SheetWrapper>
  )
}

/* ─── Transaction Detail (now imported from TxDetailSheet.tsx) ─── */

/* ─── App Sheet ─── */
function AppSheet() {
  return (
    <SheetWrapper id="app" title="App" titleId="app-sh-title" maxHeight="94vh">
      <div id="app-sh-body" style={{ overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }} />
    </SheetWrapper>
  )
}

/* ─── Advanced ─── */
function AdvancedSheet() {
  return (
    <SheetWrapper id="advanced" title="Advanced">
      <div style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 'var(--r-md)', padding: '14px 14px 12px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)' }}>Coin Control / VTXO Health</div>
            <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>Renew, recover, and inspect spendable virtual coins.</div>
          </div>
          <button onClick={() => typeof (window as any).refreshAdvancedVtxoPanel === 'function' && (window as any).refreshAdvancedVtxoPanel()} style={{ height: 34, padding: '0 12px', borderRadius: 10, background: 'var(--accs)', border: '1px solid var(--acc)', color: 'var(--acc2)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Refresh</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: '10px 12px' }}><div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Spendable</div><div id="adv-vtxo-spendable" style={{ marginTop: 4, fontSize: 15, fontWeight: 800, color: 'var(--t1)' }}>—</div></div>
          <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: '10px 12px' }}><div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Boarding</div><div id="adv-vtxo-boarding" style={{ marginTop: 4, fontSize: 15, fontWeight: 800, color: 'var(--t1)' }}>—</div></div>
          <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: '10px 12px' }}><div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Expiring</div><div id="adv-vtxo-expiring" style={{ marginTop: 4, fontSize: 15, fontWeight: 800, color: 'var(--amb)' }}>—</div></div>
          <div style={{ background: 'var(--bg3)', borderRadius: 12, padding: '10px 12px' }}><div style={{ fontSize: 10, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Recoverable</div><div id="adv-vtxo-recoverable" style={{ marginTop: 4, fontSize: 15, fontWeight: 800, color: 'var(--grn)' }}>—</div><div id="adv-vtxo-count" style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>—</div></div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg3)', borderRadius: 12, padding: '10px 12px', marginBottom: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--t3)' }}>Subdust / swept leftovers</span>
          <strong id="adv-vtxo-subdust" style={{ fontSize: 13, color: 'var(--t1)' }}>—</strong>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <button onClick={() => typeof (window as any).doRenewVtxos === 'function' && (window as any).doRenewVtxos()} style={{ height: 42, borderRadius: 12, background: 'var(--acc)', border: 0, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Renew expiring</button>
          <button onClick={() => typeof (window as any).doRecoverVtxos === 'function' && (window as any).doRecoverVtxos()} style={{ height: 42, borderRadius: 12, background: 'var(--grn)', border: 0, color: '#08130c', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Recover swept</button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5 }}>Manual per-VTXO selection is not exposed yet, but this gives you practical coin control for health, renewal, and recovery.</div>
      </div>
      <div className="slist" style={{ marginBottom: 0 }} />
    </SheetWrapper>
  )
}

/* ─── Password Settings ─── */
function PasswordSettingsSheet() {
  return (
    <SheetWrapper id="passwordsettings" title="Wallet Password" zIndex={530}>
      <div style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 'var(--r-md)', padding: '14px 14px 12px', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--t1)' }}>Require password on open</div>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginTop: 4 }} id="password-sheet-status">No password required</div>
          </div>
          <div className="tog" id="password-sheet-toggle" data-password-toggle="" onClick={(e) => { e.stopPropagation(); typeof (window as any).togglePasswordSheetToggle === 'function' && (window as any).togglePasswordSheetToggle(e.currentTarget) }} />
        </div>
        <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5, marginTop: 12 }}>Turn this on to ask for your password when the app opens. Turn it off to open the wallet without a password.</div>
      </div>
      <div id="password-form-card" style={{ display: 'none', background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 'var(--r-md)', padding: 14, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--t1)', marginBottom: 12 }}>Set wallet password</div>
        <div style={{ display: 'grid', gap: 10 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 6 }}>New password</div>
            <input id="password-input-1" type="password" placeholder="Enter password" style={{ width: '100%', height: 46, borderRadius: 12, border: '1px solid var(--bdr)', background: 'var(--bg3)', color: 'var(--t1)', padding: '0 14px', outline: 'none' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--t2)', marginBottom: 6 }}>Confirm password</div>
            <input id="password-input-2" type="password" placeholder="Confirm password" style={{ width: '100%', height: 46, borderRadius: 12, border: '1px solid var(--bdr)', background: 'var(--bg3)', color: 'var(--t1)', padding: '0 14px', outline: 'none' }} />
          </div>
        </div>
        <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.5, marginTop: 10 }}>Use at least 8 characters. The wallet will ask for this password only when opening the app.</div>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        <button onClick={() => typeof (window as any).savePasswordSettings === 'function' && (window as any).savePasswordSettings()} style={{ height: 46, borderRadius: 14, background: 'var(--acc)', border: 0, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>Save Password Setting</button>
        <button onClick={() => typeof (window as any).closeSheet === 'function' && (window as any).closeSheet('passwordsettings')} style={{ height: 44, borderRadius: 14, background: 'var(--bg3)', border: '1px solid var(--bdr)', color: 'var(--t2)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
      </div>
    </SheetWrapper>
  )
}

/* ─── Rename Wallet ─── */
function RenameSheet() {
  return (
    <SheetWrapper id="rename" title="Rename Wallet">
      <div className="fld">
        <label className="flbl">Wallet Name</label>
        <input className="finp" id="wallet-name-input" placeholder="e.g. My Savings" maxLength={32} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--t3)', margin: '-10px 0 18px' }}>This name is stored locally on your device only.</div>
      <button className="btnp" onClick={() => typeof (window as any).saveWalletName === 'function' && (window as any).saveWalletName()}>Save Name</button>
      <button className="btns" onClick={() => typeof (window as any).closeSheet === 'function' && (window as any).closeSheet('rename')}>Cancel</button>
    </SheetWrapper>
  )
}

/* ─── Chart Expand ─── */
function ChartExpandSheet() {
  return (
    <SheetWrapper id="chartexp" maxHeight="85vh" title={false}
      customHead={
        <div className="sheet-head">
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', marginBottom: 2 }}>BTC / USD</div>
            <span className="sheet-title" id="exp-chart-price" style={{ fontSize: 22 }}>$—</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span id="exp-chart-pct" style={{ fontSize: 13, fontWeight: 700, color: 'var(--grn)', background: 'var(--grns)', padding: '4px 10px', borderRadius: 'var(--r-pill)' }}>—</span>
            <button className="sheet-close" onClick={() => typeof (window as any).closeSheet === 'function' && (window as any).closeSheet('chartexp')}>✕</button>
          </div>
        </div>
      }
    >
      <div style={{ height: 200, margin: '0 -4px 8px', position: 'relative' }}>
        <canvas id="exp-chart-canvas" style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair', touchAction: 'none' }} />
        <div id="exp-chart-tooltip" style={{ display: 'none', position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', background: 'rgba(10,8,30,0.92)', border: '1px solid rgba(107,82,245,0.4)', borderRadius: 8, padding: '5px 10px', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10 }}>
          <div id="exp-chart-tt-price" style={{ fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'center' }} />
          <div id="exp-chart-tt-date" style={{ fontSize: 10, color: '#888', textAlign: 'center', marginTop: 1 }} />
        </div>
        <div id="exp-chart-cursor" style={{ display: 'none', position: 'absolute', top: 0, bottom: 0, width: 1, background: 'rgba(107,82,245,0.6)', pointerEvents: 'none' }} />
      </div>
      {/* Range tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {['24H', '7D', '1M', '1Y'].map(r => (
          <div key={r} className={`crt${r === '24H' ? ' active' : ''}`} data-range={r} onClick={(e) => typeof (window as any).setChartRange === 'function' && (window as any).setChartRange(e.currentTarget)}>{r}</div>
        ))}
      </div>
      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Market Cap', id: 'stat-mcap', color: 'var(--t1)' },
          { label: '24h Volume', id: 'stat-vol', color: 'var(--t1)' },
          { label: '24h High', id: 'stat-high', color: 'var(--grn)' },
          { label: '24h Low', id: 'stat-low', color: 'var(--red)' },
        ].map(s => (
          <div key={s.id} style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 'var(--r-md)', padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--t3)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: s.color }} id={s.id}>—</div>
          </div>
        ))}
      </div>
    </SheetWrapper>
  )
}

/* ─── Invoice ─── */
function InvoiceSheet() {
  return (
    <SheetWrapper id="invoice" maxHeight="96vh" title={false}
      customHead={
        <div className="sheet-head">
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--t3)', marginBottom: 2 }}>Bitcoin Invoice</div>
            <span className="sheet-title" id="inv-sheet-title">New Invoice</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => typeof (window as any).openSheet === 'function' && (window as any).openSheet('invhistory')} style={{ background: 'var(--surf)', border: '1.5px solid var(--bdr)', borderRadius: 10, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--t2)', fontSize: 11, fontWeight: 600 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              History
            </button>
            <button className="sheet-close" onClick={() => typeof (window as any).closeSheet === 'function' && (window as any).closeSheet('invoice')}>✕</button>
          </div>
        </div>
      }
    >
      {/* Step indicator */}
      <div className="inv-steps" id="inv-steps">
        {['From', 'To', 'Items', 'Payment', 'Preview'].map((label, i) => (
          <div key={i} className={`inv-step${i === 0 ? ' active' : ''}`} id={`inv-step-${i + 1}`} onClick={() => typeof (window as any).goInvStep === 'function' && (window as any).goInvStep(i + 1)}>{label}</div>
        ))}
      </div>

      {/* STEP 1 — FROM */}
      <div className="inv-section active" id="inv-s1">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div className="inv-sect-lbl" style={{ margin: 0 }}>Your Business</div>
          <button onClick={() => typeof (window as any).openSheet === 'function' && (window as any).openSheet('invcontacts')} style={{ background: 'var(--surf)', border: '1.5px solid var(--bdr)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: 'var(--t2)', fontSize: 10, fontWeight: 600 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
            Contacts
          </button>
        </div>
        <div className="fld" style={{ position: 'relative' }}>
          <label className="flbl">Company / Your Name <span style={{ color: 'var(--red)' }}>*</span></label>
          <input className="finp" id="inv-from-name" placeholder="e.g. Arkade Labs Ltd." onInput={(e) => typeof (window as any).showContactSuggest === 'function' && (window as any).showContactSuggest('from', e.target.value)} onFocus={(e) => typeof (window as any).showContactSuggest === 'function' && (window as any).showContactSuggest('from', e.target.value)} onBlur={() => typeof (window as any).hideContactSuggest === 'function' && (window as any).hideContactSuggest('from')} autoComplete="off" />
          <div id="inv-from-suggest" className="contact-suggest" style={{ display: 'none' }} />
        </div>
        <div className="fld"><label className="flbl">Address</label><input className="finp" id="inv-from-addr" placeholder="123 Bitcoin Street, London" /></div>
        <div className="fld"><label className="flbl">Email</label><input className="finp" id="inv-from-email" placeholder="hello@arkadelabs.com" type="email" /></div>
        <div className="fld"><label className="flbl">Phone (optional)</label><input className="finp" id="inv-from-phone" placeholder="+44 7000 000000" type="tel" /></div>
        <button className="btns" id="inv-save-co-btn" onClick={() => typeof (window as any).saveContactFromForm === 'function' && (window as any).saveContactFromForm('from')} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--acc2)', borderColor: 'var(--acc2)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
          Save Details
        </button>
        <button className="btnp" onClick={() => typeof (window as any).goInvStep === 'function' && (window as any).goInvStep(2)}>Next — Bill To →</button>
      </div>

      {/* STEP 2 — TO */}
      <div className="inv-section" id="inv-s2">
        <div className="inv-sect-lbl">Bill To</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 0 }}>
          <div className="fld"><label className="flbl">Invoice #</label><input className="finp" id="inv-num" placeholder="INV-001" /></div>
          <div className="fld"><label className="flbl">Invoice Date</label><input className="finp" id="inv-date" type="date" /></div>
        </div>
        <div className="fld"><label className="flbl">Due Date</label><input className="finp" id="inv-due" type="date" /></div>
        <div className="fld" style={{ position: 'relative' }}>
          <label className="flbl">Client Name <span style={{ color: 'var(--red)' }}>*</span></label>
          <input className="finp" id="inv-to-name" placeholder="Client company or person" onInput={(e) => typeof (window as any).showContactSuggest === 'function' && (window as any).showContactSuggest('to', e.target.value)} onFocus={(e) => typeof (window as any).showContactSuggest === 'function' && (window as any).showContactSuggest('to', e.target.value)} onBlur={() => typeof (window as any).hideContactSuggest === 'function' && (window as any).hideContactSuggest('to')} autoComplete="off" />
          <div id="inv-to-suggest" className="contact-suggest" style={{ display: 'none' }} />
        </div>
        <div className="fld"><label className="flbl">Client Address</label><input className="finp" id="inv-to-addr" placeholder="456 Satoshi Ave, New York" /></div>
        <div className="fld"><label className="flbl">Client Email</label><input className="finp" id="inv-to-email" placeholder="client@example.com" type="email" /></div>
        <button className="btns" id="inv-save-client-btn" onClick={() => typeof (window as any).saveContactFromForm === 'function' && (window as any).saveContactFromForm('to')} style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--acc2)', borderColor: 'var(--acc2)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
          Save Client Details
        </button>
        <button className="btnp" onClick={() => typeof (window as any).goInvStep === 'function' && (window as any).goInvStep(3)}>Next — Add Items →</button>
        <button className="btns" onClick={() => typeof (window as any).goInvStep === 'function' && (window as any).goInvStep(1)}>← Back</button>
      </div>

      {/* STEP 3 — ITEMS */}
      <div className="inv-section" id="inv-s3">
        <div className="inv-sect-lbl">Line Items</div>
        <div className="fld" style={{ marginBottom: 14 }}>
          <label className="flbl">Invoice Color</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { color: '#0e3a8a', title: 'ArkON Blue', active: true },
              { color: '#1a5c2e', title: 'Forest Green' },
              { color: '#8c1a1a', title: 'Deep Red' },
              { color: '#1a3a5c', title: 'Navy' },
              { color: '#5c3a1a', title: 'Burnt Orange' },
              { color: '#1c1c1e', title: 'Onyx Black' },
            ].map(s => (
              <button key={s.color} className={`inv-color-swatch${s.active ? ' active' : ''}`} data-color={s.color} onClick={(e) => typeof (window as any).setInvColor === 'function' && (window as any).setInvColor(e.currentTarget)} style={{ background: s.color }} title={s.title} />
            ))}
            <label style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', border: '2px dashed var(--bdr2)', overflow: 'hidden' }} title="Custom color">
              <span style={{ fontSize: 14 }}>+</span>
              <input type="color" id="inv-custom-color" style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} onInput={(e) => typeof (window as any).setInvColorCustom === 'function' && (window as any).setInvColorCustom(e.target.value)} />
            </label>
          </div>
        </div>
        <div className="fld" style={{ marginBottom: 14 }}>
          <label className="flbl">Invoice Currency</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6 }}>
            {['USD', 'EUR', 'CHF', 'SATS', 'BTC'].map((c, i) => (
              <button key={c} className={`inv-cur-btn${i === 0 ? ' active' : ''}`} data-cur={c} onClick={(e) => typeof (window as any).setInvCurrency === 'function' && (window as any).setInvCurrency(e.currentTarget)}>{c}</button>
            ))}
          </div>
        </div>
        <div className="item-hdr"><span>Description</span><span>Qty</span><span>Price</span><span /></div>
        <div id="inv-items-wrap" />
        <button className="btns" style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--acc2)', borderColor: 'var(--acc2)' }} onClick={() => typeof (window as any).addInvItem === 'function' && (window as any).addInvItem()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Item
        </button>
        <div style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 'var(--r-md)', padding: '12px 14px', marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}><span style={{ fontSize: 12, color: 'var(--t3)' }}>Subtotal</span><span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)' }} id="inv-subtotal">—</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderTop: '1px solid var(--bdr)', marginTop: 6, paddingTop: 8 }}><span style={{ fontSize: 13, fontWeight: 800, color: 'var(--t1)' }}>Total</span><span style={{ fontSize: 14, fontWeight: 900, color: 'var(--acc2)' }} id="inv-total">—</span></div>
        </div>
        <div className="fld"><label className="flbl">Notes (optional)</label><input className="finp" id="inv-notes" placeholder="Payment terms, thank you message…" /></div>
        <button className="btnp" onClick={() => typeof (window as any).goInvStep === 'function' && (window as any).goInvStep(4)}>Next — Payment Method →</button>
        <button className="btns" onClick={() => typeof (window as any).goInvStep === 'function' && (window as any).goInvStep(2)}>← Back</button>
      </div>

      {/* STEP 4 — PAYMENT METHOD */}
      <div className="inv-section" id="inv-s4">
        <div className="inv-sect-lbl">Accept Payment Via</div>
        {[
          { id: 'pay-ark', name: 'Ark', desc: 'Instant, low-fee, off-chain', method: 'ark', icBg: 'var(--accs)', icClr: 'var(--acc2)', svgPath: <><circle cx="12" cy="12" r="9" /><path d="M8 12h8M12 8v8" /></> },
          { id: 'pay-lightning', name: 'Lightning', desc: 'Instant settlement, any amount', method: 'lightning', icBg: 'var(--ambs)', icClr: 'var(--amb)', svgPath: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /> },
          { id: 'pay-onchain', name: 'On-chain Bitcoin', desc: 'On-chain, final settlement', method: 'onchain', icBg: 'var(--grns)', icClr: 'var(--grn)', svgPath: <><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5A2.5 2.5 0 0112 7a2.5 2.5 0 010 5 2.5 2.5 0 000 5A2.5 2.5 0 0014.5 14.5" /></> },
        ].map((p, i) => (
          <div key={p.id} className={`pay-opt${i === 0 ? ' active' : ''}`} id={p.id} onClick={() => typeof (window as any).selectPayMethod === 'function' && (window as any).selectPayMethod(p.method)}>
            <div className="pay-opt-ic" style={{ background: p.icBg, color: p.icClr }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">{p.svgPath}</svg>
            </div>
            <div><div className="pay-opt-nm">{p.name}</div><div className="pay-opt-ds">{p.desc}</div></div>
            <div className="pay-check" />
          </div>
        ))}
        <div style={{ marginTop: 4 }} className="fld">
          <label className="flbl" id="inv-addr-lbl">Your Ark Address</label>
          <input className="finp" id="inv-pay-addr" style={{ fontFamily: 'monospace', fontSize: 12 }} />
        </div>
        <button className="btnp" id="inv-gen-btn" onClick={() => typeof (window as any).generateInvoiceStep === 'function' && (window as any).generateInvoiceStep()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, display: 'inline', marginRight: 6 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
          Generate Invoice →
        </button>
        <button className="btns" onClick={() => typeof (window as any).goInvStep === 'function' && (window as any).goInvStep(3)}>← Back</button>
      </div>

      {/* STEP 5 — GENERATED INVOICE */}
      <div className="inv-section" id="inv-s5">
        <div className="inv-sect-lbl">Generated Invoice</div>
        <div id="inv-ln-badge" style={{ display: 'none', background: 'var(--ambs)', border: '1px solid var(--amb)', borderRadius: 'var(--r-md)', padding: '10px 14px', marginBottom: 14, alignItems: 'center', gap: 10 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--amb)" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amb)' }}>Lightning Invoice Generated</div>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 1 }}>Real BOLT11 invoice embedded in the PDF export</div>
          </div>
        </div>
        <div id="inv-preview-wrap" />
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button className="btnp" style={{ flex: 1, background: 'var(--grn)', boxShadow: '0 6px 20px rgba(48,208,104,.35)' }} onClick={() => typeof (window as any).downloadInvoice === 'function' && (window as any).downloadInvoice()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, display: 'inline', marginRight: 6 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Download
          </button>
          <button className="btnp" style={{ flex: 1, background: 'var(--acc2)', boxShadow: '0 6px 20px rgba(14,58,138,.25)' }} onClick={() => typeof (window as any).shareInvoiceNative === 'function' && (window as any).shareInvoiceNative()}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, display: 'inline', marginRight: 6 }}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>
            Share
          </button>
        </div>
        <button className="btns" style={{ marginTop: 10 }} onClick={() => typeof (window as any).copyInvoiceText === 'function' && (window as any).copyInvoiceText()}>Copy as Text</button>
        <button className="btns" onClick={() => typeof (window as any).goInvStep === 'function' && (window as any).goInvStep(4)}>← Back</button>
      </div>
    </SheetWrapper>
  )
}

/* ─── Invoice History ─── */
function InvHistorySheet() {
  return (
    <SheetWrapper id="invhistory" title="Invoice History" maxHeight="96vh">
      <div id="inv-hist-list" style={{ display: 'flex', flexDirection: 'column', gap: 10 }} />
      <div id="inv-hist-empty" style={{ display: 'none', textAlign: 'center', padding: '40px 16px', color: 'var(--t3)' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: .4 }}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No invoices yet</div>
        <div style={{ fontSize: 12, opacity: .7 }}>Generated invoices will appear here</div>
      </div>
      <button className="btns" onClick={() => typeof (window as any).closeSheet === 'function' && (window as any).closeSheet('invhistory')} style={{ marginTop: 12 }}>Close</button>
    </SheetWrapper>
  )
}

/* ─── Invoice Contacts ─── */
function InvContactsSheet() {
  return (
    <SheetWrapper id="invcontacts" title="Contacts" maxHeight="96vh">
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: 10 }}>Saved contacts for invoices</div>
      <div id="inv-contacts-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }} />
      <div id="inv-contacts-empty" style={{ display: 'none', textAlign: 'center', padding: '32px 16px', color: 'var(--t3)', fontSize: 13 }}>
        No contacts saved yet.<br /><span style={{ fontSize: 11, opacity: .7 }}>Save details from the invoice form</span>
      </div>
      <button className="btns" onClick={() => typeof (window as any).closeSheet === 'function' && (window as any).closeSheet('invcontacts')} style={{ marginTop: 14 }}>Close</button>
    </SheetWrapper>
  )
}

/* ─── Batch Send ─── */
function BatchSendSheet() {
  return (
    <SheetWrapper id="batchsend" title="Batch Send" maxHeight="96vh">
      {/* Upload section */}
      <div id="batch-upload-area">
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: 10 }}>Upload CSV</div>
        <div style={{ background: 'var(--surf)', border: '1.5px dashed var(--bdr)', borderRadius: 14, padding: '24px 16px', textAlign: 'center', cursor: 'pointer' }} onClick={() => document.getElementById('batch-csv-input')?.click()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="1.5" style={{ width: 32, height: 32, marginBottom: 8 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--t2)' }}>Tap to upload CSV</div>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 4 }}>Format: address,amount (sats)</div>
        </div>
        <input type="file" id="batch-csv-input" accept=".csv,.txt" style={{ display: 'none' }} onChange={(e) => typeof (window as any).parseBatchCSV === 'function' && (window as any).parseBatchCSV(e.target)} />
        <button className="btns" style={{ marginTop: 10, fontSize: 11 }} onClick={() => typeof (window as any).downloadSampleCSV === 'function' && (window as any).downloadSampleCSV()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Download sample CSV
        </button>
      </div>
      {/* Summary bar */}
      <div id="batch-summary" style={{ display: 'none', background: 'var(--surf)', border: '1.5px solid var(--bdr)', borderRadius: 14, padding: '12px 16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--t1)' }} id="batch-sum-total">0 items</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--t1)' }} id="batch-sum-sats">0 SATS</span>
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 10, fontWeight: 600 }}>
          <span style={{ color: 'var(--t3)' }} id="batch-sum-pending">0 pending</span>
          <span style={{ color: 'var(--acc2)' }} id="batch-sum-sending">0 sending</span>
          <span style={{ color: 'var(--grn)' }} id="batch-sum-sent">0 sent</span>
          <span style={{ color: 'var(--red)' }} id="batch-sum-failed">0 failed</span>
        </div>
      </div>
      {/* Queue list */}
      <div id="batch-queue-list" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }} />
      {/* Action buttons */}
      <div id="batch-actions" style={{ display: 'none' }}>
        <button className="btnp" id="batch-send-btn" style={{ background: 'var(--grn)', boxShadow: '0 6px 20px rgba(48,208,104,.35)' }} onClick={() => typeof (window as any).startBatchSend === 'function' && (window as any).startBatchSend()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15, display: 'inline', marginRight: 6 }}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
          {'Send All in 1 Round ⚡'}
        </button>
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button className="btns" style={{ flex: 1 }} id="batch-retry-btn" onClick={() => typeof (window as any).retryFailed === 'function' && (window as any).retryFailed()}>Retry Failed</button>
          <button className="btns" style={{ flex: 1 }} id="batch-clear-sent-btn" onClick={() => typeof (window as any).clearSentBatch === 'function' && (window as any).clearSentBatch()}>Clear Sent</button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <button className="btns" style={{ flex: 1 }} onClick={() => document.getElementById('batch-csv-input')?.click()}>+ Add CSV</button>
          <button className="btns" style={{ flex: 1, color: 'var(--red)' }} onClick={() => typeof (window as any).clearAllBatch === 'function' && (window as any).clearAllBatch()}>Clear All</button>
        </div>
        <button className="btns" id="batch-stop-btn" style={{ display: 'none', color: 'var(--red)', marginTop: 6 }} onClick={() => typeof (window as any).stopBatchSend === 'function' && (window as any).stopBatchSend()}>⏹ Stop Sending</button>
      </div>
      <button className="btns" onClick={() => typeof (window as any).closeSheet === 'function' && (window as any).closeSheet('batchsend')} style={{ marginTop: 14 }}>Close</button>
    </SheetWrapper>
  )
}

/* ─── Send Confirm ─── */
function SendConfirmSheet() {
  return (
    <SheetWrapper id="sendconfirm" title={false}>
      <div style={{ textAlign: 'center', padding: '20px 20px 24px', borderBottom: '1px solid var(--bdr)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 10 }}>You are sending</div>
        <div id="sc-amount-display" style={{ fontSize: 44, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-.04em', fontFamily: 'var(--f)', lineHeight: 1 }}>0 SATS</div>
        <div id="sc-fiat-display" style={{ fontSize: 16, color: 'var(--t2)', marginTop: 6, fontWeight: 500 }}>≈ $0.00</div>
      </div>
      <div style={{ padding: '0 20px' }}>
        <div className="tdrow" style={{ padding: '16px 0' }}>
          <span className="tdlbl" style={{ fontSize: 13 }}>To</span>
          <span className="tdval mono" id="sc-addr-display" style={{ fontSize: 11.5, lineHeight: 1.5, color: 'var(--t2)' }}>—</span>
        </div>
        <div className="tdrow" style={{ padding: '14px 0' }}>
          <span className="tdlbl" style={{ fontSize: 13 }}>Network</span>
          <span className="tdval" id="sc-network-display" style={{ fontSize: 13 }}>Ark</span>
        </div>
        <div className="tdrow" style={{ padding: '14px 0' }}>
          <span className="tdlbl" style={{ fontSize: 13 }}>Network fee</span>
          <span className="tdval" id="sc-fee-display" style={{ fontSize: 13 }}>Free (batched)</span>
        </div>
        <div className="tdrow" id="sc-spendable-row" style={{ display: 'none', padding: '14px 0' }}>
          <span className="tdlbl" style={{ fontSize: 13, color: 'var(--t2)' }}>Spendable after fee</span>
          <span id="sc-spendable-display" style={{ fontSize: 13, color: 'var(--t2)', fontWeight: 600, textAlign: 'right' }}>—</span>
        </div>
        <div style={{ margin: '8px 0 24px', padding: 16, background: 'var(--accs)', border: '1px solid var(--cb)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--t1)' }}>Total deducted</span>
          <span id="sc-total-display" style={{ fontSize: 16, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-.03em', fontFamily: 'var(--f)' }}>0 SATS</span>
        </div>
      </div>
      <input type="hidden" id="sc-addr-full" />
      <input type="hidden" id="sc-amount-raw" />
      <input type="hidden" id="sc-network-type" defaultValue="ark" />
      <div style={{ padding: '0 20px 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button id="sc-confirm-btn" onClick={() => typeof (window as any).confirmSend === 'function' && (window as any).confirmSend()}
          style={{ height: 54, borderRadius: 16, background: 'var(--acc2)', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: 'var(--shb)', letterSpacing: '.01em', transition: 'opacity .15s' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16, flexShrink: 0 }}><polyline points="20 6 9 17 4 12" /></svg>
          <span id="sc-confirm-label">Send Now</span>
        </button>
        <button onClick={() => { typeof (window as any).closeSheet === 'function' && (window as any).closeSheet('sendconfirm'); setTimeout(() => typeof (window as any).openSheet === 'function' && (window as any).openSheet('send'), 200) }}
          style={{ height: 46, borderRadius: 14, background: 'transparent', border: '1.5px solid var(--bdr2)', color: 'var(--t2)', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          ← Edit
        </button>
      </div>
    </SheetWrapper>
  )
}

/* ─── Send Result ─── */
function SendResultSheet() {
  return (
    <SheetWrapper id="sendresult" title={false}>
      <div style={{ textAlign: 'center', padding: '32px 24px 28px' }}>
        <div id="sres-icon" style={{ width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: 'var(--grns)' }}>
          <svg id="sres-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 34, height: 34, color: 'var(--grn)' }}><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <div id="sres-title" style={{ fontSize: 22, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-.03em', marginBottom: 6, fontFamily: 'var(--f-logo)' }}>Payment Sent</div>
        <div id="sres-amount" style={{ fontSize: 16, fontWeight: 700, color: 'var(--t2)', marginBottom: 4 }}>0 SATS</div>
        <div id="sres-sub" style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 20 }}>Transaction broadcast successfully</div>
        {/* Save to Favorites */}
        <div id="sres-fav-section" style={{ display: 'none', marginBottom: 20, padding: 16, background: 'var(--surf)', border: '1.5px solid var(--bdr)', borderRadius: 14, textAlign: 'left' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--t3)', marginBottom: 10 }}>Save Address</div>
          <input className="finp" id="sres-fav-name" type="text" placeholder="Name (e.g. Alice)" style={{ marginBottom: 10, fontSize: 13 }} />
          <div id="sres-fav-addr" style={{ fontSize: 11, color: 'var(--t3)', wordBreak: 'break-all', marginBottom: 12, fontFamily: 'var(--f-mono)', lineHeight: 1.5 }} />
          <button id="sres-fav-btn" onClick={() => typeof (window as any).saveFromResult === 'function' && (window as any).saveFromResult()} style={{ width: '100%', height: 40, borderRadius: 12, background: 'var(--accs)', border: '1px solid var(--cb)', color: 'var(--acc2)', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            Save to Favorites
          </button>
        </div>
        <button className="btnp" onClick={() => typeof (window as any).closeSheet === 'function' && (window as any).closeSheet('sendresult')} style={{ maxWidth: 280, margin: '0 auto' }}>Done</button>
      </div>
    </SheetWrapper>
  )
}

/* ─── Settle Progress ─── */
function SettleProgressSheet() {
  return (
    <SheetWrapper id="settle-progress" title={false}>
      <div style={{ textAlign: 'center', padding: '32px 24px 36px' }}>
        <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'var(--accs)', border: '1px solid var(--cb)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--acc2)" strokeWidth="2" style={{ width: 32, height: 32, animation: 'spin 1s linear infinite' }}>
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        </div>
        <div id="settle-progress-title" style={{ fontSize: 20, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-.02em', marginBottom: 8, fontFamily: 'var(--f-logo)' }}>Processing…</div>
        <div id="settle-progress-subtitle" style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.6, marginBottom: 20, maxWidth: 280, marginLeft: 'auto', marginRight: 'auto' }}>
          Joining the next Ark round. Please keep this page open.
        </div>
        <div style={{ background: 'var(--surf)', border: '1px solid var(--bdr)', borderRadius: 'var(--r-md)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--acc2)', animation: 'sdk-pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
          <span id="settle-progress-status" style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)' }}>Waiting for Ark round…</span>
        </div>
      </div>
    </SheetWrapper>
  )
}

/* ─── Share ─── */
function ShareSheet() {
  const shareOpts = [
    { fn: 'doShareCopy', label: 'Copy', icBg: 'var(--accs)', icClr: 'var(--acc2)', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg> },
    { fn: 'doShareWhatsApp', label: 'WhatsApp', icBg: 'rgba(37,211,102,0.12)', icClr: '#25d366', svg: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg> },
    { fn: 'doShareTelegram', label: 'Telegram', icBg: 'rgba(0,136,204,0.12)', icClr: '#0088cc', svg: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" /></svg> },
    { fn: 'doShareEmail', label: 'Email', icBg: 'rgba(245,166,35,0.12)', icClr: 'var(--amb)', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg> },
    { fn: 'doShareSMS', label: 'SMS', icBg: 'rgba(48,208,104,0.12)', icClr: 'var(--grn)', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg> },
    { fn: 'doShareTwitter', label: 'X', icBg: 'rgba(255,255,255,0.06)', icClr: 'var(--t1)', svg: <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
    { fn: 'doShareDownloadQR', label: 'Save QR', icBg: 'var(--accs2)', icClr: 'var(--t2)', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}><polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" /><path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29" /></svg> },
    { fn: 'doShareNative', label: 'More', icBg: 'rgba(139,92,246,0.12)', icClr: '#8b5cf6', svg: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>, id: 'share-native-btn' },
  ]
  return (
    <SheetWrapper id="share" title="Share" titleId="share-sheet-title">
      <div style={{ background: 'var(--bg3)', border: '1px solid var(--bdr2)', borderRadius: 'var(--r-md)', padding: '12px 14px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div id="share-preview-icon" style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--accs)', border: '1px solid var(--acc)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--acc2)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }} id="share-preview-label">Address</div>
          <div id="share-preview-val" style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--t2)', wordBreak: 'break-all', lineHeight: 1.6 }}>—</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
        {shareOpts.map(o => (
          <button key={o.fn} onClick={() => typeof window[o.fn] === 'function' && window[o.fn]()} className="share-opt-btn" id={o.id || undefined}>
            <div className="share-opt-ic" style={{ background: o.icBg, color: o.icClr }}>{o.svg}</div>
            <span className="share-opt-lbl">{o.label}</span>
          </button>
        ))}
      </div>
    </SheetWrapper>
  )
}

/* ─── Settle Result ─── */
function SettleResultSheet() {
  return (
    <SheetWrapper id="settleresult" title={false}>
      <div style={{ textAlign: 'center', padding: '32px 24px 28px' }}>
        <div id="settle-result-icon" style={{ width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: 'var(--grns)' }}>
          <svg id="settle-result-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 34, height: 34, color: 'var(--grn)' }}><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <div id="settle-result-title" style={{ fontSize: 22, fontWeight: 900, color: 'var(--t1)', letterSpacing: '-.03em', marginBottom: 6, fontFamily: 'var(--f-logo)' }}>Done!</div>
        <div id="settle-result-sub" style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 28, lineHeight: 1.6, maxWidth: 260, marginLeft: 'auto', marginRight: 'auto' }}>Operation completed successfully.</div>
        <button className="btnp" onClick={() => typeof (window as any).closeSheet === 'function' && (window as any).closeSheet('settleresult')} style={{ maxWidth: 280, margin: '0 auto' }}>Done</button>
      </div>
    </SheetWrapper>
  )
}

/* ─── Game Screen (not a sheet, but a full-screen overlay) ─── */
function GameScreen() {
  return (
    <div id="game-screen">
      <div className="gs-topbar">
        <button className="gs-back" onClick={() => typeof (window as any).closeGame === 'function' && (window as any).closeGame()}>←</button>
        <span className="gs-title" id="gs-title">Game</span>
        <div className="gs-stats">
          <div className="gs-stat">
            <div className="gs-stat-lbl">Score</div>
            <div className="gs-stat-val" id="gs-score">0</div>
          </div>
          <div className="gs-stat">
            <div className="gs-stat-lbl">Best</div>
            <div className="gs-stat-val" id="gs-best" style={{ color: '#f5a623' }}>0</div>
          </div>
        </div>
      </div>
      <div className="gs-canvas-wrap" id="gs-canvas-wrap" style={{ position: 'relative' }} />
      <div className="gs-footer" id="gs-footer" style={{ display: 'none' }} />
    </div>
  )
}

/* ─── PWA Install Banner ─── */
function PWABanner() {
  return (
    <div id="pwa-banner" style={{ display: 'none', position: 'fixed', bottom: 'calc(68px + env(safe-area-inset-bottom,0px))', left: 12, right: 12, zIndex: 500, background: 'var(--surf)', border: '1px solid var(--bdr2)', borderRadius: 18, padding: '14px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.45)', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accs)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 22, height: 22 }}><rect width="26" height="26" rx="7" fill="var(--acc2)" /><rect x="4" y="8" width="18" height="11" rx="2" fill="white" fillOpacity="0.9" /><rect x="7" y="5" width="3" height="4" rx="1" fill="white" fillOpacity="0.65" /><rect x="16" y="5" width="3" height="4" rx="1" fill="white" fillOpacity="0.65" /><circle cx="9.5" cy="13" r="1.8" fill="#0e3a8a" /><circle cx="16.5" cy="13" r="1.8" fill="#0e3a8a" /><rect x="12" y="15.5" width="2" height="1.8" rx="0.6" fill="#0e3a8a" /><rect x="2" y="13" width="2.5" height="2.5" rx="0.5" fill="white" fillOpacity="0.5" /><rect x="21.5" y="13" width="2.5" height="2.5" rx="0.5" fill="white" fillOpacity="0.5" /></svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)' }}>Install ArkON</div>
        <div style={{ fontSize: 11, color: 'var(--t3)' }}>Add to your Home Screen for the best experience</div>
      </div>
      <button onClick={() => typeof (window as any).triggerPWAInstall === 'function' && (window as any).triggerPWAInstall()} style={{ flexShrink: 0, padding: '8px 14px', background: 'var(--acc)', color: '#fff', border: 'none', borderRadius: 'var(--r-pill)', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--f)' }}>Install</button>
      <button onClick={() => { const b = document.getElementById('pwa-banner'); if (b) b.style.display = 'none' }} style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg3)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--t3)', flexShrink: 0, fontFamily: 'var(--f)' }}>✕</button>
    </div>
  )
}

/* ═══════════════════════════════════════════
   ALL SHEETS — composed export
═══════════════════════════════════════════ */
export default function AllSheets() {
  return (
    <>
      <SendSheet />
      <ReceiveSheet />
      <PersonalizeSheet />
      <BackupSheet />
      <AboutSheet />
      <NotificationsSheet />
      <ServerInfoSheet />
      <ExportSheet />
      <TxDetailSheetComponent />
      <AppSheet />
      <AdvancedSheet />
      <PasswordSettingsSheet />
      <RenameSheet />
      <ChartExpandSheet />
      <InvoiceSheet />
      <InvHistorySheet />
      <InvContactsSheet />
      <BatchSendSheet />
      <SendConfirmSheet />
      <SendResultSheet />
      <SettleProgressSheet />
      <ShareSheet />
      <SettleResultSheet />
      <GameScreen />
      <PWABanner />
    </>
  )
}
