import useStore from '../../store'
import HomePage from '../pages/HomePage'
import QRPage from '../pages/QRPage'
import TransactionsPage from '../pages/TransactionsPage'
import AppsPage from '../pages/AppsPage'
import SettingsPage from '../pages/SettingsPage'

const PAGES = [
  { id: 'home', Component: HomePage },
  { id: 'qr', Component: QRPage },
  { id: 'transactions', Component: TransactionsPage },
  { id: 'apps', Component: AppsPage },
  { id: 'settings', Component: SettingsPage },
] as const

export default function Content() {
  const activePage = useStore((s) => s.activePage)

  return (
    <div id="content">
      {PAGES.map(({ id, Component }) => (
        <div
          key={id}
          id={`page-${id}`}
          className={`page${activePage === id ? ' active' : ''}`}
        >
          <Component />
        </div>
      ))}
    </div>
  )
}
