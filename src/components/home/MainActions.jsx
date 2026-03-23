/**
 * MainActions — purely structural.
 * Calls ui.js openSheet() for send/receive.
 * React does NOT manage sheet state.
 */
export default function MainActions() {
  return (
    <div className="main-actions">
      <button className="main-btn send" onClick={() => typeof openSheet === 'function' && openSheet('send')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" /></svg>
        Send
      </button>
      <button className="main-btn receive" onClick={() => typeof openSheet === 'function' && openSheet('receive')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
        Receive
      </button>
    </div>
  )
}
