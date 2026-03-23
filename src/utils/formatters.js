/**
 * Format a number as a short fiat string.
 * @param {number} sats
 * @param {number} btcPrice - BTC price in target currency
 * @param {string} [symbol='$']
 * @returns {string}
 */
export function satsToFiat(sats, btcPrice, symbol = '$') {
  const val = (sats * btcPrice) / 1e8
  return symbol + val.toFixed(2)
}

/**
 * Format sats with locale separators.
 * @param {number} sats
 * @returns {string}
 */
export function formatSats(sats) {
  return Number(sats).toLocaleString()
}

/**
 * Truncate an address to first/last N chars.
 * @param {string} addr
 * @param {number} [start=8]
 * @param {number} [end=6]
 * @returns {string}
 */
export function shortAddress(addr, start = 8, end = 6) {
  if (!addr || addr.length <= start + end + 3) return addr || ''
  return addr.slice(0, start) + '…' + addr.slice(-end)
}

/**
 * Format a Date object to a display string.
 * @param {Date} date
 * @returns {{ dateStr: string, timeStr: string }}
 */
export function formatDateTime(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    return { dateStr: 'Pending', timeStr: '' }
  }
  return {
    dateStr: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    timeStr: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  }
}
