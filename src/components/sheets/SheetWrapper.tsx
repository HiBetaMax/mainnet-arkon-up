import type { ReactNode } from 'react'

interface SheetWrapperProps {
  id: string
  title?: string | false
  titleId?: string
  children: ReactNode
  maxHeight?: string
  zIndex?: number
  customHead?: ReactNode
}

export default function SheetWrapper({ id, title, titleId, children, maxHeight, zIndex, customHead }: SheetWrapperProps) {
  const overlayStyle = zIndex ? { zIndex } : undefined

  return (
    <div className="overlay" id={`sheet-${id}`} style={overlayStyle}>
      <div className="sheet" style={maxHeight ? { maxHeight } : undefined}>
        <div className="sheet-handle-row">
          <div className="sheet-handle" />
        </div>
        {customHead
          ? customHead
          : title !== false && (
              <div className="sheet-head">
                <span className="sheet-title" id={titleId || undefined}>
                  {title}
                </span>
                <button
                  className="sheet-close"
                  onClick={() => {
                    const el = document.getElementById(`sheet-${id}`)
                    if (el) el.classList.remove('open')
                    if (typeof (window as any).closeSheet === 'function') {
                      ;(window as any).closeSheet(id)
                    }
                  }}
                >
                  {'\u2715'}
                </button>
              </div>
            )}
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}
