import SheetWrapper from './SheetWrapper'
import SendSheet from './SendSheet'
import ReceiveSheet from './ReceiveSheet'

function PersonalizeSheet() {
  return (
    <SheetWrapper id="personalize" title="Personalize Your Wallet">
      <div id="personalize-body">
        {/* Dark mode */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--bdr)' }}>
          <div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Dark Mode</div><div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }}>Toggle dark/light theme</div></div>
          <div className="tog on" id="dm-tog" onClick={() => typeof toggleDark === 'function' && toggleDark()} />
        </div>
        {/* Balance display */}
        <div style={{ padding: '12px 0', borderBottom: '1px solid var(--bdr)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 8 }}>Balance Display</div>
          <div id="bal-mode-row" style={{ display: 'flex', gap: 6 }}>
            <button className="btnp" data-balmode="fiat" onClick={() => typeof setBalMode === 'function' && setBalMode('fiat')}>Fiat</button>
            <button className="btnp" data-balmode="both" onClick={() => typeof setBalMode === 'function' && setBalMode('both')}>Both</button>
            <button className="btnp" data-balmode="sats" onClick={() => typeof setBalMode === 'function' && setBalMode('sats')}>Sats</button>
          </div>
        </div>
        {/* Currency */}
        <div id="cur-row" style={{ padding: '12px 0', borderBottom: '1px solid var(--bdr)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 8 }}>Currency</div>
          <div id="cur-btns" style={{ display: 'flex', gap: 6 }}>
            {['USD', 'EUR', 'CHF'].map(c => (
              <button key={c} className="btns" data-cur={c} onClick={() => typeof setCur === 'function' && setCur(c)} style={{ margin: 0 }}>{c}</button>
            ))}
          </div>
        </div>
        {/* Color Scheme */}
        <div style={{ padding: '12px 0' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)', marginBottom: 8 }}>Color Scheme</div>
          <div id="scheme-grid" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { name: 'blue', bg: '#3b82f6' }, { name: 'red', bg: '#ef4444' },
              { name: 'green', bg: '#22c55e' }, { name: 'orange', bg: '#f97316' },
              { name: 'purple', bg: '#8b5cf6' },
            ].map(s => (
              <div key={s.name} className="scheme-dot" data-scheme={s.name} onClick={() => typeof pickScheme === 'function' && pickScheme(s.name)} style={{ width: 32, height: 32, borderRadius: '50%', background: s.bg, cursor: 'pointer', border: '2px solid transparent' }} />
            ))}
          </div>
        </div>
      </div>
    </SheetWrapper>
  )
}

function BackupSheet() {
  return (
    <SheetWrapper id="backup" title="Backup Wallet">
      <div id="backup-body" />
    </SheetWrapper>
  )
}

function AboutSheet() {
  return (
    <SheetWrapper id="about" title="About ArkON">
      <div id="about-body" />
    </SheetWrapper>
  )
}

function NotificationsSheet() {
  return (
    <SheetWrapper id="notifications" title="Notifications">
      <div id="notif-body" />
    </SheetWrapper>
  )
}

function ServerInfoSheet() {
  return (
    <SheetWrapper id="serverinfo" title="Server Configuration">
      <div id="serverinfo-body" />
    </SheetWrapper>
  )
}

function ExportSheet() {
  return (
    <SheetWrapper id="export" title="Export Transactions">
      <div id="export-body" />
    </SheetWrapper>
  )
}

function TxDetailSheet() {
  return (
    <SheetWrapper id="txdetail" title="Transaction">
      {/* Body populated by main.js showLiveTxDetail() via #txd-body */}
    </SheetWrapper>
  )
}

function AppSheet() {
  return (
    <SheetWrapper id="app" title="" maxHeight="94vh">
      <div id="app-sheet-body" />
    </SheetWrapper>
  )
}

function AdvancedSheet() {
  return (
    <SheetWrapper id="advanced" title="Advanced">
      <div id="advanced-body" />
    </SheetWrapper>
  )
}

function PasswordSettingsSheet() {
  return (
    <SheetWrapper id="passwordsettings" title="Wallet Password">
      <div id="password-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--bdr)' }}>
          <div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>Require Password</div><div style={{ fontSize: 12, color: 'var(--t3)', marginTop: 2 }} id="password-sheet-status">No password required</div></div>
          <div className="tog" id="password-sheet-toggle" data-password-toggle onClick={(e) => { e.stopPropagation(); typeof togglePasswordSheetToggle === 'function' && togglePasswordSheetToggle(e.currentTarget) }} />
        </div>
        <div id="password-form-area" style={{ display: 'none', padding: '12px 0' }}>
          <div className="fld"><label className="flbl">New Password</label><input className="finp" id="pw-new" type="password" placeholder="Min 8 characters" /></div>
          <div className="fld"><label className="flbl">Confirm Password</label><input className="finp" id="pw-confirm" type="password" placeholder="Re-enter password" /></div>
          <button className="btnp" onClick={() => typeof savePasswordSettings === 'function' && savePasswordSettings()}>Save Password</button>
        </div>
      </div>
    </SheetWrapper>
  )
}

function RenameSheet() {
  return (
    <SheetWrapper id="rename" title="Rename Wallet">
      <div className="fld">
        <label className="flbl">Wallet Name</label>
        <input className="finp" id="rename-input" maxLength={32} placeholder="My Wallet" />
      </div>
      <button className="btnp" onClick={() => typeof saveWalletName === 'function' && saveWalletName()}>Save</button>
      <button className="btns" onClick={() => typeof closeSheet === 'function' && closeSheet('rename')}>Cancel</button>
    </SheetWrapper>
  )
}

function ChartExpandSheet() {
  return (
    <SheetWrapper id="chartexp" title={false} maxHeight="94vh">
      <div id="chartexp-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div id="exp-chart-label" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--t3)', marginBottom: 3 }}>BTC / USD</div>
            <div id="exp-chart-price" style={{ fontSize: 24, fontWeight: 800, color: 'var(--t1)', letterSpacing: '-.02em', lineHeight: 1 }}>$0</div>
          </div>
          <span className="chart-val" id="exp-chart-pct" style={{ fontSize: 12, padding: '4px 9px', borderRadius: 'var(--r-pill)', background: 'var(--grns)' }}>+0%</span>
        </div>
        <div style={{ position: 'relative', height: 200 }}>
          <canvas id="exp-chart-canvas" style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair', touchAction: 'none' }} />
          <div id="exp-chart-tooltip" style={{ display: 'none', position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', background: 'rgba(10,8,30,0.92)', border: '1px solid rgba(107,82,245,0.4)', borderRadius: 8, padding: '5px 10px', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10 }}>
            <div id="exp-chart-tt-price" style={{ fontSize: 13, fontWeight: 700, color: '#fff', textAlign: 'center' }} />
            <div id="exp-chart-tt-date" style={{ fontSize: 10, color: '#888', textAlign: 'center', marginTop: 1 }} />
          </div>
          <div id="exp-chart-cursor" style={{ display: 'none', position: 'absolute', top: 0, bottom: 0, width: 1, background: 'rgba(107,82,245,0.6)', pointerEvents: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: 2, marginTop: 10 }}>
          {['24H', '7D', '1M', '1Y'].map(r => (
            <div key={r} className={`crt${r === '24H' ? ' active' : ''}`} data-range={r} onClick={(e) => typeof setChartRange === 'function' && setChartRange(e.currentTarget)}>{r}</div>
          ))}
        </div>
        <div id="chart-stats-grid" style={{ marginTop: 16 }} />
      </div>
    </SheetWrapper>
  )
}

function InvoiceSheet() {
  return (
    <SheetWrapper id="invoice" title="Bitcoin Invoice" maxHeight="94vh">
      <div id="invoice-body" />
    </SheetWrapper>
  )
}

function InvHistorySheet() {
  return (
    <SheetWrapper id="invhistory" title="Invoice History">
      <div id="invhistory-body" />
    </SheetWrapper>
  )
}

function InvContactsSheet() {
  return (
    <SheetWrapper id="invcontacts" title="Contacts">
      <div id="invcontacts-body" />
    </SheetWrapper>
  )
}

function BatchSendSheet() {
  return (
    <SheetWrapper id="batchsend" title="Batch Send" maxHeight="94vh">
      <div id="batchsend-body" />
    </SheetWrapper>
  )
}

function SendConfirmSheet() {
  return (
    <SheetWrapper id="sendconfirm" title={false}>
      <div id="sendconfirm-body" />
    </SheetWrapper>
  )
}

function SendResultSheet() {
  return (
    <SheetWrapper id="sendresult" title={false}>
      <div id="sendresult-body" />
    </SheetWrapper>
  )
}

function SettleProgressSheet() {
  return (
    <SheetWrapper id="settle-progress" title={false}>
      <div id="settle-progress-body" />
    </SheetWrapper>
  )
}

function ShareSheet() {
  return (
    <SheetWrapper id="share" title="Share">
      <div id="share-body" />
    </SheetWrapper>
  )
}

function SettleResultSheet() {
  return (
    <SheetWrapper id="settleresult" title={false}>
      <div id="settleresult-body" />
    </SheetWrapper>
  )
}

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
      <TxDetailSheet />
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
    </>
  )
}
