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

    // After React renders, re-populate addresses from main.js globals
    function syncAddresses() {
      const w = window as any
      if (typeof w._setLiveAddresses === 'function' && w._arkAddr) {
        w._setLiveAddresses(w._arkAddr, w._boardingAddr)
      }
    }

    // Register callback for main.js boot completion
    ;(window as any)._onBootReady = () => {
      markReady()
      // Give React one tick to render, then sync addresses
      setTimeout(syncAddresses, 150)
    }

    if (hasWallet) {
      useStore.getState().setBootState('booting')

      // Trigger boot via main.js
      let bootAttempts = 0
      function tryBoot() {
        bootAttempts++
        if (typeof (window as any)._bootApp === 'function') {
          console.log('[App] Calling _bootApp() — attempt', bootAttempts)
          ;(window as any)._bootApp()
        } else if (bootAttempts < 100) {
          setTimeout(tryBoot, 100)
        } else {
          console.error('[App] _bootApp never became available')
        }
      }
      setTimeout(tryBoot, 100)

      // Poll for _arkAddr — set after addresses are fetched in boot()
      const check = setInterval(() => {
        if ((window as any)._arkAddr) {
          clearInterval(check)
          markReady()
          setTimeout(syncAddresses, 150)
        }
      }, 200)
      // Safety timeout
      setTimeout(() => clearInterval(check), 15000)
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
