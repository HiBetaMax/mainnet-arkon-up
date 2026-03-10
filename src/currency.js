const DEFAULT_PRICES = { USD: 96420, EUR: 88640, CHF: 85910 };
const SYMBOLS = { USD: '$', EUR: '€', CHF: 'CHF ' };

function getPrice(currency) {
  const live = window._livePrices && Number(window._livePrices[currency]);
  if (Number.isFinite(live) && live > 0) return live;
  if (currency === 'USD' && Number.isFinite(window._btcUsd) && window._btcUsd > 0) return Number(window._btcUsd);
  return DEFAULT_PRICES[currency] || DEFAULT_PRICES.USD;
}

export function getUserCurrency() {
  return document.getElementById('cur-settings-sel')?.value || 'USD';
}

export function getCurrencySymbol(currency = getUserCurrency()) {
  return SYMBOLS[currency] || '$';
}

export function formatFiatFromSats(sats, currency = getUserCurrency(), { includeCode = true } = {}) {
  const amount = Number(sats || 0);
  if (!Number.isFinite(amount) || amount <= 0) return includeCode ? `≈ ${getCurrencySymbol(currency)}0.00 ${currency}` : `≈ ${getCurrencySymbol(currency)}0.00`;
  const fiat = (amount * getPrice(currency) / 1e8).toFixed(2);
  return includeCode ? `≈ ${getCurrencySymbol(currency)}${fiat} ${currency}` : `≈ ${getCurrencySymbol(currency)}${fiat}`;
}

export function parseDisplayedSats(text) {
  const raw = String(text || '').replace(/[^0-9]/g, '');
  return raw ? parseInt(raw, 10) : 0;
}

export function refreshCurrencyLabels() {
  const currency = getUserCurrency();
  const qrFiatCur = document.getElementById('qr-ln-fiat-cur');
  if (qrFiatCur) qrFiatCur.textContent = currency;

  const mappings = [
    ['qr-ln-amt-display', 'qr-ln-fiat-display'],
    ['ln-invoice-amt-display', 'ln-invoice-fiat-label'],
  ];

  for (const [amountId, targetId] of mappings) {
    const amountEl = document.getElementById(amountId);
    const targetEl = document.getElementById(targetId);
    if (!amountEl || !targetEl) continue;
    const sats = parseDisplayedSats(amountEl.textContent);
    targetEl.textContent = sats > 0 ? formatFiatFromSats(sats, currency) : '';
  }

  const sendConfirmAmount = document.getElementById('sc-amount-raw');
  const sendConfirmFiat = document.getElementById('sc-fiat-display');
  if (sendConfirmAmount && sendConfirmFiat) {
    const sats = parseDisplayedSats(sendConfirmAmount.value || sendConfirmAmount.textContent);
    if (sats > 0) sendConfirmFiat.textContent = formatFiatFromSats(sats, currency, { includeCode: false });
  }
}
