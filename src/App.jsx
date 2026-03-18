import { useEffect } from 'react'
import useStore from './store'

// Boot
import SplashScreen from './components/boot/SplashScreen'
import UnlockGate from './components/boot/UnlockGate'
import SdkLoading from './components/boot/SdkLoading'

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

  // Early wallet check + splash routing
  useEffect(() => {
    const v2 = localStorage.getItem('arkade_wallet_privkey_mainnet_v2_enc')
    const v1 = localStorage.getItem('arkade_wallet_privkey_mainnet_v1')
    const hasWallet = !!(v2) || !!(v1 && v1.length === 64 && /^[0-9a-fA-F]+$/.test(v1))
    window._hasExistingWallet = hasWallet

    useStore.getState().setHasExistingWallet(hasWallet)

    // Animate loader bar
    const bar = document.getElementById('loader-bar')
    setTimeout(() => { if (bar) bar.style.width = '100%' }, 80)

    // Wait for main.js SDK bridge to define _bootApp, then route
    function tryBoot() {
      if (hasWallet) {
        if (typeof window._bootApp === 'function') {
          useStore.getState().setBootState('booting')
          window._bootApp()
        } else {
          // main.js hasn't loaded yet — retry every 100ms
          setTimeout(tryBoot, 100)
        }
      } else {
        useStore.getState().setSplashStep(2)
      }
    }

    // Start after loader animation
    setTimeout(tryBoot, 360)
  }, [])

  // Escape key closes all open sheets via DOM (matches ui.js pattern)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.overlay.open').forEach(el => el.classList.remove('open'))
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const showApp = bootState === 'booting' || bootState === 'ready'

  return (
    <>
      <SplashScreen />
      <SdkLoading />
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
