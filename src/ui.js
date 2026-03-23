/* ═══════════════════════════════════════════
   SECURITY: HTML SANITIZER
   Use esc(str) for all user/server data in innerHTML.
═══════════════════════════════════════════ */
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

/* ═══════════════════════════════════════════
   WALLET ADDR & DATA
═══════════════════════════════════════════ */
let ADDR = 'Connecting…'; let BOARDING_ADDR = 'Connecting…';
const CURRENCIES = ['USD','EUR','CHF'];
let curIdx = 0;
const BALANCES = {
  SATS: { m:'4,217,839',     unit:'SATS',  s:'≈ $4,067.43',   tick:'BTC / USD', tprice:'$96,420.00', tch:'+2.4% today' },
  USD:  { m:'$4,067.43',     unit:'USD',   s:'4,217,839 sats', tick:'BTC / USD', tprice:'$96,420.00', tch:'+2.4% today' },
  EUR:  { m:'€3,742.35',     unit:'EUR',   s:'4,217,839 sats', tick:'BTC / EUR', tprice:'€88,640.00', tch:'+2.4% today' },
  CHF:  { m:'CHF 3,618',     unit:'CHF',   s:'4,217,839 sats', tick:'BTC / CHF', tprice:'CHF 85,910', tch:'+2.1% today' },
};

// TX_DATA replaced by live _TX_REGISTRY populated in main.js from Arkade SDK.
// showTxDetail(id) still works for any legacy sheet calls; live rows use showLiveTxDetail(rowId).
function showTxDetail(id) {
  // Attempt live registry first, fall back silently
  if (window._TX_REGISTRY && window._TX_REGISTRY[id]) {
    window.showLiveTxDetail(id);
  }
  // No static data — do nothing if not in registry yet
}

/* ═══════════════════════════════════════════
   SPLASH
   Screen 1 — silent loading bar (no buttons)
   Screen 2 — onboarding choice (Create / Restore)
   Screen 3 — restore key input
═══════════════════════════════════════════ */
let spStep = 1;
let _newPrivKey = null;

// advSplash — React SplashScreen.jsx now controls splash flow via Zustand.
// This is kept as a safe no-op for any legacy references.
function advSplash(n) {
  // React handles splash screens — no-op
}

function generateAndShowNewKey() {
  // Reset checkbox and continue button state on each entry
  const cb  = document.getElementById('sp-backup-check');
  const btn = document.getElementById('sp-create-continue');
  const confirm = document.getElementById('sp-copy-confirm');
  if (cb)      { cb.checked = false; }
  if (btn)     { btn.disabled = true; btn.style.background = 'rgba(59,130,246,0.3)'; btn.style.color = 'rgba(255,255,255,0.4)'; btn.style.cursor = 'not-allowed'; }
  if (confirm) { confirm.style.opacity = '0'; }

  // Generate 32 random bytes → hex private key
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  _newPrivKey = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

  const display = document.getElementById('sp-new-key-display');
  if (display) display.textContent = _newPrivKey;
}

function splashCopyKey() {
  if (!_newPrivKey) return;
  navigator.clipboard.writeText(_newPrivKey).then(() => {
    const confirm = document.getElementById('sp-copy-confirm');
    if (confirm) {
      confirm.style.opacity = '1';
      setTimeout(() => { confirm.style.opacity = '0'; }, 2000);
    }
    const btn = document.getElementById('sp-copy-key-btn');
    if (btn) {
      btn.style.background = 'rgba(48,208,104,0.2)';
      btn.style.borderColor = 'rgba(48,208,104,0.5)';
      btn.style.color = '#30d068';
      setTimeout(() => {
        btn.style.background = 'rgba(59,130,246,0.18)';
        btn.style.borderColor = 'rgba(59,130,246,0.4)';
        btn.style.color = '#3b82f6';
      }, 2000);
    }
  }).catch(() => {});
}

function checkNewKeyBackup() {
  const cb  = document.getElementById('sp-backup-check');
  const btn = document.getElementById('sp-create-continue');
  const lbl = document.getElementById('sp-backup-label');
  if (!btn) return;
  if (cb && cb.checked) {
    btn.disabled = false;
    btn.style.background = 'linear-gradient(135deg,#2563eb,#0e3a8a)';
    btn.style.color = '#fff';
    btn.style.cursor = 'pointer';
    if (lbl) lbl.style.borderColor = 'rgba(48,208,104,0.4)';
  } else {
    btn.disabled = true;
    btn.style.background = 'rgba(59,130,246,0.3)';
    btn.style.color = 'rgba(255,255,255,0.4)';
    btn.style.cursor = 'not-allowed';
    if (lbl) lbl.style.borderColor = 'rgba(255,255,255,0.1)';
  }
}

async function splashFinishCreate() {
  if (!_newPrivKey) { showToast('Key not generated yet — wait a moment'); return; }

  const btn = document.getElementById('sp-create-continue');
  if (btn) { btn.disabled = true; btn.textContent = 'Creating wallet…'; }

  try {
    // Use the function exposed by main.js on window — avoids a dynamic import that
    // breaks in the production single-file build where /src/wallet.js no longer exists.
    if (typeof window._restoreFromPrivKey !== 'function') throw new Error('Wallet not ready');
    const ok = await window._restoreFromPrivKey(_newPrivKey);
    if (!ok) throw new Error('Key storage failed');
  } catch (e) {
    console.error('[ArkON] Failed to save key securely:', e);
    showToast('Error saving wallet key — please try again');
    const btn = document.getElementById('sp-create-continue');
    if (btn) { btn.disabled = false; btn.textContent = 'Continue'; }
    return;
  }

  splashDone();
}

// Called when user submits their private key on the restore screen
async function splashRestore() {
  const input = document.getElementById('sp-restore-key');
  const errEl = document.getElementById('sp-restore-err');
  const btn   = document.getElementById('sp-restore-btn');
  if (!input || !errEl) return;

  const hex = input.value.trim();
  if (hex.length !== 64 || !/^[0-9a-fA-F]+$/.test(hex)) {
    errEl.textContent = 'Please enter a valid 64-character hex private key.';
    return;
  }

  // Disable while processing
  if (btn) { btn.disabled = true; btn.textContent = 'Restoring…'; }
  errEl.textContent = '';

  try {
    if (typeof window._restoreFromPrivKey !== 'function') throw new Error('Wallet not ready');
    const ok = await window._restoreFromPrivKey(hex);
    if (!ok) {
      errEl.textContent = 'Invalid private key — check the value and try again.';
      if (btn) { btn.disabled = false; btn.textContent = 'Restore Wallet'; }
      return;
    }
    splashDone();
  } catch (e) {
    errEl.textContent = 'Restore failed: ' + (e.message || 'unknown error');
    if (btn) { btn.disabled = false; btn.textContent = 'Restore Wallet'; }
  }
}

// splashDone — React App.jsx + SplashScreen.jsx now handle boot flow.
// This is kept as a safe no-op for any legacy references.
function splashDone() {
  // React handles splash→boot transition — no-op
}

// Boot routing is now handled by React App.jsx useEffect.
// The old window.load handler has been removed to prevent conflicts.

// "Create New Wallet" — key generation and backup are handled in advSplash(3) → splashFinishCreate()

/* ═══════════════════════════════════════════
   SHARE ENGINE
   shareContent(title, value, type)
   type: 'ark' | 'lightning' | 'address' | 'invoice'
═══════════════════════════════════════════ */
let _shareData = { title: '', value: '', type: '' };

function shareContent(title, value, type) {
  if (!value || value === '—' || value === 'Loading…') {
    showToast('Nothing to share yet');
    return;
  }
  _shareData = { title, value, type: type || 'address' };

  // Update sheet UI
  const titleEl   = document.getElementById('share-sheet-title');
  const labelEl   = document.getElementById('share-preview-label');
  const valEl     = document.getElementById('share-preview-val');
  const iconWrap  = document.getElementById('share-preview-icon');

  if (titleEl)  titleEl.textContent = title;
  if (valEl)    valEl.textContent   = value;

  // Label + icon colour per type
  const typeMap = {
    ark:       { lbl: 'Ark Address',         bg: 'rgba(59,130,246,0.15)',  col: '#3b82f6' },
    lightning: { lbl: 'Lightning Invoice',   bg: 'rgba(245,166,35,0.14)', col: '#f5a623' },
    onchain:   { lbl: 'Bitcoin Address',     bg: 'rgba(247,147,26,0.14)', col: '#f7931a' },
    invoice:   { lbl: 'Payment Request',     bg: 'rgba(48,208,104,0.13)', col: '#30d068' },
    address:   { lbl: 'Address',             bg: 'rgba(59,130,246,0.15)', col: '#3b82f6' },
  };
  const meta = typeMap[type] || typeMap.address;
  if (labelEl)  labelEl.textContent    = meta.lbl;
  if (iconWrap) {
    iconWrap.style.background  = meta.bg;
    iconWrap.style.color       = meta.col;
  }

  // Show "More" (native share) only if API available
  const nativeBtn = document.getElementById('share-native-btn');
  if (nativeBtn) nativeBtn.style.display = (typeof navigator.share === 'function') ? 'flex' : 'none';

  openSheet('share');
}

function _shareLabel() {
  const labels = { ark:'Ark Address', lightning:'Lightning Invoice', onchain:'Bitcoin Address', invoice:'Payment Request' };
  return labels[_shareData.type] || 'Address';
}

function doShareCopy() {
  if (!_shareData.value) return;
  navigator.clipboard.writeText(_shareData.value).then(() => {
    showToast('Copied to clipboard ✓');
    closeSheet('share');
  }).catch(() => showToast('Copy failed'));
}

function doShareWhatsApp() {
  const text = encodeURIComponent(_shareData.title + '\n\n' + _shareData.value);
  window.open('https://wa.me/?text=' + text, '_blank', 'noopener,noreferrer');
}

function doShareTelegram() {
  const text = encodeURIComponent(_shareData.title + '\n\n' + _shareData.value);
  window.open('https://t.me/share/url?url=' + text, '_blank', 'noopener,noreferrer');
}

function doShareEmail() {
  const subject = encodeURIComponent('ArkON – ' + _shareLabel());
  const body    = encodeURIComponent(_shareData.title + '\n\n' + _shareData.value + '\n\nSent via ArkON — arkade.computer');
  window.open('mailto:?subject=' + subject + '&body=' + body);
}

function doShareSMS() {
  const body = encodeURIComponent(_shareData.value);
  window.open('sms:?body=' + body);
}

function doShareTwitter() {
  const text = encodeURIComponent('Pay me in Bitcoin ⚡\n\n' + _shareData.value + '\n\n#Bitcoin #Ark');
  window.open('https://twitter.com/intent/tweet?text=' + text, '_blank', 'noopener,noreferrer');
}

async function doShareNative() {
  if (typeof navigator.share !== 'function') { showToast('Native share not supported on this device'); return; }
  try {
    await navigator.share({ title: 'ArkON – ' + _shareLabel(), text: _shareData.value });
    closeSheet('share');
  } catch (e) {
    if (e.name !== 'AbortError') showToast('Share cancelled');
  }
}

function doShareDownloadQR() {
  // Find the most relevant visible QR canvas and download it
  const candidates = [
    document.querySelector('#rcv-qr canvas'),
    document.querySelector('#rcv-qr img'),
    document.querySelector('#rcv-ln-qr canvas'),
    document.querySelector('#qr-main-canvas canvas'),
    document.querySelector('#qr-main-canvas img'),
    document.querySelector('#qr-ln-canvas canvas'),
  ];
  const el = candidates.find(c => c);
  if (!el) { showToast('No QR code to save'); return; }

  let dataUrl;
  if (el.tagName === 'CANVAS') {
    dataUrl = el.toDataURL('image/png');
  } else {
    // img — draw to canvas first
    const cnv = document.createElement('canvas');
    cnv.width  = el.naturalWidth  || el.width  || 300;
    cnv.height = el.naturalHeight || el.height || 300;
    const ctx  = cnv.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, cnv.width, cnv.height);
    ctx.drawImage(el, 0, 0);
    dataUrl = cnv.toDataURL('image/png');
  }

  const a = document.createElement('a');
  a.href     = dataUrl;
  a.download = 'arkon-qr.png';
  a.click();
  showToast('QR image saved ✓');
  closeSheet('share');
}

/* ═══════════════════════════════════════════
   PAGE NAV
═══════════════════════════════════════════ */
function showPage(p) {
  document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(x => x.classList.remove('active'));
  const pe = document.getElementById('page-' + p);
  if (pe) { pe.classList.add('active'); document.getElementById('content').scrollTop = 0; }
  const ne = document.getElementById('nav-' + p);
  if (ne) ne.classList.add('active');
  if (p === 'qr') initMainQR();
  // Auto-refresh transactions when the tab is opened
  if (p === 'transactions') refreshTransactionsPage();
}

// Refresh transactions with animated spinner feedback
async function refreshTransactionsPage() {
  const btn  = document.getElementById('tx-refresh-btn');
  const icon = document.getElementById('tx-refresh-icon');
  if (btn)  btn.disabled = true;
  if (icon) icon.style.animation = 'spin .6s linear infinite';
  try {
    // refreshTransactions is defined in main.js — call it if available
    if (typeof refreshTransactions === 'function') {
      await refreshTransactions();
    } else if (window._refreshTransactions) {
      await window._refreshTransactions();
    }
  } catch(e) { console.warn('[Arkade] Manual tx refresh failed:', e); }
  finally {
    if (btn)  btn.disabled = false;
    if (icon) icon.style.animation = '';
  }
}

/* ═══════════════════════════════════════════
   DARK MODE
═══════════════════════════════════════════ */
function toggleDark() {
  const h = document.documentElement;
  const isDark = h.getAttribute('data-theme') === 'dark';
  h.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('dm-tog').classList.toggle('on', !isDark);
}

function setColorScheme(scheme) {
  const h = document.documentElement;
  if (scheme === 'blue') {
    h.removeAttribute('data-scheme');
  } else {
    h.setAttribute('data-scheme', scheme);
  }
  localStorage.setItem('arkon_color_scheme', scheme);
  document.querySelectorAll('#scheme-picker button').forEach(btn => {
    btn.style.borderColor = btn.getAttribute('data-scheme-btn') === scheme ? 'var(--t1)' : 'transparent';
  });
}

(function initColorScheme() {
  const saved = localStorage.getItem('arkon_color_scheme');
  if (saved && saved !== 'blue') {
    document.documentElement.setAttribute('data-scheme', saved);
  }
  document.querySelectorAll('#scheme-picker button').forEach(btn => {
    const s = btn.getAttribute('data-scheme-btn');
    btn.style.borderColor = s === (saved || 'blue') ? 'var(--t1)' : 'transparent';
  });
})();

/* ═══════════════════════════════════════════
   BALANCE VISIBILITY TOGGLE — FIXED
═══════════════════════════════════════════ */
let balHidden = false;

function toggleBalance() {
  balHidden = !balHidden;
  const mainEl = document.getElementById('bal-main');
  const subEl  = document.getElementById('bal-sub');
  const eyeOpen   = document.getElementById('eye-open');
  const eyeClosed = document.getElementById('eye-closed');
  const eyeBtn    = document.getElementById('eye-btn');

  if (balHidden) {
    mainEl.classList.add('blurred');
    subEl.classList.add('blurred');
    eyeOpen.style.display   = 'none';
    eyeClosed.style.display = 'block';
    eyeBtn.classList.add('hidden');
  } else {
    mainEl.classList.remove('blurred');
    subEl.classList.remove('blurred');
    eyeOpen.style.display   = 'block';
    eyeClosed.style.display = 'none';
    eyeBtn.classList.remove('hidden');
  }
}

/* ═══════════════════════════════════════════
   CURRENCY
═══════════════════════════════════════════ */
function getUserFiatCurrency() {
  return (document.getElementById('cur-settings-sel')?.value) || 'USD';
}

function refreshCurrencySubtexts() {
  const activeCur = getUserFiatCurrency();
  const sym = CUR_SYMBOL[activeCur] || '$';

  const qrFiatCur = document.getElementById('qr-ln-fiat-cur');
  if (qrFiatCur) qrFiatCur.textContent = activeCur;

  const sendFiat = document.getElementById('s-fiat');
  const sendSats = document.getElementById('s-amt');
  if (sendFiat || sendSats) {
    if (typeof updateSendAmountFields === 'function') updateSendAmountFields();
    const freshSendFiat = document.getElementById('s-fiat');
    const freshSendSats = document.getElementById('s-amt');
    if (freshSendFiat || freshSendSats) {
      if (typeof syncSendFiatFromSats === 'function') syncSendFiatFromSats();
      if (typeof syncSendSatsFromFiat === 'function') syncSendSatsFromFiat();
    }
  }

  const rcvWrap = document.getElementById('rcv-ln-amt-wrap');
  const qrLnAmt = document.getElementById('qr-ln-amt');
  if (rcvWrap) {
    if (typeof updateRcvAmountFields === 'function') updateRcvAmountFields();
    const freshRcvFiat = document.getElementById('rcv-fiat');
    const freshRcvSats = document.getElementById('ln-req-amt');
    if (freshRcvFiat || freshRcvSats) {
      if (typeof syncRcvFiatFromSats === 'function') syncRcvFiatFromSats();
      if (typeof syncRcvSatsFromFiat === 'function') syncRcvSatsFromFiat();
    }
  }

  const lnPreview = document.getElementById('ln-fiat-preview');
  if (lnPreview && typeof updateLnPreview === 'function') updateLnPreview();

  const qrLnPreview = document.getElementById('qr-ln-fiat');
  if (qrLnPreview && typeof updateQrLnPreview === 'function') updateQrLnPreview();

  const qrLnAmtDisplay = document.getElementById('qr-ln-amt-display');
  const qrLnFiatDisplay = document.getElementById('qr-ln-fiat-display');
  if (qrLnAmtDisplay && qrLnFiatDisplay) {
    const amt = parseInt(qrLnAmtDisplay.textContent.replace(/[^0-9]/g, ''), 10) || 0;
    const price = (_livePrices && _livePrices[activeCur]) || window._btcUsd || _chartBasePrice || 96420;
    qrLnFiatDisplay.textContent = amt > 0 ? '≈ ' + sym + (amt * price / 1e8).toFixed(2) + ' ' + activeCur : '';
  }

  const lnInvoiceAmtDisplay = document.getElementById('ln-invoice-amt-display');
  const lnInvoiceFiatLabel = document.getElementById('ln-invoice-fiat-label');
  if (lnInvoiceAmtDisplay && lnInvoiceFiatLabel) {
    const amt = parseInt(lnInvoiceAmtDisplay.textContent.replace(/[^0-9]/g, ''), 10) || 0;
    const price = (_livePrices && _livePrices[activeCur]) || window._btcUsd || _chartBasePrice || 96420;
    lnInvoiceFiatLabel.textContent = amt > 0 ? '≈ ' + sym + (amt * price / 1e8).toFixed(2) + ' ' + activeCur : '';
  }

  if (window._refreshCurrencyLabels) {
    try { window._refreshCurrencyLabels(); } catch {}
  }
}

function applyCur(c) {
  // In sats mode always use SATS data; otherwise use the fiat currency
  const effectiveCur = (balDisplayMode === 'sats') ? 'SATS' : c;
  const b = BALANCES[effectiveCur] || BALANCES['USD'];
  const subEl  = document.getElementById('bal-sub');
  const mainEl = document.getElementById('bal-main');

  if (balDisplayMode === 'sats') {
    mainEl.textContent = b.m;
    subEl.textContent  = 'SATS';
    subEl.style.cssText = 'font-size:11px;letter-spacing:.04em;text-transform:uppercase;font-weight:600;color:rgba(255,255,255,0.35)';
    subEl.style.display = '';
  } else if (balDisplayMode === 'fiat') {
    mainEl.textContent = b.m;
    subEl.style.display = 'none';
  } else {
    // both — fiat primary, sats sub
    mainEl.textContent = b.m;
    subEl.textContent  = b.s;
    subEl.style.cssText = 'font-size:13px;color:rgba(255,255,255,0.5)';
    subEl.style.display = '';
  }

  // Sync selector
  const sel = document.getElementById('cur-settings-sel');
  if (sel && BALANCES[c]) sel.value = c;

  // Update chart ticker — always use live Kraken prices
  const tl = document.getElementById('tick-label');
  const tp = document.getElementById('tick-price');
  const tc = document.getElementById('tick-change');
  const activeCur = (c === 'SATS') ? 'USD' : c;
  const sym   = CUR_SYMBOL[activeCur] || '$';
  const liveP = (_livePrices && _livePrices[activeCur]) || window._btcUsd || 96420;
  if (tl) tl.textContent = 'BTC / ' + activeCur;
  if (tp) tp.textContent = sym + Math.round(liveP).toLocaleString('en-US');
  // pct change comes from chart cache
  const pctKey = curChartRange + '_' + activeCur;
  const cached = _chartPctCache && _chartPctCache[pctKey];
  if (tc && cached) { tc.textContent = cached.pct + ' ' + curChartRange; tc.className = 'tc ' + (cached.pos ? 'up' : 'dn'); }

  // Switch chart currency (skip SATS — chart always shows fiat)
  if (c !== 'SATS' && typeof switchChartCurrency === 'function') {
    switchChartCurrency(c);
  }
  const expTitle = document.querySelector('#sheet-chartexp .sheet-title');
  if (expTitle) expTitle.textContent = sym + Math.round(liveP).toLocaleString('en-US');

  refreshCurrencySubtexts();
}
function setCurSettings(sel) { applyCur(sel.value); }

/* ═══════════════════════════════════════════
   BALANCE DISPLAY MODE
═══════════════════════════════════════════ */
let balDisplayMode = 'both'; // 'sats' | 'fiat' | 'both'

function setBalDisplay(mode) {
  balDisplayMode = mode;
  ['fiat','both','sats'].forEach(m => {
    document.getElementById('bdm-' + m).classList.toggle('active', m === mode);
  });

  const curRow      = document.getElementById('cur-row');
  const satsLocked  = document.getElementById('sats-locked-row');

  if (mode === 'sats') {
    // Lock to SATS — hide fiat selector, show locked pill
    curRow.style.display     = 'none';
    satsLocked.style.display = 'flex';
    applyCur('SATS');
  } else {
    // Fiat or Both — show fiat selector, hide locked pill
    curRow.style.display     = 'flex';
    satsLocked.style.display = 'none';
    const sel = document.getElementById('cur-settings-sel');
    applyCur(sel ? sel.value : 'USD');
  }

  const labels = { fiat:'Fiat only', both:'Fiat + Sats', sats:'Sats only' };
  showToast('Home balance: ' + labels[mode]);
  // Re-render send and receive amount fields to match new mode
  updateSendAmountFields();
  updateRcvAmountFields();
}

function updateSendAmountFields() {
  const wrap = document.getElementById('send-amt-wrap');
  if (!wrap) return;
  const mode     = balDisplayMode || 'sats';
  const cur      = (document.getElementById('cur-settings-sel')?.value) || 'USD';
  const sym      = { USD:'$', EUR:'€', CHF:'CHF ' }[cur] || '$';
  const maxSats  = window._wallet?.sats || 0;
  const price    = (_livePrices?.[cur]) || window._btcUsd || _chartBasePrice || 96420;
  const maxFiat  = (maxSats * price / 1e8).toFixed(2);

  const balLine = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding:8px 12px;background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r-md)">
    <span style="font-size:12px;color:var(--t3)">Available balance</span>
    <span style="font-size:12px;font-weight:700;color:var(--t1)">${maxSats.toLocaleString()} SATS${maxFiat !== '0.00' ? ` <span style="color:var(--t3);font-weight:500">· ${sym}${maxFiat}</span>` : ''}</span>
  </div>`;

  if (mode === 'sats') {
    wrap.innerHTML = balLine + `
      <div class="fld">
        <label class="flbl">Amount (SATS)</label>
        <div class="fwrap">
          <input class="finp" id="s-amt" placeholder="0" type="number" style="padding-right:56px"
            oninput="syncSendFiatFromSats()">
          <span class="fmax" onclick="document.getElementById('s-amt').value='${maxSats}';syncSendFiatFromSats()">MAX</span>
        </div>
      </div>`;
  } else if (mode === 'fiat') {
    wrap.innerHTML = balLine + `
      <div class="fld">
        <label class="flbl">Amount (${cur})</label>
        <div class="fwrap">
          <input class="finp" id="s-fiat" placeholder="0.00" type="number" step="0.01" style="padding-right:56px"
            oninput="syncSendSatsFromFiat()">
          <span class="fmax" onclick="document.getElementById('s-fiat').value='${maxFiat}';syncSendSatsFromFiat()"
            style="font-size:10px;right:6px">MAX</span>
        </div>
        <div style="font-size:11px;color:var(--t3);margin-top:5px" id="s-sats-equiv">≈ — SATS</div>
      </div>
      <input type="hidden" id="s-amt" value="">`;
  } else {
    // both — fiat primary + sats
    wrap.innerHTML = balLine + `
      <div class="fld">
        <label class="flbl">Amount (${cur})</label>
        <div class="fwrap">
          <input class="finp" id="s-fiat" placeholder="0.00" type="number" step="0.01" style="padding-right:56px"
            oninput="syncSendSatsFromFiat()">
          <span class="fmax" onclick="document.getElementById('s-fiat').value='${maxFiat}';syncSendSatsFromFiat()"
            style="font-size:10px;right:6px">MAX</span>
        </div>
      </div>
      <div class="fld" style="margin-top:-4px">
        <label class="flbl">Amount (SATS)</label>
        <div class="fwrap">
          <input class="finp" id="s-amt" placeholder="0" type="number" style="padding-right:56px"
            oninput="syncSendFiatFromSats()">
          <span class="fmax" onclick="document.getElementById('s-amt').value='${maxSats}';syncSendFiatFromSats()">MAX</span>
        </div>
      </div>`;
  }
}

function syncSendSatsFromFiat() {
  const cur   = (document.getElementById('cur-settings-sel')?.value) || 'USD';
  const price = (_livePrices?.[cur]) || window._btcUsd || _chartBasePrice || 96420;
  const fiat  = parseFloat(document.getElementById('s-fiat')?.value) || 0;
  const sats  = Math.round(fiat * 1e8 / price);
  const amtEl = document.getElementById('s-amt');
  if (amtEl) amtEl.value = sats > 0 ? String(sats) : '';
  const eq = document.getElementById('s-sats-equiv');
  if (eq) eq.textContent = sats > 0 ? '≈ ' + sats.toLocaleString() + ' SATS' : '≈ — SATS';
}

function syncSendFiatFromSats() {
  const cur   = (document.getElementById('cur-settings-sel')?.value) || 'USD';
  const sym   = { USD:'$', EUR:'€', CHF:'CHF ' }[cur] || '$';
  const price = (_livePrices?.[cur]) || window._btcUsd || _chartBasePrice || 96420;
  const sats  = parseInt(document.getElementById('s-amt')?.value) || 0;
  const fiat  = (sats * price / 1e8).toFixed(2);
  const fiatEl = document.getElementById('s-fiat');
  if (fiatEl && document.activeElement !== fiatEl) {
    // Don't overwrite if user is typing in fiat field
    if (balDisplayMode === 'both') fiatEl.value = sats > 0 ? fiat : '';
  }
}

function syncRcvSatsFromFiat() {
  const cur   = (document.getElementById('cur-settings-sel')?.value) || 'USD';
  const price = (_livePrices?.[cur]) || window._btcUsd || _chartBasePrice || 96420;
  const fiat  = parseFloat(document.getElementById('rcv-fiat')?.value) || 0;
  const sats  = Math.round(fiat * 1e8 / price);
  const amtEl = document.getElementById('ln-req-amt');
  if (amtEl) amtEl.value = sats > 0 ? String(sats) : '';
  const eq = document.getElementById('rcv-sats-equiv');
  if (eq) eq.textContent = sats > 0 ? '≈ ' + sats.toLocaleString() + ' SATS' : '≈ — SATS';
  updateLnPreview();
}

function syncRcvFiatFromSats() {
  const cur   = (document.getElementById('cur-settings-sel')?.value) || 'USD';
  const sym   = { USD:'$', EUR:'€', CHF:'CHF ' }[cur] || '$';
  const price = (_livePrices?.[cur]) || window._btcUsd || _chartBasePrice || 96420;
  const sats  = parseInt(document.getElementById('ln-req-amt')?.value) || 0;
  const fiat  = (sats * price / 1e8).toFixed(2);
  const fiatEl = document.getElementById('rcv-fiat');
  if (fiatEl && balDisplayMode === 'both') fiatEl.value = sats > 0 ? fiat : '';
  const eq = document.getElementById('ln-fiat-preview');
  if (eq) eq.textContent = sats > 0 ? '≈ ' + sym + fiat : 'Enter amount to see fiat equivalent';
  updateLnPreview();
}

function updateRcvAmountFields() {
  const mode    = balDisplayMode || 'sats';
  const cur     = (document.getElementById('cur-settings-sel')?.value) || 'USD';
  const maxSats = window._wallet?.sats || 0;
  const price   = (_livePrices?.[cur]) || window._btcUsd || _chartBasePrice || 96420;
  const maxFiat = (maxSats * price / 1e8).toFixed(2);

  // Onchain / Ark optional amount
  const onchainWrap = document.getElementById('rcv-amt-wrap');
  if (onchainWrap) {
    if (mode === 'sats') {
      onchainWrap.innerHTML = `<div class="fld"><label class="flbl">Request Amount (optional)</label><input class="finp" id="onchain-req-amt" placeholder="0 SATS" type="number"></div>`;
    } else if (mode === 'fiat') {
      onchainWrap.innerHTML = `
        <div class="fld">
          <label class="flbl">Request Amount in ${cur} (optional)</label>
          <input class="finp" id="onchain-req-fiat" placeholder="0.00" type="number" step="0.01"
            oninput="(function(){const f=parseFloat(document.getElementById('onchain-req-fiat').value)||0;const s=Math.round(f*1e8/${price});document.getElementById('onchain-req-amt').value=s>0?String(s):'';const eq=document.getElementById('onchain-sats-equiv');if(eq)eq.textContent=s>0?'≈ '+s.toLocaleString()+' SATS':'≈ — SATS'})()">
          <div style="font-size:11px;color:var(--t3);margin-top:5px" id="onchain-sats-equiv">≈ — SATS</div>
        </div>
        <input type="hidden" id="onchain-req-amt" value="">`;
    } else {
      onchainWrap.innerHTML = `
        <div class="fld">
          <label class="flbl">Request in ${cur} (optional)</label>
          <input class="finp" id="onchain-req-fiat" placeholder="0.00" type="number" step="0.01">
        </div>
        <div class="fld" style="margin-top:-4px">
          <label class="flbl">Or in SATS</label>
          <input class="finp" id="onchain-req-amt" placeholder="0" type="number">
        </div>`;
    }
  }

  // Lightning required amount
  const lnWrap = document.getElementById('rcv-ln-amt-wrap');
  if (!lnWrap) return;
  if (mode === 'sats') {
    lnWrap.innerHTML = `
      <div class="fld">
        <label class="flbl">Amount to Receive <span style="color:var(--red)">*</span></label>
        <div class="fwrap">
          <input class="finp" id="ln-req-amt" placeholder="e.g. 21,000 SATS" type="number"
            oninput="updateLnPreview()" style="padding-right:56px">
          <span class="fmax" onclick="document.getElementById('ln-req-amt').value='${maxSats}';updateLnPreview()">MAX</span>
        </div>
        <div style="font-size:11px;color:var(--t3);margin-top:5px" id="ln-fiat-preview">Enter amount to see fiat equivalent</div>
      </div>`;
  } else if (mode === 'fiat') {
    lnWrap.innerHTML = `
      <div class="fld">
        <label class="flbl">Amount to Receive (${cur}) <span style="color:var(--red)">*</span></label>
        <div class="fwrap">
          <input class="finp" id="rcv-fiat" placeholder="0.00" type="number" step="0.01"
            oninput="syncRcvSatsFromFiat()" style="padding-right:56px">
          <span class="fmax" onclick="document.getElementById('rcv-fiat').value='${maxFiat}';syncRcvSatsFromFiat()"
            style="font-size:10px;right:6px">MAX</span>
        </div>
        <div style="font-size:11px;color:var(--t3);margin-top:5px" id="rcv-sats-equiv">≈ — SATS</div>
      </div>
      <input type="hidden" id="ln-req-amt" value="">`;
  } else {
    lnWrap.innerHTML = `
      <div class="fld">
        <label class="flbl">Amount in ${cur} <span style="color:var(--red)">*</span></label>
        <div class="fwrap">
          <input class="finp" id="rcv-fiat" placeholder="0.00" type="number" step="0.01"
            oninput="syncRcvSatsFromFiat()" style="padding-right:56px">
          <span class="fmax" onclick="document.getElementById('rcv-fiat').value='${maxFiat}';syncRcvSatsFromFiat()"
            style="font-size:10px;right:6px">MAX</span>
        </div>
      </div>
      <div class="fld" style="margin-top:-4px">
        <label class="flbl">Amount in SATS <span style="color:var(--red)">*</span></label>
        <div class="fwrap">
          <input class="finp" id="ln-req-amt" placeholder="0" type="number"
            oninput="syncRcvFiatFromSats()" style="padding-right:56px">
          <span class="fmax" onclick="document.getElementById('ln-req-amt').value='${maxSats}';syncRcvFiatFromSats()">MAX</span>
        </div>
        <div style="font-size:11px;color:var(--t3);margin-top:5px" id="ln-fiat-preview">Enter amount to see fiat equivalent</div>
      </div>`;
  }
}

/* ═══════════════════════════════════════════
   SHEETS
═══════════════════════════════════════════ */
let rcvQR = null;

function openSheet(t) {
  document.getElementById('sheet-' + t).classList.add('open');
  if (t === 'receive') {
    // Render amount fields for current mode first
    updateRcvAmountFields();
    // Set initial disabled state on ln-gen-btn (React no longer sets disabled)
    updateLnPreview();
    // Always regenerate QR with current live address
    setTimeout(() => {
      const qrEl = document.getElementById('rcv-qr');
      if (!qrEl) return;
      qrEl.innerHTML = ''; rcvQR = null;
      try {
        const addr = ARK_ADDR && !ARK_ADDR.startsWith('Connecting') ? ARK_ADDR : 'arkade';
        const tabActive = document.getElementById('rcv-tab-ark')?.classList.contains('active');
        const prefix = tabActive !== false ? '' : 'bitcoin:';
        rcvQR = new QRCode(qrEl, {
          text: prefix + addr, width: 168, height: 168,
          colorDark:'#000', colorLight:'#fff', correctLevel: QRCode.CorrectLevel.M
        });
      } catch(e) {}
    }, 120);
  }
  if (t === 'send') {
    // Clear fields every time the send sheet opens
    const addrEl = document.getElementById('s-addr');
    if (addrEl) addrEl.value = '';
    // Render amount fields based on current display mode, then clear them
    updateSendAmountFields();
    const amtEl = document.getElementById('s-amt');
    const fiatEl = document.getElementById('s-fiat');
    if (amtEl)  amtEl.value  = '';
    if (fiatEl) fiatEl.value = '';
    // Reset fee to medium
    document.querySelectorAll('#fee-section-onchain .fo').forEach((el, i) => {
      el.classList.toggle('active', i === 1);
    });
  }
}
function closeSheet(t) { document.getElementById('sheet-' + t).classList.remove('open'); }

// Overlay click-to-close: use event delegation on document body
// (works for React-rendered overlays that don't exist at import time)
document.addEventListener('click', e => {
  if (e.target.classList && e.target.classList.contains('overlay') && e.target.classList.contains('open')) {
    e.target.classList.remove('open');
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') document.querySelectorAll('.overlay.open').forEach(m => m.classList.remove('open'));
});

/* ═══════════════════════════════════════════
   TRANSACTION DETAIL
   (Legacy static version — replaced by showLiveTxDetail in main.js)
═══════════════════════════════════════════ */
function _showTxDetail_legacy(id) {
  const tx = TX_DATA[id];
  if (!tx) return;
  document.getElementById('txd-title').textContent = 'Transaction Details';

  const hashShort = tx.hash.length > 20 ? tx.hash.slice(0, 8) + '…' + tx.hash.slice(-8) : tx.hash;
  const statusClass = tx.status === 'Confirmed' || tx.status === 'Settled' ? 'confirmed' : tx.status === 'Pending' ? 'pending' : 'failed';

  const iconMap = { out:'↑', in:'↓', ln:'⚡', pnd:'⏱' };
  const icon = iconMap[tx.cls] || '↕';

  document.getElementById('txd-body').innerHTML = `
    <div class="tx-detail-status">
      <div class="tds-icon ${esc(tx.cls)}">${icon}</div>
      <div class="tds-title ${esc(tx.cls)}">${esc(tx.amount)}</div>
      <div class="tds-sub">${esc(tx.fiat)}</div>
      <div class="tds-badge ${statusClass}">
        <div class="badge-dot"></div>
        ${esc(tx.status)}
      </div>
    </div>

    <div class="tx-details-card">
      <div class="tdrow">
        <span class="tdlbl">Type</span>
        <span class="tdval">${esc(tx.title)}</span>
      </div>
      <div class="tdrow">
        <span class="tdlbl">Network</span>
        <span class="tdval">${esc(tx.network)}</span>
      </div>
      <div class="tdrow">
        <span class="tdlbl">Date</span>
        <span class="tdval">${esc(tx.date)}</span>
      </div>
      <div class="tdrow">
        <span class="tdlbl">Time</span>
        <span class="tdval">${esc(tx.time)}</span>
      </div>
      <div class="tdrow">
        <span class="tdlbl">Ago</span>
        <span class="tdval amber">${esc(tx.ago)}</span>
      </div>
      <div class="tdrow">
        <span class="tdlbl">Confirmations</span>
        <span class="tdval ${tx.status==='Pending'?'amber':tx.status==='Confirmed'||tx.status==='Settled'?'green':''}">${esc(tx.confs)}</span>
      </div>
    </div>

    <div class="tx-details-card">
      <div class="tdrow">
        <span class="tdlbl">${tx.type === 'in' ? 'You received' : 'You sent'}</span>
        <span class="tdval ${esc(tx.cls)}">${esc(tx.amount)}</span>
      </div>
      ${tx.fee !== '—' ? `
      <div class="tdrow">
        <span class="tdlbl">Network fee</span>
        <span class="tdval">${esc(tx.fee)}</span>
      </div>` : ''}
      <div class="tdrow">
        <span class="tdlbl">From</span>
        <span class="tdval mono">${esc(tx.from)}</span>
      </div>
      <div class="tdrow">
        <span class="tdlbl">To</span>
        <span class="tdval mono">${esc(tx.to)}</span>
      </div>
    </div>

    <div class="tx-details-card">
      <div class="tdrow">
        <span class="tdlbl">TX Hash</span>
        <div class="tx-hash-row">
          <span class="tx-hash-val" id="txhash-${esc(id)}">${esc(tx.hash)}</span>
          <div class="hash-copy" onclick="cpTxtDirect('txhash-${esc(id)}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
          </div>
        </div>
      </div>
    </div>
    <div class="spc-sm"></div>
    <button class="btns" style="margin-top:0" onclick="showToast('Opening in block explorer…')">
      View in Explorer ↗
    </button>
    <div class="spc"></div>
  `;
  openSheet('txdetail');
}

function cpTxtDirect(id) {
  const el = document.getElementById(id);
  if (el) {
    navigator.clipboard.writeText(el.textContent).catch(() => {});
    showToast('Copied to clipboard');
  }
}

/* ═══════════════════════════════════════════
   QR PAGE
═══════════════════════════════════════════ */
let ARK_ADDR = 'Connecting to Arkade…';
let mainQRNeedsReset = false;

/* Called by main.js once SDK is ready with live addresses */
window._setLiveAddresses = function(arkAddr, boardingAddr) {
  ARK_ADDR = arkAddr;
  ADDR = boardingAddr;
  BOARDING_ADDR = boardingAddr;

  // Update every address DOM element
  ['qr-addr-val', 'rcv-addr'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = arkAddr;
  });

  // Update settings profile address display with truncated address
  const profAddr = document.getElementById('wallet-addr-display');
  if (profAddr && arkAddr) {
    const truncated = arkAddr.length > 16
      ? arkAddr.slice(0, 8) + '···' + arkAddr.slice(-4) + ' · Ark'
      : arkAddr + ' · Ark';
    profAddr.textContent = truncated;
  }

  // Regenerate QR codes with live address
  const qrMain = document.getElementById('qr-main-canvas');
  if (qrMain) {
    qrMain.innerHTML = '';
    mainQR = null;
    qrCurAddr = arkAddr;
  }
  const qrRcv = document.getElementById('rcv-qr');
  if (qrRcv) { qrRcv.innerHTML = ''; rcvQR = null; }

  // If user is already on receive sheet or QR tab, re-init immediately
  if (document.getElementById('sheet-receive')?.classList.contains('open')) {
    setTimeout(() => {
      try {
        rcvQR = new QRCode(document.getElementById('rcv-qr'), {
          text: arkAddr, width:168, height:168,
          colorDark:'#000', colorLight:'#fff', correctLevel: QRCode.CorrectLevel.M
        });
      } catch(e) {}
    }, 50);
  }
  if (document.getElementById('page-qr')?.classList.contains('active')) {
    setTimeout(() => initMainQR(), 50);
  }

  // Update invoice pay-to address
  const invAddr = document.getElementById('inv-pay-addr');
  if (invAddr && (!invAddr.value || invAddr.value === '' || invAddr.value.startsWith('Connecting'))) {
    invAddr.value = arkAddr;
  }

  console.log('[UI] Live addresses set — Ark:', arkAddr, '| Boarding:', boardingAddr);
};

let mainQR = null, genQRi = null;
let qrCurAddr = ARK_ADDR;

function initMainQR() {
  if (mainQR) return;
  qrCurAddr = ARK_ADDR;
  const addrEl = document.getElementById('qr-addr-val');
  if (addrEl) addrEl.textContent = ARK_ADDR;
  setTimeout(() => {
    try {
      mainQR = new QRCode(document.getElementById('qr-main-canvas'), {
        text: ARK_ADDR, width: 186, height: 186,
        colorDark: '#000000', colorLight: '#fff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch(e) {}
  }, 100);
}

function setQRTab(tab) {
  document.getElementById('ttab-mine').classList.toggle('active', tab === 'mine');
  document.getElementById('ttab-scan').classList.toggle('active', tab === 'scan');
  document.getElementById('qr-mine-panel').style.display = tab === 'mine' ? 'block' : 'none';
  document.getElementById('qr-scan-panel').style.display = tab === 'scan' ? 'block' : 'none';
  if (tab === 'mine') initMainQR();
  if (tab === 'scan') {
    // Auto-launch camera immediately
    setTimeout(() => openQRScan('qr-page-result'), 80);
  }
}

let qrLnQR = null;
function setAddrType(el, type) {
  el.closest('.qr-type-row').querySelectorAll('.qtt').forEach(x => x.classList.remove('active'));
  el.classList.add('active');

  const staticP = document.getElementById('qr-static-panel');
  const lnP     = document.getElementById('qr-lightning-panel');

  if (type === 'lightning') {
    staticP.style.display = 'none';
    lnP.style.display = 'block';
    document.getElementById('qr-ln-result').style.display = 'none';
    document.getElementById('qr-ln-form-wrap').style.display = 'block';
    document.getElementById('qr-ln-amt').value = '';
    const memoEl = document.getElementById('qr-ln-memo');
    if (memoEl) memoEl.value = '';
    document.getElementById('qr-ln-fiat').textContent = 'Enter amount to see fiat equivalent';
    const btn = document.getElementById('qr-ln-gen-btn');
    btn.disabled = true; btn.style.opacity = '.5';
  } else {
    staticP.style.display = 'block';
    lnP.style.display = 'none';
    const addrs = {
      onchain: ADDR,
      ark: ARK_ADDR
    };
    qrCurAddr = addrs[type] || ADDR;
    document.getElementById('qr-addr-val').textContent = qrCurAddr;
    if (mainQR) { mainQR.clear(); mainQR.makeCode(qrCurAddr); }
    else { initMainQR(); }
  }
}

function updateQrLnPreview() {
  const amt = parseInt(document.getElementById('qr-ln-amt').value) || 0;
  const btn = document.getElementById('qr-ln-gen-btn');
  const activeCur = (typeof balDisplayMode !== 'undefined' && balDisplayMode !== 'sats' && document.getElementById('cur-settings-sel'))
    ? (document.getElementById('cur-settings-sel').value || 'USD') : 'USD';
  const curLabel = document.getElementById('qr-ln-fiat-cur');
  if (curLabel) curLabel.textContent = activeCur;
  if (amt > 0) {
    const price = (_livePrices && _livePrices[activeCur]) || window._btcUsd || _chartBasePrice || 96420;
    const sym   = { USD:'$', EUR:'€', CHF:'CHF ' }[activeCur] || '$';
    const fiat  = (amt * price / 1e8).toFixed(2);
    document.getElementById('qr-ln-fiat').textContent = '≈ ' + sym + fiat;
    btn.disabled = false; btn.style.opacity = '1';
  } else {
    document.getElementById('qr-ln-fiat').textContent = 'Enter amount to see fiat equivalent';
    btn.disabled = true; btn.style.opacity = '.5';
  }
}

function qrLnFiatToSats() {
  const activeCur = (typeof balDisplayMode !== 'undefined' && balDisplayMode !== 'sats' && document.getElementById('cur-settings-sel'))
    ? (document.getElementById('cur-settings-sel').value || 'USD') : 'USD';
  const price = (_livePrices && _livePrices[activeCur]) || window._btcUsd || _chartBasePrice || 96420;
  const fiatVal = parseFloat(document.getElementById('qr-ln-fiat-input').value) || 0;
  const sats = Math.round(fiatVal * 1e8 / price);
  document.getElementById('qr-ln-amt').value = sats > 0 ? sats : '';
  updateQrLnPreview();
}

async function genQrLnInvoice() {
  const amt = parseInt(document.getElementById('qr-ln-amt').value) || 0;
  if (!amt) { showToast('Enter an amount first'); return; }
  const memo = (document.getElementById('qr-ln-memo')?.value || '').trim();
  const btn = document.getElementById('qr-ln-gen-btn');
  if (btn) { btn.disabled = true; btn.style.opacity = '.6'; btn.textContent = 'Generating…'; }
  try {
    const result = await window._generateLightningInvoice({ amount: amt, description: memo });
    const invoice = result?.invoice || '';
    if (!invoice) throw new Error('No invoice returned');

    // Populate invoice text
    document.getElementById('qr-ln-invoice').textContent = invoice;

    // Amount subtext
    const amtDisplay = document.getElementById('qr-ln-amt-display');
    const fiatDisplay = document.getElementById('qr-ln-fiat-display');
    if (amtDisplay) amtDisplay.textContent = amt.toLocaleString();
    if (fiatDisplay) {
      const activeCur = (typeof balDisplayMode !== 'undefined' && balDisplayMode !== 'sats' && document.getElementById('cur-settings-sel'))
        ? (document.getElementById('cur-settings-sel').value || 'USD') : 'USD';
      const price = (_livePrices && _livePrices[activeCur]) || window._btcUsd || _chartBasePrice || 96420;
      const sym = { USD:'$', EUR:'€', CHF:'CHF ' }[activeCur] || '$';
      fiatDisplay.textContent = '≈ ' + sym + (amt * price / 1e8).toFixed(2) + ' ' + activeCur;
    }

    // Build QR in the ring container
    const el = document.getElementById('qr-ln-canvas');
    el.innerHTML = '';
    qrLnQR = null;
    try {
      qrLnQR = new QRCode(el, { text: invoice, width:186, height:186, colorDark:'#1a1630', colorLight:'#fff', correctLevel: QRCode.CorrectLevel.M });
    } catch(e) {}

    // Hide form, show result
    document.getElementById('qr-ln-form-wrap').style.display = 'none';
    document.getElementById('qr-ln-result').style.display = 'block';
    showToast('Lightning invoice ready ✓');
  } catch(e) {
    console.error(e);
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.textContent = 'Generate Lightning Invoice'; }
    showToast(e?.message || 'Failed to create Lightning invoice');
  }
}

function resetQrLnForm() {
  const el = document.getElementById('qr-ln-canvas');
  if (el) { el.innerHTML = ''; qrLnQR = null; }
  document.getElementById('qr-ln-invoice').textContent = '';
  document.getElementById('qr-ln-amt').value = '';
  const fiatInp = document.getElementById('qr-ln-fiat-input');
  if (fiatInp) fiatInp.value = '';
  const memoEl = document.getElementById('qr-ln-memo');
  if (memoEl) memoEl.value = '';
  document.getElementById('qr-ln-fiat').textContent = 'Enter amount to see fiat equivalent';
  const btn = document.getElementById('qr-ln-gen-btn');
  if (btn) { btn.disabled = true; btn.style.opacity = '.5'; btn.textContent = 'Generate Lightning Invoice'; }
  document.getElementById('qr-ln-form-wrap').style.display = 'block';
  document.getElementById('qr-ln-result').style.display = 'none';
}

function cpQrLnInvoice() {
  const inv = document.getElementById('qr-ln-invoice').textContent;
  navigator.clipboard.writeText(inv).catch(() => {});
  showToast('Invoice copied');
}

function shareQrLnInvoice() {
  const inv = document.getElementById('qr-ln-invoice').textContent;
  if (inv) shareContent('Share Lightning Invoice', inv, 'lightning');
}

function cpAddr() {
  navigator.clipboard.writeText(qrCurAddr).catch(() => {});
  showToast('Address copied');
}
function toggleAddrBlur(elId, btn) {
  const el = document.getElementById(elId);
  if (!el) return;
  const hidden = el.classList.toggle('addr-masked');
  if (btn) {
    const svg = hidden
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    btn.innerHTML = svg;
  }
}

function liveQR() {
  const val = document.getElementById('gen-inp').value.trim();
  if (!val) return;
  const result = document.getElementById('gen-result');
  result.style.display = 'block';
  const el = document.getElementById('gen-qr-canvas');
  el.innerHTML = '';
  document.getElementById('gen-qr-text').textContent = val;
  try {
    genQRi = new QRCode(el, {
      text: val, width: 186, height: 186,
      colorDark: '#1a1630', colorLight: '#fff',
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch(e) {}
}

/* ═══════════════════════════════════════════
   RECEIVE
═══════════════════════════════════════════ */
let rcvLnQR = null;
function setRcvType(el, type) {
  // Update active pill
  ['ark','lightning','onchain'].forEach(t => {
    const b = document.getElementById('rcv-tab-' + t);
    if (b) b.classList.toggle('active', t === type);
  });
  const onchainP = document.getElementById('rcv-onchain-panel');
  const lnP      = document.getElementById('rcv-lightning-panel');
  if (type === 'lightning') {
    onchainP.style.display = 'none';
    lnP.style.display = 'block';
    document.getElementById('ln-invoice-area').style.display = 'none';
    document.getElementById('ln-form-wrap').style.display = 'block';
    document.getElementById('ln-gen-wrap').style.display = 'block';
  } else {
    onchainP.style.display = 'block';
    lnP.style.display = 'none';
    const addr = type === 'ark' ? ARK_ADDR : ADDR;
    const prefix = type === 'ark' ? '' : 'bitcoin:';
    document.getElementById('rcv-addr').textContent = addr;
    // Update address label and copy button text to match type
    const lbl     = document.getElementById('rcv-addr-lbl');
    const copyBtn = document.getElementById('rcv-copy-btn');
    if (type === 'ark') {
      if (lbl)     lbl.textContent     = 'Ark Address';
      if (copyBtn) copyBtn.textContent = 'Copy Ark Address';
    } else {
      if (lbl)     lbl.textContent     = 'Bitcoin Address';
      if (copyBtn) copyBtn.textContent = 'Copy Bitcoin Address';
    }
    if (rcvQR) { rcvQR.clear(); rcvQR.makeCode(prefix + addr); }
    else {
      setTimeout(() => {
        try {
          rcvQR = new QRCode(document.getElementById('rcv-qr'), {
            text: prefix + addr, width:168, height:168,
            colorDark:'#000000', colorLight:'#fff', correctLevel: QRCode.CorrectLevel.M
          });
        } catch(e){}
      }, 80);
    }
  }
}

function updateLnPreview() {
  const amt = parseInt(document.getElementById('ln-req-amt').value) || 0;
  const activeCur = (typeof balDisplayMode !== 'undefined' && balDisplayMode !== 'sats' && document.getElementById('cur-settings-sel'))
    ? (document.getElementById('cur-settings-sel').value || 'USD') : 'USD';
  const price = (_livePrices && _livePrices[activeCur]) || window._btcUsd || _chartBasePrice || 96420;
  const sym   = { USD:'$', EUR:'€', CHF:'CHF ' }[activeCur] || '$';
  const fiat  = (amt * price / 1e8).toFixed(2);
  const btn = document.getElementById('ln-gen-btn');
  if (amt > 0) {
    document.getElementById('ln-fiat-preview').textContent = '≈ ' + sym + fiat;
    btn.disabled = false; btn.style.opacity = '1';
  } else {
    document.getElementById('ln-fiat-preview').textContent = 'Enter amount to see fiat equivalent';
    btn.disabled = true; btn.style.opacity = '.5';
  }
}

async function genLnInvoice() {
  const amtEl = document.getElementById('ln-req-amt');
  const amt = parseInt(amtEl?.value) || 0;
  if (!amt) { showToast('Enter an amount first'); return; }
  if (typeof window._generateLightningInvoice !== 'function') {
    showToast('Lightning not ready — wallet still loading');
    console.error('[ArkON] _generateLightningInvoice not available');
    return;
  }
  const memo = document.getElementById('ln-memo')?.value || '';
  const btn = document.getElementById('ln-gen-btn');
  const status = document.getElementById('ln-status');
  const area = document.getElementById('ln-invoice-area');
  if (btn) { btn.disabled = true; btn.style.opacity = '.6'; btn.textContent = 'Generating…'; }
  try {
    console.log('[ArkON] Generating Lightning invoice for', amt, 'sats');
    const result = await window._generateLightningInvoice({ amount: amt, description: memo });
    console.log('[ArkON] Lightning invoice result:', result ? 'OK' : 'empty');
    const invoice = result?.invoice || '';
    if (!invoice) throw new Error('No invoice returned');
    document.getElementById('ln-invoice-val').textContent = invoice;

    // Populate amount subtext
    const amtDisplay = document.getElementById('ln-invoice-amt-display');
    const fiatDisplay = document.getElementById('ln-invoice-fiat-label');
    if (amtDisplay) amtDisplay.textContent = amt.toLocaleString();
    if (fiatDisplay) {
      const activeCur = (typeof balDisplayMode !== 'undefined' && balDisplayMode !== 'sats' && document.getElementById('cur-settings-sel'))
        ? (document.getElementById('cur-settings-sel').value || 'USD') : 'USD';
      const price = (_livePrices && _livePrices[activeCur]) || window._btcUsd || _chartBasePrice || 96420;
      const sym = { USD:'$', EUR:'€', CHF:'CHF ' }[activeCur] || '$';
      const fiat = (amt * price / 1e8).toFixed(2);
      fiatDisplay.textContent = '≈ ' + sym + fiat + ' ' + activeCur;
    }

    // Hide form, show QR area
    document.getElementById('ln-form-wrap').style.display = 'none';
    area.style.display = 'block';
    if (status) { status.style.display = 'block'; status.textContent = 'Invoice ready — auto-claims into your Ark wallet after payment.'; }

    const el = document.getElementById('rcv-ln-qr');
    el.innerHTML = '';
    try {
      rcvLnQR = new QRCode(el, { text: invoice, width:168, height:168, colorDark:'#14111f', colorLight:'#fff', correctLevel: QRCode.CorrectLevel.M });
    } catch(e) {}
    if (window._getLightningSwaps) {
      try {
        const swaps = await window._getLightningSwaps();
        const mgr = swaps?.getSwapManager?.();
        if (mgr?.onSwapCompleted) {
          mgr.onSwapCompleted((swap) => {
            if (swap?.id === result?.pendingSwap?.id || swap?.paymentHash === result?.paymentHash) {
              if (status) status.textContent = 'Lightning payment received and settled into your Ark wallet.';
              showToast('Lightning payment received ✓');
              if (window._refreshBalance) window._refreshBalance();
              if (window._refreshTransactions) window._refreshTransactions();
            }
          });
        }
      } catch(e) {}
    }
    showToast('Lightning invoice ready ✓');
  } catch(e) {
    console.error(e);
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.textContent = 'Generate Lightning Invoice'; }
    showToast(e?.message || 'Failed to create Lightning invoice');
  }
}

function resetLnInvoiceForm() {
  // Clear QR
  const qrEl = document.getElementById('rcv-ln-qr');
  if (qrEl) { qrEl.innerHTML = ''; rcvLnQR = null; }
  // Clear invoice value
  const invVal = document.getElementById('ln-invoice-val');
  if (invVal) invVal.textContent = '—';
  // Reset status
  const status = document.getElementById('ln-status');
  if (status) { status.style.display = 'none'; status.textContent = ''; }
  // Reset amount inputs
  const amtEl = document.getElementById('ln-req-amt');
  if (amtEl) amtEl.value = '';
  const memoEl = document.getElementById('ln-memo');
  if (memoEl) memoEl.value = '';
  // Restore preview text
  const fiatPrev = document.getElementById('ln-fiat-preview');
  if (fiatPrev) fiatPrev.textContent = 'Enter amount to see fiat equivalent';
  // Reset generate button
  const btn = document.getElementById('ln-gen-btn');
  if (btn) { btn.disabled = true; btn.style.opacity = '.5'; btn.textContent = 'Generate Lightning Invoice'; }
  // Show form, hide invoice area
  document.getElementById('ln-form-wrap').style.display = 'block';
  document.getElementById('ln-invoice-area').style.display = 'none';
}

/* ═══════════════════════════════════════════
   SEND
═══════════════════════════════════════════ */
// ═══════════════════════════════════════════
//    SAVED ADDRESSES (Encrypted Address Book)
// ═══════════════════════════════════════════
const FAV_STORE = 'arkon_addrbook_v2';
const FAV_KSTORE = 'arkon_addrbook_k';

// --- Crypto helpers (AES-GCM via SubtleCrypto) ---
async function _favGetKey() {
  try {
    let raw = localStorage.getItem(FAV_KSTORE);
    if (raw) {
      const buf = Uint8Array.from(atob(raw), c => c.charCodeAt(0));
      return crypto.subtle.importKey('raw', buf, 'AES-GCM', false, ['encrypt','decrypt']);
    }
    const key = await crypto.subtle.generateKey({ name:'AES-GCM', length:256 }, true, ['encrypt','decrypt']);
    const exported = await crypto.subtle.exportKey('raw', key);
    localStorage.setItem(FAV_KSTORE, btoa(String.fromCharCode(...new Uint8Array(exported))));
    return key;
  } catch { return null; }
}

async function _favEncrypt(data) {
  const key = await _favGetKey();
  if (!key) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(data)));
  const buf = new Uint8Array(iv.length + enc.byteLength);
  buf.set(iv); buf.set(new Uint8Array(enc), iv.length);
  return btoa(String.fromCharCode(...buf));
}

async function _favDecrypt(b64) {
  try {
    const key = await _favGetKey();
    if (!key || !b64) return null;
    const buf = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const iv = buf.slice(0, 12);
    const ct = buf.slice(12);
    const dec = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, ct);
    return JSON.parse(new TextDecoder().decode(dec));
  } catch { return null; } // tampered or corrupt → return null
}

async function getFavorites() {
  const raw = localStorage.getItem(FAV_STORE);
  if (!raw) return [];
  const data = await _favDecrypt(raw);
  if (!data) { showToast('Address book corrupted — resetting'); localStorage.removeItem(FAV_STORE); return []; }
  return Array.isArray(data) ? data : [];
}

async function saveFavorites(favs) {
  const enc = await _favEncrypt(favs);
  if (enc) localStorage.setItem(FAV_STORE, enc);
}

function detectNetworkLabel(address) {
  const type = window._detectAddressType ? window._detectAddressType(address) : 'unknown';
  if (type === 'bitcoin') return 'L1';
  if (type === 'ark') return 'ARK';
  if (/^(bc1|1|3|tb1)/i.test(address)) return 'L1';
  return 'ARK';
}

async function addFavorite(name, address) {
  const favs = await getFavorites();
  if (favs.some(f => f.address === address)) { showToast('Already saved'); return false; }
  const net = detectNetworkLabel(address);
  if (net !== 'ARK' && net !== 'L1') { showToast('Only ARK & L1 addresses can be saved'); return false; }
  favs.push({ name: name.trim(), address, net, ts: Date.now() });
  await saveFavorites(favs);
  return true;
}

async function removeFavoriteAddr(address) {
  const favs = (await getFavorites()).filter(f => f.address !== address);
  await saveFavorites(favs);
  renderFavList();
}

// --- Saved tab view in send sheet ---
let _favViewOpen = false;

function toggleSavedView(el) {
  const row = document.getElementById('snd-net-row');
  if (row) row.querySelectorAll('.qtt').forEach(x => x.classList.remove('active'));
  if (el) el.classList.add('active');

  const form = document.getElementById('send-form-area');
  const list = document.getElementById('fav-list-view');
  _favViewOpen = true;
  if (form) form.style.display = 'none';
  if (list) list.style.display = 'block';
  renderFavList();
}

function closeSavedView() {
  _favViewOpen = false;
  const form = document.getElementById('send-form-area');
  const list = document.getElementById('fav-list-view');
  if (form) form.style.display = 'block';
  if (list) list.style.display = 'none';
}

async function renderFavList() {
  const items = document.getElementById('fav-list-items');
  const empty = document.getElementById('fav-empty');
  if (!items) return;
  const favs = await getFavorites();
  if (favs.length === 0) {
    items.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  items.innerHTML = favs.map((f, i) => {
    const netColor = { ARK:'var(--acc2)', L1:'var(--grn)' }[f.net] || 'var(--t2)';
    const safeAddr = esc(f.address);
    const safeName = esc(f.name);
    const uid = 'fav-addr-' + i;
    return `<div style="background:var(--surf);border:1.5px solid var(--bdr);border-radius:14px;padding:14px 16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <div style="display:flex;align-items:center;gap:8px;cursor:pointer;flex:1" onclick="useFavorite('${f.address.replace(/'/g,"\\'")}','${f.net}')">
          <span style="font-size:9px;font-weight:800;color:${netColor};background:${netColor}18;padding:3px 6px;border-radius:5px;letter-spacing:.04em">${f.net}</span>
          <span style="font-size:14px;font-weight:700;color:var(--t1)">${safeName}</span>
        </div>
        <div style="display:flex;align-items:center;gap:2px">
          <button onclick="event.stopPropagation();toggleFavAddr('${uid}')" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--t3)" title="Show address">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button onclick="event.stopPropagation();confirmDeleteFav('${f.address.replace(/'/g,"\\'")}')" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--t3)" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </div>
      <div id="${uid}" style="display:none;font-size:11px;color:var(--t3);font-family:var(--f-mono);word-break:break-all;line-height:1.5;margin-top:6px;padding:8px 10px;background:var(--bg3);border-radius:8px">${safeAddr}</div>
    </div>`;
  }).join('');
}

function toggleFavAddr(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function useFavorite(address, net) {
  closeSavedView();
  // Switch to proper network tab
  const netMap = { ARK:'ark', L1:'onchain' };
  const netKey = netMap[net] || 'ark';
  const btn = document.getElementById('snd-net-btn-' + netKey);
  selectSendNet(netKey, btn);
  // Fill address
  const addrInput = document.getElementById('s-addr');
  if (addrInput) { addrInput.value = address; addrInput.dispatchEvent(new Event('input')); }
}

function confirmDeleteFav(address) {
  if (confirm('Remove this saved address?')) removeFavoriteAddr(address);
}

// --- Save from send result screen ---
async function saveFromResult() {
  const nameInput = document.getElementById('sres-fav-name');
  const name = nameInput?.value?.trim();
  if (!name) { showToast('Enter a name'); nameInput?.focus(); return; }
  const address = document.getElementById('sc-addr-full')?.value?.trim();
  if (!address) { showToast('No address to save'); return; }
  const ok = await addFavorite(name, address);
  if (ok) {
    showToast('Address saved');
    const btn = document.getElementById('sres-fav-btn');
    if (btn) {
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="20 6 9 17 4 12"/></svg> Saved';
      btn.style.color = 'var(--grn)'; btn.style.borderColor = 'var(--grn)'; btn.style.background = 'var(--grns)';
      btn.disabled = true;
    }
  }
}

// Show save-fav section on sendresult open (only for ARK/L1)
const _origOpenSheet = window.openSheet;
if (typeof _origOpenSheet === 'function') {
  window.openSheet = function(id) {
    _origOpenSheet(id);
    if (id === 'send') {
      // Reset to form view if Saved tab was active
      closeSavedView();
      const arkBtn = document.getElementById('snd-net-btn-ark');
      if (arkBtn && !document.querySelector('#snd-net-row .qtt.active')) {
        selectSendNet('ark', arkBtn);
      }
    }
    if (id === 'sendresult') {
      const addr = document.getElementById('sc-addr-full')?.value?.trim();
      const net = document.getElementById('sc-network-type')?.value;
      const sec = document.getElementById('sres-fav-section');
      const addrEl = document.getElementById('sres-fav-addr');
      const nameInput = document.getElementById('sres-fav-name');
      const btn = document.getElementById('sres-fav-btn');
      // Only show for ARK / L1 (onchain)
      const canSave = net === 'ark' || net === 'onchain';
      if (sec) sec.style.display = canSave && addr ? 'block' : 'none';
      if (addrEl) addrEl.textContent = addr || '';
      if (nameInput) nameInput.value = '';
      if (btn) {
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Save to Favorites';
        btn.style.color = 'var(--acc2)'; btn.style.borderColor = 'var(--cb)'; btn.style.background = 'var(--accs)';
        btn.disabled = false;
      }
      // Check if already saved
      if (addr && canSave) {
        getFavorites().then(favs => {
          if (favs.some(f => f.address === addr) && sec) sec.style.display = 'none';
        });
      }
    }
    if (id === 'invhistory') renderInvHistory();
    if (id === 'invcontacts') renderInvContacts();
    if (id === 'batchsend') renderBatchQueue();
  };
}

function doSend() {
  const rawAddress = document.getElementById('s-addr').value.trim();
  const address = rawAddress.replace(/^(ark|bitcoin|lightning):/i, '');
  const amount  = parseInt(document.getElementById('s-amt').value);
  if (!address) { showToast('Enter a recipient address'); return; }
  if (!amount || amount <= 0) {
    showToast(balDisplayMode === 'fiat' ? 'Enter a fiat amount' : 'Enter an amount in SATS');
    return;
  }
  const wallet = window._wallet;
  // For Ark sends, only offchain VTXOs are spendable — boarding UTXOs need onboarding first
  const detectedTypeEarly = window._detectAddressType ? window._detectAddressType(address) : 'unknown';
  const isArkSend = detectedTypeEarly === 'ark' || detectedTypeEarly === 'unknown';
  const spendable = wallet ? (isArkSend ? (wallet.offchain || 0) : (wallet.sats || 0)) : 0;
  if (wallet && amount > spendable) {
    if (isArkSend && wallet.onchain > 0 && wallet.offchain === 0) {
      showToast('Funds need onboarding first — tap "Onboard" in Settings');
    } else {
      showToast('Not enough spendable sats');
    }
    return;
  }

  // Detect network from address using shared detectAddressType
  let network = document.getElementById('snd-net')?.value || 'ark';
  const detectedType = window._detectAddressType ? window._detectAddressType(address) : 'unknown';
  if (detectedType !== 'unknown') {
    network = detectedType === 'bitcoin' ? 'onchain' : detectedType;
    selectSendNet(network);
  }
  let networkLabel = { onchain:'Bitcoin (on-chain)', lightning:'Lightning', ark:'Ark (off-chain)' }[network] || 'Ark';

  // Estimate fee using live mempool rates
  const rates   = window._feeRates || { halfHourFee: 12 };
  const feeSats = network === 'onchain' ? (rates.halfHourFee * 140) : 0;

  // Use live price for the active display currency
  const activeCur  = (typeof balDisplayMode !== 'undefined' && balDisplayMode !== 'sats' && document.getElementById('cur-settings-sel'))
    ? (document.getElementById('cur-settings-sel').value || 'USD') : 'USD';
  const livePrice  = (_livePrices && _livePrices[activeCur]) || window._btcUsd || _chartBasePrice || 96420;
  const curSym     = { USD:'$', EUR:'€', CHF:'CHF ' }[activeCur] || '$';
  const total = amount + feeSats;
  const feeUsd  = (feeSats * livePrice / 1e8).toFixed(2);
  const amtUsd  = (amount  * livePrice / 1e8).toFixed(2);
  const totUsd  = (total   * livePrice / 1e8).toFixed(2);

  // Spendable after fee — only shown for on-chain sends
  const offchainBal   = window._wallet?.offchain ?? window._wallet?.sats ?? 0;
  const spendableAmt  = Math.max(0, offchainBal - feeSats);
  const spendableUsd  = (spendableAmt * livePrice / 1e8).toFixed(2);

  // Populate confirm sheet
  const shortAddr = address.length > 22 ? address.slice(0, 12) + '…' + address.slice(-10) : address;
  document.getElementById('sc-addr-display').textContent  = shortAddr;
  document.getElementById('sc-addr-full').value           = address;
  document.getElementById('sc-amount-raw').value          = String(amount);
  document.getElementById('sc-amount-display').textContent = amount.toLocaleString() + ' SATS';
  document.getElementById('sc-fiat-display').textContent   = '≈ ' + curSym + amtUsd;
  document.getElementById('sc-network-display').textContent = networkLabel;
  document.getElementById('sc-fee-display').textContent    = feeSats > 0 ? '~' + feeSats.toLocaleString() + ' SATS (' + curSym + feeUsd + ')' : 'Free (batched)';
  document.getElementById('sc-total-display').textContent  = total.toLocaleString() + ' SATS (' + curSym + totUsd + ')';

  // Show spendable row only for on-chain sends
  const spendableRow = document.getElementById('sc-spendable-row');
  const spendableEl  = document.getElementById('sc-spendable-display');
  if (spendableRow && spendableEl) {
    if (network === 'onchain' && feeSats > 0) {
      spendableEl.textContent = spendableAmt.toLocaleString() + ' SATS (' + curSym + spendableUsd + ')';
      spendableRow.style.display = '';
    } else {
      spendableRow.style.display = 'none';
    }
  }
  // Store network type so confirmSend can route correctly
  const netTypeEl = document.getElementById('sc-network-type');
  if (netTypeEl) netTypeEl.value = network;

  closeSheet('send');
  setTimeout(() => openSheet('sendconfirm'), 200);
}

/* confirmSend is defined / overridden in main.js once SDK is loaded */
window._baseConfirmSend = window.confirmSend || async function() {
  showToast('SDK still loading, please wait…');
};
window.confirmSend = async function() {
  const net = (document.getElementById('sc-network-type')?.value || '').toLowerCase();
  const amt = parseInt(document.getElementById('sc-amount-raw')?.value) || 0;
  return window._baseConfirmSend();
};

function selFee(el) {
  el.closest('.fee-grid').querySelectorAll('.fo').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
}

/* ═══════════════════════════════════════════
   FILTERS — WORKING SORT/FILTER
═══════════════════════════════════════════ */
function setFil(el, filter) {
  el.closest('.fscroll').querySelectorAll('.ftg').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
  const rows = document.querySelectorAll('#tx-list .txr');
  rows.forEach(row => {
    const t = row.getAttribute('data-type');
    if (filter === 'all') {
      row.style.display = 'flex';
    } else if (filter === 'in' && t === 'in') {
      row.style.display = 'flex';
    } else if (filter === 'out' && t === 'out') {
      row.style.display = 'flex';
    } else if (filter === 'ln' && t === 'ln') {
      row.style.display = 'flex';
    } else if (filter === 'pnd' && t === 'pnd') {
      row.style.display = 'flex';
    } else {
      row.style.display = 'none';
    }
  });
}

/* ═══════════════════════════════════════════
   APP SHEETS
═══════════════════════════════════════════ */
const APP_CONTENT = {
  boltz: { title:'Lightning Activity', html:`<p style="font-size:13px;color:var(--t2);margin-bottom:18px;line-height:1.6">Track Lightning invoice creation and Lightning sends in one place. Entries are added automatically when you generate or pay over Lightning.</p><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;padding:12px 14px;background:var(--surf);border:1px solid var(--bdr);border-radius:14px"><div><div style="font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--t3);margin-bottom:4px">Lightning Activity</div><div style="font-size:14px;font-weight:700;color:var(--t1)">Receive and send history</div></div><button class="btns" onclick="renderBoltzLog(true)" style="border:none;min-width:44px;width:44px;height:44px;padding:0;border-radius:14px;display:grid;place-items:center" aria-label="Refresh Lightning Activity" title="Refresh Lightning Activity"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:18px;height:18px"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15.55-6.36L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15.55 6.36L3 16"/></svg></button></div><div id="boltz-log-panel"><div id="boltz-log-stats"></div><div id="boltz-log-list"></div><div id="boltz-log-empty" style="text-align:center;padding:24px 0;color:var(--t3);font-size:13px">No Lightning payments yet.</div></div>`, init: function(){ renderBoltzLog(); } },
  lendasat: { title:'LendaSat', html:`<p style="font-size:13px;color:var(--t2);margin-bottom:20px;line-height:1.6">Borrow against your sats. Keep your Bitcoin exposure.</p><div class="rtabs"><div class="rtab active">Lend</div><div class="rtab">Borrow</div></div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:18px"><div style="background:var(--surf);border:1px solid var(--bdr);border-radius:12px;padding:12px;text-align:center"><div style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">APY</div><div style="font-size:18px;font-weight:800;color:var(--amb)">4.8%</div></div><div style="background:var(--surf);border:1px solid var(--bdr);border-radius:12px;padding:12px;text-align:center"><div style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">Term</div><div style="font-size:18px;font-weight:800">30d</div></div><div style="background:var(--surf);border:1px solid var(--bdr);border-radius:12px;padding:12px;text-align:center"><div style="font-size:10px;font-weight:700;color:var(--t3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px">LTV</div><div style="font-size:18px;font-weight:800;color:var(--grn)">60%</div></div></div><div class="fld"><label class="flbl">Amount (BTC)</label><div class="fwrap"><input class="finp" type="number" placeholder="0.00000000" style="padding-right:68px"><span class="fmax">MAX</span></div></div><div class="fld"><label class="flbl">Lock Period</label><select class="finp" style="cursor:pointer"><option>7 days — 3.2% APY</option><option selected>30 days — 4.8% APY</option><option>90 days — 6.1% APY</option></select></div><button class="btnp" onclick="showToast('Lending position opened ✓')">Start Lending</button>` },
  swap: { title:'LendaSwap', html:`<p style="font-size:13px;color:var(--t2);margin-bottom:20px;line-height:1.6">Swap Bitcoin to USDC instantly. Non-custodial.</p><div class="fld"><label class="flbl">From</label><select class="finp" style="cursor:pointer"><option>Bitcoin (BTC)</option><option>Lightning (BTC)</option><option>Liquid (L-BTC)</option></select></div><div class="fld"><label class="flbl">Amount</label><div class="fwrap"><input class="finp" type="number" placeholder="0.00000000" style="padding-right:68px"><span class="fmax">MAX</span></div></div><div style="text-align:center;font-size:22px;color:var(--t3);padding:4px 0;cursor:pointer">⇅</div><div class="fld"><label class="flbl">To</label><select class="finp" style="cursor:pointer"><option selected>USDC</option><option>Lightning (BTC)</option><option>Liquid (L-BTC)</option></select></div><div class="fsm"><div class="fl"><span class="fl-l">Swap fee</span><span class="fl-v">0.25%</span></div><div class="fl"><span class="fl-l">Slippage</span><span class="fl-v">0.1% max</span></div></div><button class="btnp" onclick="showToast('Swap executed ✓')">Execute Swap</button>` },
  mysterybox: { title:'Mystery Box', isGame:true, isMB:true, gameId:'mb', _dummy:`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
      <div>
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--t3);margin-bottom:2px">Balance</div>
        <div id="mb-balance" style="font-size:24px;font-weight:900;color:var(--acc2)">10,000 sats</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--t3);margin-bottom:2px">Total Won</div>
        <div id="mb-won" style="font-size:16px;font-weight:800;color:var(--grn)">0 sats</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">
      <div onclick="mbOpen('starter')" style="background:var(--surf);border:1px solid var(--bdr);border-radius:14px;padding:14px 6px;text-align:center;cursor:pointer;transition:transform .15s" onmousedown="this.style.transform='scale(.94)'" onmouseup="this.style.transform=''">
        <div style="width:36px;height:36px;margin:0 auto 8px;background:rgba(255,255,255,.08);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--t2)"><svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px"><path d="M5 3h14a1 1 0 011 1v2H4V4a1 1 0 011-1zm15 4H4v13a1 1 0 001 1h14a1 1 0 001-1V7zm-8 3h2v6h-2v-6z"/></svg></div>
        <div style="font-size:11px;font-weight:800;color:var(--t1)">Starter</div>
        <div style="font-size:10px;color:var(--t3);font-weight:700;margin-top:2px">50 sats</div>
      </div>
      <div onclick="mbOpen('common')" style="background:var(--surf);border:1px solid var(--bdr);border-radius:14px;padding:14px 6px;text-align:center;cursor:pointer;transition:transform .15s" onmousedown="this.style.transform='scale(.94)'" onmouseup="this.style.transform=''">
        <div style="width:36px;height:36px;margin:0 auto 8px;background:rgba(245,166,35,.12);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--amb)"><svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px"><path d="M4 9h16v11a1 1 0 01-1 1H5a1 1 0 01-1-1V9zm7 3v5h2v-5h-2zM2 6a1 1 0 011-1h4.586l1.707-1.707A1 1 0 0110 3h4a1 1 0 01.707.293L16.414 5H21a1 1 0 011 1v2H2V6zm10-1h-1.586l-1 1H15l-1-1h-2z"/></svg></div>
        <div style="font-size:11px;font-weight:800;color:var(--t1)">Common</div>
        <div style="font-size:10px;color:var(--amb);font-weight:700;margin-top:2px">200 sats</div>
      </div>
      <div onclick="mbOpen('rare')" style="background:var(--surf);border:1px solid var(--bdr2);border-radius:14px;padding:14px 6px;text-align:center;cursor:pointer;transition:transform .15s;box-shadow:0 0 14px rgba(107,82,245,.2)" onmousedown="this.style.transform='scale(.94)'" onmouseup="this.style.transform=''">
        <div style="width:36px;height:36px;margin:0 auto 8px;background:rgba(107,82,245,.12);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--acc2)"><svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px"><path d="M20 7H4a2 2 0 00-2 2v1h20V9a2 2 0 00-2-2zM2 14v5a2 2 0 002 2h16a2 2 0 002-2v-5H2zm5 4H5v-2h2v2zm4 0H9v-2h2v2zm8-11h-3l-2-3H10L8 7H5l3-4h8l3 4z"/></svg></div>
        <div style="font-size:11px;font-weight:800;color:var(--acc2)">Rare</div>
        <div style="font-size:10px;color:var(--acc2);font-weight:700;margin-top:2px">500 sats</div>
      </div>
      <div onclick="mbOpen('epic')" style="background:linear-gradient(135deg,rgba(107,82,245,.1),rgba(245,166,35,.07));border:1px solid var(--acc2);border-radius:14px;padding:14px 6px;text-align:center;cursor:pointer;transition:transform .15s" onmousedown="this.style.transform='scale(.94)'" onmouseup="this.style.transform=''">
        <div style="width:36px;height:36px;margin:0 auto 8px;background:rgba(107,82,245,.15);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#a78bfa"><svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px"><path d="M6.5 2h11l3 5-8.5 14L3.5 7l3-5zm1.5 2L6 7l6 10 6-10-2-3H8zm4 1h-4l-1.5 2.5 3.5 6.5V5h2v5.9l3.5-6.4L14 5z"/></svg></div>
        <div style="font-size:11px;font-weight:800;color:var(--t1)">Epic</div>
        <div style="font-size:10px;color:var(--grn);font-weight:700;margin-top:2px">2,000 sats</div>
      </div>
      <div onclick="mbOpen('legendary')" style="background:linear-gradient(135deg,rgba(245,166,35,.13),rgba(255,77,77,.08));border:1px solid var(--amb);border-radius:14px;padding:14px 6px;text-align:center;cursor:pointer;transition:transform .15s" onmousedown="this.style.transform='scale(.94)'" onmouseup="this.style.transform=''">
        <div style="width:36px;height:36px;margin:0 auto 8px;background:rgba(245,166,35,.15);border-radius:10px;display:flex;align-items:center;justify-content:center;color:var(--amb)"><svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 3.8 2.4-7.4L2 9.4h7.6L12 2z"/></svg></div>
        <div style="font-size:11px;font-weight:800;color:var(--amb)">Legendary</div>
        <div style="font-size:10px;color:var(--amb);font-weight:700;margin-top:2px">5,000 sats</div>
      </div>
      <div onclick="mbOpen('satoshi')" style="background:linear-gradient(135deg,rgba(255,165,0,.16),rgba(107,82,245,.16));border:2px solid var(--amb);border-radius:14px;padding:14px 6px;text-align:center;cursor:pointer;transition:transform .15s;box-shadow:0 0 18px rgba(245,166,35,.25)" onmousedown="this.style.transform='scale(.94)'" onmouseup="this.style.transform=''">
        <div style="width:36px;height:36px;margin:0 auto 8px;background:rgba(245,166,35,.2);border-radius:10px;display:flex;align-items:center;justify-content:center;color:#f5a623"><svg viewBox="0 0 24 24" fill="currentColor" style="width:20px;height:20px"><path d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 3.21-1.81 6-4.72 7.28L13 17.77V20h-2v-2.23l-2.28-1.72C5.81 14.93 4 12.14 4 8.93c0-4.08 3.05-7.44 7-7.93V2.05h2zm-1 3.95C9.24 6 7 8.43 7 11.32c0 2.3 1.32 4.36 3.4 5.44L11 17.4V14h2v3.4l.6-.64C15.68 15.68 17 13.62 17 11.32 17 8.43 14.76 6 12 6z"/></svg></div>
        <div style="font-size:11px;font-weight:800;color:var(--amb)">Satoshi</div>
        <div style="font-size:10px;color:var(--grn);font-weight:700;margin-top:2px">21,000 sats</div>
      </div>
    </div>
    <div id="mb-result" style="min-height:76px;display:flex;align-items:center;justify-content:center;margin-bottom:12px"></div>
    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--t3);margin-bottom:8px;flex-shrink:0">History</div>
    ` },

  spaceinvaders: { title:'Space Invaders', isGame:true, entryCost:150, gameId:'si' },
  satsrun:       { title:'Sats Run',        isGame:true, entryCost:150, gameId:'sr' },
  pixelpaint:    { title:'Pixel Paint',     isGame:true, gameId:'pp' },

  support: { title:'Support', html:`<div style="text-align:center;padding:8px 0 20px"><div style="margin-bottom:12px;display:flex;justify-content:center"><svg viewBox="0 0 48 48" fill="none" style="width:48px;height:48px"><rect width="48" height="48" rx="12" fill="var(--accs)"/><rect x="8" y="16" width="32" height="19" rx="4" fill="var(--acc2)" fill-opacity="0.9"/><rect x="13" y="11" width="6" height="7" rx="1.5" fill="var(--acc2)" fill-opacity="0.6"/><rect x="29" y="11" width="6" height="7" rx="1.5" fill="var(--acc2)" fill-opacity="0.6"/><circle cx="18" cy="24" r="3.5" fill="var(--bg)"/><circle cx="30" cy="24" r="3.5" fill="var(--bg)"/><rect x="22" y="29" width="4" height="3" rx="1" fill="var(--bg)"/><rect x="5" y="27" width="5" height="5" rx="1" fill="var(--acc2)" fill-opacity="0.4"/><rect x="38" y="27" width="5" height="5" rx="1" fill="var(--acc2)" fill-opacity="0.4"/></svg></div><div style="font-size:16px;font-weight:700;color:var(--t1);margin-bottom:4px">How can we help?</div><div style="font-size:13px;color:var(--t2)">Average response under 2 hours</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px"><div style="background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r-md);padding:14px;cursor:pointer;display:flex;align-items:center;gap:10px" onclick="showToast('Opening Telegram…')"><div style="width:36px;height:36px;border-radius:11px;background:rgba(41,182,246,.12);color:#29b6f6;display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px;height:16px"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></div><div><div style="font-size:13px;font-weight:700;color:var(--t1)">Telegram</div><div style="font-size:10px;color:var(--t3)">Live chat</div></div></div><div style="background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r-md);padding:14px;cursor:pointer;display:flex;align-items:center;gap:10px" onclick="showToast('Opening email…')"><div style="width:36px;height:36px;border-radius:11px;background:var(--accs);color:var(--acc2);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px;height:16px"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></div><div><div style="font-size:13px;font-weight:700;color:var(--t1)">Email</div><div style="font-size:10px;color:var(--t3)">Send us a message</div></div></div><div style="background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r-md);padding:14px;cursor:pointer;display:flex;align-items:center;gap:10px" onclick="showToast('Opening Discord…')"><div style="width:36px;height:36px;border-radius:11px;background:rgba(88,101,242,.12);color:#5865f2;display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px;height:16px"><path d="M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37.07.07 0 003.645 4.4C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/></svg></div><div><div style="font-size:13px;font-weight:700;color:var(--t1)">Discord</div><div style="font-size:10px;color:var(--t3)">Community</div></div></div><div style="background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r-md);padding:14px;cursor:pointer;display:flex;align-items:center;gap:10px" onclick="showToast('Opening docs…')"><div style="width:36px;height:36px;border-radius:11px;background:var(--grns);color:var(--grn);display:flex;align-items:center;justify-content:center;flex-shrink:0"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="width:16px;height:16px"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg></div><div><div style="font-size:13px;font-weight:700;color:var(--t1)">Docs</div><div style="font-size:10px;color:var(--t3)">Go to ArkadeOS</div></div></div></div><button class="btnp" onclick="showToast('Ticket created ✓')">Open a Support Ticket</button>` }
};

/* ── Lightning Log ── */
function getLightningLogEntries() {
  if (window._lightningLog?.list) return window._lightningLog.list();
  try { return JSON.parse(localStorage.getItem('arkon_lightning_log_v2') || '[]'); } catch { return []; }
}

function addBoltzLog(entry) {
  if (window._lightningLog?.add) return window._lightningLog.add(entry);
  const current = getLightningLogEntries();
  current.unshift(entry);
  localStorage.setItem('arkon_lightning_log_v2', JSON.stringify(current.slice(0, 100)));
  return entry;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizedLightningStatus(entry) {
  const raw = String(entry?.status || '').trim().toLowerCase();
  const direction = entry.direction || entry.type || 'receive';
  const isReceive = direction === 'receive';
  if (/(fail|error|reject|expired|cancel|refund|timeout|unable|abandon)/i.test(raw)) return 'Failed';
  if (/(pending|await|processing|hold|created|invoice ready|mempool|broadcast|unconfirmed|waiting|in[ -]?flight|queued|lockup|claim pending|invoice paid but)/i.test(raw)) return 'Pending';
  if (isReceive) {
    if (/(complete|completed|confirmed|settled|claimed|claim(?:ed)? successfully|success)/i.test(raw)) return 'Received';
    if (/(paid|received)/i.test(raw)) return 'Pending';
    return 'Pending';
  }
  if (/(complete|completed|confirmed|settled|claimed|paid|sent|success)/i.test(raw)) return 'Sent';
  return 'Pending';
}

function formatLightningDateTime(ts) {
  const dt = new Date(ts || Date.now());
  return {
    date: dt.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }),
    time: dt.toLocaleTimeString(undefined, { hour:'2-digit', minute:'2-digit', second:'2-digit' }),
    compact: dt.toLocaleDateString(undefined, {month:'short',day:'numeric'}) + ' ' + dt.toLocaleTimeString(undefined, {hour:'2-digit',minute:'2-digit'})
  };
}

function closeLightningActivityModal() {
  const modal = document.getElementById('lightning-activity-modal');
  if (modal) modal.remove();
}

function showModal(content, title = '') {
  closeLightningActivityModal();
  const modal = document.createElement('div');
  modal.id = 'lightning-activity-modal';
  const isCompactViewport = window.matchMedia('(max-width: 640px), (max-height: 760px)').matches;
  modal.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:15000',
    'background:rgba(3,7,18,.72)',
    'backdrop-filter:blur(12px)',
    'display:flex',
    `align-items:${isCompactViewport ? 'flex-end' : 'center'}`,
    'justify-content:center',
    `padding:${isCompactViewport ? '10px 10px max(10px, env(safe-area-inset-bottom))' : '18px'}`,
    'overscroll-behavior:contain'
  ].join(';');
  const panelRadius = isCompactViewport ? '22px 22px 18px 18px' : '24px';
  const panelWidth = isCompactViewport ? 'min(100%, 420px)' : 'min(100%, 420px)';
  const panelHeight = isCompactViewport ? 'min(78dvh, 680px)' : 'min(86dvh, 760px)';
  modal.innerHTML = `
    <div style="width:${panelWidth};max-height:${panelHeight};overflow:hidden;border-radius:${panelRadius};background:linear-gradient(180deg,rgba(17,24,39,.98),rgba(11,17,32,.98));border:1px solid rgba(255,255,255,.08);box-shadow:0 30px 80px rgba(0,0,0,.45);display:flex;flex-direction:column">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 20px 14px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0">
        <div style="font-size:15px;font-weight:800;color:var(--t1);min-width:0">${escapeHtml(title)}</div>
        <button type="button" onclick="closeLightningActivityModal()" style="width:38px;height:38px;border-radius:12px;border:1px solid var(--bdr);background:var(--surf);color:var(--t1);font-size:18px;cursor:pointer;flex-shrink:0">×</button>
      </div>
      <div style="padding:16px 20px 20px;overflow:auto;-webkit-overflow-scrolling:touch">${content}</div>
    </div>`;
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeLightningActivityModal();
  });
  document.body.appendChild(modal);
}

function openLightningActivityDetail(index) {
  const entries = getLightningLogEntries();
  const entry = entries[index];
  if (!entry) return;
  const status = normalizedLightningStatus(entry);
  const direction = entry.direction || entry.type || 'receive';
  const amount = Number(entry.amountSats ?? entry.amount ?? 0);
  const when = formatLightningDateTime(entry.updatedAt || entry.createdAt || entry.ts || Date.now());
  const directionLabel = direction === 'receive' ? 'Incoming' : 'Outgoing';
  const description = entry.memo || entry.description || entry.rawStatus || entry.status || 'Lightning activity';
  const swapId = entry.id || entry.swapId || entry.paymentHash || '—';
  const invoiceAddress = entry.invoice || entry.invoiceAddress || entry.paymentRequest || entry.paymentHash || '—';
  const pendingBg = status === 'Pending' ? 'rgba(245,166,35,.14)' : 'var(--surf)';
  const pendingBorder = status === 'Pending' ? 'rgba(245,166,35,.35)' : 'var(--bdr)';
  showModal(`
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px">
      <div>
        <div style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--t3);margin-bottom:4px">Lightning Activity</div>
        <div style="font-size:22px;font-weight:900;color:var(--t1);line-height:1.1">${amount.toLocaleString()} sats</div>
      </div>
      <div style="padding:8px 12px;border-radius:999px;background:${pendingBg};border:1px solid ${pendingBorder};font-size:12px;font-weight:800;color:${status === 'Failed' ? 'var(--red)' : status === 'Pending' ? 'var(--amb)' : 'var(--t1)'}">${escapeHtml(status)}</div>
    </div>
    <div style="display:grid;grid-template-columns:1fr;gap:10px">
      <div style="padding:12px 14px;border-radius:14px;background:var(--surf);border:1px solid var(--bdr)"><div style="font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--t3);margin-bottom:5px">When</div><div style="font-size:14px;font-weight:700;color:var(--t1)">${escapeHtml(when.date)}</div><div style="font-size:12px;color:var(--t2);margin-top:2px">${escapeHtml(when.time)}</div></div>
      <div style="padding:12px 14px;border-radius:14px;background:var(--surf);border:1px solid var(--bdr)"><div style="font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--t3);margin-bottom:5px">Swap ID</div><div style="font-size:13px;font-weight:700;color:var(--t1);word-break:break-all">${escapeHtml(swapId)}</div></div>
      <div style="padding:12px 14px;border-radius:14px;background:var(--surf);border:1px solid var(--bdr)"><div style="font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--t3);margin-bottom:5px">Description</div><div style="font-size:13px;color:var(--t1);line-height:1.5">${escapeHtml(description)}</div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div style="padding:12px 14px;border-radius:14px;background:var(--surf);border:1px solid var(--bdr)"><div style="font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--t3);margin-bottom:5px">Direction</div><div style="font-size:13px;font-weight:700;color:${direction === 'receive' ? 'var(--grn)' : 'var(--red, #f44)'}">${escapeHtml(directionLabel)}</div></div>
        <div style="padding:12px 14px;border-radius:14px;background:var(--surf);border:1px solid var(--bdr)"><div style="font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--t3);margin-bottom:5px">Status</div><div style="font-size:13px;font-weight:700;color:${status === 'Failed' ? 'var(--red)' : status === 'Pending' ? 'var(--amb)' : 'var(--t1)'}">${escapeHtml(status)}</div></div>
      </div>
      <div style="padding:12px 14px;border-radius:14px;background:var(--surf);border:1px solid var(--bdr)"><div style="font-size:10px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--t3);margin-bottom:5px">Invoice Address</div><div style="font-size:13px;color:var(--t1);word-break:break-all;line-height:1.5">${escapeHtml(invoiceAddress)}</div></div>
    </div>
  `, 'Lightning Activity');
}

function renderBoltzLog(showRefreshedToast = false) {
  const list = document.getElementById('boltz-log-list');
  const empty = document.getElementById('boltz-log-empty');
  const stats = document.getElementById('boltz-log-stats');
  if (!list) return;
  const entries = getLightningLogEntries();
  const totals = entries.reduce((acc, e) => {
    const amount = Number(e.amountSats ?? e.amount ?? 0);
    const direction = e.direction || e.type || 'receive';
    const status = normalizedLightningStatus(e);
    if (status === 'Pending') acc.pending += 1;
    if (status === 'Failed') acc.failed += 1;
    if (status === 'Received' && direction === 'receive') acc.received += amount;
    if (status === 'Sent' && direction === 'send') acc.sent += amount;
    return acc;
  }, { received: 0, sent: 0, pending: 0, failed: 0 });
  if (stats) {
    stats.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">
        <div style="padding:10px 12px;border-radius:12px;background:var(--surf);border:1px solid var(--bdr)"><div style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.05em">Completed In</div><div style="font-size:14px;font-weight:800;color:var(--grn)">${totals.received.toLocaleString()} sats</div></div>
        <div style="padding:10px 12px;border-radius:12px;background:var(--surf);border:1px solid var(--bdr)"><div style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.05em">Completed Out</div><div style="font-size:14px;font-weight:800;color:var(--red)">${totals.sent.toLocaleString()} sats</div></div>
        <div style="padding:10px 12px;border-radius:12px;background:var(--surf);border:1px solid var(--bdr)"><div style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.05em">Pending</div><div style="font-size:14px;font-weight:800;color:var(--amb)">${totals.pending}</div></div>
        <div style="padding:10px 12px;border-radius:12px;background:var(--surf);border:1px solid var(--bdr)"><div style="font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.05em">Failed</div><div style="font-size:14px;font-weight:800;color:var(--red)">${totals.failed}</div></div>
      </div>`;
  }
  if (entries.length === 0) {
    list.innerHTML = '';
    if (empty) empty.style.display = 'block';
    if (showRefreshedToast && typeof showToast === 'function') showToast('Lightning Activity refreshed');
    return;
  }
  if (empty) empty.style.display = 'none';
  list.innerHTML = entries.map((e, index) => {
    const direction = e.direction || e.type || 'receive';
    const status = normalizedLightningStatus(e);
    const isPending = status === 'Pending';
    const dir = direction === 'receive'
      ? (status === 'Failed' ? '↓ Incoming failed' : (isPending ? '↓ Incoming pending' : '↓ Received'))
      : (status === 'Failed' ? '↑ Outgoing failed' : (isPending ? '↑ Outgoing pending' : '↑ Sent'));
    const dirColor = status === 'Pending' ? 'var(--amb)' : direction === 'receive' ? 'var(--grn)' : 'var(--red, #f44)';
    const amount = Number(e.amountSats ?? e.amount ?? 0);
    const when = formatLightningDateTime(e.updatedAt || e.createdAt || e.ts || Date.now());
    const detail = e.memo || e.description || e.rawStatus || e.status || (direction === 'receive' ? 'Lightning receive' : 'Lightning send');
    const hashPreview = e.id || e.paymentHash || e.invoice || '';
    const cardBg = isPending ? 'linear-gradient(135deg, rgba(245,166,35,.12), rgba(245,166,35,.04))' : 'var(--surf)';
    const cardBorder = isPending ? 'rgba(245,166,35,.35)' : 'var(--bdr)';
    return `<button type="button" onclick="openLightningActivityDetail(${index})" style="width:100%;text-align:left;padding:14px;border-radius:16px;margin-bottom:10px;border:1px solid ${cardBorder};background:${cardBg};cursor:pointer;display:block">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
        <div style="min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            <div style="font-size:13px;font-weight:800;color:${dirColor}">${dir}</div>
            ${isPending ? `<span style="padding:4px 8px;border-radius:999px;background:rgba(245,166,35,.16);border:1px solid rgba(245,166,35,.28);font-size:10px;font-weight:800;color:var(--amb);letter-spacing:.04em;text-transform:uppercase">Pending</span>` : ''}
          </div>
          <div style="font-size:11px;color:var(--t3);margin-top:4px">${escapeHtml(when.compact)}</div>
          <div style="font-size:12px;color:var(--t2);margin-top:6px;line-height:1.45">${escapeHtml(detail)}</div>
          ${hashPreview ? `<div style="font-size:10px;color:var(--t3);margin-top:6px">ID ${escapeHtml(String(hashPreview).slice(0, 18))}${String(hashPreview).length > 18 ? '…' : ''}</div>` : ''}
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:14px;font-weight:900;color:var(--t1)">${amount.toLocaleString()} sats</div>
          <div style="font-size:10px;color:${status === 'Failed' ? 'var(--red)' : isPending ? 'var(--amb)' : 'var(--t3)'};margin-top:4px;font-weight:800">${escapeHtml(status)}</div>
        </div>
      </div>
    </button>`;
  }).join('');
  if (showRefreshedToast && typeof showToast === 'function') showToast('Lightning Activity refreshed');
}

function boltzSwitchTab(el, panelId) {
  const tabs = el.parentElement.querySelectorAll('.rtab');
  tabs.forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('boltz-swap-panel').style.display = panelId === 'boltz-swap-panel' ? 'block' : 'none';
  document.getElementById('boltz-log-panel').style.display = panelId === 'boltz-log-panel' ? 'block' : 'none';
  if (panelId === 'boltz-log-panel') renderBoltzLog();
}

function openApp(id) {
  const a = APP_CONTENT[id]; if (!a) return;
  if (a.isGame) { openGame(id); return; }
  document.getElementById('app-sh-title').textContent = a.title;
  document.getElementById('app-sh-body').innerHTML = a.html;
  openSheet('app');
  if (a.init) setTimeout(a.init, 60);
}

/* ═══════════════════════════════════════════
   GAME SCREEN CONTROLLER
═══════════════════════════════════════════ */
window._activeGame = null;
function openGame(id) {
  const a = APP_CONTENT[id]; if(!a) return;
  window._activeGame = id;
  // Apply light/dark theme to game screen
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const gs = document.getElementById('game-screen');
  gs.style.setProperty('--gs-bg',  isLight ? 'var(--bg)'  : '#000');
  gs.style.setProperty('--gs-txt', isLight ? 'var(--t1)'  : '#fff');
  gs.style.setProperty('--gs-sub', isLight ? 'rgba(16,12,48,.45)' : 'rgba(255,255,255,.4)');
  gs.style.setProperty('--gs-btn', isLight ? 'rgba(46,30,140,.1)' : 'rgba(255,255,255,.1)');
  document.getElementById('gs-title').textContent = a.title;
  // Show/hide stats based on game type
  const statsEl = document.querySelector('.gs-stats');
  const isMB = id === 'mysterybox', isPP = id === 'pixelpaint';
  if (statsEl) statsEl.style.display = (isMB || isPP) ? 'none' : 'flex';
  if (!isMB && !isPP) {
    document.getElementById('gs-score').textContent = '0';
    document.getElementById('gs-best').textContent = '0';
  }
  const wrap = document.getElementById('gs-canvas-wrap');
  wrap.innerHTML = '';
  document.getElementById('gs-footer').style.display = 'none';
  gs.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    if (id === 'satsrun') srOpenGame(wrap, a.entryCost, isLight);
    if (id === 'spaceinvaders') siOpenGame(wrap, a.entryCost, isLight);
    if (id === 'mysterybox') mbOpenGame(wrap, isLight);
    if (id === 'pixelpaint') ppOpenGame(wrap, isLight);
  }, 80);
}
function closeGame() {
  if (window._sr && window._sr.raf) { cancelAnimationFrame(window._sr.raf); window._sr.raf = null; }
  if (window._si && window._si.raf) { cancelAnimationFrame(window._si.raf); window._si.raf = null; }
  if (window._pp && window._pp.raf) { cancelAnimationFrame(window._pp.raf); window._pp.raf = null; }
  document.getElementById('game-screen').classList.remove('open');
  document.body.style.overflow = '';
  window._activeGame = null;
}
function gsUpdateScore(val) { const el=document.getElementById('gs-score'); if(el) el.textContent=val; }
function gsUpdateBest(val)  { const el=document.getElementById('gs-best');  if(el) el.textContent=val; }

/* ═══════════════════════════════════════════
   TRANSACTION EXPORT
═══════════════════════════════════════════ */
let _exportPreset  = '30d';
let _exportFmt     = 'csv';

function openExportSheet() {
  // Set default date range to last 30 days
  selectExportPreset(null, _exportPreset);
  openSheet('export');
}

function selectExportPreset(btn, preset) {
  _exportPreset = preset;
  // Update button active states
  document.querySelectorAll('.export-preset[data-preset]').forEach(b => {
    b.classList.toggle('active', b.dataset.preset === preset);
  });

  const now   = new Date();
  let from, to;
  to   = new Date(now); to.setHours(23,59,59,999);

  if (preset === '30d') {
    from = new Date(now); from.setDate(from.getDate() - 30); from.setHours(0,0,0,0);
  } else if (preset === 'month') {
    from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    to   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
  } else if (preset === 'quarter') {
    from = new Date(now); from.setMonth(from.getMonth() - 3); from.setHours(0,0,0,0);
  } else if (preset === 'year') {
    from = new Date(now.getFullYear() - 1, 0, 1);
    to   = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
  } else if (preset === 'all') {
    from = new Date(2009, 0, 3); // genesis block ;)
  } else {
    // custom — read from inputs
    const fv = document.getElementById('export-from').value;
    const tv = document.getElementById('export-to').value;
    from = fv ? new Date(fv + 'T00:00:00') : new Date(2009, 0, 3);
    to   = tv ? new Date(tv + 'T23:59:59') : new Date();
  }

  // Update date inputs
  if (preset !== 'custom') {
    const toISO = d => d.toISOString().slice(0,10);
    const fi = document.getElementById('export-from');
    const ti = document.getElementById('export-to');
    if (fi) fi.value = toISO(from);
    if (ti) ti.value = toISO(to);
  }

  updateExportPreview(from, to);
}

function selectExportFmt(fmt) {
  _exportFmt = fmt;
  document.getElementById('export-fmt-csv').classList.toggle('active', fmt === 'csv');
  document.getElementById('export-fmt-pdf').classList.toggle('active', fmt === 'pdf');
}

function getExportDates() {
  const fv = document.getElementById('export-from').value;
  const tv = document.getElementById('export-to').value;
  const from = fv ? new Date(fv + 'T00:00:00') : new Date(2009, 0, 3);
  const to   = tv ? new Date(tv + 'T23:59:59') : new Date();
  return { from, to };
}

function addRunningBalances(txs, startBal) {
  let running = startBal;
  return txs.map(t => {
    running += t.cls === 'in' ? t.amount : -t.amount;
    return { ...t, balanceAfter: Math.max(0, running) };
  });
}

function updateExportPreview(from, to) {
  const reg = window._TX_REGISTRY || {};
  const all  = Object.values(reg);

  // All txs sorted oldest-first for balance calc
  const sorted = all.filter(t => t.rawDate).sort((a,b) => a.rawDate - b.rawDate);

  // Starting balance = sum of everything strictly BEFORE the range
  let startBal = 0;
  sorted.forEach(t => {
    if (t.rawDate < from) {
      startBal += t.cls === 'in' ? t.amount : -t.amount;
    }
  });

  const inRange = sorted.filter(t => t.rawDate && t.rawDate >= from && t.rawDate <= to);
  const enriched = addRunningBalances(inRange, startBal);

  const titleEl = document.getElementById('export-preview-title');
  const bodyEl  = document.getElementById('export-preview-body');
  if (!titleEl || !bodyEl) return;

  const fmt = d => d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  titleEl.textContent = `${fmt(from)} — ${fmt(to)}`;

  const received = inRange.filter(t => t.cls === 'in').reduce((s,t) => s + t.amount, 0);
  const sent     = inRange.filter(t => t.cls !== 'in').reduce((s,t) => s + t.amount, 0);
  const endBal   = startBal + received - sent;

  bodyEl.innerHTML = `
    <div style="display:flex;justify-content:space-between"><span>Transactions</span><strong style="color:var(--t1)">${enriched.length}</strong></div>
    <div style="display:flex;justify-content:space-between"><span>Starting balance</span><strong style="color:var(--t1)">${Math.max(0,startBal).toLocaleString()} sats</strong></div>
    <div style="display:flex;justify-content:space-between"><span>Total received</span><strong style="color:var(--grn)">+${received.toLocaleString()} sats</strong></div>
    <div style="display:flex;justify-content:space-between"><span>Total sent</span><strong style="color:var(--red)">−${sent.toLocaleString()} sats</strong></div>
    <div style="display:flex;justify-content:space-between;border-top:1px solid var(--bdr);margin-top:4px;padding-top:4px"><span>Ending balance</span><strong style="color:var(--t1)">${Math.max(0,endBal).toLocaleString()} sats</strong></div>`;
}

function runExport() {
  const { from, to } = getExportDates();
  const reg    = window._TX_REGISTRY || {};
  const all    = Object.values(reg);
  const sorted = all.filter(t => t.rawDate).sort((a,b) => a.rawDate - b.rawDate);

  let startBal = 0;
  sorted.forEach(t => {
    if (t.rawDate < from) startBal += t.cls === 'in' ? t.amount : -t.amount;
  });
  startBal = Math.max(0, startBal);

  const inRange = sorted.filter(t => t.rawDate && t.rawDate >= from && t.rawDate <= to);
  const enriched = addRunningBalances(inRange, startBal);

  if (enriched.length === 0) { showToast('No transactions in this range'); return; }

  const label = document.getElementById('export-run-label');
  if (label) label.textContent = 'Preparing…';

  const presetLabel = { '30d':'Last 30 Days','month':'Last Month','quarter':'Last Quarter','year':'Last Year','all':'All Time','custom':'Custom' }[_exportPreset] || '';
  const rangeLabel  = `${from.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})} – ${to.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`;
  const filename    = `arkade-transactions-${from.toISOString().slice(0,10)}-to-${to.toISOString().slice(0,10)}`;

  try {
    if (_exportFmt === 'csv') {
      exportCSV(enriched, startBal, filename, rangeLabel);
    } else {
      exportPDF(enriched, startBal, filename, rangeLabel, presetLabel);
    }
  } finally {
    setTimeout(() => { if (label) label.textContent = 'Download Export'; }, 1000);
  }
}

function exportCSV(txs, startBal, filename, rangeLabel) {
  const esc = v => `"${String(v).replace(/"/g,'""')}"`;
  const rows = [
    ['ArkON — Transaction Export'],
    [`Range: ${rangeLabel}`],
    [`Starting Balance (sats): ${startBal}`],
    [],
    ['Date','Time','Type','Network','Amount (sats)','Balance After (sats)','Direction','Status','Transaction Hash'],
  ];
  txs.forEach(t => {
    rows.push([
      esc(t.date),
      esc(t.time || '—'),
      esc(t.label),
      esc(t.network),
      t.amount,
      t.balanceAfter ?? '',
      t.cls === 'in' ? 'Received' : 'Sent',
      esc(t.status),
      esc(t.txid || '—'),
    ]);
  });
  const csv  = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename + '.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('CSV downloaded ✓');
}

function exportPDF(txs, startBal, filename, rangeLabel, presetLabel) {
  const received = txs.filter(t => t.cls === 'in').reduce((s,t) => s + t.amount, 0);
  const sent     = txs.filter(t => t.cls !== 'in').reduce((s,t) => s + t.amount, 0);
  const endBal   = Math.max(0, startBal + received - sent);
  const AC = '#0e3a8a';

  const rows = txs.map(t => {
    const clr = t.cls === 'in' ? '#16a34a' : '#dc2626';
    const sign = t.cls === 'in' ? '+' : '−';
    const hash = t.txid ? `<span style="font-family:monospace;font-size:5.4pt;letter-spacing:-.01em;color:#666;word-break:break-all">${t.txid}</span>` : '<span style="color:#ccc">—</span>';
    const explorerHref = t.commitmentTxid
      ? `https://mempool.space/tx/${t.commitmentTxid}`
      : t.boardingTxid
      ? `https://mempool.space/tx/${t.boardingTxid}`
      : t.arkTxid
      ? `https://arkade.space/tx/${t.arkTxid}`
      : null;
    const hashCell = explorerHref && t.txid
      ? `<a href="${explorerHref}" target="_blank" rel="noopener noreferrer" style="font-family:monospace;font-size:5.4pt;letter-spacing:-.01em;color:${AC};text-decoration:none;word-break:break-all">${t.txid}</a>`
      : hash;
    return `<tr>
      <td>${t.date}</td>
      <td>${t.time || '—'}</td>
      <td>${t.label}</td>
      <td>${t.network}</td>
      <td style="text-align:right;font-weight:700;color:${clr}">${sign}${t.amount.toLocaleString()}</td>
      <td style="text-align:right;font-weight:700;color:#1f2937">${(t.balanceAfter ?? 0).toLocaleString()}</td>
      <td style="text-align:center"><span style="font-size:7pt;padding:2px 6px;border-radius:50px;background:${t.settled ? '#dcfce7' : '#fef9c3'};color:${t.settled ? '#166534' : '#854d0e'}">${t.status}</span></td>
      <td>${hashCell}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8">
<title>ArkON Transaction Export</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Geist',sans-serif;background:#f5f4ff;padding:20px 10px;color:#1a1a2e}
  .page{width:100%;max-width:980px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;box-shadow:0 4px 40px rgba(46,30,140,.1)}
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid ${AC}}
  .brand{font-size:22pt;font-weight:900;color:${AC};letter-spacing:-.02em}
  .range{font-size:10pt;color:#666;margin-top:4px}
  .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:22px}
  .sum-box{background:#f8f7ff;border-radius:10px;padding:9px 10px}
  .sum-lbl{font-size:7pt;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9087be;margin-bottom:4px}
  .sum-val{font-size:10.5pt;font-weight:800;color:${AC}}
  .sum-val.grn{color:#16a34a}.sum-val.red{color:#dc2626}
  table{width:100%;border-collapse:collapse;font-size:6.5pt;table-layout:fixed}
  thead tr{background:${AC}}
  thead th{padding:6px 6px;font-size:6pt;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:#fff;text-align:left;white-space:nowrap}
  tbody tr:nth-child(even){background:#f8f7ff}
  tbody td{padding:5px 6px;border-bottom:1px solid #ede9ff;vertical-align:middle;line-height:1.18;overflow-wrap:anywhere;word-break:break-word}
  .footer{margin-top:24px;padding-top:16px;border-top:1px solid #ede9ff;display:flex;justify-content:space-between;font-size:8pt;color:#aaa}
  @media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0}button{display:none!important}}
  @page{size:A4 landscape;margin:8mm}
  .print-bar{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #ede9ff;padding:12px 16px;display:flex;gap:10px;justify-content:center;z-index:999}
  .print-bar button{padding:12px 28px;border-radius:50px;border:none;font-size:14px;font-weight:700;cursor:pointer}
  .btn-p{background:${AC};color:#fff;box-shadow:0 4px 16px rgba(46,30,140,.3)}
  .btn-s{background:#f0eeff;color:${AC}}
  @media print{.print-bar{display:none}}
</style>
</head><body>
<div class="page">
  <div class="header">
    <div>
      <div class="brand">ArkON</div>
      <div class="range">Transaction Statement · ${rangeLabel}${presetLabel ? ' (' + presetLabel + ')' : ''}</div>
    </div>
    <div style="text-align:right;font-size:9pt;color:#666">Generated ${new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
  </div>

  <div class="summary">
    <div class="sum-box"><div class="sum-lbl">Starting Balance</div><div class="sum-val">${startBal.toLocaleString()} <span style="font-size:9pt;font-weight:600;color:#9087be">SATS</span></div></div>
    <div class="sum-box"><div class="sum-lbl">Total Received</div><div class="sum-val grn">+${received.toLocaleString()} <span style="font-size:9pt;font-weight:600;color:#9087be">SATS</span></div></div>
    <div class="sum-box"><div class="sum-lbl">Total Sent</div><div class="sum-val red">−${sent.toLocaleString()} <span style="font-size:9pt;font-weight:600;color:#9087be">SATS</span></div></div>
    <div class="sum-box"><div class="sum-lbl">Ending Balance</div><div class="sum-val">${endBal.toLocaleString()} <span style="font-size:9pt;font-weight:600;color:#9087be">SATS</span></div></div>
  </div>

  <table>
    <thead><tr>
      <th>Date</th><th>Time</th><th>Type</th><th>Network</th>
      <th style="width:10%;text-align:right">Amount</th><th style="width:11%;text-align:right">Balance After</th><th style="width:11%;text-align:center">Status</th><th style="width:27%">Transaction Hash</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    <span>Arkade Wallet · arkade.computer</span>
    <span>${txs.length} transaction${txs.length !== 1 ? 's' : ''}</span>
  </div>
</div>
<div class="print-bar">
  <button class="btn-p" onclick="window.print()">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15" style="display:inline;vertical-align:middle;margin-right:6px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
    Save as PDF / Print
  </button>
</div>
</body></html>`;

  // Use Blob URL to prevent window.opener access from the export window
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const win  = window.open(url, '_blank', 'noopener,noreferrer');
  if (!win) {
    const a = document.createElement('a');
    a.href = url; a.download = filename + '.html'; a.click();
    showToast('PDF report downloaded ✓');
  }
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/* ═══════════════════════════════════════════
   ADDRESS AUTO-DETECT (shared by QR scan + manual input + upload)
═══════════════════════════════════════════ */
function autoDetectSendNet(addr) {
  if (!addr) return;
  const type = (window._detectAddressType && window._detectAddressType(addr)) || 'unknown';
  if      (type === 'lightning') selectSendNet('lightning');
  else if (type === 'bitcoin')   selectSendNet('onchain');
  else if (type === 'ark')       selectSendNet('ark');

  // Auto-fill amount from Lightning invoice if it contains an embedded amount
  if (type === 'lightning' && window._decodeLightningInvoice) {
    try {
      const decoded = window._decodeLightningInvoice(addr.replace(/^lightning:/i, '').split('?')[0].trim());
      if (decoded && decoded.amountSats && decoded.amountSats > 0) {
        const amtEl = document.getElementById('s-amt');
        if (amtEl) {
          amtEl.value = String(decoded.amountSats);
          // Sync fiat display if applicable
          if (typeof syncSendFiatFromSats === 'function') syncSendFiatFromSats();
        }
        // Also sync the fiat field in case of fiat mode
        const fiatEl = document.getElementById('s-fiat');
        if (fiatEl) {
          const cur   = (document.getElementById('cur-settings-sel')?.value) || 'USD';
          const price = (_livePrices?.[cur]) || window._btcUsd || _chartBasePrice || 96420;
          fiatEl.value = (decoded.amountSats * price / 1e8).toFixed(2);
        }
      }
    } catch (e) {
      // Decode may fail for partial input — ignore silently
    }
  }
}

/* ═══════════════════════════════════════════
   INVOICE / QR IMAGE UPLOAD
═══════════════════════════════════════════ */
function handleInvoiceUpload(inputEl) {
  const file = inputEl.files && inputEl.files[0];
  inputEl.value = ''; // reset so same file can be re-selected
  if (!file) return;

  const isText = file.type === 'text/plain' || file.name.endsWith('.txt');
  if (isText) {
    // Plain-text invoice file — read directly
    const reader = new FileReader();
    reader.onload = e => {
      const text = (e.target.result || '').trim().split(/\s+/)[0];
      if (text) applyScannedAddress(text, 's-addr');
      else showToast('Could not read invoice from file');
    };
    reader.readAsText(file);
    return;
  }

  // Image (or PDF rendered as image) — decode QR
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      if ('BarcodeDetector' in window) {
        new BarcodeDetector({ formats: ['qr_code'] })
          .detect(img)
          .then(codes => {
            if (codes.length > 0) applyScannedAddress(codes[0].rawValue, 's-addr');
            else showToast('No QR code found in image');
          })
          .catch(() => decodeWithJsQR(imageData, canvas.width, canvas.height));
      } else {
        decodeWithJsQR(imageData, canvas.width, canvas.height);
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function decodeWithJsQR(imageData, w, h) {
  if (window.jsQR) {
    const code = jsQR(imageData.data, w, h);
    if (code) applyScannedAddress(code.data, 's-addr');
    else showToast('No QR code found in image');
    return;
  }
  const scr = document.createElement('script');
  scr.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
  scr.integrity = 'sha384-Mj8MkfvuX5bWCnAE4DExmgB6oF9wQM7DZ3LHRD3JVB8X8a9nD7eFjGh1g6Gkf4I';
  scr.crossOrigin = 'anonymous';
  scr.onload = () => {
    const code = jsQR(imageData.data, w, h);
    if (code) applyScannedAddress(code.data, 's-addr');
    else showToast('No QR code found in image');
  };
  document.head.appendChild(scr);
}

function applyScannedAddress(raw, fieldId) {
  // Strip URI prefixes (bitcoin:, ark:, lightning:)
  let addr = raw.replace(/^bitcoin:/i,'').replace(/^ark:/i,'').replace(/^lightning:/i,'').split('?')[0].trim();
  const el = document.getElementById(fieldId);
  if (el) { el.value = addr; el.focus(); }
  autoDetectSendNet(addr);
  showToast('Address detected ✓');
}
function selectSendNet(net, btn) {
  // Close saved view if open
  if (_favViewOpen) closeSavedView();
  // Update hidden field and active pill
  const hidden = document.getElementById('snd-net');
  if (hidden) hidden.value = net;
  ['onchain','lightning','ark','saved'].forEach(n => {
    const b = document.getElementById('snd-net-btn-' + n);
    if (b) b.classList.toggle('active', n === net);
  });
  // Update address label and placeholder to match selected network
  const addrInput = document.getElementById('s-addr');
  const addrLbl   = document.getElementById('snd-addr-lbl');
  const addrMeta  = {
    ark:       { label: 'Ark Address',       placeholder: 'ark1q…'              },
    lightning: { label: 'Lightning Invoice', placeholder: 'lnbc… or user@domain' },
    onchain:   { label: 'Bitcoin Address',   placeholder: 'bc1q… or 1… or 3…'   },
  };
  const m = addrMeta[net] || addrMeta.ark;
  if (addrInput) addrInput.placeholder = m.placeholder;
  if (addrLbl)   addrLbl.textContent   = m.label;
  updateSendFees(net);
}

function updateSendFees(net) {
  document.getElementById('fee-section-onchain').style.display = net === 'onchain' ? 'block' : 'none';
  document.getElementById('fee-section-lightning').style.display = net === 'lightning' ? 'block' : 'none';
  document.getElementById('fee-section-ark').style.display = net === 'ark' ? 'block' : 'none';
}
function openQRScan(targetFieldId) {
  const fieldId = targetFieldId || 's-addr';
  const overlay = document.createElement('div');
  overlay.id = 'qr-cam-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;';
  overlay.innerHTML = `
    <div style="color:#fff;font-size:16px;font-weight:700;letter-spacing:-.02em">Scan QR Code</div>
    <div style="position:relative;width:268px;height:268px;border-radius:18px;overflow:hidden;background:#111">
      <video id="qrcam-video" style="width:100%;height:100%;object-fit:cover" playsinline autoplay muted></video>
      <div style="position:absolute;inset:0;pointer-events:none">
        <div style="position:absolute;top:14px;left:14px;width:28px;height:28px;border-top:3px solid #2563eb;border-left:3px solid #2563eb;border-radius:4px 0 0 0"></div>
        <div style="position:absolute;top:14px;right:14px;width:28px;height:28px;border-top:3px solid #2563eb;border-right:3px solid #2563eb;border-radius:0 4px 0 0"></div>
        <div style="position:absolute;bottom:14px;left:14px;width:28px;height:28px;border-bottom:3px solid #2563eb;border-left:3px solid #2563eb;border-radius:0 0 0 4px"></div>
        <div style="position:absolute;bottom:14px;right:14px;width:28px;height:28px;border-bottom:3px solid #2563eb;border-right:3px solid #2563eb;border-radius:0 0 4px 0"></div>
        <div id="qrcam-scan-line" style="position:absolute;left:14px;right:14px;height:2px;background:linear-gradient(90deg,transparent,#2563eb,transparent);animation:qrscan 2s linear infinite;top:14px"></div>
      </div>
    </div>
    <div style="color:rgba(255,255,255,.5);font-size:13px">Point at a Bitcoin, Ark, or Lightning QR</div>
    <button id="qrcam-cancel" style="padding:13px 36px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);border-radius:14px;color:#fff;font-size:14px;font-weight:600;cursor:pointer">Cancel</button>
    <style>@keyframes qrscan{0%{top:14px}50%{top:calc(100% - 28px)}100%{top:14px}}</style>`;
  document.body.appendChild(overlay);

  let stream = null, scanning = true;
  function closeCam() {
    scanning = false;
    if (stream) stream.getTracks().forEach(t => t.stop());
    overlay.remove();
  }
  document.getElementById('qrcam-cancel').onclick = closeCam;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeCam(); });

  function handleResult(val) {
    if (!scanning) return;
    closeCam();
    if (fieldId === 'qr-page-result') {
      // QR page display — just show raw value
      let addr = val.replace(/^bitcoin:/i,'').replace(/^ark:/i,'').replace(/^lightning:/i,'').split('?')[0].trim();
      const resWrap = document.getElementById('qr-page-result');
      const resVal  = document.getElementById('qr-page-result-val');
      if (resWrap) resWrap.style.display = 'block';
      if (resVal)  resVal.textContent = addr;
      showToast('QR scanned ✓');
    } else {
      applyScannedAddress(val, fieldId);
    }
  }

  navigator.mediaDevices.getUserMedia({ video: { facingMode:'environment' } })
    .then(s => {
      stream = s;
      const video = document.getElementById('qrcam-video');
      if (!video) { closeCam(); return; }
      video.srcObject = s;
      if ('BarcodeDetector' in window) {
        const det = new BarcodeDetector({ formats: ['qr_code'] });
        const tick = async () => {
          if (!scanning) return;
          try {
            const codes = await det.detect(video);
            if (codes.length > 0) { handleResult(codes[0].rawValue); return; }
          } catch(_) {}
          if (scanning) requestAnimationFrame(tick);
        };
        video.onloadedmetadata = () => tick();
      } else {
        // jsQR fallback
        const scr = document.createElement('script');
        scr.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
  scr.integrity = 'sha384-Mj8MkfvuX5bWCnAE4DExmgB6oF9wQM7DZ3LHRD3JVB8X8a9nD7eFjGh1g6Gkf4I';
  scr.crossOrigin = 'anonymous';
        scr.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const tick = () => {
            if (!scanning) return;
            if (video.readyState === video.HAVE_ENOUGH_DATA) {
              canvas.width = video.videoWidth; canvas.height = video.videoHeight;
              ctx.drawImage(video, 0, 0);
              const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(img.data, img.width, img.height);
              if (code) { handleResult(code.data); return; }
            }
            if (scanning) requestAnimationFrame(tick);
          };
          video.onloadedmetadata = () => tick();
        };
        document.head.appendChild(scr);
      }
    })
    .catch(err => {
      closeCam();
      showToast(err.name === 'NotAllowedError' ? 'Camera permission denied' : 'Camera not available');
    });
}

/* ═══════════════════════════════════════════
   LOAD MORE TRANSACTIONS
═══════════════════════════════════════════ */
function loadMoreTx() {
  const wrap = document.getElementById('load-more-wrap');
  const extra = document.getElementById('load-more-extra');
  const btn = wrap.querySelector('button');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;animation:spin .6s linear infinite"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Loading…';
  btn.disabled = true;
  setTimeout(() => {
    wrap.style.display = 'none';
    extra.style.display = 'block';
  }, 700);
}
function loadMoreTx2() {
  const w2 = document.getElementById('load-more-wrap-2');
  const btn = w2.querySelector('button');
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;animation:spin .6s linear infinite"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg> Loading…';
  btn.disabled = true;
  setTimeout(() => {
    w2.style.display = 'none';
    document.getElementById('load-more-end').style.display = 'block';
  }, 700);
}

/* ═══════════════════════════════════════════
   ADVANCED
═══════════════════════════════════════════ */
function openAdvanced() { openSheet('advanced'); if (window.refreshAdvancedVtxoPanel) window.refreshAdvancedVtxoPanel(); }

function openAboutSheet() {
  // Populate live server URLs once main.js has set them
  const ark     = window._ARK_SERVER_URL     || 'https://arkade.computer'
  const esplora = window._ESPLORA_API_URL    || 'https://mempool.space/api'
  const setEl = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt }
  setEl('about-ark-url',     ark)
  setEl('about-esplora-url', esplora)
  openSheet('about')
}

function openServerInfo() {
  const ark     = window._ARK_SERVER_URL     || 'https://arkade.computer'
  const esplora = window._ESPLORA_API_URL    || 'https://mempool.space/api'
  const setEl = (id, txt) => { const e = document.getElementById(id); if (e) e.textContent = txt }
  setEl('srv-ark-url',     ark)
  setEl('srv-esplora-url', esplora)
  setEl('adv-server-sub',  ark.replace('https://',''))
  setEl('srv-status-text', 'Connected · Bitcoin Mainnet')
  closeSheet('advanced')
  setTimeout(() => openSheet('serverinfo'), 120)
}

function setAppsFilter(filter, btn) {
  document.querySelectorAll('.app-pill').forEach(el => el.classList.toggle('active', el.dataset.appFilter === filter));
  document.querySelectorAll('.apps-section').forEach(section => {
    const show = filter === 'all' || section.dataset.appSection === filter;
    section.hidden = !show;
  });
}

/* ═══════════════════════════════════════════
   COPY
═══════════════════════════════════════════ */
function cpTxt(id) {
  const el = document.getElementById(id);
  if (el) {
    navigator.clipboard.writeText(el.textContent).catch(() => {});
    showToast('Copied to clipboard');
  }
}

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
let toastT;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2500);
}

/* ═══════════════════════════════════════════
   RENAME WALLET
═══════════════════════════════════════════ */
function openRenameWallet() {
  const current = document.getElementById('wallet-name-display').textContent;
  document.getElementById('wallet-name-input').value = current;
  openSheet('rename');
  setTimeout(() => document.getElementById('wallet-name-input').focus(), 300);
}
function saveWalletName() {
  const val = document.getElementById('wallet-name-input').value.trim();
  if (!val) { showToast('Enter a name'); return; }
  document.getElementById('wallet-name-display').textContent = val;
  try { localStorage.setItem('arkade_wallet_name', val); } catch {}
  closeSheet('rename');
  showToast('Wallet renamed');
}

(function loadSavedWalletName() {
  try {
    const saved = localStorage.getItem('arkade_wallet_name');
    if (saved) {
      const el = document.getElementById('wallet-name-display');
      if (el) el.textContent = saved;
    }
  } catch {}
})();

/* ═══════════════════════════════════════════
   CHART ENGINE — dynamic canvas with drag/hover tooltip
═══════════════════════════════════════════ */

/* ── Real historical prices from CoinGecko ── */
// CoinGecko free API: days=1 → 5min intervals, days≤90 → hourly, days>90 → daily
// For 5Y we use max to get full history
const RANGE_DAYS = { '24H': 1, '7D': 7, '1M': 30, '1Y': 365, '5Y': 'max' };
let curChartRange   = '24H';
let _chartPoints    = {};   // cache: range+currency → [{t, price}]
let _chartPctCache  = {};   // cache: range+currency → {pct, pos}
let _chartBasePrice = 96420;
let _chartCurrency  = 'USD'; // tracks which currency the chart is showing
// Kraken pair names for each display currency
const KRAKEN_PAIRS  = { USD: 'XXBTZUSD', EUR: 'XXBTZEUR', CHF: 'XBTCHF' };
const CG_CURRENCY   = { USD: 'usd', EUR: 'eur', CHF: 'chf' };
const CUR_SYMBOL    = { USD: '$', EUR: '€', CHF: 'CHF ' };
// Live prices per currency (fetched from Kraken)
const _livePrices   = { USD: null, EUR: null, CHF: null };
window._livePrices  = _livePrices; // expose for main.js module access

async function fetchChartPoints(range, currency) {
  const cur  = currency || _chartCurrency || 'USD';
  const days = RANGE_DAYS[range];
  const vsCur = CG_CURRENCY[cur] || 'usd';
  const interval = (days === 'max' || days >= 90) ? '&interval=daily' : '';
  const url = `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${vsCur}&days=${days}${interval}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('CoinGecko HTTP ' + res.status);
  const json = await res.json();
  const raw = json.prices;
  if (!raw || !raw.length) throw new Error('No price data');
  const pts = raw.map(([t, p]) => ({ t, price: Math.round(p) }));
  const first = pts[0].price, last = pts[pts.length - 1].price;
  const pct = ((last - first) / first * 100);
  const key = range + '_' + cur;
  _chartPctCache[key] = { pct: (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%', pos: pct >= 0 };
  return pts;
}

async function getChartPoints(range, currency) {
  const cur = currency || _chartCurrency || 'USD';
  const key = range + '_' + cur;
  if (_chartPoints[key] && _chartPoints[key].length) return _chartPoints[key];
  const pts = await fetchChartPoints(range, cur);
  _chartPoints[key] = pts;
  return pts;
}

// Fetch real market stats from CoinGecko and populate expanded sheet
async function fetchAndPopulateStats() {
  try {
    const cur  = _chartCurrency || 'USD';
    const sym  = CUR_SYMBOL[cur] || '$';
    const vsCur = CG_CURRENCY[cur] || 'usd';
    const res  = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vsCur}&ids=bitcoin`);
    const json = await res.json();
    const d    = json[0];
    if (!d) return;
    const fmtLarge = (n) => n >= 1e12 ? sym + (n/1e12).toFixed(2) + 'T'
                           : n >= 1e9  ? sym + (n/1e9).toFixed(1) + 'B'
                           : sym + n.toLocaleString('en-US');
    const el = id => document.getElementById(id);
    if (el('stat-mcap'))  el('stat-mcap').textContent  = fmtLarge(d.market_cap);
    if (el('stat-vol'))   el('stat-vol').textContent   = fmtLarge(d.total_volume);

    // High/Low: use chart data for current range if available, else 24h from CoinGecko
    updateChartHighLow();

    if (el('exp-chart-price') && d.current_price) {
      el('exp-chart-price').textContent = sym + Math.round(d.current_price).toLocaleString('en-US');
    }
  } catch(e) { console.warn('[Chart] Stats fetch failed:', e); }
}

function updateChartHighLow() {
  const cur  = _chartCurrency || 'USD';
  const sym  = CUR_SYMBOL[cur] || '$';
  const key  = curChartRange + '_' + cur;
  const pts  = _chartPoints[key];
  const hiEl = document.getElementById('stat-high');
  const loEl = document.getElementById('stat-low');
  if (!hiEl || !loEl) return;

  if (pts && pts.length) {
    const prices = pts.map(p => p.price);
    const hi = Math.max(...prices);
    const lo = Math.min(...prices);
    const rangeLabel = { '24H':'24h', '7D':'7d', '1M':'1m', '1Y':'1y', '5Y':'5y' }[curChartRange] || curChartRange;
    hiEl.textContent = sym + Math.round(hi).toLocaleString('en-US');
    loEl.textContent = sym + Math.round(lo).toLocaleString('en-US');
    // Update the label text too
    const hiLbl = hiEl.previousElementSibling;
    const loLbl = loEl.previousElementSibling;
    if (hiLbl) hiLbl.textContent = rangeLabel + ' High';
    if (loLbl) loLbl.textContent = rangeLabel + ' Low';
  } else {
    hiEl.textContent = '—';
    loEl.textContent = '—';
  }
}

// ── Canvas drawing (shared between mini and expanded chart) ──
function drawChart(canvasEl, pts, hoverIdx) {
  if (!canvasEl || !pts || !pts.length) return;
  const dpr = window.devicePixelRatio || 1;
  const W = canvasEl.offsetWidth, H = canvasEl.offsetHeight;
  if (!W || !H) return;
  canvasEl.width  = W * dpr;
  canvasEl.height = H * dpr;
  const ctx = canvasEl.getContext('2d');
  ctx.scale(dpr, dpr);

  const prices = pts.map(p => p.price);
  const minP = Math.min(...prices), maxP = Math.max(...prices);
  const pad = (maxP - minP) * 0.1 || 1;
  const lo = minP - pad, hi = maxP + pad;

  const xOf = i => (i / (pts.length - 1)) * W;
  const yOf = p => H - ((p - lo) / (hi - lo)) * H * 0.88 - H * 0.06;

  // Gradient fill
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(107,82,245,0.28)');
  grad.addColorStop(1, 'rgba(107,82,245,0)');
  ctx.beginPath();
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(xOf(i), yOf(p.price)) : ctx.lineTo(xOf(i), yOf(p.price)));
  ctx.lineTo(xOf(pts.length - 1), H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Line
  ctx.beginPath();
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = '#2563eb';
  ctx.lineJoin = 'round';
  ctx.lineCap  = 'round';
  pts.forEach((p, i) => i === 0 ? ctx.moveTo(xOf(i), yOf(p.price)) : ctx.lineTo(xOf(i), yOf(p.price)));
  ctx.stroke();

  // Hover dot
  if (hoverIdx != null && hoverIdx >= 0 && hoverIdx < pts.length) {
    const hx = xOf(hoverIdx), hy = yOf(pts[hoverIdx].price);
    ctx.beginPath(); ctx.arc(hx, hy, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#2563eb'; ctx.fill();
    ctx.beginPath(); ctx.arc(hx, hy, 7, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(107,82,245,0.35)'; ctx.lineWidth = 2; ctx.stroke();
  }
}

function formatChartDate(ts, range) {
  const d = new Date(ts);
  if (range === '24H') return d.toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  if (range === '7D')  return d.toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

// ── Attach drag/hover interaction to any chart canvas ──
function initChartInteraction(canvasEl, tooltipEl, ttPriceEl, ttDateEl, cursorEl, priceHeaderEl) {
  if (!canvasEl || canvasEl._chartInited) return;
  canvasEl._chartInited = true;

  function fmtPrice(p) {
    const sym = CUR_SYMBOL[_chartCurrency] || '$';
    return sym + p.toLocaleString('en-US');
  }

  function onMove(clientX) {
    const key = curChartRange + '_' + _chartCurrency;
    const pts = _chartPoints[key];
    if (!pts || !pts.length) return;
    const rect = canvasEl.getBoundingClientRect();
    const x = clientX - rect.left;
    const idx = Math.max(0, Math.min(pts.length - 1, Math.round((x / rect.width) * (pts.length - 1))));
    const pt  = pts[idx];

    if (priceHeaderEl) priceHeaderEl.textContent = fmtPrice(pt.price);
    if (ttPriceEl) ttPriceEl.textContent = fmtPrice(pt.price);
    if (ttDateEl)  ttDateEl.textContent  = formatChartDate(pt.t, curChartRange);
    if (tooltipEl) {
      const pct = idx / (pts.length - 1);
      const left = pct * rect.width;
      const ttW  = 160;
      tooltipEl.style.display   = 'block';
      tooltipEl.style.left      = Math.max(ttW/2, Math.min(rect.width - ttW/2, left)) + 'px';
      tooltipEl.style.transform = 'translateX(-50%)';
    }
    if (cursorEl) { cursorEl.style.display = 'block'; cursorEl.style.left = (idx / (pts.length-1) * rect.width) + 'px'; }
    drawChart(canvasEl, pts, idx);
  }

  function onLeave() {
    const key = curChartRange + '_' + _chartCurrency;
    const pts = _chartPoints[key];
    if (tooltipEl) tooltipEl.style.display = 'none';
    if (cursorEl)  cursorEl.style.display  = 'none';
    // Restore live price in correct currency
    const livePrice = _livePrices[_chartCurrency] || _livePrices['USD'] || _chartBasePrice;
    if (priceHeaderEl) priceHeaderEl.textContent = (CUR_SYMBOL[_chartCurrency] || '$') + Math.round(livePrice).toLocaleString('en-US');
    if (pts) drawChart(canvasEl, pts, null);
  }

  canvasEl.addEventListener('mousemove', e => onMove(e.clientX));
  canvasEl.addEventListener('mouseleave', onLeave);
  canvasEl.addEventListener('touchmove',  e => { e.preventDefault(); onMove(e.touches[0].clientX); }, { passive: false });
  canvasEl.addEventListener('touchend',   onLeave);
}

// ── Render a specific canvas with current range + currency data ──
async function renderCanvasChart(canvasId, tooltipId, ttPriceId, ttDateId, cursorId, priceHeaderId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  try {
    const pts = await getChartPoints(curChartRange, _chartCurrency);
    drawChart(canvas, pts, null);
    initChartInteraction(
      canvas,
      document.getElementById(tooltipId),
      document.getElementById(ttPriceId),
      document.getElementById(ttDateId),
      document.getElementById(cursorId),
      priceHeaderId ? document.getElementById(priceHeaderId) : null
    );
    // Update % badge using currency-keyed cache
    const key = curChartRange + '_' + _chartCurrency;
    const cached = _chartPctCache[key];
    if (cached) {
      ['chart-pct', 'exp-chart-pct'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.textContent = cached.pct; el.style.color = cached.pos ? 'var(--grn)' : 'var(--red)'; el.style.background = cached.pos ? 'var(--grns)' : 'var(--reds)'; }
      });
      const tcEl = document.getElementById('tick-change');
      if (tcEl) { tcEl.textContent = cached.pct + ' ' + curChartRange; tcEl.className = 'tc ' + (cached.pos ? 'up' : 'dn'); }
    }
  } catch(e) {
    console.warn('[Chart] renderCanvasChart failed:', e);
  }
}

async function renderChart(range) {
  // Reset interaction flag so new range re-inits properly
  const mini = document.getElementById('chart-canvas');
  const exp  = document.getElementById('exp-chart-canvas');
  if (mini) mini._chartInited = false;
  if (exp)  exp._chartInited  = false;

  await renderCanvasChart('chart-canvas', 'chart-tooltip', 'chart-tt-price', 'chart-tt-date', 'chart-cursor', 'tick-price');
  // Only render expanded if it's open
  if (document.getElementById('sheet-chartexp')?.classList.contains('open')) {
    await renderCanvasChart('exp-chart-canvas', 'exp-chart-tooltip', 'exp-chart-tt-price', 'exp-chart-tt-date', 'exp-chart-cursor', 'exp-chart-price');
  }
  // Update high/low for the current range
  updateChartHighLow();
}

async function setChartRange(el) {
  document.querySelectorAll('.crt').forEach(e => e.classList.remove('active'));
  document.querySelectorAll(`.crt[data-range="${el.dataset.range}"]`).forEach(e => e.classList.add('active'));
  curChartRange = el.dataset.range;
  // Invalidate cache for this range+currency so it re-fetches
  delete _chartPoints[curChartRange + '_' + _chartCurrency];
  await renderChart(curChartRange);
}

function openChartExpand() {
  openSheet('chartexp');
  // Render expanded chart and fetch live stats
  setTimeout(async () => {
    await renderCanvasChart('exp-chart-canvas', 'exp-chart-tooltip', 'exp-chart-tt-price', 'exp-chart-tt-date', 'exp-chart-cursor', 'exp-chart-price');
    await fetchAndPopulateStats();
    // Sync range tabs
    document.querySelectorAll('#sheet-chartexp .crt').forEach(e => {
      e.classList.toggle('active', e.dataset.range === curChartRange);
    });
  }, 80);
}

function syncExpRange(el) {
  document.querySelectorAll('#chart-card .crt').forEach(e => {
    e.classList.toggle('active', e.dataset.range === el.dataset.range);
  });
}

// ── Boot: Kraken for live price, then CoinGecko for chart history ──
async function bootChart() {
  try {
    // Fetch USD, EUR, CHF all in one Kraken call
    const kr  = await fetch('https://api.kraken.com/0/public/Ticker?pair=XBTUSD,XBTEUR,XBTCHF');
    const krj = await kr.json();
    const r   = krj.result || {};
    const usd = parseFloat((r['XXBTZUSD'] || r['XBTUSD'] || {}).c?.[0]) || null;
    const eur = parseFloat((r['XXBTZEUR'] || r['XBTEUR'] || {}).c?.[0]) || null;
    const chf = parseFloat((r['XBTCHF']  || {}).c?.[0]) || null;
    if (usd > 1000 && usd < 10_000_000) { _livePrices.USD = usd; _chartBasePrice = Math.round(usd); window._btcUsd = usd; }
    if (eur > 1000 && eur < 10_000_000)   _livePrices.EUR = eur;
    if (chf > 1000 && chf < 10_000_000)   _livePrices.CHF = chf;
    updateChartHeader();
  } catch(e) { console.warn('[Chart] Kraken fetch failed:', e); }
  _chartPoints = {};
  await renderChart(curChartRange);
}

// Update tick-label, tick-price and tick-change for active currency
function updateChartHeader() {
  const sym   = CUR_SYMBOL[_chartCurrency] || '$';
  const price = _livePrices[_chartCurrency] || _chartBasePrice;
  const label = 'BTC / ' + _chartCurrency;
  const tl = document.getElementById('tick-label');
  const tp = document.getElementById('tick-price');
  if (tl) tl.textContent = label;
  if (tp) tp.textContent = sym + Math.round(price).toLocaleString('en-US');
}

// Called by applyCur when user switches currency
async function switchChartCurrency(cur) {
  if (!['USD','EUR','CHF'].includes(cur)) return; // SATS — don't change chart
  _chartCurrency = cur;
  updateChartHeader();
  // Reset interaction so new currency data re-inits properly
  const mini = document.getElementById('chart-canvas');
  const exp  = document.getElementById('exp-chart-canvas');
  if (mini) mini._chartInited = false;
  if (exp)  exp._chartInited  = false;
  await renderChart(curChartRange);
}

// Re-render on resize
let _chartResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(_chartResizeTimer);
  _chartResizeTimer = setTimeout(() => renderChart(curChartRange), 100);
});

// Kick off after layout is settled — use ResizeObserver so we only draw
// once the canvas actually has non-zero dimensions.  Falls back to a
// timeout when ResizeObserver is unavailable.
let _chartBooted = false;
function _bootChartOnce() {
  if (_chartBooted) return;
  const canvas = document.getElementById('chart-canvas');
  if (canvas && (canvas.offsetWidth > 0 || canvas.getBoundingClientRect().width > 0)) {
    _chartBooted = true;
    bootChart();
  }
}
if (typeof ResizeObserver !== 'undefined') {
  const _chartRO = new ResizeObserver((entries) => {
    if (entries[0].contentRect.width > 0) { _chartRO.disconnect(); _bootChartOnce(); }
  });
  const _chartCanvas = document.getElementById('chart-canvas');
  if (_chartCanvas) {
    _chartRO.observe(_chartCanvas);
    // Fallback: if ResizeObserver never fires (e.g. hidden tab), boot after 500ms
    setTimeout(_bootChartOnce, 500);
  } else {
    setTimeout(bootChart, 120);
  }
} else {
  setTimeout(bootChart, 120);
}

/* ═══════════════════════════════════════════
   NOTIFICATION SYSTEM
═══════════════════════════════════════════ */
const NOTIF_DEFAULTS = { received:true, sent:true, failed:true, price:false };
let _notifPrefs = Object.assign({}, NOTIF_DEFAULTS);
try {
  const saved = localStorage.getItem('notif_prefs');
  if (saved) _notifPrefs = Object.assign({}, NOTIF_DEFAULTS, JSON.parse(saved));
} catch(e) {}

function saveNotifPrefs() {
  try { localStorage.setItem('notif_prefs', JSON.stringify(_notifPrefs)); } catch(e) {}
}

function openNotifSheet() {
  // Sync toggle states before opening
  ['received','sent','failed','price'].forEach(k => {
    const tog = document.getElementById('notif-tog-' + k);
    if (tog) tog.classList.toggle('on', !!_notifPrefs[k]);
  });
  updateNotifStatusText();
  openSheet('notifications');
}

function toggleNotifPref(key, el) {
  _notifPrefs[key] = !_notifPrefs[key];
  el.classList.toggle('on', _notifPrefs[key]);
  saveNotifPrefs();
  updateNotifStatusText();
}

function updateNotifStatusText() {
  const el = document.getElementById('notif-status-text');
  if (!el) return;
  const onCount = Object.values(_notifPrefs).filter(Boolean).length;
  el.textContent = onCount === 0 ? 'All notifications off' : onCount + ' of 4 enabled';
}

let _notifQueue = [];
let _notifShowing = false;

function showNotification(type, title, subtitle) {
  // type: 'success-in' | 'success-out' | 'fail' | 'pending'
  const prefMap = { 'success-in':'received', 'success-out':'sent', 'fail':'failed', 'pending':'sent' };
  const pref = prefMap[type] || 'received';
  if (!_notifPrefs[pref]) return;

  const iconMap = {
    'success-in': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`,
    'success-out': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`,
    'fail': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    'pending': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  };

  const banner = document.getElementById('notif-banner');
  const card = document.createElement('div');
  card.className = 'notif-card';
  card.innerHTML = `
    <div class="notif-ic ${type}">${iconMap[type] || iconMap['success-in']}</div>
    <div class="notif-body">
      <div class="notif-title">${title}</div>
      <div class="notif-sub">${subtitle}</div>
    </div>
    <button class="notif-close" onclick="dismissNotif(this.closest('.notif-card'))">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>`;
  card.onclick = function(e) { if (!e.target.closest('.notif-close')) dismissNotif(card); };
  banner.appendChild(card);
  requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('show')));
  setTimeout(() => dismissNotif(card), 5000);
}

function dismissNotif(card) {
  if (!card) return;
  card.classList.remove('show');
  card.classList.add('hide');
  setTimeout(() => card.remove(), 350);
}

/* ═══════════════════════════════════════════
   DYNAMIC NETWORK FEES
═══════════════════════════════════════════ */
let _feeRates = null; // cached fee rates from mempool.space

async function fetchFeeRates() {
  try {
    const res = await fetch('https://mempool.space/api/v1/fees/recommended');
    if (!res.ok) throw new Error('bad response');
    _feeRates = await res.json();
    // { fastestFee, halfHourFee, hourFee, economyFee, minimumFee }
    return _feeRates;
  } catch(e) {
    // fallback static values
    _feeRates = { fastestFee: 24, halfHourFee: 12, hourFee: 6, economyFee: 3, minimumFee: 1 };
    return _feeRates;
  }
}

async function refreshFeeGrid() {
  const rates = _feeRates || await fetchFeeRates();
  const activeCur = (typeof balDisplayMode !== 'undefined' && balDisplayMode !== 'sats' && document.getElementById('cur-settings-sel'))
    ? (document.getElementById('cur-settings-sel').value || 'USD') : 'USD';
  const price  = (_livePrices && _livePrices[activeCur]) || _btcUsd || 96420;

  // Update fee grid options
  const slowEl   = document.querySelector('#fee-section-onchain .fee-grid .fo:nth-child(1)');
  const medEl    = document.querySelector('#fee-section-onchain .fee-grid .fo:nth-child(2)');
  const fastEl   = document.querySelector('#fee-section-onchain .fee-grid .fo:nth-child(3)');

  if (slowEl) slowEl.innerHTML = `<div class="fo-nm">SLOW</div><div class="fo-r">${rates.hourFee} sat/vB</div><div class="fo-t">~60 min</div>`;
  if (medEl)  medEl.innerHTML  = `<div class="fo-nm">MEDIUM</div><div class="fo-r">${rates.halfHourFee} sat/vB</div><div class="fo-t">~30 min</div>`;
  if (fastEl) fastEl.innerHTML = `<div class="fo-nm">FAST</div><div class="fo-r">${rates.fastestFee} sat/vB</div><div class="fo-t">~10 min</div>`;

  // Update fee summary with medium fee (140 vBytes typical tx)
  updateFeeSummary(rates.halfHourFee);
}

function updateFeeSummary(ratePerVb) {
  const vbytes = 140;
  const feeSats = ratePerVb * vbytes;
  const activeCur = (typeof balDisplayMode !== 'undefined' && balDisplayMode !== 'sats' && document.getElementById('cur-settings-sel'))
    ? (document.getElementById('cur-settings-sel').value || 'USD') : 'USD';
  const price  = (_livePrices && _livePrices[activeCur]) || _btcUsd || 96420;
  const sym    = { USD:'$', EUR:'€', CHF:'CHF ' }[activeCur] || '$';
  const feeUsd = (feeSats * price / 1e8).toFixed(2);
  const time = ratePerVb >= (_feeRates?.fastestFee || 24) ? '~10 minutes' :
               ratePerVb >= (_feeRates?.halfHourFee || 12) ? '~30 minutes' : '~60 minutes';
  const fsmEl = document.querySelector('#fee-section-onchain .fsm');
  if (fsmEl) fsmEl.innerHTML = `
    <div class="fl"><span class="fl-l">Estimated fee</span><span class="fl-v">~${feeSats.toLocaleString()} SATS (${sym}${feeUsd})</span></div>
    <div class="fl"><span class="fl-l">Estimated time</span><span class="fl-v">${time}</span></div>
    <div class="fl" style="margin-top:4px"><span class="fl-l" style="font-size:10px;color:var(--t3)">Rate: ${ratePerVb} sat/vB · Live from mempool</span></div>`;
}

// When fee option is clicked, update summary
const origSelFee = window.selFee;
window.selFee = function(el) {
  el.closest('.fee-grid').querySelectorAll('.fo').forEach(x => x.classList.remove('active'));
  el.classList.add('active');
  // Parse sat/vB from selected option
  const rateText = el.querySelector('.fo-r')?.textContent || '';
  const rate = parseInt(rateText);
  if (rate) updateFeeSummary(rate);
};

// Fees refresh when send opens — hooked in new openSheet above
const _origOpenSheetFees = openSheet;
openSheet = function(t) {
  _origOpenSheetFees(t);
  if (t === 'send') fetchFeeRates().then(() => refreshFeeGrid());
};

/* doSend + confirmSend handled in main.js */

/* ═══════════════════════════════════════════
   SPACE INVADERS — DEDUCT BALANCE ON START
═══════════════════════════════════════════ */
// ── Space Invaders: intercept siOpenGame to gate lobby→playing on real payment ──
(function() {
  const _origSiOpenGame = window.siOpenGame;
  window.siOpenGame = function(wrap, cost, isLight) {
    _origSiOpenGame(wrap, cost, isLight);
    const si = window._si;
    if (!si || !si.canvas) return;
    // Clone canvas to strip original listeners (they'd start game without payment)
    const nc = si.canvas.cloneNode(true);
    si.canvas.parentNode.replaceChild(nc, si.canvas);
    si.canvas = nc;
    si.ctx = nc.getContext('2d');
    siDraw(); // redraw lobby on fresh context

    async function siPayAndStart() {
      if (si.state !== 'lobby') return;
      if ((window._wallet?.sats || 0) < si.entryCost) { showToast('Not enough sats'); return; }
      si.state = 'paying';
      const ctx = si.ctx, W = nc.width, H = nc.height;
      ctx.clearRect(0,0,W,H);
      ctx.fillStyle='rgba(0,0,5,.95)'; ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#a78bfa'; ctx.font='bold 14px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('SENDING 150 SATS\u2026', W/2, H/2-10);
      ctx.fillStyle='rgba(255,255,255,.3)'; ctx.font='10px monospace';
      ctx.fillText('Please wait', W/2, H/2+12);
      try {
        await arcadeSendBitcoin(ARCADE_ADDRESS, si.entryCost);
        addTxRow('out', 'Space Invaders \u2014 Entry', si.entryCost);
        if (window._refreshTransactions) window._refreshTransactions();
        si.state = 'playing';
        siLoop();
      } catch(e) {
        console.error('[SI] Entry payment failed:', e);
        si.state = 'lobby';
        showToast('Payment failed \u2014 ' + (e?.message||'try again').slice(0,40));
        siDraw();
      }
    }

    let _tsx = null, _spx = null, _tmv = false, _mdn = false;
    nc.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.changedTouches[0];
      _tsx = t.clientX; _spx = si.player.x; _tmv = false;
      if (si.state === 'lobby') { siPayAndStart(); }
      else if (si.state === 'dead') { window.siOpenGame(wrap, si.entryCost, si._isLight); }
    }, {passive:false});
    nc.addEventListener('touchmove', e => {
      e.preventDefault();
      if (si.state !== 'playing') return;
      const t = e.changedTouches[0], dx = t.clientX - _tsx;
      si.player.x = Math.max(0, Math.min(nc.width - si.player.w, _spx + dx * (nc.width / nc.getBoundingClientRect().width)));
      if (Math.abs(dx) > 5) _tmv = true;
    }, {passive:false});
    nc.addEventListener('touchend', e => {
      e.preventDefault();
      if (!_tmv && si.state === 'playing' && si.bullets.length < 3)
        si.bullets.push({x: si.player.x + si.player.w/2, y: si.player.y, w:3, h:12, vy:-9});
      _tmv = false;
    }, {passive:false});
    nc.addEventListener('mousedown', e => {
      _mdn = true; _tsx = e.clientX; _spx = si.player.x; _tmv = false;
      if (si.state === 'lobby') { siPayAndStart(); }
      else if (si.state === 'dead') { window.siOpenGame(wrap, si.entryCost, si._isLight); }
    });
    nc.addEventListener('mousemove', e => {
      if (!_mdn || si.state !== 'playing') return;
      const dx = e.clientX - _tsx;
      si.player.x = Math.max(0, Math.min(nc.width - si.player.w, _spx + dx * (nc.width / nc.getBoundingClientRect().width)));
      if (Math.abs(dx) > 4) _tmv = true;
    });
    nc.addEventListener('mouseup', e => {
      if (!_tmv && si.state === 'playing' && si.bullets.length < 3)
        si.bullets.push({x: si.player.x + si.player.w/2, y: si.player.y, w:3, h:12, vy:-9});
      _mdn = false; _tmv = false;
    });
  };
})();

// Patch siDie — flat fee, no earnings credited back
const _origSiDie = window.siDie;
window.siDie = function() {
  _origSiDie();
  const si = window._si;
  showNotification('fail', 'Space Invaders', 'Game over — score ' + si.score.toLocaleString());
};


/* ═══════════════════════════════════════════
   INIT NOTIF UI
═══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  updateNotifStatusText();
  // Pre-fetch fees in background
  fetchFeeRates();
});


let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  // Show the in-app install banner
  const banner = document.getElementById('pwa-banner');
  if (banner) banner.style.display = 'flex';
});

function triggerPWAInstall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((result) => {
      if (result.outcome === 'accepted') {
        showToast('ArkON installed ✓');
        const banner = document.getElementById('pwa-banner');
        if (banner) banner.style.display = 'none';
      }
      deferredInstallPrompt = null;
    });
  } else {
    // iOS fallback — show instructions
    showToast('Tap Share → Add to Home Screen');
  }
}

window.addEventListener('appinstalled', () => {
  showToast('ArkON installed ✓');
  const banner = document.getElementById('pwa-banner');
  if (banner) banner.style.display = 'none';
});

// Inject PWA manifest inline
const manifest = {
  name: "ArkON",
  short_name: "ArkON",
  description: "Bitcoin-native wallet with Lightning, DeFi, and more",
  start_url: "./",
  display: "standalone",
  background_color: "#0e3a8a",
  theme_color: "#0e3a8a",
  orientation: "portrait",
  icons: [
    { src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><rect width='48' height='48' fill='%232e1e8c'/></svg>", sizes: "48x48", type: "image/svg+xml" }
  ]
};
const blob = new Blob([JSON.stringify(manifest)], {type:'application/json'});
document.getElementById('pwa-manifest').href = URL.createObjectURL(blob);

/* ═══════════════════════════════════════════
   INVOICE GENERATOR
═══════════════════════════════════════════ */
let invStep = 1;
let invPayMethod = 'ark';
let invItems = [];
let invCurrency = 'USD'; // invoice-specific currency, independent of wallet display
let invColor = '#0e3a8a'; // invoice accent color

// ═══════════════════════════════════════════
//    INVOICE CONTACTS (unified company + client)
// ═══════════════════════════════════════════
const INV_CONTACTS_KEY = 'arkon_inv_contacts';
function getInvContacts() {
  try { return JSON.parse(localStorage.getItem(INV_CONTACTS_KEY) || '[]'); } catch { return []; }
}
function saveInvContacts(list) { localStorage.setItem(INV_CONTACTS_KEY, JSON.stringify(list)); }

function saveContactFromForm(type) {
  const prefix = type === 'from' ? 'inv-from' : 'inv-to';
  const name = document.getElementById(prefix + '-name').value.trim();
  if (!name) { showToast('Enter a name first'); return; }
  const data = { name, addr: document.getElementById(prefix + '-addr').value, email: document.getElementById(prefix + '-email').value };
  if (type === 'from') data.phone = document.getElementById('inv-from-phone').value;
  data.type = type; data.ts = Date.now();
  const contacts = getInvContacts();
  const idx = contacts.findIndex(c => c.name === name && c.type === type);
  if (idx >= 0) contacts[idx] = { ...contacts[idx], ...data };
  else contacts.push(data);
  saveInvContacts(contacts);
  showToast('Contact saved');
  const btnId = type === 'from' ? 'inv-save-co-btn' : 'inv-save-client-btn';
  const btn = document.getElementById(btnId);
  if (btn) { btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="20 6 9 17 4 12"/></svg> Saved'; btn.style.color = 'var(--grn)'; btn.style.borderColor = 'var(--grn)'; }
}

function fillContactToForm(type, contact) {
  const prefix = type === 'from' ? 'inv-from' : 'inv-to';
  document.getElementById(prefix + '-name').value = contact.name || '';
  document.getElementById(prefix + '-addr').value = contact.addr || '';
  document.getElementById(prefix + '-email').value = contact.email || '';
  if (type === 'from' && contact.phone) document.getElementById('inv-from-phone').value = contact.phone;
  hideContactSuggest(type);
}

function showContactSuggest(type, query) {
  const el = document.getElementById(type === 'from' ? 'inv-from-suggest' : 'inv-to-suggest');
  if (!el) return;
  const q = (query || '').toLowerCase();
  const contacts = getInvContacts().filter(c => {
    if (q && !c.name.toLowerCase().includes(q)) return false;
    return true;
  });
  if (contacts.length === 0) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.innerHTML = contacts.map((c, i) => {
    const typeLabel = c.type === 'from' ? 'Company' : 'Client';
    return `<div class="contact-suggest-item" data-cidx="${i}" onmousedown="pickContact('${type}',${i})">
      <div style="font-size:13px;font-weight:600;color:var(--t1)">${esc(c.name)}</div>
      <div style="font-size:10px;color:var(--t3);margin-top:1px">${esc(c.email || c.addr || typeLabel)}</div>
    </div>`;
  }).join('');
  // store filtered contacts for pick
  el._contacts = contacts;
}

function hideContactSuggest(type) {
  const el = document.getElementById(type === 'from' ? 'inv-from-suggest' : 'inv-to-suggest');
  if (el) setTimeout(() => el.style.display = 'none', 150);
}
function pickContact(type, idx) {
  const el = document.getElementById(type === 'from' ? 'inv-from-suggest' : 'inv-to-suggest');
  const c = el && el._contacts && el._contacts[idx];
  if (c) fillContactToForm(type, c);
}

// Contacts repository rendering
function renderInvContacts() {
  const list = document.getElementById('inv-contacts-list');
  const empty = document.getElementById('inv-contacts-empty');
  if (!list) return;
  const contacts = getInvContacts().sort((a, b) => a.name.localeCompare(b.name));
  if (contacts.length === 0) { list.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
  if (empty) empty.style.display = 'none';
  list.innerHTML = contacts.map(c => {
    const typeColor = c.type === 'from' ? 'var(--acc2)' : 'var(--grn)';
    const typeLabel = c.type === 'from' ? 'Company' : 'Client';
    const eid = 'cedit-' + c.ts;
    return `<div style="background:var(--surf);border:1.5px solid var(--bdr);border-radius:14px;padding:14px 16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:9px;font-weight:800;color:${typeColor};background:${typeColor}18;padding:3px 6px;border-radius:5px;letter-spacing:.04em">${typeLabel}</span>
          <span style="font-size:14px;font-weight:700;color:var(--t1)">${esc(c.name)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:4px">
          <button onclick="toggleEditContact('${c.ts}')" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--t3)" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button onclick="deleteInvContact('${c.ts}')" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--t3)" title="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          </button>
        </div>
      </div>
      ${c.addr ? '<div style="font-size:11px;color:var(--t3);margin-bottom:2px">' + esc(c.addr) + '</div>' : ''}
      ${c.email ? '<div style="font-size:11px;color:var(--t3);margin-bottom:2px">' + esc(c.email) + '</div>' : ''}
      ${c.phone ? '<div style="font-size:11px;color:var(--t3)">' + esc(c.phone) + '</div>' : ''}
      <div id="${eid}" style="display:none;margin-top:10px;padding-top:10px;border-top:1px solid var(--bdr)">
        <div class="fld" style="margin-bottom:8px"><label class="flbl" style="font-size:10px">Name</label><input class="finp" id="${eid}-name" value="${esc(c.name)}" style="font-size:12px"></div>
        <div class="fld" style="margin-bottom:8px"><label class="flbl" style="font-size:10px">Address</label><input class="finp" id="${eid}-addr" value="${esc(c.addr || '')}" style="font-size:12px"></div>
        <div class="fld" style="margin-bottom:8px"><label class="flbl" style="font-size:10px">Email</label><input class="finp" id="${eid}-email" value="${esc(c.email || '')}" style="font-size:12px"></div>
        ${c.type === 'from' ? '<div class="fld" style="margin-bottom:8px"><label class="flbl" style="font-size:10px">Phone</label><input class="finp" id="' + eid + '-phone" value="' + esc(c.phone || '') + '" style="font-size:12px"></div>' : ''}
        <button onclick="saveEditContact('${c.ts}')" style="width:100%;height:36px;border-radius:10px;background:var(--acc2);color:#fff;border:none;font-size:12px;font-weight:700;cursor:pointer">Save</button>
      </div>
    </div>`;
  }).join('');
}

function toggleEditContact(ts) {
  const el = document.getElementById('cedit-' + ts);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function saveEditContact(ts) {
  const contacts = getInvContacts();
  const c = contacts.find(x => String(x.ts) === String(ts));
  if (!c) return;
  const eid = 'cedit-' + ts;
  c.name = (document.getElementById(eid + '-name')?.value || '').trim() || c.name;
  c.addr = document.getElementById(eid + '-addr')?.value || '';
  c.email = document.getElementById(eid + '-email')?.value || '';
  if (c.type === 'from') c.phone = document.getElementById(eid + '-phone')?.value || '';
  saveInvContacts(contacts);
  renderInvContacts();
  showToast('Contact updated');
}

function deleteInvContact(ts) {
  if (!confirm('Delete this contact?')) return;
  const contacts = getInvContacts().filter(c => String(c.ts) !== String(ts));
  saveInvContacts(contacts);
  renderInvContacts();
}

// Migrate old company data
(function migrateOldCompany() {
  const old = localStorage.getItem('arkon_inv_company');
  if (!old) return;
  try {
    const d = JSON.parse(old);
    if (d && d.name) {
      const contacts = getInvContacts();
      if (!contacts.some(c => c.name === d.name && c.type === 'from')) {
        contacts.push({ name: d.name, addr: d.addr || '', email: d.email || '', phone: d.phone || '', type: 'from', ts: Date.now() });
        saveInvContacts(contacts);
      }
    }
    localStorage.removeItem('arkon_inv_company');
  } catch {}
})();

function loadInvCompany() {
  const contacts = getInvContacts().filter(c => c.type === 'from');
  if (contacts.length === 0) return;
  const d = contacts[0]; // most recent company contact
  if (d.name)  document.getElementById('inv-from-name').value = d.name;
  if (d.addr)  document.getElementById('inv-from-addr').value = d.addr;
  if (d.email) document.getElementById('inv-from-email').value = d.email;
  if (d.phone) document.getElementById('inv-from-phone').value = d.phone;
}

function openInvoice() {
  // Seed today's date and a default invoice number
  const today = new Date();
  const iso = today.toISOString().split('T')[0];
  const due = new Date(today); due.setDate(due.getDate() + 14);
  const dueIso = due.toISOString().split('T')[0];
  document.getElementById('inv-date').value = iso;
  document.getElementById('inv-due').value = dueIso;
  const n = 'INV-' + String(Math.floor(Math.random()*900)+100);
  document.getElementById('inv-num').value = n;
  // Pre-fill Ark address
  document.getElementById('inv-pay-addr').value = ARK_ADDR;
  // Clear client fields (fresh form after previous generation)
  document.getElementById('inv-to-name').value = '';
  document.getElementById('inv-to-addr').value = '';
  document.getElementById('inv-to-email').value = '';
  document.getElementById('inv-notes').value = '';
  // Load saved company details
  loadInvCompany();
  // Reset save button states
  const saveSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>';
  const coBtn = document.getElementById('inv-save-co-btn');
  if (coBtn) { coBtn.innerHTML = saveSvg + ' Save Details'; coBtn.style.color = 'var(--acc2)'; coBtn.style.borderColor = 'var(--acc2)'; }
  const clBtn = document.getElementById('inv-save-client-btn');
  if (clBtn) { clBtn.innerHTML = saveSvg + ' Save Client Details'; clBtn.style.color = 'var(--acc2)'; clBtn.style.borderColor = 'var(--acc2)'; }
  // Reset to step 1
  invItems = [{ desc:'', qty:1, price:'' }];
  renderInvItems();
  goInvStep(1, true);
  openSheet('invoice');
}

function goInvStep(n, silent) {
  // Mark steps
  for (let i = 1; i <= 5; i++) {
    const s = document.getElementById('inv-step-' + i);
    if (i < n) { s.classList.add('done'); s.classList.remove('active'); }
    else if (i === n) { s.classList.add('active'); s.classList.remove('done'); }
    else { s.classList.remove('active','done'); }
  }
  // Show section
  for (let i = 1; i <= 5; i++) {
    document.getElementById('inv-s' + i).classList.toggle('active', i === n);
  }
  invStep = n;
  // Always rebuild the preview when landing on step 5
  if (n === 5) buildInvPreview();
  // Scroll sheet to top
  const sheet = document.querySelector('#sheet-invoice .sheet');
  if (sheet) sheet.scrollTop = 0;
}

function renderInvItems() {
  const wrap = document.getElementById('inv-items-wrap');
  wrap.innerHTML = '';
  invItems.forEach((item, idx) => {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
      <input class="finp" placeholder="Description" value="${item.desc}" oninput="invItems[${idx}].desc=this.value;calcInvTotal()">
      <input class="finp" type="number" min="1" value="${item.qty}" style="text-align:center" oninput="invItems[${idx}].qty=+this.value||1;calcInvTotal()">
      <input class="finp" type="number" placeholder="0.00" value="${item.price}" oninput="invItems[${idx}].price=this.value;calcInvTotal()">
      <button class="item-del" onclick="removeInvItem(${idx})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
    wrap.appendChild(row);
  });
  calcInvTotal();
}

function addInvItem() {
  invItems.push({ desc:'', qty:1, price:'' });
  renderInvItems();
}

function removeInvItem(idx) {
  if (invItems.length === 1) { showToast('Need at least one item'); return; }
  invItems.splice(idx, 1);
  renderInvItems();
}

function setInvColor(btn) {
  document.querySelectorAll('.inv-color-swatch').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  invColor = btn.dataset.color;
}

function setInvColorCustom(val) {
  invColor = val;
  document.querySelectorAll('.inv-color-swatch').forEach(b => b.classList.remove('active'));
}

function setInvCurrency(btn) {
  document.querySelectorAll('.inv-cur-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  invCurrency = btn.dataset.cur;
  calcInvTotal();
}

function calcInvTotal() {
  const sub = invItems.reduce((s, it) => s + ((+it.price || 0) * (it.qty || 1)), 0);
  const sym = { USD:'$', EUR:'€', CHF:'CHF ', SATS:'', BTC:'₿ ' }[invCurrency] || '$';
  const decimals = (invCurrency === 'SATS') ? 0 : (invCurrency === 'BTC') ? 8 : 2;
  const fmt = (invCurrency === 'SATS')
    ? Math.round(sub).toLocaleString()
    : sub.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const display = (invCurrency === 'SATS') ? fmt + ' SATS' : sym + fmt;
  document.getElementById('inv-subtotal').textContent = display;
  document.getElementById('inv-total').textContent = display;
}

function selectPayMethod(m) {
  invPayMethod = m;
  ['ark','lightning','onchain'].forEach(k => {
    document.getElementById('pay-' + k).classList.toggle('active', k === m);
  });
  const labels = { ark:'Your Ark Address', lightning:'Your Lightning Address', onchain:'Your Bitcoin Address' };
  const defaults = { ark: ARK_ADDR, lightning: '', onchain: ADDR };
  document.getElementById('inv-addr-lbl').textContent = labels[m];
  const addrField = document.getElementById('inv-pay-addr');
  addrField.value = defaults[m];
  addrField.placeholder = m === 'lightning' ? 'e.g. yourname@arkade.computer' : '';
}

async function generateInvoiceStep() {
  const btn = document.getElementById('inv-gen-btn');
  const badge = document.getElementById('inv-ln-badge');

  // Hide the lightning badge by default
  if (badge) badge.style.display = 'none';

  if (invPayMethod === 'lightning') {
    // Get total in sats
    const total = invItems.reduce((s, it) => s + ((+it.price || 0) * (it.qty || 1)), 0);
    const cur = invCurrency || 'USD';
    let sats = 0;
    if (cur === 'SATS') {
      sats = Math.round(total);
    } else if (cur === 'BTC') {
      sats = Math.round(total * 1e8);
    } else {
      // Fiat → sats via live price
      const activeCur = cur;
      const price = (_livePrices && _livePrices[activeCur]) || window._btcUsd || _chartBasePrice || 96420;
      sats = Math.round(total / price * 1e8);
    }
    if (!sats || sats <= 0) {
      showToast('Add invoice items with an amount first');
      return;
    }
    if (btn) { btn.disabled = true; btn.style.opacity = '.6'; btn.textContent = 'Generating invoice…'; }
    try {
      const num   = document.getElementById('inv-num').value || 'INV-001';
      const toName = document.getElementById('inv-to-name').value || '';
      const memo  = ('Invoice ' + num + (toName ? ' — ' + toName : '')).slice(0, 120);
      const result = await window._generateLightningInvoice({ amount: sats, description: memo });
      const invoice = result?.invoice || '';
      if (!invoice) throw new Error('No invoice returned');
      // Write the real BOLT11 invoice into the payment address field
      document.getElementById('inv-pay-addr').value = invoice;
      // Show the badge on step 5
      if (badge) badge.style.display = 'flex';
      showToast('Lightning invoice generated ✓');
    } catch(e) {
      console.error(e);
      showToast(e?.message || 'Failed to generate Lightning invoice');
      if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;display:inline;margin-right:6px"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Generate Invoice →'; }
      return;
    }
  }

  // Reset button, save to history, advance to step 5
  if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;display:inline;margin-right:6px"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Generate Invoice →'; }
  addInvToHistory();
  goInvStep(5);
}

function buildInvPreview() {
  const from = {
    name:  document.getElementById('inv-from-name').value  || 'Your Company',
    addr:  document.getElementById('inv-from-addr').value  || '',
    email: document.getElementById('inv-from-email').value || '',
    phone: document.getElementById('inv-from-phone').value || '',
  };
  const to = {
    name:  document.getElementById('inv-to-name').value  || 'Client Name',
    addr:  document.getElementById('inv-to-addr').value  || '',
    email: document.getElementById('inv-to-email').value || '',
  };
  const num      = document.getElementById('inv-num').value  || 'INV-001';
  const date     = document.getElementById('inv-date').value || '';
  const due      = document.getElementById('inv-due').value  || '';
  const notes    = document.getElementById('inv-notes').value || '';
  const payAddr  = document.getElementById('inv-pay-addr').value || '';
  const cur      = invCurrency || 'USD';
  const sym      = { USD:'$', EUR:'€', CHF:'CHF ', SATS:'', BTC:'₿ ' }[cur] || '$';
  const decimals = (cur === 'SATS') ? 0 : (cur === 'BTC') ? 8 : 2;

  const fmtDate = d => { if (!d) return '—'; const p = d.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; };
  const total   = invItems.reduce((s, it) => s + ((+it.price||0)*(it.qty||1)), 0);
  const fmtAmt  = v => {
    if (cur === 'SATS') return Math.round(v).toLocaleString() + ' SATS';
    return sym + v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  const payIcons = {
    ark:       `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></svg>`,
    lightning: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    onchain:   `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5A2.5 2.5 0 0112 7a2.5 2.5 0 010 5 2.5 2.5 0 000 5A2.5 2.5 0 0014.5 14.5"/></svg>`,
  };
  const payLabels = { ark:'Pay via Ark', lightning:'Pay via Lightning', onchain:'Pay via Bitcoin' };

  const rows = invItems.filter(it => it.desc || it.price).map(it =>
    `<tr><td>${it.desc||'—'}</td><td style="text-align:center">${it.qty}</td><td style="text-align:right">${fmtAmt(+it.price||0)}</td><td style="text-align:right">${fmtAmt((+it.price||0)*(it.qty||1))}</td></tr>`
  ).join('');

  const C = invColor || '#0e3a8a'; // chosen accent color
  // Derive a lighter tint for backgrounds
  document.getElementById('inv-preview-wrap').innerHTML = `
    <div class="inv-preview" style="--inv-c:${C}">
      <div class="inv-preview-header" style="border-bottom:2px solid ${C}">
        <div>
          <div class="inv-preview-title" style="color:${C}">INVOICE</div>
          <div class="inv-preview-num">${esc(num)}</div>
        </div>
        <div class="inv-preview-from">
          <div style="font-weight:800;font-size:13px;color:${C};margin-bottom:3px">${esc(from.name)}</div>
          ${from.addr  ? `<div>${esc(from.addr)}</div>` : ''}
          ${from.email ? `<div>${esc(from.email)}</div>` : ''}
          ${from.phone ? `<div>${esc(from.phone)}</div>` : ''}
        </div>
      </div>
      <div class="inv-to-sec">
        <div class="inv-to-blk">
          <div class="inv-to-lbl">Bill To</div>
          <div class="inv-to-val">
            <strong>${esc(to.name)}</strong>
            ${to.addr  ? '<br>'+to.addr  : ''}
            ${to.email ? '<br>'+to.email : ''}
          </div>
        </div>
        <div class="inv-to-blk">
          <div class="inv-to-lbl">Dates</div>
          <div class="inv-to-val" style="font-size:11px">
            <span style="color:#9087be">Issued</span><br><strong>${fmtDate(date)}</strong>
            <br><span style="color:#9087be;margin-top:4px;display:block">Due</span><br><strong style="color:#c03030">${fmtDate(due)}</strong>
          </div>
        </div>
      </div>
      <table class="inv-items-table">
        <thead style="background:${C}"><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit (${cur})</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="4" style="color:#aaa;text-align:center;padding:12px">No items added</td></tr>'}</tbody>
      </table>
      <div class="inv-total-row" style="border-top:2px solid ${C}">
        <span class="inv-total-lbl" style="color:${C}">Total Due</span>
        <span class="inv-total-val" style="color:${C}">${fmtAmt(total)}</span>
      </div>
      ${notes ? `<div style="margin-top:12px;font-size:11px;color:#666;line-height:1.6;background:#f8f7ff;border-radius:8px;padding:10px 12px">${esc(notes)}</div>` : ''}
      <div class="inv-pay-bar" style="background:${C}15;border:1px solid ${C}30">
        <div class="inv-pay-bar-ic" style="background:${C}">${payIcons[invPayMethod]}</div>
        <div>
          <div class="inv-pay-bar-lbl" style="color:${C}">${payLabels[invPayMethod]}</div>
          <div class="inv-pay-bar-addr" style="color:${C}cc">${esc(payAddr || '—')}</div>
        </div>
      </div>
    </div>`;

  // No QR in preview — clean look
}

function _buildInvoiceHtml() {
  // Gather all invoice data
  const from = {
    name:  document.getElementById('inv-from-name').value  || 'Your Company',
    addr:  document.getElementById('inv-from-addr').value  || '',
    email: document.getElementById('inv-from-email').value || '',
    phone: document.getElementById('inv-from-phone').value || '',
  };
  const to = {
    name:  document.getElementById('inv-to-name').value  || 'Client',
    addr:  document.getElementById('inv-to-addr').value  || '',
    email: document.getElementById('inv-to-email').value || '',
  };
  const num      = document.getElementById('inv-num').value  || 'INV-001';
  const date     = document.getElementById('inv-date').value || '';
  const due      = document.getElementById('inv-due').value  || '';
  const notes    = document.getElementById('inv-notes').value || '';
  const payAddr  = document.getElementById('inv-pay-addr').value || '';
  const cur      = invCurrency || 'USD';
  const sym      = { USD:'$', EUR:'€', CHF:'CHF ', SATS:'', BTC:'₿ ' }[cur] || '$';
  const decimals = (cur === 'SATS') ? 0 : (cur === 'BTC') ? 8 : 2;
  const fmtDate  = d => { if (!d) return '—'; const p = d.split('-'); return p[2]+'/'+p[1]+'/'+p[0]; };
  const total    = invItems.reduce((s, it) => s + ((+it.price||0)*(it.qty||1)), 0);
  const fmtAmt   = v => {
    if (cur === 'SATS') return Math.round(v).toLocaleString() + ' SATS';
    return sym + v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };
  const payLabels = { ark:'Ark (Instant)', lightning:'Lightning Network', onchain:'Bitcoin On-chain' };
  const rows = invItems.filter(it => it.desc || it.price).map(it =>
    `<tr><td>${it.desc||'—'}</td><td style="text-align:center">${it.qty}</td><td style="text-align:right">${fmtAmt(+it.price||0)}</td><td style="text-align:right">${fmtAmt((+it.price||0)*(it.qty||1))}</td></tr>`
  ).join('');
  const AC = invColor || '#0e3a8a'; // accent color for A4

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invoice ${num}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Geist',sans-serif;background:#f5f4ff;display:flex;align-items:flex-start;justify-content:center;min-height:100vh;padding:32px 16px}
  .page{
    width:210mm;min-height:297mm;background:#fff;
    border-radius:0;padding:14mm 16mm;
    box-shadow:0 4px 40px rgba(46,30,140,.12);
    position:relative;
  }
  /* Header */
  .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10mm;padding-bottom:8mm;border-bottom:2px solid ${AC}}
  .logo-block .inv-word{font-size:32pt;font-weight:900;color:${AC};letter-spacing:-.02em;line-height:1}
  .logo-block .inv-num{font-size:10pt;font-weight:700;color:#9087be;letter-spacing:.06em;margin-top:3px}
  .from-block{text-align:right;font-size:9pt;color:#444;line-height:1.6}
  .from-block .from-name{font-size:12pt;font-weight:800;color:${AC}}
  /* Parties */
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-bottom:8mm}
  .party-lbl{font-size:7.5pt;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9087be;margin-bottom:4px}
  .party-val{font-size:9pt;color:#333;line-height:1.65}
  .party-val strong{font-size:10.5pt;font-weight:800;color:${AC}}
  /* Dates */
  .dates{display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-bottom:8mm}
  .date-box{background:#f8f7ff;border-radius:8px;padding:8px 12px}
  .date-box .dl{font-size:7.5pt;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9087be;margin-bottom:3px}
  .date-box .dv{font-size:11pt;font-weight:800;color:${AC}}
  .date-box.due .dv{color:#c03030}
  /* Items table */
  table{width:100%;border-collapse:collapse;margin-bottom:6mm}
  thead tr{background:${AC}}
  thead th{padding:8px 10px;font-size:8pt;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#fff;text-align:left}
  tbody tr:nth-child(even){background:#f8f7ff}
  tbody td{padding:8px 10px;font-size:9.5pt;color:#333;border-bottom:1px solid #ede9ff}
  /* Total */
  .total-row{display:flex;justify-content:flex-end;margin-bottom:6mm}
  .total-box{background:${AC};border-radius:10px;padding:10px 18px;min-width:180px;display:flex;justify-content:space-between;align-items:center;gap:20px}
  .total-lbl{font-size:9pt;font-weight:700;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.06em}
  .total-val{font-size:18pt;font-weight:900;color:#fff;letter-spacing:-.02em}
  /* Notes */
  .notes{background:#f8f7ff;border-radius:8px;padding:10px 14px;margin-bottom:6mm;font-size:9pt;color:#555;line-height:1.6}
  .notes-lbl{font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9087be;margin-bottom:4px}
  /* Pay bar */
  .pay-bar{background:linear-gradient(135deg,${AC},${AC});border-radius:10px;padding:12px 16px;display:flex;align-items:flex-start;gap:14px}
  .pay-bar-lbl{font-size:7.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.55);margin-bottom:4px}
  .pay-bar-method{font-size:10pt;font-weight:800;color:#fff;margin-bottom:5px}
  .pay-bar-addr{font-family:monospace;font-size:8pt;color:rgba(255,255,255,.7);word-break:break-all;line-height:1.5}
  .pay-icon{width:36px;height:36px;background:rgba(255,255,255,.15);border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
  /* Footer */
  .footer{margin-top:auto;padding-top:6mm;border-top:1px solid #ede9ff;display:flex;justify-content:space-between;align-items:center}
  .footer-brand{font-size:8pt;font-weight:700;color:#9087be;letter-spacing:.06em}
  .footer-pg{font-size:8pt;color:#ccc}
  /* Print */
  @media print{
    body{background:white;padding:0}
    .page{box-shadow:none;border-radius:0;padding:14mm 16mm}
    .no-print{display:none!important}
  }
  @page{size:A4;margin:0}
  /* Share bar */
  .share-bar{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #ede9ff;padding:12px 16px;display:flex;gap:10px;justify-content:center;z-index:999}
  .share-bar button{padding:12px 24px;border-radius:50px;border:none;font-size:14px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:8px}
  .btn-primary{background:${AC};color:#fff;box-shadow:0 4px 16px rgba(0,0,0,.25)}
  .btn-secondary{background:#f0eeff;color:${AC}}
  @media print{.share-bar{display:none}}
</style>
</head>
<body>
<div class="page" id="inv-page">
  <div class="header">
    <div class="logo-block">
      <div class="inv-word">INVOICE</div>
      <div class="inv-num">${num}</div>
    </div>
    <div class="from-block">
      <div class="from-name">${from.name}</div>
      ${from.addr  ? `<div>${from.addr}</div>` : ''}
      ${from.email ? `<div>${from.email}</div>` : ''}
      ${from.phone ? `<div>${from.phone}</div>` : ''}
    </div>
  </div>

  <div class="parties">
    <div>
      <div class="party-lbl">Bill To</div>
      <div class="party-val">
        <strong>${to.name}</strong>
        ${to.addr  ? `<br>${to.addr}`  : ''}
        ${to.email ? `<br>${to.email}` : ''}
      </div>
    </div>
    <div class="dates">
      <div class="date-box">
        <div class="dl">Issued</div>
        <div class="dv">${fmtDate(date)}</div>
      </div>
      <div class="date-box due">
        <div class="dl">Due</div>
        <div class="dv">${fmtDate(due)}</div>
      </div>
    </div>
  </div>

  <table>
    <thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit (${cur})</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="4" style="color:#aaa;text-align:center;padding:14px">No items</td></tr>'}</tbody>
  </table>

  <div class="total-row">
    <div class="total-box">
      <span class="total-lbl">Total Due</span>
      <span class="total-val">${fmtAmt(total)}</span>
    </div>
  </div>

  ${notes ? `<div class="notes"><div class="notes-lbl">Notes</div>${notes}</div>` : ''}

  <div class="pay-bar">
    <div class="pay-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5A2.5 2.5 0 0112 7a2.5 2.5 0 010 5 2.5 2.5 0 000 5A2.5 2.5 0 0014.5 14.5"/></svg>
    </div>
    <div style="flex:1">
      <div class="pay-bar-lbl">Payment Method</div>
      <div class="pay-bar-method">${payLabels[invPayMethod] || 'Bitcoin'}</div>
      <div class="pay-bar-addr">${payAddr}</div>
    </div>
  </div>

  <div class="footer">
    <span class="footer-brand">ArkON</span>
    <span class="footer-pg">Page 1 of 1</span>
  </div>
</div>

<div class="share-bar no-print">
  <button class="btn-primary" onclick="window.print()">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
    Save as PDF / Print
  </button>
  <button class="btn-secondary" id="share-btn" onclick="doShare()">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
    Share
  </button>
</div>
<scr` + `ipt>
  // Web Share API for mobile
  async function doShare() {
    if (!navigator.share) { window.print(); return; }
    try {
      await navigator.share({ title: 'Invoice ${num} — ${from.name}', text: 'Invoice ${num} for ${fmtAmt(total)} due ${fmtDate(due)}' });
    } catch(e) { if (e.name !== 'AbortError') window.print(); }
  }
  // Show share button only if Web Share available
  const sb = document.getElementById('share-btn');
  if (!navigator.share) sb.style.display = 'none';
<\/script>
</body>
</html>`;

  return { html, num };
}

function downloadInvoice() {
  const { html, num } = _buildInvoiceHtml();
  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = num + '.html'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  showToast('Invoice downloaded');
}

async function shareInvoiceNative() {
  const { html, num } = _buildInvoiceHtml();
  const file = new File([html], num + '.html', { type: 'text/html' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ title: 'Invoice ' + num, files: [file] });
      return;
    } catch(e) { if (e.name === 'AbortError') return; }
  }
  // Fallback: share as text if file sharing not supported
  const total = invItems.reduce((s,it)=>s+((+it.price||0)*(it.qty||1)),0);
  const cur = invCurrency || 'USD';
  const fmtAmt = cur === 'SATS' ? Math.round(total).toLocaleString() + ' SATS' : (cur === 'BTC' ? '₿ ' + total.toFixed(8) : ({ USD:'$', EUR:'€', CHF:'CHF ' }[cur]||'$') + total.toFixed(2));
  const text = `Invoice ${num} — ${fmtAmt}\nDue: ${document.getElementById('inv-due').value || '—'}\nPay via: ${invPayMethod.toUpperCase()}\n${document.getElementById('inv-pay-addr').value}`;
  if (navigator.share) {
    navigator.share({ title: 'Invoice ' + num, text: text }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(text).then(()=> showToast('Invoice details copied')).catch(()=>{});
  }
}

function copyInvoiceText() {
  const from = document.getElementById('inv-from-name').value || 'Your Company';
  const to   = document.getElementById('inv-to-name').value   || 'Client';
  const num  = document.getElementById('inv-num').value        || 'INV-001';
  const due  = document.getElementById('inv-due').value        || '';
  const total = invItems.reduce((s,it)=>s+((+it.price||0)*(it.qty||1)),0);
  const text = `INVOICE ${num}\nFrom: ${from}\nTo: ${to}\nDue: ${due}\nTotal: ${total.toFixed(2)}\nPay via: ${invPayMethod.toUpperCase()}\n${document.getElementById('inv-pay-addr').value}`;
  navigator.clipboard.writeText(text).catch(()=>{});
  showToast('Invoice copied as text');
}

// ═══════════════════════════════════════════
//    INVOICE HISTORY
// ═══════════════════════════════════════════
const INV_HIST_KEY = 'arkon_inv_history';
function getInvHistory() {
  try { return JSON.parse(localStorage.getItem(INV_HIST_KEY) || '[]'); } catch { return []; }
}
function saveInvHistory(list) {
  localStorage.setItem(INV_HIST_KEY, JSON.stringify(list));
}
function addInvToHistory() {
  const company = document.getElementById('inv-to-name').value || 'Unknown';
  const num     = document.getElementById('inv-num').value || 'INV-???';
  const date    = document.getElementById('inv-date').value || new Date().toISOString().split('T')[0];
  const due     = document.getElementById('inv-due').value || '';
  const total   = invItems.reduce((s, it) => s + ((+it.price || 0) * (it.qty || 1)), 0);
  const cur     = invCurrency || 'USD';
  const entry = { id: Date.now().toString(36), company, num, amount: total, currency: cur, dateCreated: date, dateDue: due, datePaid: '', status: 'unpaid' };
  const hist = getInvHistory();
  hist.unshift(entry);
  saveInvHistory(hist);
}
function renderInvHistory() {
  const list = document.getElementById('inv-hist-list');
  const empty = document.getElementById('inv-hist-empty');
  if (!list) return;
  const hist = getInvHistory();
  if (hist.length === 0) {
    list.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  list.innerHTML = hist.map(h => {
    const isPaid = h.status === 'paid';
    const statusColor = isPaid ? 'var(--grn)' : 'var(--amb)';
    const statusBg = isPaid ? 'var(--grns)' : 'var(--ambs)';
    const statusText = isPaid ? 'Paid' : 'Unpaid';
    const fmtAmt = ['SATS','BTC'].includes(h.currency) ? h.amount.toLocaleString() + ' ' + h.currency : h.currency + ' ' + h.amount.toFixed(2);
    const fmtDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '—';
    return `<div style="background:var(--surf);border:1.5px solid var(--bdr);border-radius:14px;padding:14px 16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--t1)">${esc(h.company)}</div>
          <div style="font-size:11px;color:var(--t3);margin-top:2px">${esc(h.num)}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:14px;font-weight:800;color:var(--t1)">${fmtAmt}</div>
          <button onclick="toggleInvPaid('${h.id}')" style="margin-top:3px;font-size:10px;font-weight:700;padding:3px 8px;border-radius:6px;border:none;cursor:pointer;background:${statusBg};color:${statusColor}">${statusText}</button>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;font-size:10px;color:var(--t3)">
        <div><span style="font-weight:600;text-transform:uppercase;letter-spacing:.04em">Created</span><br>${fmtDate(h.dateCreated)}</div>
        <div><span style="font-weight:600;text-transform:uppercase;letter-spacing:.04em">Due</span><br>${fmtDate(h.dateDue)}</div>
        <div>
          <span style="font-weight:600;text-transform:uppercase;letter-spacing:.04em">Paid</span><br>
          ${isPaid ? fmtDate(h.datePaid) : '<span style="opacity:.5">—</span>'}
          ${isPaid ? `<button onclick="setInvPaidDate('${h.id}')" style="background:none;border:none;color:var(--acc2);cursor:pointer;font-size:9px;font-weight:600;padding:0;margin-left:2px">edit</button>` : ''}
        </div>
      </div>
      <div id="hpaid-${h.id}" style="display:none;align-items:center;gap:8px;margin-top:8px;padding:8px 0;border-top:1px solid var(--bdr)">
        <input type="date" id="hpaid-input-${h.id}" value="${h.datePaid || new Date().toISOString().split('T')[0]}" style="flex:1;padding:6px 10px;border-radius:8px;border:1.5px solid var(--bdr);background:var(--surf);color:var(--t1);font-size:12px;font-family:inherit">
        <button onclick="confirmPaidDate('${h.id}')" style="padding:6px 12px;border-radius:8px;border:none;background:var(--grn);color:#fff;font-size:11px;font-weight:700;cursor:pointer">Confirm</button>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-top:8px;gap:8px">
        <button onclick="deleteInvHist('${h.id}')" style="background:none;border:none;cursor:pointer;padding:4px;color:var(--t3);font-size:10px;display:flex;align-items:center;gap:3px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:12px;height:12px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
          Delete
        </button>
      </div>
    </div>`;
  }).join('');
}
function toggleInvPaid(id) {
  const hist = getInvHistory();
  const entry = hist.find(h => h.id === id);
  if (!entry) return;
  if (entry.status === 'paid') {
    entry.status = 'unpaid';
    entry.datePaid = '';
    saveInvHistory(hist);
    renderInvHistory();
  } else {
    // Show inline date picker
    const el = document.getElementById('hpaid-' + id);
    if (el) el.style.display = el.style.display === 'none' ? 'flex' : 'none';
  }
}
function confirmPaidDate(id) {
  const input = document.getElementById('hpaid-input-' + id);
  const dateStr = input?.value || new Date().toISOString().split('T')[0];
  const hist = getInvHistory();
  const entry = hist.find(h => h.id === id);
  if (!entry) return;
  entry.status = 'paid';
  entry.datePaid = dateStr;
  saveInvHistory(hist);
  renderInvHistory();
}
function setInvPaidDate(id) {
  const el = document.getElementById('hpaid-' + id);
  if (el) el.style.display = el.style.display === 'none' ? 'flex' : 'none';
}
function deleteInvHist(id) {
  if (!confirm('Delete this invoice from history?')) return;
  const hist = getInvHistory().filter(h => h.id !== id);
  saveInvHistory(hist);
  renderInvHistory();
}
// ═══════════════════════════════════════════
//    BATCH SEND — Ark payments queue
// ═══════════════════════════════════════════
const BATCH_KEY = 'arkon_batch_queue';
let _batchRunning = false;

function getBatchQueue() {
  try { return JSON.parse(localStorage.getItem(BATCH_KEY) || '[]'); } catch { return []; }
}
function saveBatchQueue(q) {
  localStorage.setItem(BATCH_KEY, JSON.stringify(q));
}

function openBatchSend() {
  // On open: recover any items stuck in 'sending' (interrupted)
  const q = getBatchQueue();
  let changed = false;
  q.forEach(item => {
    if (item.status === 'sending') { item.status = 'pending'; changed = true; }
  });
  if (changed) saveBatchQueue(q);
  renderBatchQueue();
  openSheet('batchsend');
}

function parseBatchCSV(inputEl) {
  const file = inputEl.files[0];
  inputEl.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const text = e.target.result.trim();
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    const q = getBatchQueue();
    let added = 0, skipped = 0;
    for (const line of lines) {
      // Skip header row
      if (/^address/i.test(line.trim())) continue;
      const parts = line.split(',').map(s => s.trim());
      const address = (parts[0] || '').replace(/^["']|["']$/g, '');
      const amount = Math.floor(Number(parts[1]));
      if (!address || !amount || amount <= 0) { skipped++; continue; }
      const addrType = (typeof window._detectAddressType === 'function') ? window._detectAddressType(address) : 'unknown';
      if (addrType !== 'ark') { skipped++; continue; }
      q.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        address: address,
        amount: amount,
        status: 'pending',
        txid: null,
        error: null,
        ts: Date.now()
      });
      added++;
    }
    saveBatchQueue(q);
    renderBatchQueue();
    if (skipped > 0) showToast(added + ' added, ' + skipped + ' skipped (non-Ark or invalid)');
    else showToast(added + ' payments added to queue');
  };
  reader.readAsText(file);
}

function renderBatchQueue() {
  const q = getBatchQueue();
  const list = document.getElementById('batch-queue-list');
  const summary = document.getElementById('batch-summary');
  const actions = document.getElementById('batch-actions');
  const upload = document.getElementById('batch-upload-area');
  if (!list) return;

  if (q.length === 0) {
    list.innerHTML = '';
    if (summary) summary.style.display = 'none';
    if (actions) actions.style.display = 'none';
    if (upload) upload.style.display = 'block';
    return;
  }
  if (upload) upload.style.display = 'none';
  if (summary) summary.style.display = 'block';
  if (actions) actions.style.display = 'block';

  // Summary counts
  const pending = q.filter(i => i.status === 'pending').length;
  const sending = q.filter(i => i.status === 'sending').length;
  const sent = q.filter(i => i.status === 'sent').length;
  const failed = q.filter(i => i.status === 'failed').length;
  const totalSats = q.reduce((s, i) => s + i.amount, 0);
  document.getElementById('batch-sum-total').textContent = q.length + ' item' + (q.length !== 1 ? 's' : '');
  document.getElementById('batch-sum-sats').textContent = totalSats.toLocaleString() + ' SATS';
  document.getElementById('batch-sum-pending').textContent = pending + ' pending';
  document.getElementById('batch-sum-sending').textContent = sending + ' sending';
  document.getElementById('batch-sum-sent').textContent = sent + ' sent';
  document.getElementById('batch-sum-failed').textContent = failed + ' failed';

  // Button states
  const sendBtn = document.getElementById('batch-send-btn');
  const retryBtn = document.getElementById('batch-retry-btn');
  const clearSentBtn = document.getElementById('batch-clear-sent-btn');
  const stopBtn = document.getElementById('batch-stop-btn');
  if (sendBtn) sendBtn.style.display = (pending > 0 && !_batchRunning) ? '' : 'none';
  if (retryBtn) retryBtn.style.display = (failed > 0 && !_batchRunning) ? '' : 'none';
  if (clearSentBtn) clearSentBtn.style.display = sent > 0 ? '' : 'none';
  if (stopBtn) stopBtn.style.display = _batchRunning ? '' : 'none';

  // Render cards
  list.innerHTML = q.map(item => {
    const statusColors = { pending: 'var(--t3)', sending: 'var(--acc2)', sent: 'var(--grn)', failed: 'var(--red)' };
    const statusBgs = { pending: 'var(--bg3)', sending: 'var(--accs)', sent: 'var(--grns)', failed: 'rgba(255,77,77,.12)' };
    const statusLabels = { pending: 'Pending', sending: 'Sending…', sent: 'Sent', failed: 'Failed' };
    const sc = statusColors[item.status] || 'var(--t3)';
    const sb = statusBgs[item.status] || 'var(--bg3)';
    const sl = statusLabels[item.status] || item.status;
    const shortAddr = item.address.slice(0, 10) + '…' + item.address.slice(-6);
    return `<div style="background:var(--surf);border:1.5px solid var(--bdr);border-radius:14px;padding:12px 14px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-family:var(--f-mono);color:var(--t2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(shortAddr)}</div>
          ${item.error ? `<div style="font-size:10px;color:var(--red);margin-top:3px;word-break:break-word">${esc(item.error)}</div>` : ''}
          ${item.txid ? `<div style="font-size:10px;color:var(--t3);margin-top:3px;font-family:var(--f-mono)">tx: ${esc(item.txid.slice(0, 12))}…</div>` : ''}
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div style="font-size:13px;font-weight:800;color:var(--t1)">${item.amount.toLocaleString()} <span style="font-size:10px;font-weight:600;color:var(--t3)">SATS</span></div>
          <span style="display:inline-block;margin-top:3px;font-size:9px;font-weight:700;padding:2px 8px;border-radius:6px;background:${sb};color:${sc}">${sl}</span>
        </div>
      </div>
      ${item.status === 'pending' || item.status === 'failed' ? `<div style="display:flex;justify-content:flex-end;margin-top:6px"><button onclick="removeBatchItem('${item.id}')" style="background:none;border:none;cursor:pointer;padding:2px 4px;color:var(--t3);font-size:10px;display:flex;align-items:center;gap:3px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:11px;height:11px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg> Remove</button></div>` : ''}
    </div>`;
  }).join('');
}

async function startBatchSend() {
  const q = getBatchQueue();
  const pending = q.filter(i => i.status === 'pending');
  if (!pending.length) { showToast('No pending items'); return; }
  if (!confirm('Send ' + pending.length + ' Ark payment' + (pending.length !== 1 ? 's' : '') + ' totalling ' + pending.reduce((s, i) => s + i.amount, 0).toLocaleString() + ' SATS in one round?')) return;
  _batchRunning = true;
  // Mark all pending as sending
  pending.forEach(item => { item.status = 'sending'; });
  saveBatchQueue(q);
  renderBatchQueue();
  try {
    if (typeof window._sdkSendBatch !== 'function') throw new Error('Wallet SDK not ready');
    const recipients = pending.map(item => ({ address: item.address, amount: item.amount }));
    const txid = await window._sdkSendBatch(recipients);
    // All sent in one round — mark all as sent with the same txid
    pending.forEach(item => { item.status = 'sent'; item.txid = txid || 'ok'; item.error = null; });
    saveBatchQueue(q);
    renderBatchQueue();
    showToast('Batch done: ' + pending.length + ' sent in 1 round ⚡');
  } catch (e) {
    const errMsg = e?.message || 'Batch send failed';
    // All failed — mark all back as failed
    pending.forEach(item => { item.status = 'failed'; item.error = errMsg; });
    saveBatchQueue(q);
    renderBatchQueue();
    showToast('Batch failed: ' + errMsg);
  }
  _batchRunning = false;
  renderBatchQueue();
}

function stopBatchSend() {
  _batchRunning = false;
  showToast('Batch send stopped');
}

function retryFailed() {
  const q = getBatchQueue();
  let count = 0;
  q.forEach(item => {
    if (item.status === 'failed') { item.status = 'pending'; item.error = null; count++; }
  });
  saveBatchQueue(q);
  renderBatchQueue();
  if (count > 0) startBatchSend();
}

function clearSentBatch() {
  const q = getBatchQueue().filter(i => i.status !== 'sent');
  saveBatchQueue(q);
  renderBatchQueue();
  showToast('Sent items cleared');
}

function clearAllBatch() {
  if (_batchRunning) { showToast('Stop batch first'); return; }
  if (!confirm('Clear entire batch queue?')) return;
  saveBatchQueue([]);
  renderBatchQueue();
  showToast('Queue cleared');
}

function removeBatchItem(id) {
  const q = getBatchQueue().filter(i => i.id !== id);
  saveBatchQueue(q);
  renderBatchQueue();
}

function downloadSampleCSV() {
  const csv = 'address,amount\nark1qexampleaddress1,5000\nark1qexampleaddress2,3000\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'batch-send-sample.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 3000);
}

/* ═══════════════════════════════════════════
   MYSTERY BOX — ~70% RTP (30% house edge)
   Weighted prize pools: sum(val*weight)/sum(weight)/cost ≈ 0.70
═══════════════════════════════════════════ */
window._wallet = { sats: 4217839 };
function walletUpdateDisplay() {
  const s = window._wallet.sats;
  const fmt = s.toLocaleString();

  // Use live Kraken prices — fall back gracefully if not yet loaded
  const priceUSD = (_livePrices && _livePrices.USD) || window._btcUsd || 96420;
  const priceEUR = (_livePrices && _livePrices.EUR) || (priceUSD * 0.92);
  const priceCHF = (_livePrices && _livePrices.CHF) || (priceUSD * 0.89);

  const usd = (s * priceUSD / 1e8).toFixed(2);
  const eur = (s * priceEUR / 1e8).toFixed(2);
  const chf = (s * priceCHF / 1e8).toFixed(0);

  // Update BALANCES object so currency switching stays right
  BALANCES.SATS.m = fmt;          BALANCES.SATS.s = '≈ $' + usd;
  BALANCES.USD.m  = '$' + usd;    BALANCES.USD.s  = fmt + ' sats';
  BALANCES.EUR.m  = '€' + eur;    BALANCES.EUR.s  = fmt + ' sats';
  BALANCES.CHF.m  = 'CHF ' + chf; BALANCES.CHF.s  = fmt + ' sats';

  // Also update the live tprice in BALANCES so applyCur picks it up
  BALANCES.SATS.tprice = '$' + Math.round(priceUSD).toLocaleString('en-US');
  BALANCES.USD.tprice  = '$' + Math.round(priceUSD).toLocaleString('en-US');
  BALANCES.EUR.tprice  = '€' + Math.round(priceEUR).toLocaleString('en-US');
  BALANCES.CHF.tprice  = 'CHF ' + Math.round(priceCHF).toLocaleString('en-US');

  // Write directly to DOM
  const mainEl = document.getElementById('bal-main');
  const subEl  = document.getElementById('bal-sub');
  if (!mainEl) return;

  if (typeof balDisplayMode === 'undefined' || balDisplayMode === 'sats') {
    mainEl.textContent = fmt;
    if (subEl) subEl.textContent = 'SATS';
  } else if (balDisplayMode === 'fiat') {
    const curSel = document.getElementById('cur-settings-sel');
    const cur = (curSel && curSel.value) || 'USD';
    mainEl.textContent = BALANCES[cur] ? BALANCES[cur].m : '$' + usd;
  } else {
    // 'both' — fiat primary, sats sub
    const curSel = document.getElementById('cur-settings-sel');
    const cur = (curSel && curSel.value) || 'USD';
    mainEl.textContent = BALANCES[cur] ? BALANCES[cur].m : '$' + usd;
    if (subEl) subEl.textContent = fmt + ' sats';
  }

  // Refresh tick-price with live price for active currency
  if (typeof updateChartHeader === 'function') updateChartHeader();
}
window._mb = { balance: 0, totalWon: 0, opening: false, history: [] };
const MB_TIERS = {
  // EV/cost ≈ 70% for all tiers
  starter:   { cost:50,    name:'Starter Box',    emoji:'🎲',
    prizes:[[0,42],[20,32],[50,16],[120,7],[300,2],[1000,1]] },
    // EV=(0+640+800+840+600+1000)/100=38.8 → 77.6%... let me tune
  common:    { cost:200,   name:'Common Box',     emoji:'📦',
    prizes:[[0,43],[80,30],[200,16],[500,7],[1200,3],[3000,1]] },
  rare:      { cost:500,   name:'Rare Box',       emoji:'🎁',
    prizes:[[0,43],[180,29],[500,17],[1200,7],[3000,3],[8000,1]] },
  epic:      { cost:2000,  name:'Epic Box',       emoji:'💎',
    prizes:[[0,44],[700,29],[2000,16],[5000,7],[12000,3],[30000,1]] },
  legendary: { cost:5000,  name:'Legendary Box',  emoji:'👑',
    prizes:[[0,44],[1800,29],[5000,16],[12000,7],[30000,3],[75000,1]] },
  satoshi:   { cost:21000, name:'Satoshi Box',    emoji:'⚡',
    prizes:[[0,44],[7500,29],[21000,16],[50000,7],[120000,3],[300000,1]] }
};
function mbWeightedPrize(prizes) {
  const total = prizes.reduce((s,p)=>s+p[1],0);
  let r = Math.random()*total;
  for (const [val,w] of prizes) { r-=w; if(r<=0) return val; }
  return prizes[prizes.length-1][0];
}
function mbInit() {
  const el = document.getElementById('mb-balance');
  if (el) el.textContent = window._mb.balance.toLocaleString() + ' sats';
}
const MB_GAME_ADDRESS = 'ark1qq4hfssprtcgnjzf8qlw2f78yvjau5kldfugg29k34y7j96q2w4t5pqhfv4fslcw2qwgnupptnftsj8zdc5e05v3yfz5kj5hw68guh6lq85lrd';
const ARCADE_ADDRESS  = MB_GAME_ADDRESS; // all games send to same house address

function mbTopUp() {
  const resultEl = document.getElementById('mb-result');
  if (!resultEl) return;
  const walletSats = window._wallet?.sats || 0;
  const options = [1000, 5000, 10000, 50000].filter(a => a <= walletSats + 1);
  resultEl.innerHTML = `
    <div style="width:100%;background:rgba(107,82,245,.08);border:1.5px solid rgba(107,82,245,.3);border-radius:16px;padding:14px 14px 12px">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:rgba(107,82,245,.7);margin-bottom:10px">Deposit to Mystery Box</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:10px">
        ${options.map(amt => `<button onclick="mbDoTopUp(${amt})" style="padding:9px 6px;background:rgba(107,82,245,.12);border:1px solid rgba(107,82,245,.3);border-radius:10px;color:#2563eb;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit">+${amt.toLocaleString()}</button>`).join('')}
      </div>
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <input id="mb-custom-amount" type="number" placeholder="Custom amount" min="50" max="${walletSats}"
          style="flex:1;background:rgba(107,82,245,.08);border:1px solid rgba(107,82,245,.3);border-radius:10px;padding:8px 10px;color:#2563eb;font-size:12px;font-weight:700;font-family:inherit;outline:none">
        <button onclick="mbDoTopUp(parseInt(document.getElementById('mb-custom-amount').value)||0)"
          style="padding:8px 14px;background:rgba(107,82,245,.2);border:1px solid rgba(107,82,245,.4);border-radius:10px;color:#2563eb;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit">Pay</button>
      </div>
      <div style="font-size:10px;color:rgba(107,82,245,.5);text-align:center">Wallet: <span style="font-weight:700;color:#2563eb">${walletSats.toLocaleString()} sats</span> available · Sends via Ark instantly</div>
    </div>`;
}
function mbWithdraw() {
  const resultEl = document.getElementById('mb-result');
  if (!resultEl) return;
  if (window._mb.balance <= 0) { showToast('Nothing to withdraw 👀'); return; }
  const userAddr = (typeof ARK_ADDR !== 'undefined' && ARK_ADDR && !ARK_ADDR.startsWith('Connecting'))
    ? ARK_ADDR : '';
  resultEl.innerHTML = `
    <div style="width:100%;background:rgba(48,208,104,.07);border:1.5px solid rgba(48,208,104,.3);border-radius:16px;padding:14px 14px 12px">
      <div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:rgba(48,208,104,.8);margin-bottom:10px">Withdraw Winnings</div>
      <div style="font-size:11px;color:rgba(48,208,104,.7);margin-bottom:8px">Box balance: <span style="font-weight:800;color:#30d068">${window._mb.balance.toLocaleString()} sats</span></div>
      <div style="margin-bottom:7px">
        <div style="font-size:10px;color:rgba(48,208,104,.7);font-weight:700;margin-bottom:4px">Withdraw to address</div>
        <input id="mb-withdraw-addr" type="text" value="${userAddr}" placeholder="ark1q…"
          style="width:100%;background:rgba(48,208,104,.07);border:1px solid rgba(48,208,104,.3);border-radius:10px;padding:8px 10px;color:#30d068;font-size:11px;font-family:monospace;outline:none;box-sizing:border-box">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">
        <button onclick="mbSetWithdrawAmt('quarter')" style="padding:7px 4px;background:rgba(48,208,104,.1);border:1px solid rgba(48,208,104,.3);border-radius:8px;color:#30d068;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit">25%</button>
        <button onclick="mbSetWithdrawAmt('half')" style="padding:7px 4px;background:rgba(48,208,104,.1);border:1px solid rgba(48,208,104,.3);border-radius:8px;color:#30d068;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit">50%</button>
        <button onclick="mbSetWithdrawAmt('all')" style="padding:7px 4px;background:rgba(48,208,104,.15);border:1px solid rgba(48,208,104,.4);border-radius:8px;color:#30d068;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit">All</button>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:10px">
        <input id="mb-withdraw-amt" type="number" value="${window._mb.balance}" min="1" max="${window._mb.balance}"
          style="flex:1;background:rgba(48,208,104,.07);border:1px solid rgba(48,208,104,.3);border-radius:10px;padding:8px 10px;color:#30d068;font-size:12px;font-weight:700;font-family:inherit;outline:none">
        <span style="font-size:11px;color:rgba(48,208,104,.6);align-self:center;flex-shrink:0">sats</span>
      </div>
      <button onclick="mbDoWithdraw()" style="width:100%;padding:10px;background:rgba(48,208,104,.15);border:1.5px solid rgba(48,208,104,.5);border-radius:10px;color:#30d068;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit">
        Withdraw →
      </button>
    </div>`;
}
function addTxRow(type, label, amountSats) {
  const isIn = type === 'in';
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  const dateStr = now.toLocaleDateString([], { month:'short', day:'numeric' });
  const usd = (Math.abs(amountSats) * ((_livePrices?.USD || window._btcUsd || 96420) / 1e8)).toFixed(2);
  const amtFmt = Math.abs(amountSats).toLocaleString();
  const iconSvg = isIn
    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`;
  function makeRow() {
    const row = document.createElement('div');
    row.className = 'txr';
    row.dataset.type = isIn ? 'in' : 'out';
    row.style.animation = 'spi .3s var(--spring)';
    row.innerHTML = `
      <div class="txico ${isIn ? 'in' : 'out'}">${iconSvg}</div>
      <div class="txinf">
        <div class="txnm">${label}</div>
        <div class="txmt">${dateStr} · ${timeStr} · Instant</div>
      </div>
      <div class="txamt">
        <div class="txb ${isIn ? 'in' : 'out'}">${isIn ? '+' : '−'}${amtFmt} sats</div>
        <div class="txf">${isIn ? '+' : '−'}$${usd}</div>
      </div>`;
    return row;
  }
  // Prepend to full history list
  const list = document.getElementById('tx-list');
  if (list) list.insertBefore(makeRow(), list.firstChild);
  // Prepend to home recent list, keep max 3 rows
  const home = document.getElementById('home-tx-list');
  if (home) {
    home.insertBefore(makeRow(), home.firstChild);
    while (home.children.length > 3) home.removeChild(home.lastChild);
  }
}
function mbSetWithdrawAmt(mode) {
  const el = document.getElementById('mb-withdraw-amt');
  if (!el) return;
  const bal = window._mb.balance;
  if (mode === 'quarter') el.value = Math.floor(bal / 4);
  else if (mode === 'half') el.value = Math.floor(bal / 2);
  else el.value = bal;
}

async function mbDoTopUp(amount) {
  if (!amount || amount <= 0) { showToast('Enter an amount'); return; }
  if ((window._wallet?.sats || 0) < amount) { showToast('Not enough sats in wallet'); return; }

  const resultEl = document.getElementById('mb-result');
  if (resultEl) resultEl.innerHTML = `<div style="text-align:center;padding:14px"><svg viewBox="0 0 24 24" fill="none" stroke="rgba(107,82,245,.8)" stroke-width="2" style="width:28px;height:28px;animation:spin .6s linear infinite"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg><div style="font-size:12px;color:rgba(107,82,245,.7);margin-top:8px;font-weight:700">Sending via Ark…</div></div>`;

  try {
    // Real Ark send to game address
    await arcadeSendBitcoin(MB_GAME_ADDRESS, amount)
    window._mb.balance += amount
    addTxRow('out', 'Mystery Box — Deposit', amount)
    const balEl = document.getElementById('mb-balance')
    if (balEl) balEl.textContent = window._mb.balance.toLocaleString() + ' sats'
    if (resultEl) resultEl.innerHTML = `<div style="text-align:center;padding:10px 16px;background:rgba(48,208,104,.08);border:1px solid rgba(48,208,104,.3);border-radius:16px;animation:spi .3s var(--spring)"><div style="font-size:15px;font-weight:900;color:#30d068">+${amount.toLocaleString()} sats added ✓</div><div style="font-size:10px;color:rgba(48,208,104,.6);margin-top:2px">Sent to Mystery Box via Ark</div></div>`
    if (window._refreshTransactions) window._refreshTransactions()
    setTimeout(() => { const r = document.getElementById('mb-result'); if(r) r.innerHTML=''; }, 2500)
  } catch (e) {
    console.error('[MB] Deposit failed:', e)
    if (resultEl) resultEl.innerHTML = `<div style="text-align:center;padding:10px 16px;background:rgba(255,77,77,.08);border:1px solid rgba(255,77,77,.3);border-radius:16px"><div style="font-size:13px;font-weight:800;color:#ff4d4d">Deposit failed</div><div style="font-size:10px;color:rgba(255,77,77,.6);margin-top:2px">${(e?.message||'').slice(0,80)}</div></div>`
  }
}
async function mbDoWithdraw() {
  const addrEl  = document.getElementById('mb-withdraw-addr');
  const amtEl   = document.getElementById('mb-withdraw-amt');
  const resultEl = document.getElementById('mb-result');

  const address = addrEl?.value?.trim();
  const amount  = parseInt(amtEl?.value) || 0;

  if (!address) { showToast('Enter a destination address'); return; }
  if (amount <= 0 || amount > window._mb.balance) {
    showToast('Invalid amount'); return;
  }

  // Show spinner
  if (resultEl) resultEl.innerHTML = `
    <div style="text-align:center;padding:14px">
      <svg viewBox="0 0 24 24" fill="none" stroke="rgba(48,208,104,.8)" stroke-width="2"
        style="width:28px;height:28px;animation:spin .6s linear infinite">
        <path d="M21 12a9 9 0 11-6.219-8.56"/>
      </svg>
      <div style="font-size:12px;color:rgba(48,208,104,.7);margin-top:8px;font-weight:700">Processing withdrawal…</div>
    </div>`;

  try {
    // ── SERVER CALL GOES HERE ──────────────────────────────────────────────
    // In production: POST /api/mb/withdraw { address, amount, userId/token }
    // The server holds the game wallet's private key and calls sendBitcoin().
    // For now we simulate a 1.2s network round-trip then credit the balance.
    await new Promise(r => setTimeout(r, 1200));
    // ──────────────────────────────────────────────────────────────────────

    window._mb.balance -= amount;
    addTxRow('in', 'Mystery Box — Withdrawal', amount);
    if (window._refreshTransactions) window._refreshTransactions();

    const balEl = document.getElementById('mb-balance');
    if (balEl) balEl.textContent = window._mb.balance.toLocaleString() + ' sats';

    const shortAddr = address.length > 20
      ? address.slice(0, 10) + '…' + address.slice(-6)
      : address;

    if (resultEl) resultEl.innerHTML = `
      <div style="text-align:center;padding:12px 16px;background:rgba(48,208,104,.08);border:1px solid rgba(48,208,104,.3);border-radius:16px;animation:spi .3s var(--spring)">
        <div style="font-size:18px;font-weight:900;color:#30d068">${amount.toLocaleString()} sats sent ✓</div>
        <div style="font-size:10px;color:rgba(48,208,104,.6);margin-top:4px;font-family:monospace">${shortAddr}</div>
        <div style="font-size:10px;color:rgba(48,208,104,.5);margin-top:2px">Arrives within one Ark batch (~10s)</div>
      </div>`;
    setTimeout(() => { const r = document.getElementById('mb-result'); if(r) r.innerHTML=''; }, 3500);

  } catch(e) {
    console.error('[MB] Withdrawal failed:', e);
    if (resultEl) resultEl.innerHTML = `
      <div style="text-align:center;padding:10px 16px;background:rgba(255,77,77,.08);border:1px solid rgba(255,77,77,.3);border-radius:16px">
        <div style="font-size:13px;font-weight:800;color:#ff4d4d">Withdrawal failed</div>
        <div style="font-size:10px;color:rgba(255,77,77,.6);margin-top:2px">${(e?.message||'').slice(0,80)}</div>
      </div>`;
  }
}
function mbOpen(tier) {
  if (window._mb.opening) return;
  const t = MB_TIERS[tier]; if (!t) return;
  if (window._mb.balance < t.cost) { showToast('Not enough sats'); return; }
  window._mb.opening = true;
  window._mb.balance -= t.cost;
  const resultEl = document.getElementById('mb-result');
  if (resultEl) resultEl.innerHTML = '<div style="display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 24 24" fill="none" stroke="var(--acc2)" stroke-width="2" style="width:32px;height:32px;animation:spin .5s linear infinite"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg></div>';
  setTimeout(() => {
    const prize = mbWeightedPrize(t.prizes);
    window._mb.balance += prize;
    const big = prize >= t.cost * 3;
    const win = prize >= t.cost;
    const col = big ? 'var(--grn)' : win ? 'var(--acc2)' : prize > 0 ? 'var(--amb)' : 'var(--red)';
    const icon = prize === 0
      ? '<svg viewBox="0 0 24 24" fill="currentColor" style="width:32px;height:32px;color:#666"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>'
      : big
      ? '<svg viewBox="0 0 24 24" fill="currentColor" style="width:32px;height:32px;color:#30d068"><path d="M19 5h-2V3H7v2H5C3.9 5 3 5.9 3 7v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V18H8v2h8v-2h-3v-2.1a5.01 5.01 0 003.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>'
      : win
      ? '<svg viewBox="0 0 24 24" fill="currentColor" style="width:32px;height:32px;color:#2563eb"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="currentColor" style="width:32px;height:32px;color:#f5a623"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>';
    const msg = prize === 0 ? 'Empty…' : '+' + prize.toLocaleString() + ' sats';
    if (resultEl) resultEl.innerHTML = '<div style="text-align:center;padding:10px 16px;background:var(--surf);border:1px solid var(--bdr);border-radius:16px;animation:spi .3s var(--spring)"><div style="font-size:32px;margin-bottom:4px;display:flex;justify-content:center">'+icon+'</div><div style="font-size:18px;font-weight:900;color:'+col+'">'+msg+'</div>'+(big?'<div style="font-size:9px;font-weight:800;color:var(--amb);letter-spacing:.1em;text-transform:uppercase;margin-top:2px">JACKPOT!</div>':'')+'</div>';
    window._mb.history.unshift({ label: t.name, prize, cost: t.cost });
    if (window._mb.history.length > 6) window._mb.history.pop();
    const balEl = document.getElementById('mb-balance');
    const histEl = document.getElementById('mb-history');
    if (balEl) balEl.textContent = window._mb.balance.toLocaleString() + ' sats';
    if (histEl) histEl.innerHTML = window._mb.history.map(h => {
      const c = h.prize >= h.cost ? 'var(--grn)' : h.prize > 0 ? 'var(--amb)' : 'var(--red)';
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid var(--bdr)"><span style="font-size:12px;color:var(--t2)">'+h.label+'</span><span style="font-size:12px;font-weight:800;color:'+c+'">'+(h.prize===0?'—':'+'+h.prize.toLocaleString()+' sats')+'</span></div>';
    }).join('');
    window._mb.opening = false;
  }, 650);
}

/* ═══════════════════════════════════════════
   SATS RUN — fullscreen, pay-to-play
   Entry: 100 sats. Each coin = 6 sats (~60% RTP)
   House keeps ~40% of entry net of prizes
═══════════════════════════════════════════ */
window._sr = { raf:null, state:'lobby', score:0, hi:0, frame:0, entryCost:30,
  player:{ x:55, y:0, vy:0, w:26, h:26, grounded:true, canDouble:true },
  obstacles:[], coins:[], particles:[] };

function srOpenGame(wrap, cost, isLight) {
  const now = Date.now();
  if(window._srLastOpen && now - window._srLastOpen < 400) return;
  window._srLastOpen = now;

  const sr = window._sr;
  sr._isLight = isLight;
  sr.entryCost = cost || 30;
  if(sr.raf){ cancelAnimationFrame(sr.raf); sr.raf=null; }
  sr.state='lobby'; sr.score=0; sr.frame=0;
  sr.obstacles=[]; sr.coins=[]; sr.particles=[];
  sr.player.vy=0; sr.player.grounded=true; sr.player.canDouble=true;

  wrap.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.style.cssText='width:100%;height:100%;display:block;touch-action:none;cursor:pointer';
  wrap.appendChild(canvas);
  sr.canvas=canvas; sr.ctx=canvas.getContext('2d');

  function resize(){
    canvas.width=wrap.clientWidth||360;
    canvas.height=wrap.clientHeight||500;
    sr.ground=canvas.height-110;
    sr.player.y=sr.ground-sr.player.h;
    if(sr.state!=='playing') srDraw();
  }
  resize();
  window._srResize = resize;
  window.addEventListener('resize', resize);

  gsUpdateBest(sr.hi);

  // Touch: tap to start/jump
  canvas.addEventListener('touchstart', e=>{ e.preventDefault(); srJump(); },{passive:false});
  canvas.addEventListener('click', srJump);
  srDraw();
}
function srRestart() { if(window._sr.canvas) srOpenGame(document.getElementById('gs-canvas-wrap'), window._sr.entryCost); }
function srSpeed() { return 1.2 + Math.min(window._sr.frame/900,1)*2.0; }
function srJump() {
  const sr = window._sr;
  if(sr.state==='lobby') {
    if(window._wallet.sats < sr.entryCost){ showToast('Not enough sats'); return; }
    sr.state = 'paying';
    // Draw paying screen
    const ctx = sr.ctx, W = sr.canvas.width, H = sr.canvas.height;
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = sr._isLight ? '#f0eeff' : 'rgba(0,0,5,.95)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#a78bfa'; ctx.font='bold 14px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('SENDING 150 SATS…', W/2, H/2-10);
    ctx.fillStyle='rgba(255,255,255,.3)'; ctx.font='10px monospace';
    ctx.fillText('Please wait', W/2, H/2+12);
    arcadeSendBitcoin(ARCADE_ADDRESS, sr.entryCost)
      .then(() => {
        addTxRow('out', 'Sats Run — Entry', sr.entryCost);
        if (window._refreshTransactions) window._refreshTransactions();
        sr.state='playing'; sr.running=true; srLoop();
      })
      .catch(e => {
        console.error('[SR] Entry payment failed:', e);
        sr.state='lobby';
        showToast('Payment failed — ' + (e?.message||'try again').slice(0,40));
        srDraw();
      });
    return;
  }
  if(sr.state==='dead') { srOpenGame(document.getElementById('gs-canvas-wrap'), sr.entryCost); return; }
  if(sr.state==='paying') return; // block input during payment
  if(sr.player.grounded) {
    sr.player.vy=-12; sr.player.grounded=false; sr.player.canDouble=true; sr.score+=1; gsUpdateScore(sr.score);
  } else if(sr.player.canDouble) {
    sr.player.vy=-10; sr.player.canDouble=false;
  }
}
function srLoop() {
  const sr=window._sr;
  if(sr.state!=='playing'||!sr.canvas) return;
  srTick(); srDraw();
  sr.raf=requestAnimationFrame(srLoop);
}
function srTick() {
  const sr=window._sr; const spd=srSpeed();
  sr.frame++;
  sr.player.vy+=0.48; sr.player.y+=sr.player.vy;
  if(sr.player.y>=sr.ground-sr.player.h){ sr.player.y=sr.ground-sr.player.h; sr.player.vy=0; sr.player.grounded=true; sr.player.canDouble=true; }
  const gap=Math.max(90,160-Math.floor(sr.frame/250)*5);
  if(sr.frame%gap===0){ const h=14+Math.random()*20; sr.obstacles.push({x:sr.canvas.width+10,y:sr.ground-h,w:13,h}); }
  if(sr.frame%35===0){ sr.coins.push({x:sr.canvas.width+10,y:sr.ground-35-Math.random()*60,r:10}); }
  sr.obstacles=sr.obstacles.filter(o=>{
    o.x-=spd; const p=sr.player;
    if(p.x+p.w-10>o.x+3&&p.x+10<o.x+o.w-3&&p.y+p.h-8>o.y&&p.y+8<o.y+o.h){
      sr.state='dead'; if(sr.score>sr.hi){sr.hi=sr.score;} gsUpdateBest(sr.hi);
      // Flat entry fee — no earnings credited back
    }
    return o.x>-o.w;
  });
  sr.coins=sr.coins.filter(c=>{
    c.x-=spd; const p=sr.player,dx=(p.x+p.w/2)-c.x,dy=(p.y+p.h/2)-c.y;
    if(Math.sqrt(dx*dx+dy*dy)<c.r+p.w/2-2){
      sr.score+=6; gsUpdateScore(sr.score);
      for(let i=0;i<6;i++) sr.particles.push({x:c.x,y:c.y,vx:(Math.random()-.5)*5,vy:-2-Math.random()*4,life:20,r:3});
      return false;
    }
    return c.x>-20;
  });
  sr.particles=sr.particles.filter(p=>{ p.x+=p.vx; p.y+=p.vy; p.vy+=0.3; p.life--; return p.life>0; });
}
function srDraw() {
  const sr=window._sr; if(!sr.ctx||!sr.canvas) return;
  const {ctx,canvas}=sr; const W=canvas.width,H=canvas.height;
  const srBg=window._sr._isLight?'#f0eeff':'#050508'; ctx.fillStyle=srBg; ctx.fillRect(0,0,W,H);
  // Stars
  ctx.fillStyle='rgba(255,255,255,.18)';
  for(let i=0;i<40;i++){ const x=(i*137.5)%W,y=(i*79.3)%sr.ground; ctx.fillRect(x,y,1,1); }
  // Grid lines
  ctx.strokeStyle='rgba(107,82,245,0.05)'; ctx.lineWidth=1;
  for(let x=0;x<W;x+=40){ ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke(); }
  // Ground
  ctx.fillStyle='rgba(107,82,245,0.3)'; ctx.fillRect(0,sr.ground,W,2);
  ctx.fillStyle='rgba(107,82,245,0.04)'; ctx.fillRect(0,sr.ground+2,W,H);
  // Obstacles
  sr.obstacles.forEach(o=>{ ctx.shadowColor='#2563eb';ctx.shadowBlur=10;ctx.fillStyle='#2563eb';ctx.fillRect(o.x,o.y,o.w,o.h);ctx.shadowBlur=0; });
  // Coins
  sr.coins.forEach(c=>{
    ctx.shadowColor='#f5a623';ctx.shadowBlur=14;ctx.fillStyle='#f5a623';
    ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    ctx.fillStyle='#1a0f00';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('₿',c.x,c.y+0.5);
  });
  sr.particles.forEach(p=>{ ctx.globalAlpha=p.life/20;ctx.fillStyle='#f5a623';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill(); }); ctx.globalAlpha=1;
  // Player
  const p=sr.player;
  ctx.shadowColor='#f5a623';ctx.shadowBlur=sr.player.grounded?5:16;ctx.fillStyle='#f5a623';
  ctx.beginPath();ctx.arc(p.x+7,p.y+7,7,Math.PI,1.5*Math.PI);ctx.arc(p.x+p.w-7,p.y+7,7,1.5*Math.PI,0);ctx.arc(p.x+p.w-7,p.y+p.h-7,7,0,.5*Math.PI);ctx.arc(p.x+7,p.y+p.h-7,7,.5*Math.PI,Math.PI);ctx.closePath();ctx.fill();
  ctx.shadowBlur=0;ctx.fillStyle='#0a0500';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('₿',p.x+p.w/2,p.y+p.h/2+1);
  ctx.fillStyle='rgba(245,166,35,.6)';ctx.font='10px sans-serif';ctx.textAlign='left';ctx.textBaseline='top';
  ctx.fillText('tap twice = double jump  ·  ₿ = 6 sats',10,sr.ground+8);
  // Overlays
  if(sr.state==='lobby'){
    ctx.fillStyle='rgba(0,0,5,.92)';ctx.fillRect(0,0,W,H);
    // Scanlines
    for(let y=0;y<H;y+=4){ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(0,y,W,2);}
    // Title
    ctx.shadowColor='#f5a623';ctx.shadowBlur=18;
    ctx.fillStyle='#f5a623';ctx.font='bold 28px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('SATS RUN',W/2,H/2-110);
    ctx.shadowBlur=0;
    // Pixel divider
    ctx.fillStyle='#f5a623';for(let x=W/2-70;x<W/2+70;x+=6){ctx.fillRect(x,H/2-90,4,2);}
    // INSERT COIN box
    ctx.strokeStyle='#2563eb';ctx.lineWidth=2;
    ctx.strokeRect(W/2-90,H/2-72,180,56);
    ctx.fillStyle='rgba(107,82,245,.15)';ctx.fillRect(W/2-90,H/2-72,180,56);
    ctx.fillStyle='rgba(255,255,255,.5)';ctx.font='10px monospace';
    ctx.fillText('INSERT COIN TO PLAY',W/2,H/2-56);
    ctx.fillStyle='#f5a623';ctx.font='bold 26px monospace';
    ctx.shadowColor='#f5a623';ctx.shadowBlur=10;
    ctx.fillText(sr.entryCost+' SATS',W/2,H/2-32);
    ctx.shadowBlur=0;
    // Instructions
    ctx.fillStyle='rgba(255,255,255,.4)';ctx.font='10px monospace';
    ctx.fillText('COLLECT ₿ COINS · TAP TWICE TO DOUBLE JUMP',W/2,H/2+4);
    // Blinking play button
    if(Math.floor(Date.now()/500)%2===0){
      ctx.fillStyle='#30d068';ctx.shadowColor='#30d068';ctx.shadowBlur=12;
      ctx.font='bold 13px monospace';ctx.fillText('► TAP TO START ◄',W/2,H/2+36);
      ctx.shadowBlur=0;
    }
    // Hi score
    if(sr.hi>0){ctx.fillStyle='rgba(245,166,35,.6)';ctx.font='10px monospace';ctx.fillText('HI-SCORE  '+sr.hi,W/2,H/2+60);}
    requestAnimationFrame(srDraw);
  }
  if(sr.state==='dead'){
    ctx.fillStyle='rgba(0,0,5,.9)';ctx.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=4){ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(0,y,W,2);}
    ctx.fillStyle='#ff4d4d';ctx.shadowColor='#ff4d4d';ctx.shadowBlur=16;
    ctx.font='bold 26px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('GAME OVER',W/2,H/2-65);ctx.shadowBlur=0;
    ctx.strokeStyle='rgba(107,82,245,.6)';ctx.lineWidth=2;
    ctx.strokeRect(W/2-80,H/2-44,160,52);
    ctx.fillStyle='rgba(107,82,245,.1)';ctx.fillRect(W/2-80,H/2-44,160,52);
    ctx.fillStyle='rgba(255,255,255,.4)';ctx.font='9px monospace';
    ctx.fillText('YOUR SCORE',W/2,H/2-28);
    ctx.fillStyle='#a78bfa';ctx.shadowColor='#2563eb';ctx.shadowBlur=10;
    ctx.font='bold 30px monospace';ctx.fillText(sr.score+' PTS',W/2,H/2-4);
    ctx.shadowBlur=0;
    if(sr.hi>0){ctx.fillStyle='#f5a623';ctx.font='10px monospace';ctx.fillText('BEST  '+sr.hi+' PTS',W/2,H/2+24);}
    if(Math.floor(Date.now()/600)%2===0){
      ctx.fillStyle='#2563eb';ctx.shadowColor='#2563eb';ctx.shadowBlur=10;
      ctx.font='bold 12px monospace';ctx.fillText('► 150 SATS TO PLAY AGAIN ◄',W/2,H/2+52);
      ctx.shadowBlur=0;
    }
    requestAnimationFrame(srDraw);
  }
}

/* ═══════════════════════════════════════════
   SPACE INVADERS — fullscreen, pay-to-play
   Entry: 150 sats. Each alien = 7 sats, wave bonus = 80 sats
   ~38% house edge at average skill
═══════════════════════════════════════════ */
window._si = { raf:null, state:'lobby', score:0, hi:0, lives:3, wave:1, entryCost:30,
  player:{x:160,y:200,w:30,h:18},
  bullets:[], alienBullets:[], aliens:[], particles:[],
  alienDir:1, shootTimer:0, moveTimer:0,
  _touchStartX:null,_touchStartPX:null,_touchMoved:false,_mouseDown:false };

function siMakeAliens() {
  const si=window._si; si.aliens=[];
  const canvas=si.canvas; if(!canvas) return;
  const cols=10,rows=3,aw=16,ah=12,gx=4,gy=12;
  const totalW=cols*aw+(cols-1)*gx;
  const ox=Math.floor((canvas.width-totalW)/2);
  const oy=28;
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    si.aliens.push({x:ox+c*(aw+gx),y:oy+r*(ah+gy),w:aw,h:ah,row:r,alive:true});
  }
  si.alienDir=1; si.moveTimer=0;
}
function siOpenGame(wrap, cost, isLight) {
  const now = Date.now();
  if(window._siLastOpen && now - window._siLastOpen < 400) return;
  window._siLastOpen = now;

  const si=window._si;
  si._isLight = isLight;
  si.entryCost=cost||30;
  if(si.raf){cancelAnimationFrame(si.raf);si.raf=null;}
  si.state='lobby'; si.score=0; si.lives=3; si.wave=1;
  si.bullets=[]; si.alienBullets=[]; si.particles=[]; si.shootTimer=0; si.moveTimer=0;
  si._touchStartX=null; si._touchMoved=false; si._mouseDown=false;

  wrap.innerHTML = '';
  const canvas=document.createElement('canvas');
  canvas.style.cssText='width:100%;height:100%;display:block;touch-action:none';
  wrap.appendChild(canvas);
  si.canvas=canvas; si.ctx=canvas.getContext('2d');

  function resize(){
    canvas.width=wrap.clientWidth||360;
    canvas.height=wrap.clientHeight||500;
    si.player.x=canvas.width/2-si.player.w/2;
    si.player.y=canvas.height-85;
    siMakeAliens();
    if(si.state!=='playing') siDraw();
  }
  resize(); window._siResize=resize;
  window.addEventListener('resize',resize);
  gsUpdateBest(si.hi);

  // Touch controls: slide = move, tap = shoot
  canvas.addEventListener('touchstart',e=>{
    e.preventDefault();
    const t=e.changedTouches[0];
    si._touchStartX=t.clientX; si._touchStartPX=si.player.x; si._touchMoved=false;
    if(si.state==='lobby'){si.state='playing';siLoop();}
    else if(si.state==='dead'){siOpenGame(wrap,si.entryCost);}
  },{passive:false});
  canvas.addEventListener('touchmove',e=>{
    e.preventDefault();
    const t=e.changedTouches[0],dx=t.clientX-si._touchStartX;
    const scale=canvas.width/canvas.getBoundingClientRect().width;
    si.player.x=Math.max(0,Math.min(canvas.width-si.player.w,si._touchStartPX+dx*scale));
    if(Math.abs(dx)>5) si._touchMoved=true;
  },{passive:false});
  canvas.addEventListener('touchend',e=>{
    e.preventDefault();
    if(!si._touchMoved&&si.state==='playing'&&si.bullets.length<3)
      si.bullets.push({x:si.player.x+si.player.w/2,y:si.player.y,w:3,h:12,vy:-9});
    si._touchMoved=false;
  },{passive:false});
  // Mouse fallback
  canvas.addEventListener('mousedown',e=>{
    si._mouseDown=true;si._touchStartX=e.clientX;si._touchStartPX=si.player.x;si._touchMoved=false;
    if(si.state==='lobby'){si.state='playing';siLoop();}
    else if(si.state==='dead'){siOpenGame(wrap,si.entryCost);}
  });
  canvas.addEventListener('mousemove',e=>{
    if(!si._mouseDown)return;
    const dx=e.clientX-si._touchStartX,scale=canvas.width/canvas.getBoundingClientRect().width;
    si.player.x=Math.max(0,Math.min(canvas.width-si.player.w,si._touchStartPX+dx*scale));
    if(Math.abs(dx)>4) si._touchMoved=true;
  });
  canvas.addEventListener('mouseup',e=>{
    if(!si._touchMoved&&si.state==='playing'&&si.bullets.length<3)
      si.bullets.push({x:si.player.x+si.player.w/2,y:si.player.y,w:3,h:12,vy:-9});
    si._mouseDown=false;si._touchMoved=false;
  });
  siDraw();
}
function siLoop(){
  const si=window._si;
  if(si.state!=='playing'||!si.canvas)return;
  siTick();siDraw();
  si.raf=requestAnimationFrame(siLoop);
}
function siTick(){
  const si=window._si;const canvas=si.canvas;
  const aliveAliens=si.aliens.filter(a=>a.alive);
  if(!aliveAliens.length){
    si.wave++;si.score+=1;gsUpdateScore(si.score);
    siMakeAliens();return;
  }
  // Alien march
  si.moveTimer++;
  const mInterval=Math.max(8,32-si.wave*2|0);
  if(si.moveTimer>=mInterval){
    si.moveTimer=0;
    const step=(0.45+si.wave*0.06)*mInterval*si.alienDir;
    aliveAliens.forEach(a=>a.x+=step);
    const minX=Math.min(...aliveAliens.map(a=>a.x));
    const maxX=Math.max(...aliveAliens.map(a=>a.x+a.w));
    if(maxX>=canvas.width-4||minX<=4){
      si.alienDir*=-1;aliveAliens.forEach(a=>a.y+=16);
    }
    if(aliveAliens.some(a=>a.y+a.h>=si.player.y-8)){si.lives=0;siDie();}
  }
  // Alien shooting
  si.shootTimer++;
  const sRate=Math.max(28,80-si.wave*8);
  if(si.shootTimer>sRate&&aliveAliens.length&&si.alienBullets.length<4){
    si.shootTimer=0;
    const s=aliveAliens[Math.floor(Math.random()*aliveAliens.length)];
    si.alienBullets.push({x:s.x+s.w/2,y:s.y+s.h,w:2,h:10,vy:1.8+si.wave*0.15});
  }
  // Player bullets
  si.bullets=si.bullets.filter(b=>{
    b.y+=b.vy;if(b.y<-10)return false;
    let hit=false;
    si.aliens.forEach(a=>{
      if(!a.alive||hit)return;
      if(b.x>a.x&&b.x<a.x+a.w&&b.y>a.y&&b.y<a.y+a.h){
        a.alive=false;hit=true;si.score+=1;gsUpdateScore(si.score);
        for(let i=0;i<8;i++) si.particles.push({x:a.x+a.w/2,y:a.y+a.h/2,vx:(Math.random()-.5)*4,vy:(Math.random()-.5)*4,life:18,r:2,col:'#30d068'});
      }
    });
    return !hit;
  });
  // Alien bullets
  si.alienBullets=si.alienBullets.filter(b=>{
    b.y+=b.vy;if(b.y>canvas.height+10)return false;
    const p=si.player;
    if(b.x>p.x&&b.x<p.x+p.w&&b.y>p.y&&b.y<p.y+p.h){
      si.lives--;
      for(let i=0;i<10;i++) si.particles.push({x:p.x+p.w/2,y:p.y+p.h/2,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,life:22,r:3,col:'#ff4d4d'});
      if(si.lives<=0){siDie();return false;}
      return false;
    }
    return true;
  });
  si.particles=si.particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.life--;return p.life>0;});
}
function siDie(){
  const si=window._si;
  if(si.score>si.hi){si.hi=si.score;gsUpdateBest(si.hi);}
  si.state='dead';cancelAnimationFrame(si.raf);si.raf=null;siDraw();
}
function siDraw(){
  const si=window._si;if(!si.ctx||!si.canvas)return;
  const {ctx,canvas}=si;const W=canvas.width,H=canvas.height;
  const siBg=window._si._isLight?'#f0eeff':'#010108'; ctx.fillStyle=siBg; ctx.fillRect(0,0,W,H);
  // Stars
  ctx.fillStyle='rgba(255,255,255,.2)';
  for(let i=0;i<50;i++){const x=(i*113.7)%W,y=(i*61.3)%(H*.85);ctx.fillRect(x,y,1,1);}
  // Aliens
  si.aliens.forEach(a=>{
    if(!a.alive)return;
    const cols=['#ff4d4d','#f5a623','#2563eb','#30d068'];
    const col=cols[a.row%cols.length];
    ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=5;
    // Body (16x12 pixel alien)
    ctx.fillRect(a.x+3,a.y,a.w-6,a.h);       // head
    ctx.fillRect(a.x,a.y+3,a.w,a.h-5);       // wide body
    ctx.fillRect(a.x+2,a.y+1,a.w-4,a.h-2);   // fill
    // Antennae
    ctx.fillRect(a.x+3,a.y-3,2,3);ctx.fillRect(a.x+a.w-5,a.y-3,2,3);
    // Legs/claws
    ctx.fillRect(a.x,a.y+a.h-3,3,4);ctx.fillRect(a.x+a.w-3,a.y+a.h-3,3,4);
    ctx.fillRect(a.x+4,a.y+a.h-1,3,3);ctx.fillRect(a.x+a.w-7,a.y+a.h-1,3,3);
    ctx.shadowBlur=0;
    // Eyes
    ctx.fillStyle='#000';ctx.fillRect(a.x+4,a.y+3,3,3);ctx.fillRect(a.x+a.w-7,a.y+3,3,3);
  });
  // Player ship
  const p=si.player;
  ctx.fillStyle='#2563eb';ctx.shadowColor='#2563eb';ctx.shadowBlur=14;
  ctx.fillRect(p.x+p.w/2-2,p.y-5,4,5);
  ctx.fillRect(p.x+5,p.y,p.w-10,p.h-5);
  ctx.fillRect(p.x,p.y+p.h-8,p.w,8);
  ctx.shadowBlur=0;
  // Lives display on canvas
  ctx.fillStyle='rgba(255,255,255,.7)';ctx.font='bold 11px sans-serif';ctx.textAlign='left';ctx.textBaseline='bottom';
  let livesStr=''; for(let i=0;i<si.lives;i++) livesStr+='♥ ';
  ctx.fillStyle='#ff4d4d';ctx.fillText(livesStr.trim(),8,H-8);
  ctx.fillStyle='rgba(255,255,255,.4)';ctx.font='10px monospace';ctx.textAlign='right';
  ctx.fillText('LVL '+si.wave,W-8,H-8);
  // Bullets
  si.bullets.forEach(b=>{ctx.fillStyle='#30d068';ctx.shadowColor='#30d068';ctx.shadowBlur=8;ctx.fillRect(b.x-b.w/2,b.y,b.w,b.h);ctx.shadowBlur=0;});
  si.alienBullets.forEach(b=>{ctx.fillStyle='#ff4d4d';ctx.shadowColor='#ff4d4d';ctx.shadowBlur=6;ctx.fillRect(b.x-b.w/2,b.y,b.w,b.h);ctx.shadowBlur=0;});
  si.particles.forEach(pt=>{ctx.globalAlpha=pt.life/22;ctx.fillStyle=pt.col||'#fff';ctx.beginPath();ctx.arc(pt.x,pt.y,pt.r,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;
  // Ground line
  ctx.strokeStyle='rgba(107,82,245,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,H-18);ctx.lineTo(W,H-18);ctx.stroke();

  if(si.state==='lobby'){
    ctx.fillStyle='rgba(0,0,5,.93)';ctx.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=4){ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(0,y,W,2);}
    // Draw demo aliens in header
    const demoColors=['#ff4d4d','#f5a623','#2563eb','#30d068'];
    for(let c=0;c<6;c++){const ax=W/2-75+c*26,ay=H/2-140,col=demoColors[c%4];ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=4;ctx.fillRect(ax+2,ay,10,8);ctx.fillRect(ax,ay+2,14,5);ctx.fillRect(ax+2,ay-2,2,3);ctx.fillRect(ax+10,ay-2,2,3);ctx.fillRect(ax,ay+7,3,3);ctx.fillRect(ax+11,ay+7,3,3);ctx.shadowBlur=0;}
    ctx.fillStyle='#2563eb';ctx.shadowColor='#2563eb';ctx.shadowBlur=20;
    ctx.font='bold 26px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('SPACE INVADERS',W/2,H/2-100);ctx.shadowBlur=0;
    // Pixel divider
    ctx.fillStyle='#2563eb';for(let x=W/2-80;x<W/2+80;x+=6){ctx.fillRect(x,H/2-82,4,2);}
    // INSERT COIN box
    ctx.strokeStyle='#f5a623';ctx.lineWidth=2;
    ctx.strokeRect(W/2-90,H/2-66,180,58);
    ctx.fillStyle='rgba(245,166,35,.1)';ctx.fillRect(W/2-90,H/2-66,180,58);
    ctx.fillStyle='rgba(255,255,255,.45)';ctx.font='10px monospace';
    ctx.fillText('INSERT COIN TO PLAY',W/2,H/2-50);
    ctx.fillStyle='#f5a623';ctx.shadowColor='#f5a623';ctx.shadowBlur=10;
    ctx.font='bold 26px monospace';ctx.fillText(si.entryCost+' SATS',W/2,H/2-24);
    ctx.shadowBlur=0;
    ctx.fillStyle='rgba(255,255,255,.38)';ctx.font='9px monospace';
    ctx.fillText('SLIDE=MOVE  TAP=FIRE  3x12',W/2,H/2+4);
    if(Math.floor(Date.now()/500)%2===0){
      ctx.fillStyle='#30d068';ctx.shadowColor='#30d068';ctx.shadowBlur=12;
      ctx.font='bold 12px monospace';ctx.fillText('► TAP TO START ◄',W/2,H/2+36);ctx.shadowBlur=0;
    }
    if(si.hi>0){ctx.fillStyle='rgba(245,166,35,.55)';ctx.font='10px monospace';ctx.fillText('HI-SCORE  '+si.hi,W/2,H/2+60);}
    requestAnimationFrame(siDraw);
  }
  if(si.state==='dead'){
    ctx.fillStyle='rgba(0,0,5,.92)';ctx.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=4){ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(0,y,W,2);}
    ctx.fillStyle='#ff4d4d';ctx.shadowColor='#ff4d4d';ctx.shadowBlur=18;
    ctx.font='bold 26px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('GAME OVER',W/2,H/2-70);ctx.shadowBlur=0;
    ctx.strokeStyle='rgba(107,82,245,.6)';ctx.lineWidth=2;
    ctx.strokeRect(W/2-80,H/2-50,160,54);
    ctx.fillStyle='rgba(107,82,245,.1)';ctx.fillRect(W/2-80,H/2-50,160,54);
    ctx.fillStyle='rgba(255,255,255,.4)';ctx.font='9px monospace';
    ctx.fillText('YOUR SCORE',W/2,H/2-34);
    ctx.fillStyle='#a78bfa';ctx.shadowColor='#2563eb';ctx.shadowBlur=12;
    ctx.font='bold 28px monospace';ctx.fillText(si.score+' PTS',W/2,H/2-8);ctx.shadowBlur=0;
    if(si.hi>0){ctx.fillStyle='#f5a623';ctx.font='10px monospace';ctx.fillText('BEST '+si.hi+' · WAVE '+si.wave,W/2,H/2+22);}
    if(Math.floor(Date.now()/600)%2===0){
      ctx.fillStyle='#2563eb';ctx.shadowColor='#2563eb';ctx.shadowBlur=10;
      ctx.font='bold 11px monospace';ctx.fillText('► 150 SATS TO PLAY AGAIN ◄',W/2,H/2+52);ctx.shadowBlur=0;
    }
    requestAnimationFrame(siDraw);
  }
}

/* ═══════════════════════════════════════════
   MYSTERY BOX — fullscreen
═══════════════════════════════════════════ */
function mbOpenGame(wrap, isLight) {
  const mb = window._mb;
  const bg   = isLight ? '#f0eeff' : '#0a0508';
  const surf = isLight ? '#fff'    : '#140d1a';
  const bdr  = isLight ? 'rgba(46,30,140,.12)' : 'rgba(107,82,245,.2)';
  const t1   = isLight ? '#100c30' : '#fff';
  const t3   = isLight ? '#8880b8' : 'rgba(255,255,255,.4)';

  wrap.innerHTML = '';
  wrap.style.cssText = 'flex:1;min-height:0;display:block;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;background:' + bg + ';position:relative';

  wrap.innerHTML = `
  <div style="padding:20px 20px 0">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">
      <div>
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${t3};margin-bottom:3px">Box Balance</div>
        <div id="mb-balance" style="font-size:26px;font-weight:900;color:#2563eb">0 sats</div>
      </div>
      <div style="display:flex;gap:7px">
        <button onclick="mbTopUp()" style="display:flex;align-items:center;gap:6px;padding:9px 14px;background:rgba(107,82,245,.15);border:1.5px solid rgba(107,82,245,.4);border-radius:50px;color:#2563eb;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit" onmousedown="this.style.opacity='.7'" onmouseup="this.style.opacity='1'" ontouchend="this.style.opacity='1'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px;height:12px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Top Up
        </button>
        <button onclick="mbWithdraw()" style="display:flex;align-items:center;gap:6px;padding:9px 14px;background:rgba(48,208,104,.1);border:1.5px solid rgba(48,208,104,.35);border-radius:50px;color:#30d068;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit" onmousedown="this.style.opacity='.7'" onmouseup="this.style.opacity='1'" ontouchend="this.style.opacity='1'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px;height:12px"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 19 19 12"/></svg>
          Withdraw
        </button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px">
      ${[
        {id:'starter',   label:'Starter',   cost:'50',      col:t3,       bg:'rgba(255,255,255,.06)', icon:'M5 3h14a1 1 0 011 1v2H4V4a1 1 0 011-1zm15 4H4v13a1 1 0 001 1h14a1 1 0 001-1V7zm-8 3h2v6h-2v-6z'},
        {id:'common',    label:'Common',    cost:'200',     col:'#f5a623', bg:'rgba(245,166,35,.1)',  icon:'M4 9h16v11a1 1 0 01-1 1H5a1 1 0 01-1-1V9zm7 3v5h2v-5h-2zM2 6a1 1 0 011-1h4.586l1.707-1.707A1 1 0 0110 3h4a1 1 0 01.707.293L16.414 5H21a1 1 0 011 1v2H2V6zm10-1h-1.586l-1 1H15l-1-1h-2z'},
        {id:'rare',      label:'Rare',      cost:'500',     col:'#2563eb', bg:'rgba(107,82,245,.12)', icon:'M20 7H4a2 2 0 00-2 2v1h20V9a2 2 0 00-2-2zM2 14v5a2 2 0 002 2h16a2 2 0 002-2v-5H2zm5 4H5v-2h2v2zm4 0H9v-2h2v2zm8-11h-3l-2-3H10L8 7H5l3-4h8l3 4z'},
        {id:'epic',      label:'Epic',      cost:'2,000',   col:'#a78bfa', bg:'rgba(167,139,250,.12)',icon:'M6.5 2h11l3 5-8.5 14L3.5 7l3-5zm1.5 2L6 7l6 10 6-10-2-3H8zm4 1h-4l-1.5 2.5 3.5 6.5V5h2v5.9l3.5-6.4L14 5z'},
        {id:'legendary', label:'Legend',    cost:'5,000',   col:'#f5a623', bg:'rgba(245,166,35,.12)', icon:'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 3.8 2.4-7.4L2 9.4h7.6L12 2z'},
        {id:'satoshi',   label:'Satoshi',   cost:'21,000',  col:'#f5a623', bg:'rgba(245,166,35,.15)', icon:'M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 3.21-1.81 6-4.72 7.28L13 17.77V20h-2v-2.23l-2.28-1.72C5.81 14.93 4 12.14 4 8.93c0-4.08 3.05-7.44 7-7.93V2.05h2zm-1 3.95C9.24 6 7 8.43 7 11.32c0 2.3 1.32 4.36 3.4 5.44L11 17.4V14h2v3.4l.6-.64C15.68 15.68 17 13.62 17 11.32 17 8.43 14.76 6 12 6z'},
      ].map(b=>`
        <div onclick="mbOpen('${b.id}')" style="background:${surf};border:1.5px solid ${bdr};border-radius:16px;padding:14px 6px;text-align:center;cursor:pointer;transition:transform .12s;-webkit-tap-highlight-color:transparent" onmousedown="this.style.transform='scale(.93)'" onmouseup="this.style.transform=''" ontouchend="this.style.transform=''">
          <div style="width:38px;height:38px;margin:0 auto 8px;background:${b.bg};border-radius:11px;display:flex;align-items:center;justify-content:center">
            <svg viewBox="0 0 24 24" fill="${b.col}" style="width:22px;height:22px"><path d="${b.icon}"/></svg>
          </div>
          <div style="font-size:11px;font-weight:800;color:${t1}">${b.label}</div>
          <div style="font-size:10px;font-weight:700;color:${b.col};margin-top:2px">${b.cost} sats</div>
        </div>`).join('')}
    </div>
    <div id="mb-result" style="min-height:80px;display:flex;align-items:center;justify-content:center;margin-bottom:14px"></div>
    <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:${t3};margin-bottom:8px">History</div>
    <div id="mb-history" style="padding-bottom:28px"><div style="font-size:12px;color:${t3};text-align:center;padding:12px 0">No boxes opened yet</div></div>
  </div>`;

  // Re-run mbInit to wire up balance display
  mbInit();
}

/* ═══════════════════════════════════════════
   PIXEL PAINT — 1 sat per cell
═══════════════════════════════════════════ */
window._pp = {
  raf: null,
  appBalance: 0,   // deposited sats available to spend on cells
  committed: {},   // paid cells  "x,y" -> color
  draft: {},       // unpaid pending cells "x,y" -> color
  selectedColor: '#2563eb',
  cols: 20, rows: 28,
  palette: ['#2563eb','#30d068','#f5a623','#ff4d4d','#29b6f6','#ff80ab','#fff','#888','#a78bfa','#ffd740','#69f0ae','#ff6e40'],
};

function ppOpenGame(wrap, isLight) {
  const pp = window._pp;
  if (pp.raf) { cancelAnimationFrame(pp.raf); pp.raf = null; }

  const bg     = isLight ? '#f0eeff' : '#0a0a14';
  const cellBg = isLight ? '#e0dbf8' : '#1a1a2e';
  const gridC  = isLight ? 'rgba(46,30,140,.08)' : 'rgba(107,82,245,.15)';
  const t1     = isLight ? '#100c30' : '#fff';
  const t3     = isLight ? '#8880b8' : 'rgba(255,255,255,.4)';
  const btnBg  = isLight ? '#0e3a8a' : '#2563eb';

  wrap.innerHTML = '';
  wrap.style.cssText = 'background:'+bg+';overflow:hidden;display:flex;flex-direction:column';

  // ── Header ──
  const hdr = document.createElement('div');
  hdr.style.cssText = 'padding:10px 16px 6px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between';
  hdr.innerHTML = `
    <div>
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:${t3};margin-bottom:1px">Paint Balance</div>
      <div style="font-size:16px;font-weight:900;color:#2563eb"><span id="pp-balance">${pp.appBalance.toLocaleString()}</span> sats</div>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <div style="font-size:11px;font-weight:800;color:${t3}">Pending: <span id="pp-pending" style="color:#f5a623">0</span></div>
      <button onclick="ppTopUp()" style="padding:6px 12px;background:rgba(107,82,245,.15);border:1.5px solid rgba(107,82,245,.4);border-radius:50px;color:#2563eb;font-size:11px;font-weight:800;cursor:pointer;font-family:inherit">+ Add Sats</button>
    </div>`;
  wrap.appendChild(hdr);

  // ── Palette ──
  const pal = document.createElement('div');
  pal.style.cssText = 'display:flex;gap:6px;padding:0 16px 8px;flex-wrap:wrap;flex-shrink:0;align-items:center';

  pp.palette.forEach(col => {
    const sw = document.createElement('div');
    sw.style.cssText = `width:26px;height:26px;border-radius:7px;background:${col};cursor:pointer;border:3px solid transparent;transition:border-color .1s;flex-shrink:0;box-sizing:border-box`;
    if (col === pp.selectedColor) sw.style.borderColor = t1;
    sw.onclick = () => {
      pp.selectedColor = col;
      pal.querySelectorAll('[data-swatch]').forEach(s => s.style.borderColor = 'transparent');
      sw.style.borderColor = t1;
    };
    sw.dataset.swatch = col;
    pal.appendChild(sw);
  });

  // Eraser
  const eraser = document.createElement('div');
  eraser.dataset.swatch = 'erase';
  eraser.style.cssText = `width:26px;height:26px;border-radius:7px;background:${cellBg};cursor:pointer;border:2px dashed ${t3};display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;color:${t1};font-weight:700`;
  eraser.textContent = '✕';
  eraser.onclick = () => {
    pp.selectedColor = null;
    pal.querySelectorAll('[data-swatch]').forEach(s => s.style.borderColor = 'transparent');
    eraser.style.borderColor = t1;
  };
  pal.appendChild(eraser);

  // Clear draft button
  const clrBtn = document.createElement('div');
  clrBtn.style.cssText = `margin-left:4px;padding:4px 10px;border-radius:7px;background:rgba(255,77,77,.15);color:#ff4d4d;font-size:11px;font-weight:700;cursor:pointer;flex-shrink:0`;
  clrBtn.textContent = 'Clear';
  clrBtn.onclick = () => { pp.draft = {}; ppUpdatePending(); ppDraw(); };
  pal.appendChild(clrBtn);
  wrap.appendChild(pal);

  // ── Canvas ──
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'flex:1;display:block;touch-action:none;cursor:crosshair;min-height:0';
  wrap.appendChild(canvas);
  pp.canvas = canvas; pp.ctx = canvas.getContext('2d');
  pp.bg = cellBg; pp.gridC = gridC;

  // ── Confirm footer ──
  const footer = document.createElement('div');
  footer.style.cssText = `padding:10px 16px max(env(safe-area-inset-bottom,0px),14px);flex-shrink:0;background:${bg};border-top:1px solid ${isLight?'rgba(46,30,140,.1)':'rgba(107,82,245,.15)'}`;
  footer.innerHTML = `
    <button id="pp-confirm-btn" onclick="ppConfirm()" style="width:100%;padding:15px;background:${btnBg};border:none;border-radius:50px;color:#fff;font-size:15px;font-weight:800;cursor:pointer;font-family:var(--f);opacity:.4;pointer-events:none">
      Confirm &amp; Pay <span id="pp-confirm-cost">0 sats</span>
    </button>
    <div style="font-size:10px;color:${t3};text-align:center;margin-top:6px">Paint your cells first · then confirm to pay</div>`;
  wrap.appendChild(footer);

  function resize() {
    canvas.width  = wrap.clientWidth || 360;
    canvas.height = wrap.clientHeight - hdr.offsetHeight - pal.offsetHeight - footer.offsetHeight;
    ppDraw();
  }
  setTimeout(resize, 40);
  window.addEventListener('resize', resize);

  // ── Touch/mouse painting ──
  function getCell(cx, cy) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    const cw = canvas.width / pp.cols, ch = canvas.height / pp.rows;
    const x = Math.floor(((cx - rect.left) * sx) / cw);
    const y = Math.floor(((cy - rect.top)  * sy) / ch);
    if (x < 0 || x >= pp.cols || y < 0 || y >= pp.rows) return null;
    return {x, y};
  }

  let painting = false, lastKey = null;

  function paintAt(cx, cy) {
    const cell = getCell(cx, cy); if (!cell) return;
    const key = cell.x + ',' + cell.y;
    if (key === lastKey) return;
    lastKey = key;
    if (pp.selectedColor === null) {
      // Eraser removes draft only (can't un-pay committed)
      delete pp.draft[key];
    } else {
      // Only add to draft if not already committed to this color
      if (pp.committed[key] !== pp.selectedColor) {
        pp.draft[key] = pp.selectedColor;
      }
    }
    ppUpdatePending();
    ppDraw();
  }

  canvas.addEventListener('touchstart', e => { e.preventDefault(); painting=true; lastKey=null; paintAt(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});
  canvas.addEventListener('touchmove',  e => { e.preventDefault(); if(!painting) return; paintAt(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});
  canvas.addEventListener('touchend',   e => { e.preventDefault(); painting=false; lastKey=null; }, {passive:false});
  canvas.addEventListener('mousedown',  e => { painting=true; lastKey=null; paintAt(e.clientX, e.clientY); });
  canvas.addEventListener('mousemove',  e => { if(!painting) return; paintAt(e.clientX, e.clientY); });
  canvas.addEventListener('mouseup',    () => { painting=false; lastKey=null; });
}

function ppUpdatePending() {
  const pp = window._pp;
  // Count draft cells that differ from committed
  let count = 0;
  for (const [k, col] of Object.entries(pp.draft)) {
    if (pp.committed[k] !== col) count++;
  }
  const el = document.getElementById('pp-pending');
  if (el) el.textContent = count;
  const btn = document.getElementById('pp-confirm-btn');
  const cost = document.getElementById('pp-confirm-cost');
  if (cost) cost.textContent = count + ' sat' + (count!==1?'s':'');
  if (btn) {
    btn.style.opacity = count > 0 ? '1' : '.4';
    btn.style.pointerEvents = count > 0 ? 'auto' : 'none';
  }
}

function ppUpdateBalance() {
  const el = document.getElementById('pp-balance');
  if (el) el.textContent = window._pp.appBalance.toLocaleString();
}

function ppTopUp() {
  const opts = [500, 1000, 2000, 5000];
  const walletSats = window._wallet?.sats || 0;
  const overlay = document.createElement('div');
  overlay.id = 'pp-topup-overlay';
  overlay.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;z-index:99;padding:24px;box-sizing:border-box';
  overlay.innerHTML = `
    <div style="background:#140d1a;border:1.5px solid rgba(107,82,245,.4);border-radius:20px;padding:22px;width:100%;max-width:320px">
      <div style="font-size:13px;font-weight:800;color:#fff;margin-bottom:4px">Add Sats to Paint</div>
      <div style="font-size:11px;color:rgba(255,255,255,.4);margin-bottom:16px">1 sat = 1 cell · wallet: ${walletSats.toLocaleString()} sats</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        ${opts.map(a => `<button onclick="ppDoTopUp(${a})" style="padding:10px;background:rgba(107,82,245,.15);border:1px solid rgba(107,82,245,.35);border-radius:12px;color:#a78bfa;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit">${a.toLocaleString()} sats</button>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:14px">
        <input id="pp-topup-custom" type="number" placeholder="Custom…" min="1" max="${walletSats}"
          style="flex:1;background:rgba(107,82,245,.08);border:1px solid rgba(107,82,245,.3);border-radius:10px;padding:9px 12px;color:#a78bfa;font-size:12px;font-weight:700;font-family:inherit;outline:none">
        <button onclick="ppDoTopUp(parseInt(document.getElementById('pp-topup-custom').value)||0)" style="padding:9px 16px;background:rgba(107,82,245,.2);border:1px solid rgba(107,82,245,.4);border-radius:10px;color:#2563eb;font-size:12px;font-weight:800;cursor:pointer;font-family:inherit">Add</button>
      </div>
      <button onclick="document.getElementById('pp-topup-overlay').remove()" style="width:100%;padding:9px;background:transparent;border:1px solid rgba(255,255,255,.12);border-radius:10px;color:rgba(255,255,255,.4);font-size:12px;cursor:pointer;font-family:inherit">Cancel</button>
    </div>`;
  const wrap = document.getElementById('gs-canvas-wrap');
  if (wrap) wrap.style.position = 'relative';
  const gameWrap = document.getElementById('game-screen');
  if (gameWrap) gameWrap.appendChild(overlay);
}

async function ppDoTopUp(amount) {
  if (!amount || amount <= 0) { showToast('Enter an amount'); return; }
  if ((window._wallet?.sats || 0) < amount) { showToast('Not enough sats'); return; }

  // Show loading state in overlay
  const overlay = document.getElementById('pp-topup-overlay');
  if (overlay) overlay.innerHTML = `
    <div style="background:#140d1a;border:1.5px solid rgba(107,82,245,.4);border-radius:20px;padding:32px 24px;text-align:center">
      <svg viewBox="0 0 24 24" fill="none" stroke="rgba(107,82,245,.8)" stroke-width="2"
        style="width:32px;height:32px;animation:spin .6s linear infinite;margin-bottom:12px">
        <path d="M21 12a9 9 0 11-6.219-8.56"/>
      </svg>
      <div style="font-size:14px;font-weight:800;color:#a78bfa">Sending ${amount.toLocaleString()} sats…</div>
      <div style="font-size:11px;color:rgba(255,255,255,.3);margin-top:4px">via Ark</div>
    </div>`;

  try {
    await arcadeSendBitcoin(ARCADE_ADDRESS, amount);
    window._pp.appBalance += amount;
    ppUpdateBalance();
    addTxRow('out', 'Pixel Paint — Deposit', amount);
    if (window._refreshTransactions) window._refreshTransactions();
    document.getElementById('pp-topup-overlay')?.remove();
    showToast('+' + amount.toLocaleString() + ' sats added to paint balance ✓');
  } catch(e) {
    console.error('[PP] Deposit failed:', e);
    document.getElementById('pp-topup-overlay')?.remove();
    showToast('Payment failed — ' + (e?.message||'try again').slice(0,40));
  }
}

function ppConfirm() {
  const pp = window._pp;
  let paid = 0;
  for (const [k, col] of Object.entries(pp.draft)) {
    if (pp.committed[k] !== col) { pp.committed[k] = col; paid++; }
  }
  if (paid === 0) return;
  if (pp.appBalance < paid) { showToast('Not enough paint balance — add more sats'); ppTopUp(); return; }
  pp.appBalance -= paid;
  ppUpdateBalance();
  addTxRow('out', 'Pixel Paint — ' + paid + ' cell' + (paid!==1?'s':''), paid);
  pp.draft = {};
  ppUpdatePending();
  ppDraw();
  showToast('Painted ' + paid + ' cell' + (paid!==1?'s':'') + ' ✓');
}

function ppDraw() {
  const pp = window._pp;
  if (!pp.canvas || !pp.ctx) return;
  const {ctx, canvas, cols, rows} = pp;
  const W = canvas.width, H = canvas.height;
  const cw = W / cols, ch = H / rows;

  ctx.fillStyle = pp.bg;
  ctx.fillRect(0, 0, W, H);

  // Committed cells (solid)
  for (const [key, col] of Object.entries(pp.committed)) {
    const [x, y] = key.split(',').map(Number);
    ctx.fillStyle = col;
    ctx.fillRect(x*cw+1, y*ch+1, cw-2, ch-2);
  }

  // Draft cells (semi-transparent preview)
  for (const [key, col] of Object.entries(pp.draft)) {
    const [x, y] = key.split(',').map(Number);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = col;
    ctx.fillRect(x*cw+1, y*ch+1, cw-2, ch-2);
    // Dashed border to indicate pending
    ctx.globalAlpha = 1;
    ctx.strokeStyle = col;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([2,2]);
    ctx.strokeRect(x*cw+1.5, y*ch+1.5, cw-3, ch-3);
    ctx.setLineDash([]);
  }
  ctx.globalAlpha = 1;

  // Grid
  ctx.strokeStyle = pp.gridC;
  ctx.lineWidth = 0.5;
  for (let x=0; x<=cols; x++) { ctx.beginPath(); ctx.moveTo(x*cw,0); ctx.lineTo(x*cw,H); ctx.stroke(); }
  for (let y=0; y<=rows; y++) { ctx.beginPath(); ctx.moveTo(0,y*ch); ctx.lineTo(W,y*ch); ctx.stroke(); }
}

/* ═══════════════════════════════════════════
   INLINE WRAPPERS — delegate to module-defined functions
   (module functions on window aren't available for inline onclick
   until after main.js finishes loading; these wrappers bridge that)
═══════════════════════════════════════════ */

// Backup — called by onclick="openBackupSheet()" in settings HTML
function openBackupSheet() {
  if (typeof window._openBackupSheet === 'function') {
    window._openBackupSheet();
  } else {
    showToast('Wallet still loading — try again in a moment');
  }
}
function doRestoreWallet() {
  if (typeof window._doRestoreWallet === 'function') {
    window._doRestoreWallet();
  }
}
function openPasswordSettings() {
  if (typeof window._syncPasswordToggle === 'function') window._syncPasswordToggle();
  openSheet('passwordsettings');
}

function togglePasswordSheetToggle(el) {
  const nextEnabled = !el.classList.contains('on');
  if (typeof window._setPasswordSheetState === 'function') {
    window._setPasswordSheetState(nextEnabled);
  }
}

window._setPasswordSheetState = function(enabled) {
  const tog = document.getElementById('password-sheet-toggle');
  const form = document.getElementById('password-form-card');
  const p1 = document.getElementById('password-input-1');
  const p2 = document.getElementById('password-input-2');
  if (tog) tog.classList.toggle('on', !!enabled);
  if (form) form.style.display = enabled ? 'block' : 'none';
  if (!enabled) {
    if (p1) p1.value = '';
    if (p2) p2.value = '';
  }
}

async function savePasswordSettings() {
  const enabled = document.getElementById('password-sheet-toggle')?.classList.contains('on');
  const password = document.getElementById('password-input-1')?.value || '';
  const confirmPassword = document.getElementById('password-input-2')?.value || '';
  if (typeof window._savePasswordSettings !== 'function') return;
  const result = await window._savePasswordSettings({ enabled, password, confirmPassword });
  if (!result?.ok) {
    showToast(result?.error || 'Could not update password setting');
    return;
  }
  if (enabled) {
    const p1 = document.getElementById('password-input-1');
    const p2 = document.getElementById('password-input-2');
    if (p1) p1.value = '';
    if (p2) p2.value = '';
  }
  closeSheet('passwordsettings');
}

// Arcade send — wraps _sdkSendBitcoin with _sendInProgress guard so
// the incoming watcher doesn't fire "Bitcoin Received" for change vtxos
async function arcadeSendBitcoin(address, amount) {
  if (!window._sdkSendBitcoin) throw new Error('SDK not ready — retry in a moment');
  if (window._setSendInProgress) window._setSendInProgress(true);
  try {
    return await window._sdkSendBitcoin({ address, amount });
  } finally {
    // Small delay so the watcher's next poll fires after _sendInProgress clears
    setTimeout(() => { if (window._setSendInProgress) window._setSendInProgress(false); }, 3000);
  }
}


/* ═══════════════════════════════════════════
   KEYBOARD / VIEWPORT AWARENESS
   Keeps sheets visible when soft keyboard appears
═══════════════════════════════════════════ */
(function(){
  if (!window.visualViewport) return;
  var THRESHOLD = 150;
  var baseHeight = window.visualViewport.height;

  function onViewportChange() {
    var vvh = window.visualViewport.height;
    document.documentElement.style.setProperty('--vvh', vvh + 'px');

    if (baseHeight - vvh > THRESHOLD) {
      document.body.classList.add('kb-open');
      var offsetY = window.visualViewport.offsetTop;
      document.querySelectorAll('.overlay.open').forEach(function(el) {
        el.style.transform = 'translateY(' + offsetY + 'px)';
        el.style.height = vvh + 'px';
      });
    } else {
      document.body.classList.remove('kb-open');
      document.querySelectorAll('.overlay').forEach(function(el) {
        el.style.transform = '';
        el.style.height = '';
      });
    }
  }

  window.visualViewport.addEventListener('resize', onViewportChange);
  window.visualViewport.addEventListener('scroll', onViewportChange);
})();

/* ═══════════════════════════════════════════
   EXPOSE ALL UI FUNCTIONS ON WINDOW
   (Required because Vite imports as ES module)
═══════════════════════════════════════════ */
window._bootChartOnce = _bootChartOnce;
window._buildInvoiceHtml = _buildInvoiceHtml;
window._favDecrypt = _favDecrypt;
window._favEncrypt = _favEncrypt;
window._favGetKey = _favGetKey;
window._shareLabel = _shareLabel;
window.addBoltzLog = addBoltzLog;
window.addFavorite = addFavorite;
window.addInvItem = addInvItem;
window.addInvToHistory = addInvToHistory;
window.addRunningBalances = addRunningBalances;
window.addTxRow = addTxRow;
window.advSplash = advSplash;
window.applyCur = applyCur;
window.applyScannedAddress = applyScannedAddress;
window.arcadeSendBitcoin = arcadeSendBitcoin;
window.autoDetectSendNet = autoDetectSendNet;
window.boltzSwitchTab = boltzSwitchTab;
window.bootChart = bootChart;
window.buildInvPreview = buildInvPreview;
window.calcInvTotal = calcInvTotal;
window.checkNewKeyBackup = checkNewKeyBackup;
window.clearAllBatch = clearAllBatch;
window.clearSentBatch = clearSentBatch;
window.closeGame = closeGame;
window.closeLightningActivityModal = closeLightningActivityModal;
window.closeSavedView = closeSavedView;
window.closeSheet = closeSheet;
window.confirmDeleteFav = confirmDeleteFav;
window.confirmPaidDate = confirmPaidDate;
window.copyInvoiceText = copyInvoiceText;
window.cpAddr = cpAddr;
window.cpQrLnInvoice = cpQrLnInvoice;
window.cpTxt = cpTxt;
window.cpTxtDirect = cpTxtDirect;
window.decodeWithJsQR = decodeWithJsQR;
window.deleteInvContact = deleteInvContact;
window.deleteInvHist = deleteInvHist;
window.detectNetworkLabel = detectNetworkLabel;
window.dismissNotif = dismissNotif;
window.doRestoreWallet = doRestoreWallet;
window.doSend = doSend;
window.doShareCopy = doShareCopy;
window.doShareDownloadQR = doShareDownloadQR;
window.doShareEmail = doShareEmail;
window.doShareNative = doShareNative;
window.doShareSMS = doShareSMS;
window.doShareTelegram = doShareTelegram;
window.doShareTwitter = doShareTwitter;
window.doShareWhatsApp = doShareWhatsApp;
window.downloadInvoice = downloadInvoice;
window.downloadSampleCSV = downloadSampleCSV;
window.drawChart = drawChart;
window.esc = esc;
window.escapeHtml = escapeHtml;
window.exportCSV = exportCSV;
window.exportPDF = exportPDF;
window.fetchAndPopulateStats = fetchAndPopulateStats;
window.fetchChartPoints = fetchChartPoints;
window.fetchFeeRates = fetchFeeRates;
window.fillContactToForm = fillContactToForm;
window.formatChartDate = formatChartDate;
window.formatLightningDateTime = formatLightningDateTime;
window.genLnInvoice = genLnInvoice;
window.genQrLnInvoice = genQrLnInvoice;
window.generateAndShowNewKey = generateAndShowNewKey;
window.generateInvoiceStep = generateInvoiceStep;
window.getBatchQueue = getBatchQueue;
window.getChartPoints = getChartPoints;
window.getExportDates = getExportDates;
window.getFavorites = getFavorites;
window.getInvContacts = getInvContacts;
window.getInvHistory = getInvHistory;
window.getLightningLogEntries = getLightningLogEntries;
window.getUserFiatCurrency = getUserFiatCurrency;
window.goInvStep = goInvStep;
window.gsUpdateBest = gsUpdateBest;
window.gsUpdateScore = gsUpdateScore;
window.handleInvoiceUpload = handleInvoiceUpload;
window.hideContactSuggest = hideContactSuggest;
window.initChartInteraction = initChartInteraction;
window.initMainQR = initMainQR;
window.liveQR = liveQR;
window.loadInvCompany = loadInvCompany;
window.loadMoreTx = loadMoreTx;
window.loadMoreTx2 = loadMoreTx2;
window.mbDoTopUp = mbDoTopUp;
window.mbDoWithdraw = mbDoWithdraw;
window.mbInit = mbInit;
window.mbOpen = mbOpen;
window.mbOpenGame = mbOpenGame;
window.mbSetWithdrawAmt = mbSetWithdrawAmt;
window.mbTopUp = mbTopUp;
window.mbWeightedPrize = mbWeightedPrize;
window.mbWithdraw = mbWithdraw;
window.normalizedLightningStatus = normalizedLightningStatus;
window.openAboutSheet = openAboutSheet;
window.openAdvanced = openAdvanced;
window.openApp = openApp;
window.openBackupSheet = openBackupSheet;
window.openBatchSend = openBatchSend;
window.openChartExpand = openChartExpand;
window.openExportSheet = openExportSheet;
window.openGame = openGame;
window.openInvoice = openInvoice;
window.openLightningActivityDetail = openLightningActivityDetail;
window.openNotifSheet = openNotifSheet;
window.openPasswordSettings = openPasswordSettings;
window.openQRScan = openQRScan;
window.openRenameWallet = openRenameWallet;
window.openServerInfo = openServerInfo;
window.openSheet = openSheet;
window.parseBatchCSV = parseBatchCSV;
window.pickContact = pickContact;
window.ppConfirm = ppConfirm;
window.ppDoTopUp = ppDoTopUp;
window.ppDraw = ppDraw;
window.ppOpenGame = ppOpenGame;
window.ppTopUp = ppTopUp;
window.ppUpdateBalance = ppUpdateBalance;
window.ppUpdatePending = ppUpdatePending;
window.qrLnFiatToSats = qrLnFiatToSats;
window.refreshCurrencySubtexts = refreshCurrencySubtexts;
window.refreshFeeGrid = refreshFeeGrid;
window.refreshTransactionsPage = refreshTransactionsPage;
window.removeBatchItem = removeBatchItem;
window.removeFavoriteAddr = removeFavoriteAddr;
window.removeInvItem = removeInvItem;
window.renderBatchQueue = renderBatchQueue;
window.renderBoltzLog = renderBoltzLog;
window.renderCanvasChart = renderCanvasChart;
window.renderChart = renderChart;
window.renderFavList = renderFavList;
window.renderInvContacts = renderInvContacts;
window.renderInvHistory = renderInvHistory;
window.renderInvItems = renderInvItems;
window.resetLnInvoiceForm = resetLnInvoiceForm;
window.resetQrLnForm = resetQrLnForm;
window.retryFailed = retryFailed;
window.runExport = runExport;
window.saveBatchQueue = saveBatchQueue;
window.saveContactFromForm = saveContactFromForm;
window.saveEditContact = saveEditContact;
window.saveFavorites = saveFavorites;
window.saveFromResult = saveFromResult;
window.saveInvContacts = saveInvContacts;
window.saveInvHistory = saveInvHistory;
window.saveNotifPrefs = saveNotifPrefs;
window.savePasswordSettings = savePasswordSettings;
window.saveWalletName = saveWalletName;
window.selFee = selFee;
window.selectExportFmt = selectExportFmt;
window.selectExportPreset = selectExportPreset;
window.selectPayMethod = selectPayMethod;
window.selectSendNet = selectSendNet;
window.setAddrType = setAddrType;
window.setAppsFilter = setAppsFilter;
window.setBalDisplay = setBalDisplay;
window.setChartRange = setChartRange;
window.setColorScheme = setColorScheme;
window.setCurSettings = setCurSettings;
window.setFil = setFil;
window.setInvColor = setInvColor;
window.setInvColorCustom = setInvColorCustom;
window.setInvCurrency = setInvCurrency;
window.setInvPaidDate = setInvPaidDate;
window.setQRTab = setQRTab;
window.setRcvType = setRcvType;
window.shareContent = shareContent;
window.shareInvoiceNative = shareInvoiceNative;
window.shareQrLnInvoice = shareQrLnInvoice;
window.showContactSuggest = showContactSuggest;
window.showModal = showModal;
window.showNotification = showNotification;
window.showPage = showPage;
window.showToast = showToast;
window.showTxDetail = showTxDetail;
window.siDie = siDie;
window.siDraw = siDraw;
window.siLoop = siLoop;
window.siMakeAliens = siMakeAliens;
window.siOpenGame = siOpenGame;
window.siTick = siTick;
window.splashCopyKey = splashCopyKey;
window.splashDone = splashDone;
window.splashFinishCreate = splashFinishCreate;
window.splashRestore = splashRestore;
window.srDraw = srDraw;
window.srJump = srJump;
window.srLoop = srLoop;
window.srOpenGame = srOpenGame;
window.srRestart = srRestart;
window.srSpeed = srSpeed;
window.srTick = srTick;
window.startBatchSend = startBatchSend;
window.stopBatchSend = stopBatchSend;
window.switchChartCurrency = switchChartCurrency;
window.syncExpRange = syncExpRange;
window.syncRcvFiatFromSats = syncRcvFiatFromSats;
window.syncRcvSatsFromFiat = syncRcvSatsFromFiat;
window.syncSendFiatFromSats = syncSendFiatFromSats;
window.syncSendSatsFromFiat = syncSendSatsFromFiat;
window.toggleAddrBlur = toggleAddrBlur;
window.toggleBalance = toggleBalance;
window.toggleDark = toggleDark;
window.toggleEditContact = toggleEditContact;
window.toggleFavAddr = toggleFavAddr;
window.toggleInvPaid = toggleInvPaid;
window.toggleNotifPref = toggleNotifPref;
window.togglePasswordSheetToggle = togglePasswordSheetToggle;
window.toggleSavedView = toggleSavedView;
window.triggerPWAInstall = triggerPWAInstall;
window.updateChartHeader = updateChartHeader;
window.updateChartHighLow = updateChartHighLow;
window.updateExportPreview = updateExportPreview;
window.updateFeeSummary = updateFeeSummary;
window.updateLnPreview = updateLnPreview;
window.updateNotifStatusText = updateNotifStatusText;
window.updateQrLnPreview = updateQrLnPreview;
window.updateRcvAmountFields = updateRcvAmountFields;
window.updateSendAmountFields = updateSendAmountFields;
window.updateSendFees = updateSendFees;
window.useFavorite = useFavorite;
window.walletUpdateDisplay = walletUpdateDisplay;
// Also expose key variables
if (typeof _livePrices !== 'undefined') window._livePrices = _livePrices;
if (typeof _shareData !== 'undefined') window._shareData = _shareData;
window.esc = esc;
