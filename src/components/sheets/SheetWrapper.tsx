import { useEffect, useRef, type ReactNode } from 'react'
import useStore from '../../store'

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
  const isOpen = useStore((s) => s.openSheets.includes(id))
  const closeSheet = useStore((s) => s.closeSheet)
  const overlayRef = useRef<HTMLDivElement>(null)
  const overlayStyle = zIndex ? { zIndex } : undefined

  // Sync Zustand state → DOM class (for CSS animations)
  useEffect(() => {
    const el = overlayRef.current
    if (!el) return
    if (isOpen) {
      el.classList.add('open')
    } else {
      el.classList.remove('open')
    }
  }, [isOpen])

  // Also listen for DOM class changes from ui.js → sync to Zustand
  useEffect(() => {
    const el = overlayRef.current
    if (!el) return
    const observer = new MutationObserver(() => {
      const hasOpen = el.classList.contains('open')
      const storeHas = useStore.getState().openSheets.includes(id)
      if (hasOpen && !storeHas) {
        useStore.getState().openSheet(id)
      } else if (!hasOpen && storeHas) {
        useStore.getState().closeSheet(id)
      }
    })
    observer.observe(el, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [id])

  const handleClose = () => {
    closeSheet(id)
    // Also remove DOM class directly for immediate visual feedback
    overlayRef.current?.classList.remove('open')
  }

  return (
    <div className="overlay" id={`sheet-${id}`} ref={overlayRef} style={overlayStyle}>
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
                <button className="sheet-close" onClick={handleClose}>
                  {'\u2715'}
                </button>
              </div>
            )}
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}
