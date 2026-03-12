// ══════════════════════════════════════════════════
//  PERSIST MANAGER
//  Syncs localStorage ↔ bridge state.json file
//  Loaded BEFORE all widgets so state is restored
//  before any widget init runs.
// ══════════════════════════════════════════════════

const PERSIST_KEYS = [
  'pixelTodos', 'widgetSettings', 'displayW', 'displayH',
  'ambiance', 'widgetPositions', 'petBehaviorConfig',
  'appearanceSettings', 'pixelSticky', 'pixelHabits',
  'pixelPomodoro', 'pixelCountdowns', 'pixelQuickLinks',
  'pixelWorldClocks', 'weatherManualCity', 'selectedPet'
];

let _persistReady = false;
let _persistPaused = false;   // true during factory reset
let _persistTimer = null;

// Debounced save — waits 800ms after last change, then POSTs all keys
function _persistSave() {
  clearTimeout(_persistTimer);
  _persistTimer = setTimeout(() => {
    if (_persistPaused) return;
    const state = {};
    PERSIST_KEYS.forEach(k => {
      const v = localStorage.getItem(k);
      if (v !== null) state[k] = v;
    });
    fetch(`${BRIDGE_URL}/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state)
    }).catch(() => {});
  }, 800);
}

// Monkey-patch localStorage.setItem to auto-sync tracked keys
const _origSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = function(key, value) {
  _origSetItem(key, value);
  if (_persistReady && !_persistPaused && PERSIST_KEYS.includes(key)) {
    _persistSave();
  }
};

// Also patch removeItem
const _origRemoveItem = localStorage.removeItem.bind(localStorage);
localStorage.removeItem = function(key) {
  _origRemoveItem(key);
  if (_persistReady && !_persistPaused && PERSIST_KEYS.includes(key)) {
    _persistSave();
  }
};

// Restore state from bridge on startup
async function _persistRestore() {
  // Skip restore if we just did a factory reset (flag set by resetLayout)
  if (localStorage.getItem('_justReset')) {
    localStorage.removeItem('_justReset');
    console.log('[Persist] Skipping restore — factory reset');
    // Push clean state TO bridge (since sendBeacon may not have arrived yet)
    const clean = {};
    PERSIST_KEYS.forEach(k => {
      const v = localStorage.getItem(k);
      if (v !== null) clean[k] = v;
    });
    fetch(`${BRIDGE_URL}/state`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clean)
    }).catch(() => {});
    return;
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`${BRIDGE_URL}/state`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return;
    const state = await res.json();
    if (!state || typeof state !== 'object') return;
    let restored = 0;
    Object.keys(state).forEach(k => {
      if (PERSIST_KEYS.includes(k) && state[k] !== undefined) {
        _origSetItem(k, state[k]);
        restored++;
      }
    });
    if (restored > 0) console.log(`[Persist] Restored ${restored} keys from bridge`);
  } catch {
    console.log('[Persist] Bridge not available, using localStorage only');
  }
}
