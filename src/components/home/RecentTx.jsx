import useStore from '../../store'

export default function RecentTx() {
  const setActivePage = useStore((s) => s.setActivePage)

  return (
    <div className="section">
      <div className="sh">
        <span className="sh-t">Recent</span>
        <span className="sh-l" onClick={() => setActivePage('transactions')}>See all</span>
      </div>
      <div className="txcard" id="home-tx-list">
        {/* Populated by main.js via DOM manipulation */}
      </div>
    </div>
  )
}
