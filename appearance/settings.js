// ══════════════════════════════════════════════════
//  SETTINGS — widgets, display size, keyboard shortcuts
//  Depends on: appearanceOpen (appearance.js)
//              closePetSelector, selectorOpen (main script)
// ══════════════════════════════════════════════════
let settingsPanelOpen = false;
const SETTINGS_KEY = 'widgetSettings';

// ── Display size ──
// Use the actual wallpaper canvas size (window.innerWidth/Height in Lively).
// User can override via settings if needed.
function detectDisplayWidth() {
  return window.innerWidth || screen.width || 1920;
}
function detectDisplayHeight() {
  return window.innerHeight || screen.height || 1080;
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

const WIDGET_TOGGLES = [
  ['clock',      'clock-widget'],
  ['hw',         'hw-panel'],
  ['chat',       'chat-panel'],
  ['chat',       'chat-bubble-btn'],
  ['bubble',     'pill-row'],
  ['weather',    'weather-widget'],
  ['calendar',   'calendar-widget'],
  ['todo',       'todo-widget'],
  ['pomodoro',   'pomodoro-widget'],
  ['timer',      'timer-widget'],
  ['habits',     'habits-widget'],
  ['worldclock', 'worldclock-widget'],
  ['quote',      'quote-widget'],
  ['countdown',  'countdown-widget'],
  ['sticky',     'sticky-widget'],
  ['quicklinks', 'quicklinks-widget'],
  ['network',    'network-widget'],
  ['processes',  'processes-widget'],
  ['battery',    'battery-widget'],
  ['nowplaying', 'nowplaying-widget'],
];

function applySettings() {
  const s = {};
  WIDGET_TOGGLES.forEach(([key]) => {
    const el = document.getElementById('tog-' + key);
    if (el) s[key] = el.checked;
  });
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  WIDGET_TOGGLES.forEach(([key, elId]) => {
    const el = document.getElementById(elId);
    if (!el) return;
    if (s[key] === false) {
      el.style.display = 'none';
    } else {
      el.style.display = '';
      // Restore .visible for widgets that use opacity-based visibility
      // so they re-appear when re-enabled in settings
      el.classList.add('visible');
    }
  });
}

function initSettings() {
  const s = loadSettings();
  WIDGET_TOGGLES.forEach(([key]) => {
    if (s[key] !== undefined) {
      const tog = document.getElementById('tog-' + key);
      if (tog) tog.checked = s[key];
    }
  });
  applySettings();
  initDayNight();
}

function switchSettingsTab(tab) {
  document.querySelectorAll('.stab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
  const pane = document.getElementById('stab-' + tab);
  if (pane) pane.classList.add('active');
  const btn = document.querySelector(`.stab[onclick*="${tab}"]`);
  if (btn) btn.classList.add('active');
  if (typeof _updateSettingsArrows === 'function') setTimeout(_updateSettingsArrows, 50);
}

function toggleSettings() {
  settingsPanelOpen = !settingsPanelOpen;
  document.getElementById('settings-panel').classList.toggle('open', settingsPanelOpen);
  if (settingsPanelOpen) {
    const wi = document.getElementById('display-w-input');
    if (wi) wi.value = displayW;
    const hi = document.getElementById('display-h-input');
    if (hi) hi.value = displayH;
    if (typeof _updateSettingsArrows === 'function') setTimeout(_updateSettingsArrows, 50);
  }
}

// ── Day / Night mode ──────────────────────────────
const DN_KEY = 'ambiance';
let _dnAuto = false;
let _autoCheckTimer = null;

function _isDayHour() {
  const hr = new Date().getHours();
  return hr >= 6 && hr < 18;
}

function setDayNight(isDay, save = true) {
  _dayNightTarget = isDay ? 1 : 0;
  const btn = document.getElementById('dn-btn');
  if (btn) btn.textContent = isDay ? '☀️' : '🌙';
  const tog = document.getElementById('tog-dn');
  if (tog) tog.checked = isDay;
  if (save) {
    localStorage.setItem(DN_KEY, JSON.stringify({ isDay, auto: _dnAuto }));
  }
}

function toggleDayNight() {
  // Called by the "Day mode" checkbox onchange
  const tog = document.getElementById('tog-dn');
  const isDay = tog ? tog.checked : _dayNightTarget < 0.5;
  _dnAuto = false;
  const autoCk = document.getElementById('tog-dn-auto');
  if (autoCk) autoCk.checked = false;
  setDayNight(isDay);
}

function setDayNightAuto(auto) {
  _dnAuto = auto;
  if (auto) setDayNight(_isDayHour(), false);
  const stored = JSON.parse(localStorage.getItem(DN_KEY) || '{}');
  stored.auto = auto;
  localStorage.setItem(DN_KEY, JSON.stringify(stored));
}

function initDayNight() {
  try {
    const cfg = JSON.parse(localStorage.getItem(DN_KEY)) || {};
    _dnAuto = !!cfg.auto;
    const autoCk = document.getElementById('tog-dn-auto');
    if (autoCk) autoCk.checked = _dnAuto;
    const isDay = _dnAuto ? _isDayHour() : !!cfg.isDay;
    // Set blend immediately (no animation on load)
    dayNightBlend = isDay ? 1 : 0;
    _dayNightTarget = dayNightBlend;
    const btn = document.getElementById('dn-btn');
    if (btn) btn.textContent = isDay ? '☀️' : '🌙';
    const tog = document.getElementById('tog-dn');
    if (tog) tog.checked = isDay;
  } catch(e) {}

  // Check every minute if auto is on
  _autoCheckTimer = setInterval(() => {
    if (_dnAuto) setDayNight(_isDayHour(), false);
  }, 60 * 1000);
}

// ── Keyboard shortcut: Ctrl+, opens settings ──
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === ',') { e.preventDefault(); toggleSettings(); }
  if (e.key === 'Escape') {
    if (helpOpen) closeHelp();
    else if (appearanceOpen) closeAppearance();
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
