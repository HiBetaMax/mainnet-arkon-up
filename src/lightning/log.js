const STORAGE_KEY = 'arkon_lightning_log_v2';

function nowIso() {
  return new Date().toISOString();
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, 100)));
}

function hasAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text));
}

export function normalizeLightningStatus(status, direction = 'receive') {
  const raw = String(status || '').trim();
  if (!raw) return 'Pending';

  const lower = raw.toLowerCase();
  const isReceive = direction === 'receive';

  const failedPatterns = [
    /fail/,
    /error/,
    /reject/,
    /expired/,
    /cancel/,
    /refund/,
    /timeout/,
    /unable/,
    /abandon/,
  ];
  if (hasAny(lower, failedPatterns)) return 'Failed';

  const pendingPatterns = [
    /pending/,
    /await/,
    /processing/,
    /hold/,
    /created/,
    /invoice ready/,
    /mempool/,
    /broadcast/,
    /unconfirmed/,
    /waiting/,
    /in flight/,
    /inflight/,
    /queued/,
    /lockup/,
    /claim pending/,
    /invoice paid but/,
  ];

  const receiveFinalPatterns = [
    /complete/,
    /completed/,
    /confirmed/,
    /settled/,
    /claimed/,
    /claim(?:ed)? successfully/,
    /success/,
  ];

  const sendFinalPatterns = [
    /complete/,
    /completed/,
    /confirmed/,
    /settled/,
    /claimed/,
    /paid/,
    /sent/,
    /success/,
  ];

  if (hasAny(lower, pendingPatterns)) return 'Pending';

  if (isReceive) {
    if (hasAny(lower, receiveFinalPatterns)) return 'Received';
    if (/(paid|received)/.test(lower)) return 'Pending';
  } else {
    if (hasAny(lower, sendFinalPatterns)) return 'Sent';
  }

  return 'Pending';
}

export function isLightningEntryPending(entry) {
  return normalizeLightningStatus(entry?.status, entry?.direction || entry?.type) === 'Pending';
}

export function isLightningEntryFinal(entry) {
  const normalized = normalizeLightningStatus(entry?.status, entry?.direction || entry?.type);
  return normalized === 'Received' || normalized === 'Sent';
}

export function getLightningLog() {
  return load().sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));
}

export function appendLightningLog(entry) {
  const entries = load();
  const direction = entry.direction || entry.type || 'receive';
  const normalizedStatus = normalizeLightningStatus(entry.status, direction);
  const matchIndex = entries.findIndex((existing) => {
    if (entry.id && existing.id === entry.id) return true;
    if (entry.paymentHash && existing.paymentHash === entry.paymentHash) return true;
    if (entry.invoice && existing.invoice === entry.invoice) return true;
    return false;
  });

  const base = matchIndex >= 0 ? entries[matchIndex] : null;
  const id = entry.id || base?.id || `ln_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const normalized = {
    ...base,
    id,
    direction,
    amountSats: Number(entry.amountSats ?? entry.amount ?? base?.amountSats ?? 0),
    memo: String(entry.memo ?? base?.memo ?? ''),
    status: normalizedStatus,
    rawStatus: String(entry.status ?? base?.rawStatus ?? normalizedStatus),
    paymentHash: entry.paymentHash || base?.paymentHash || null,
    provider: entry.provider || base?.provider || 'Boltz',
    kind: entry.kind || base?.kind || 'submarine',
    invoice: entry.invoice || base?.invoice || null,
    txid: entry.txid || base?.txid || null,
    createdAt: base?.createdAt || entry.createdAt || nowIso(),
    updatedAt: nowIso(),
  };

  if (matchIndex >= 0) {
    entries.splice(matchIndex, 1);
  }
  entries.unshift(normalized);
  save(entries);
  return normalized;
}

export function updateLightningLog(match, patch) {
  const entries = load();
  const idx = entries.findIndex((entry) => {
    if (match.id && entry.id === match.id) return true;
    if (match.paymentHash && entry.paymentHash === match.paymentHash) return true;
    if (match.invoice && entry.invoice === match.invoice) return true;
    return false;
  });
  if (idx === -1) return null;
  const direction = patch.direction || entries[idx].direction || 'receive';
  const merged = { ...entries[idx], ...patch, updatedAt: nowIso() };
  merged.rawStatus = String(patch.status ?? merged.rawStatus ?? merged.status ?? '');
  merged.status = normalizeLightningStatus(merged.status, direction);
  entries[idx] = merged;
  save(entries);
  return entries[idx];
}

export function summarizeLightningLog() {
  return getLightningLog().reduce((acc, entry) => {
    acc.count += 1;
    const amount = Number(entry.amountSats || 0);
    const direction = entry.direction || entry.type || 'receive';
    if (isLightningEntryPending(entry)) acc.pending += 1;
    if (isLightningEntryFinal(entry) && direction === 'receive') acc.receivedSats += amount;
    if (isLightningEntryFinal(entry) && direction === 'send') acc.sentSats += amount;
    if (normalizeLightningStatus(entry?.status, direction) === 'Failed') acc.failed += 1;
    return acc;
  }, { count: 0, receivedSats: 0, sentSats: 0, pending: 0, failed: 0 });
}
