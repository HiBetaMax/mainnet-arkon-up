import { useCallback } from 'react'
import useStore from '../../store'

export default function SheetWrapper({ id, title, titleId, children, maxHeight, zIndex, customHead, onClose }) {
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

  const overlayStyle = zIndex ? { zIndex } : undefined

  return (
    <div
      className={`overlay${isOpen ? ' open' : ''}`}
      id={`sheet-${id}`}
      onClick={handleOverlayClick}
      style={overlayStyle}
    >
      <div className="sheet" style={maxHeight ? { maxHeight } : undefined}>
        <div className="sheet-handle-row"><div className="sheet-handle" /></div>
        {customHead
          ? customHead
          : title !== false && (
              <div className="sheet-head">
                <span className="sheet-title" id={titleId || undefined}>{title}</span>
                <button className="sheet-close" onClick={handleClose}>{'\u2715'}</button>
              </div>
            )}
        <div className="sheet-body">
          {children}
        </div>
      </div>
    </div>
  )
}
