// ══════════════════════════════════════════════════
//  SETTINGS — widgets, display size, keyboard shortcuts
//  Depends on: appearanceOpen (appearance.js)
//              closePetSelector, selectorOpen (main script)
// ══════════════════════════════════════════════════
let settingsPanelOpen = false;
const SETTINGS_KEY = 'widgetSettings';

// ── Display size (span / multi-monitor support) ──
// Auto-detect single-monitor width even in span mode.
function detectDisplayWidth() {
  const saved = parseInt(localStorage.getItem('displayW'));
  const heuristic = Math.min(window.innerWidth, Math.round(window.screen.height * 16 / 9));
  if (saved && saved < window.innerWidth) return saved;
  return heuristic || 1920;
}
function detectDisplayHeight() {
  const saved = parseInt(localStorage.getItem('displayH'));
  if (saved) return saved;
  return Math.min(window.innerHeight, window.screen.height) || 1080;
}
let displayW = detectDisplayWidth();
let displayH = detectDisplayHeight();

function setDisplayWidth(w) {
  displayW = Math.max(800, Math.min(7680, w || displayW));
  localStorage.setItem('displayW', displayW);
  document.documentElement.style.setProperty('--primary-w', displayW + 'px');
  const inp = document.getElementById('display-w-input');
  if (inp) inp.value = displayW;
}
function setDisplayHeight(h) {
  displayH = Math.max(400, Math.min(4320, h || displayH));
  localStorage.setItem('displayH', displayH);
  document.documentElement.style.setProperty('--primary-h', displayH + 'px');
  const inp = document.getElementById('display-h-input');
  if (inp) inp.value = displayH;
}
function resetDisplaySize() {
  localStorage.removeItem('displayW');
  localStorage.removeItem('displayH');
  setDisplayWidth(detectDisplayWidth());
  setDisplayHeight(detectDisplayHeight());
}

// ── Widget toggles ──
function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch(e) { return {}; }
}

function applySettings() {
  const s = {
    clock:  document.getElementById('tog-clock').checked,
    hw:     document.getElementById('tog-hw').checked,
    chat:   document.getElementById('tog-chat').checked,
    bubble: document.getElementById('tog-bubble').checked,
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  document.getElementById('clock-widget').style.display = s.clock ? '' : 'none';
  document.getElementById('hw-panel').style.display     = s.hw    ? '' : 'none';
  document.getElementById('chat-panel').style.display      = s.chat ? '' : 'none';
  document.getElementById('chat-bubble-btn').style.display = s.chat ? '' : 'none';
  document.getElementById('pill-row').style.display = s.bubble ? '' : 'none';
}

function initSettings() {
  const s = loadSettings();
  if (s.clock  === false) document.getElementById('tog-clock').checked  = false;
  if (s.hw     === false) document.getElementById('tog-hw').checked     = false;
  if (s.chat   === false) document.getElementById('tog-chat').checked   = false;
  if (s.bubble === false) document.getElementById('tog-bubble').checked = false;
  applySettings();
}

function toggleSettings() {
  settingsPanelOpen = !settingsPanelOpen;
  document.getElementById('settings-panel').classList.toggle('open', settingsPanelOpen);
  if (settingsPanelOpen) {
    const wi = document.getElementById('display-w-input');
    if (wi) wi.value = displayW;
    const hi = document.getElementById('display-h-input');
    if (hi) hi.value = displayH;
  }
}

// ── Keyboard shortcut: Ctrl+, opens settings ──
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === ',') { e.preventDefault(); toggleSettings(); }
  if (e.key === 'Escape') {
    if (appearanceOpen) closeAppearance();
    else if (selectorOpen) closePetSelector();
    else if (settingsPanelOpen) { settingsPanelOpen = false; document.getElementById('settings-panel').classList.remove('open'); }
  }
});

// ── Click outside to close settings panel ──
document.addEventListener('click', e => {
  if (settingsPanelOpen &&
      !e.target.closest('#settings-panel') &&
      !e.target.closest('#settings-btn')) {
    settingsPanelOpen = false;
    document.getElementById('settings-panel').classList.remove('open');
  }
});
