import useStore from '../../store'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in', label: 'Received' },
  { id: 'out', label: 'Sent' },
  { id: 'ln', label: 'Lightning' },
  { id: 'pnd', label: 'Pending' },
]

export default function TransactionsPage() {
  const txFilter = useStore((s) => s.txFilter)
  const setTxFilter = useStore((s) => s.setTxFilter)

  return (
    <div style={{ padding: '0 20px 28px' }}>
      <div className="pg-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="pg-title">Transactions</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => typeof openExportSheet === 'function' && openExportSheet()} style={{ background: 'var(--accs)', border: '1px solid var(--acc)', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700, color: 'var(--acc2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            Export
          </button>
          <button onClick={() => typeof refreshTransactionsPage === 'function' && refreshTransactionsPage()} id="tx-refresh-btn" style={{ background: 'var(--bg3)', border: '1px solid var(--bdr2)', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 700, color: 'var(--t2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg id="tx-refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg>
            Refresh
          </button>
        </div>
      </div>
      <div className="fscroll">
        {FILTERS.map(f => (
          <div key={f.id} className={`ftg${txFilter === f.id ? ' active' : ''}`} data-filter={f.id} onClick={() => { setTxFilter(f.id); typeof setFil === 'function' && setFil(document.querySelector(`.ftg[data-filter="${f.id}"]`), f.id) }}>{f.label}</div>
        ))}
      </div>
      <div className="txcard" id="tx-list" />
      <div id="load-more-wrap" style={{ marginTop: 14 }}>
        <button className="btns" style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} onClick={() => typeof loadMoreTx === 'function' && loadMoreTx()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 15, height: 15 }}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg>
          Load More
        </button>
      </div>
      <div id="load-more-end" style={{ display: 'none', textAlign: 'center', padding: '16px 0' }}>
        <span style={{ fontSize: 12, color: 'var(--t3)', fontWeight: 500 }}>You've reached the beginning</span>
      </div>
    </div>
  )
}
