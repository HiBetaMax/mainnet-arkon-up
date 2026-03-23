import { useEffect, useCallback } from 'react'
import useStore from './store'

// Boot
import SplashScreen from './components/boot/SplashScreen'
import UnlockGate from './components/boot/UnlockGate'

// Layout
import TopBar from './components/layout/TopBar'
import BottomNav from './components/layout/BottomNav'
import Content from './components/layout/Content'

// Sheets
import AllSheets from './components/sheets/AllSheets'

// Shared
import Toast from './components/shared/Toast'

export default function App() {
  const bootState = useStore((s) => s.bootState)
  const closeAllSheets = useStore((s) => s.closeAllSheets)

  // Early wallet check + splash routing
  useEffect(() => {
    const v2 = localStorage.getItem('arkade_wallet_privkey_mainnet_v2_enc')
    const v1 = localStorage.getItem('arkade_wallet_privkey_mainnet_v1')
    const hasWallet = !!(v2) || !!(v1 && v1.length === 64 && /^[0-9a-fA-F]+$/.test(v1))

    useStore.getState().setHasExistingWallet(hasWallet)

    function removeSdkLoading() {
      const el = document.getElementById('sdk-loading')
      if (el) {
        el.classList.add('fade')
        setTimeout(() => el.remove(), 400)
      }
    }

    function markReady() {
      removeSdkLoading()
      useStore.getState().setBootState('ready')
    }

    // Register callback for main.js boot completion
    ;(window as any)._onBootReady = markReady

    if (hasWallet) {
      // main.js boot may have already completed before React mounted
      if ((window as any)._wallet) {
        markReady()
      } else {
        // Boot in progress or not started — poll for completion
        useStore.getState().setBootState('booting')
        const check = setInterval(() => {
          if ((window as any)._wallet) {
            clearInterval(check)
            markReady()
          }
        }, 200)
        // Safety timeout
        setTimeout(() => clearInterval(check), 15000)
      }
    } else {
      removeSdkLoading()
      useStore.getState().setSplashStep(2)
    }
  }, [])

  // Escape key closes all open sheets
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllSheets()
        // Also close DOM-based sheets (legacy compat)
        document.querySelectorAll('.overlay.open').forEach((el) => el.classList.remove('open'))
      }
    },
    [closeAllSheets]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [handleEscape])

  const showApp = bootState === 'booting' || bootState === 'ready'

  return (
    <>
      <SplashScreen />
      <div id="app" style={{ opacity: showApp ? 1 : 0 }}>
        <TopBar />
        <Content />
        <BottomNav />
      </div>
      <AllSheets />
      <UnlockGate />
      <Toast />
    </>
  )
}
