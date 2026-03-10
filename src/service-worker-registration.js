let registrationStarted = false

export function registerServiceWorker() {
  if (registrationStarted) return
  registrationStarted = true

  if (!('serviceWorker' in navigator)) return
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      console.log('[ArkON] Service worker registered')
    } catch (error) {
      console.warn('[ArkON] Service worker registration failed:', error)
    }
  })
}
