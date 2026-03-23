import { useCallback, type ReactNode } from 'react'
import useStore from '../../store/index.ts'
import type { Page } from '../../store/index.ts'

interface NavItem {
  id: Page
  label: string
  icon: ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'apps',
    label: 'Apps',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: 'qr',
    label: 'QR',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <path d="M14 14h3v3h-3zM20 14v3h-3M14 20h3M20 20h0" />
      </svg>
    ),
  },
  {
    id: 'transactions',
    label: 'History',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const setActivePage = useStore((s) => s.setActivePage)

  const handleNav = useCallback(
    (id: Page) => {
      setActivePage(id)
      // Legacy compat: toggle DOM classes for CSS transitions
      document.querySelectorAll('.page').forEach((x) => x.classList.remove('active'))
      document.querySelectorAll('.ni').forEach((x) => x.classList.remove('active'))
      document.getElementById(`page-${id}`)?.classList.add('active')
      document.getElementById(`nav-${id}`)?.classList.add('active')

      // Scroll content to top
      const content = document.getElementById('content')
      if (content) content.scrollTop = 0

      // Legacy: trigger QR init or tx refresh
      if (id === 'qr' && typeof (window as any).initMainQR === 'function') {
        ;(window as any).initMainQR()
      }
      if (id === 'transactions' && typeof (window as any).refreshTransactionsPage === 'function') {
        ;(window as any).refreshTransactionsPage()
      }
    },
    [setActivePage]
  )

  return (
    <div id="bnav">
      {NAV_ITEMS.map((item) => (
        <div
          key={item.id}
          id={`nav-${item.id}`}
          className={`ni${item.id === 'home' ? ' active' : ''}`}
          onClick={() => handleNav(item.id)}
        >
          <div className="nbar" />
          {item.icon}
          <span className="nl">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
