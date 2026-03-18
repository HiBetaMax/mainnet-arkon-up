/**
 * SettingsPage — purely structural.
 * Wallet name/address populated by main.js via DOM IDs.
 * All sheet openings use ui.js functions.
 * React does NOT control display state.
 */
function SettingsRow({ icon, name, sub, subId, onClick, danger }) {
  return (
    <div className="sr" onClick={onClick}>
      <div className="sr-ic" style={danger ? { background: 'var(--reds)' } : undefined}>{icon}</div>
      <div className="sr-text">
        <div className="sr-nm" style={danger ? { color: 'var(--red)' } : undefined}>{name}</div>
        <div className="sr-sb" id={subId}>{sub}</div>
      </div>
      <span className="sr-ch" style={danger ? { color: 'var(--red)' } : undefined}>&rsaquo;</span>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div style={{ padding: '0 20px 28px' }}>
      <div className="pg-head-settings"><div className="pg-title">Settings</div></div>

      {/* Profile */}
      <div className="prof-tile" onClick={() => typeof openRenameWallet === 'function' && openRenameWallet()}>
        <div className="prof-av"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" /></svg></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="prof-nm" id="wallet-name-display">ArkON</div>
          <div className="prof-addr" id="wallet-addr-display"></div>
        </div>
        <div className="prof-edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 13, height: 13 }}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></div>
      </div>

      {/* General */}
      <div className="sg">
        <div className="sg-lbl">General</div>
        <div className="slist">
          <SettingsRow name="About" sub="ARKADE V1 Mainnet &middot; arkade.computer" onClick={() => typeof openAboutSheet === 'function' && openAboutSheet()} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>} />
          <SettingsRow name="Personalize Your Wallet" sub="Appearance &amp; display options" onClick={() => typeof openSheet === 'function' && openSheet('personalize')} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>} />
          <SettingsRow name="Notes" sub="Add notes to transactions" onClick={() => typeof showToast === 'function' && showToast('Notes coming soon')} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>} />
          <SettingsRow name="Notifications" sub="Tap to manage" subId="notif-status-text" onClick={() => typeof openNotifSheet === 'function' && openNotifSheet()} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>} />
          <SettingsRow name="Support" sub="Get help from the team" onClick={() => typeof openApp === 'function' && openApp('support')} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>} />
        </div>
      </div>

      {/* Security */}
      <div className="sg">
        <div className="sg-lbl">Security</div>
        <div className="slist">
          <SettingsRow name="Advanced" sub="VTXO control &amp; coin management" onClick={() => typeof openAdvanced === 'function' && openAdvanced()} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>} />
          <SettingsRow name="Wallet Password" sub="No password required" subId="sec-password-status" onClick={() => typeof openPasswordSettings === 'function' && openPasswordSettings()} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /><circle cx="12" cy="16" r="1" /></svg>} />
          <SettingsRow name="Backup" sub="View &amp; copy your hex private key" onClick={() => typeof openBackupSheet === 'function' && openBackupSheet()} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /></svg>} />
          <SettingsRow name="Reset Wallet" sub="Erase all data from this device" danger onClick={() => typeof resetWallet === 'function' && resetWallet()} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--red)' }}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg>} />
        </div>
      </div>
      <div className="spc" />
    </div>
  )
}
