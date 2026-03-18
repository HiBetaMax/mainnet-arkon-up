import { useState } from 'react'

const PILL_LABELS = { all: 'All', finance: 'Finance', collectibles: 'Collectibles', games: 'Games' }

export default function AppsPage() {
  const [filter, setFilter] = useState('all')

  return (
    <div style={{ padding: '0 20px 28px' }}>
      <div className="pg-head"><div className="pg-title">Apps</div><div className="pg-sub">Bitcoin services &amp; tools</div></div>

      <div className="apps-pills" role="tablist" aria-label="Filter apps">
        {Object.entries(PILL_LABELS).map(([k, v]) => (
          <button key={k} className={`app-pill${filter === k ? ' active' : ''}`} data-app-filter={k} onClick={() => setFilter(k)}>{v}</button>
        ))}
      </div>

      {(filter === 'all' || filter === 'finance') && (
        <div className="apps-section" data-app-section="finance">
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--t3)', marginBottom: 10 }}>Finance</div>
          <div className="apps-grid" style={{ marginBottom: 24 }}>
            <div className="apc boltz" onClick={() => typeof openApp === 'function' && openApp('boltz')}><div className="apci"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 2l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 22l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg></div><div className="ap-nm">Boltz</div><div className="ap-ds">Swap between Arkade &amp; Lightning</div></div>
            <div className="apc lendasat" onClick={() => typeof openApp === 'function' && openApp('lendasat')}><div className="apci"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5A2.5 2.5 0 0112 7a2.5 2.5 0 010 5 2.5 2.5 0 000 5A2.5 2.5 0 0014.5 14.5" /></svg></div><div className="ap-nm">LendaSat</div><div className="ap-ds">Borrow against your sats</div></div>
            <div className="apc swap" onClick={() => typeof openApp === 'function' && openApp('swap')}><div className="apci"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 01-4 4H3" /></svg></div><div className="ap-nm">LendaSwap</div><div className="ap-ds">Swap Bitcoin to USDC instantly</div></div>
            <div className="apc" style={{ background: 'var(--surf)' }} onClick={() => typeof openInvoice === 'function' && openInvoice()}><div className="apci" style={{ background: 'rgba(48,208,104,.12)', color: 'var(--grn)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg></div><div className="ap-nm">Invoice</div><div className="ap-ds">Create &amp; send Bitcoin invoices</div></div>
            <div className="apc" style={{ background: 'var(--surf)' }} onClick={() => typeof openBatchSend === 'function' && openBatchSend()}><div className="apci" style={{ background: 'rgba(59,130,246,.12)', color: 'var(--acc2)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg></div><div className="ap-nm">Batch Send</div><div className="ap-ds">Send Ark payments in bulk</div></div>
            <div className="apc fuji disabled"><div className="ap-soon">Soon</div><div className="apci"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="12 2 22 20 2 20" /><line x1="12" y1="8" x2="12" y2="14" /><line x1="9" y1="14" x2="15" y2="14" /></svg></div><div className="ap-nm">Fuji Money</div><div className="ap-ds">Synthetic assets on Bitcoin</div></div>
          </div>
        </div>
      )}

      {(filter === 'all' || filter === 'collectibles') && (
        <div className="apps-section" data-app-section="collectibles">
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--t3)', marginBottom: 10 }}>Collectibles</div>
          <div className="apps-grid" style={{ marginBottom: 24 }}>
            <div className="apc disabled"><div className="ap-soon">Soon</div><div className="apci" style={{ background: 'rgba(155,125,224,.15)', color: 'var(--acc2)' }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg></div><div className="ap-nm">Ark Assets</div><div className="ap-ds">Bitcoin-native digital assets on Ark</div></div>
          </div>
        </div>
      )}

      {(filter === 'all' || filter === 'games') && (
        <div className="apps-section" data-app-section="games">
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--t3)', marginBottom: 10 }}>Games</div>
          <div className="apps-grid" style={{ marginBottom: 24 }}>
            <div className="apc" style={{ background: 'var(--surf)' }} onClick={() => typeof openApp === 'function' && openApp('satsrun')}><div className="apci" style={{ background: 'rgba(155,125,224,.15)', color: 'var(--acc2)' }}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" /></svg></div><div className="ap-nm">Sats Run</div><div className="ap-ds">150 sats per play &middot; dodge blocks</div></div>
            <div className="apc" style={{ background: 'var(--surf)' }} onClick={() => typeof openApp === 'function' && openApp('spaceinvaders')}><div className="apci" style={{ background: 'rgba(48,208,104,.12)', color: 'var(--grn)' }}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 17h2v2H2v-2zm2-2h2v2H4v-2zm2 2h2v2H6v-2zm10 0h2v2h-2v-2zm2-2h2v2h-2v-2zm2 2h2v2h-2v-2zM6 7H4V5h2V3h2v2h8V3h2v2h2v2h-2v2h-2V7H6v2H4V7H2V5h2v2h2zm2 2h8v2H8V9zm-2 2h2v2H6v-2zm10 0h2v2h-2v-2zm-8 2h8v2H8v-2zm2 2h4v2h-4v-2zm0-8h4v2h-4V7z" /></svg></div><div className="ap-nm">Space Invaders</div><div className="ap-ds">150 sats per play &middot; shoot aliens</div></div>
            <div className="apc" style={{ background: 'var(--surf)' }} onClick={() => typeof openApp === 'function' && openApp('pixelpaint')}><div className="apci" style={{ background: 'rgba(255,100,100,.12)', color: '#ff6464' }}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34a1 1 0 00-1.41 0L9 12.25 11.75 15l8.96-8.96a1 1 0 000-1.41z" /></svg></div><div className="ap-nm">Pixel Paint</div><div className="ap-ds">Deposit sats &middot; 1 sat per cell</div></div>
            <div className="apc disabled"><div className="ap-soon">Soon</div><div className="apci" style={{ background: 'rgba(41,182,246,.12)', color: '#29b6f6' }}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 4H5C3.35 4 2 5.35 2 7v10c0 1.65 1.35 3 3 3h14c1.65 0 3-1.35 3-3V7c0-1.65-1.35-3-3-3zm-7 11.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 6.5 12 6.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-7c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5-1.12-2.5-2.5-2.5zM5.5 9h-1V8h1v1zm0 2h-1v-1h1v1zm0 2h-1v-1h1v1zm13 2h-1v-1h1v1zm0-2h-1v-1h1v1zm0-2h-1V9h1v1z" /></svg></div><div className="ap-nm">Lightning Poker</div><div className="ap-ds">Permissionless poker on Lightning</div></div>
            <div className="apc disabled"><div className="ap-soon">Soon</div><div className="apci" style={{ background: 'rgba(224,149,61,.12)', color: 'var(--amb)' }}><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 4l5 2.18V11c0 3.5-2.33 6.79-5 7.93-2.67-1.14-5-4.43-5-7.93V7.18L12 5zm-1 3v4h2V8h-2zm0 6v2h2v-2h-2z" /></svg></div><div className="ap-nm">Tournaments</div><div className="ap-ds">Compete in sats prize pools</div></div>
          </div>
        </div>
      )}
    </div>
  )
}
