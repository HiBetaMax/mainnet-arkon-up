import HomePage from '../pages/HomePage'
import QRPage from '../pages/QRPage'
import TransactionsPage from '../pages/TransactionsPage'
import AppsPage from '../pages/AppsPage'
import SettingsPage from '../pages/SettingsPage'

export default function Content() {
  return (
    <div id="content">
      <div className="page active" id="page-home">
        <HomePage />
      </div>
      <div className="page" id="page-qr">
        <QRPage />
      </div>
      <div className="page" id="page-transactions">
        <TransactionsPage />
      </div>
      <div className="page" id="page-apps">
        <AppsPage />
      </div>
      <div className="page" id="page-settings">
        <SettingsPage />
      </div>
    </div>
  )
}
