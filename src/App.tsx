import { useEffect, useCallback } from 'react'
import useStore from './store/index.ts'

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

    // Remove SDK loading overlay for new users (no wallet to connect)
    function removeSdkLoading() {
      const el = document.getElementById('sdk-loading')
      if (el) {
        el.classList.add('fade')
        setTimeout(() => el.remove(), 400)
      }
    }

    // Wait for main.js SDK bridge to define _bootApp, then route
    // TODO: Once full migration is complete, replace with direct bootWallet() call
    let retries = 0
    const MAX_RETRIES = 100 // 10 seconds max
    function tryBoot() {
      if (hasWallet) {
        if (typeof (window as any)._bootApp === 'function') {
          useStore.getState().setBootState('booting')
          ;(window as any)._bootApp()
        } else if (retries < MAX_RETRIES) {
          retries++
          setTimeout(tryBoot, 100)
        } else {
          console.error('[ArkON] _bootApp never became available after 10s')
          removeSdkLoading()
          useStore.getState().setBootState('splash')
          useStore.getState().setSplashStep(2)
        }
      } else {
        removeSdkLoading()
        useStore.getState().setSplashStep(2)
      }
    }

    // Start after loader animation
    setTimeout(tryBoot, 360)
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
