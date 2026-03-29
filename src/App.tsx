import { useEffect, useCallback } from 'react'
import useStore from './store'
import { bootWallet, startAutoLockListeners } from './services/wallet'
import { initWindowBridge } from './services/bridge'

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

  useEffect(() => {
    // Set up window bridge so ui.js can read store data
    // MUST run before boot — sets __REACT_BOOT_ACTIVE to prevent main.js double-boot
    initWindowBridge()

    const v2 = localStorage.getItem('arkade_wallet_privkey_mainnet_v2_enc')
    const v1 = localStorage.getItem('arkade_wallet_privkey_mainnet_v1')
    const hasWallet = !!(v2) || !!(v1 && v1.length === 64 && /^[0-9a-fA-F]+$/.test(v1))

    useStore.getState().setHasExistingWallet(hasWallet)

    // Remove SDK loading overlay
    function removeSdkLoading() {
      const el = document.getElementById('sdk-loading')
      if (el) {
        el.classList.add('fade')
        setTimeout(() => el.remove(), 400)
      }
    }

    if (hasWallet) {
      // Boot wallet directly via typed service (not main.js)
      bootWallet().then(() => {
        removeSdkLoading()
        // Sync addresses to ui.js after boot
        const w = window as any
        if (typeof w._setLiveAddresses === 'function') {
          const store = useStore.getState()
          w._setLiveAddresses(store.arkAddress, store.boardingAddress)
        }
        startAutoLockListeners()
      }).catch((err) => {
        console.error('[App] Boot failed:', err)
        removeSdkLoading()
      })
    } else {
      removeSdkLoading()
      useStore.getState().setSplashStep(2)
    }
  }, [])

  // Escape key closes all open sheets
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const openPages = document.querySelectorAll('.subpage.open')
        if (openPages.length > 0) {
          openPages.forEach((el) => el.classList.add('closing'))
          setTimeout(() => {
            openPages.forEach((el) => el.classList.remove('open', 'closing'))
            closeAllSheets()
          }, 280)
        } else {
          closeAllSheets()
          document.querySelectorAll('.overlay.open').forEach((el) => el.classList.remove('open'))
        }
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
        <div id="app-body">
          <Content />
          <AllSheets />
        </div>
        <BottomNav />
      </div>
      <UnlockGate />
      <Toast />
    </>
  )
}
