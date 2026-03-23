/**
 * RecentTx — purely structural.
 * Transaction list populated by main.js via DOM (#home-tx-list).
 * "See all" calls ui.js showPage().
 * React does NOT control content.
 */
export default function RecentTx() {
  return (
    <div className="section">
      <div className="sh">
        <span className="sh-t">Recent</span>
        <span className="sh-l" onClick={() => typeof showPage === 'function' && showPage('transactions')}>See all</span>
      </div>
      <div className="txcard" id="home-tx-list">
        {/* Populated by main.js via DOM manipulation */}
      </div>
    </div>
  )
}
