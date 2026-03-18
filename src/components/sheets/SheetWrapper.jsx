import { useCallback } from 'react'
import useStore from '../../store'

export default function SheetWrapper({ id, title, children, maxHeight, onClose }) {
  const openSheets = useStore((s) => s.openSheets)
  const closeSheet = useStore((s) => s.closeSheet)
  const isOpen = openSheets.includes(id)

  const handleClose = useCallback(() => {
    closeSheet(id)
    if (onClose) onClose()
  }, [closeSheet, id, onClose])

  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget) handleClose()
  }, [handleClose])

  return (
    <div
      className={`overlay${isOpen ? ' open' : ''}`}
      id={`sheet-${id}`}
      onClick={handleOverlayClick}
    >
      <div className="sheet" style={maxHeight ? { maxHeight } : undefined}>
        <div className="sheet-handle-row"><div className="sheet-handle" /></div>
        {title !== false && (
          <div className="sheet-head">
            <span className="sheet-title" id={id === 'txdetail' ? 'txd-title' : undefined}>{title}</span>
            <button className="sheet-close" onClick={handleClose}>{'\u2715'}</button>
          </div>
        )}
        <div className="sheet-body" id={id === 'txdetail' ? 'txd-body' : undefined}>
          {children}
        </div>
      </div>
    </div>
  )
}
