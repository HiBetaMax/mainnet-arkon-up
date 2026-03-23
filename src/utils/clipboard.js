/**
 * Copy text to clipboard with optional auto-clear after a delay.
 * @param {string} text - Text to copy
 * @param {number} [autoClearMs=0] - Auto-clear delay in ms (0 = no auto-clear)
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text, autoClearMs = 0) {
  try {
    await navigator.clipboard.writeText(text)
    if (autoClearMs > 0) {
      setTimeout(() => {
        navigator.clipboard.writeText('').catch(() => {})
      }, autoClearMs)
    }
    return true
  } catch {
    return false
  }
}
