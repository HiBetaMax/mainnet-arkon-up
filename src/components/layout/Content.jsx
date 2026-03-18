import useStore from '../../store'
import HomePage from '../pages/HomePage'
import QRPage from '../pages/QRPage'
import TransactionsPage from '../pages/TransactionsPage'
import AppsPage from '../pages/AppsPage'
import SettingsPage from '../pages/SettingsPage'

const PAGES = {
  home: HomePage,
  qr: QRPage,
  transactions: TransactionsPage,
  apps: AppsPage,
  settings: SettingsPage,
}

export default function Content() {
  const activePage = useStore((s) => s.activePage)

  return (
    <div id="content">
      {Object.entries(PAGES).map(([id, Page]) => (
        <div key={id} className={`page${activePage === id ? ' active' : ''}`} style={{ display: activePage === id ? '' : 'none' }}>
          <Page />
        </div>
      ))}
    </div>
  )
}
