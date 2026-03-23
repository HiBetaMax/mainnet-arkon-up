/**
 * SheetWrapper — purely structural.
 * Renders the overlay/sheet HTML skeleton.
 * ui.js openSheet()/closeSheet() controls the .open class via DOM.
 * React does NOT control sheet visibility.
 */
export default function SheetWrapper({ id, title, titleId, children, maxHeight, zIndex, customHead }) {
  const overlayStyle = zIndex ? { zIndex } : undefined

  return (
    <div
      className="overlay"
      id={`sheet-${id}`}
      style={overlayStyle}
    >
      <div className="sheet" style={maxHeight ? { maxHeight } : undefined}>
        <div className="sheet-handle-row"><div className="sheet-handle" /></div>
        {customHead
          ? customHead
          : title !== false && (
              <div className="sheet-head">
                <span className="sheet-title" id={titleId || undefined}>{title}</span>
                <button className="sheet-close" onClick={() => typeof closeSheet === 'function' && closeSheet(id)}>{'\u2715'}</button>
              </div>
            )}
        <div className="sheet-body">
          {children}
        </div>
      </div>
    </div>
  )
}
