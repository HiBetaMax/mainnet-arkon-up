import useStore from '../../store'

export default function TopBar() {
  const walletName = useStore((s) => s.walletName)
  const showToast = useStore((s) => s.showToast)

  return (
    <div id="topbar">
      <div className="logo-row">
        <span style={{ width: 26, height: 26, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 26, height: 26 }}>
            <rect width="26" height="26" rx="7" fill="var(--acc2)" />
            <rect x="4" y="8" width="18" height="11" rx="2" fill="white" fillOpacity="0.9" />
            <rect x="7" y="5" width="3" height="4" rx="1" fill="white" fillOpacity="0.65" />
            <rect x="16" y="5" width="3" height="4" rx="1" fill="white" fillOpacity="0.65" />
            <circle cx="9.5" cy="13" r="1.8" fill="#0e3a8a" />
            <circle cx="16.5" cy="13" r="1.8" fill="#0e3a8a" />
            <rect x="12" y="15.5" width="2" height="1.8" rx="0.6" fill="#0e3a8a" />
            <rect x="2" y="13" width="2.5" height="2.5" rx="0.5" fill="white" fillOpacity="0.5" />
            <rect x="21.5" y="13" width="2.5" height="2.5" rx="0.5" fill="white" fillOpacity="0.5" />
          </svg>
        </span>
        <span className="logo-text">{walletName}</span>
      </div>
      <div className="topbar-r">
        <div className="ic-btn" onClick={() => showToast('No new notifications')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        </div>
        <div className="ic-btn" onClick={() => useStore.getState().setActivePage('settings')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8" />
          </svg>
        </div>
      </div>
    </div>
  )
}
