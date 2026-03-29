import { useEffect, useRef, useCallback, type ReactNode } from 'react'
import useStore from '../../store'

interface SheetWrapperProps {
  id: string
  title?: string | false
  titleId?: string
  children: ReactNode
  maxHeight?: string
  zIndex?: number
  customHead?: ReactNode
  onClose?: () => void
}

/** Duration of close animation in ms — must match CSS */
const CLOSE_MS = 280

export default function SheetWrapper({ id, title, titleId, children, zIndex, customHead, onClose }: SheetWrapperProps) {
  const isOpen = useStore((s) => s.openSheets.includes(id))
  const closeSheet = useStore((s) => s.closeSheet)
  const pageRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef(false)

  // Sync Zustand state → DOM class (for CSS animations + legacy compat)
  useEffect(() => {
    const el = pageRef.current
    if (!el) return
    if (isOpen) {
      closingRef.current = false
      el.classList.remove('closing')
      el.classList.add('open')
    } else if (el.classList.contains('open') && !closingRef.current) {
      // Trigger close animation
      closingRef.current = true
      el.classList.add('closing')
      setTimeout(() => {
        el.classList.remove('open', 'closing')
        closingRef.current = false
      }, CLOSE_MS)
    }
  }, [isOpen])

  // Also listen for DOM class changes from ui.js → sync to Zustand
  useEffect(() => {
    const el = pageRef.current
    if (!el) return
    const observer = new MutationObserver(() => {
      if (closingRef.current) return // ignore changes during close animation
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

  const handleBack = useCallback(() => {
    const el = pageRef.current
    if (el && el.classList.contains('open')) {
      closingRef.current = true
      el.classList.add('closing')
      setTimeout(() => {
        el.classList.remove('open', 'closing')
        closingRef.current = false
        closeSheet(id)
        onClose?.()
      }, CLOSE_MS)
    } else {
      closeSheet(id)
      onClose?.()
    }
  }, [id, closeSheet, onClose])

  return (
    <div
      className="subpage"
      id={`sheet-${id}`}
      ref={pageRef}
      style={zIndex ? { zIndex } : undefined}
    >
      {customHead
        ? customHead
        : title !== false && (
            <div className="subpage-head">
              <button className="subpage-back" onClick={handleBack} aria-label="Back">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 20, height: 20 }}>
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="subpage-title" id={titleId || undefined}>
                {title}
              </span>
              <div style={{ width: 32 }} />
            </div>
          )}
      <div className="subpage-body">{children}</div>
    </div>
  )
}
