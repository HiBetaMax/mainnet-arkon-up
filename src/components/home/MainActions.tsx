import useStore from '../../store'

export default function MainActions() {
  const openSheet = useStore((s) => s.openSheet)

  const handleOpen = (id: string) => {
    openSheet(id)
  }

  return (
    <div className="main-actions">
      <button className="main-btn send" onClick={() => handleOpen('send')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
        Send
      </button>
      <button className="main-btn receive" onClick={() => handleOpen('receive')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <line x1="12" y1="5" x2="12" y2="19" />
          <polyline points="19 12 12 19 5 12" />
        </svg>
        Receive
      </button>
    </div>
  )
}
