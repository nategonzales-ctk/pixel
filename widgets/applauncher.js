// ══════════════════════════════════════════════════
//  APP LAUNCHER — Floating desktop objects
//  Each app shortcut is a draggable object on the
//  wallpaper. Double-click to launch, right-click
//  to configure. Positions are saved per-item.
// ══════════════════════════════════════════════════
const APPS_KEY = 'pixelApps';
const APPS_POS_KEY = 'pixelAppsPos';
const APPS_MAX = 12;
let _apps = [];
let _appsPos = {};  // { idx: { x, y } }

const APP_PRESETS = [
  { icon: '📖', label: 'Book' },
  { icon: '📱', label: 'Phone' },
  { icon: '💻', label: 'Tablet' },
  { icon: '🎮', label: 'Games' },
  { icon: '🎵', label: 'Music' },
  { icon: '📧', label: 'Mail' },
  { icon: '📷', label: 'Camera' },
  { icon: '🌐', label: 'Browser' },
  { icon: '📁', label: 'Files' },
  { icon: '💬', label: 'Chat' },
  { icon: '🎬', label: 'Video' },
  { icon: '📝', label: 'Notes' },
];

function _appsLoad() {
  try { _apps = JSON.parse(localStorage.getItem(APPS_KEY)) || []; } catch { _apps = []; }
  try { _appsPos = JSON.parse(localStorage.getItem(APPS_POS_KEY)) || {}; } catch { _appsPos = {}; }
}
function _appsSave() {
  localStorage.setItem(APPS_KEY, JSON.stringify(_apps));
}
function _appsPosSave() {
  localStorage.setItem(APPS_POS_KEY, JSON.stringify(_appsPos));
}

// ── Render floating objects ──
function _appsRender() {
  // Remove old floating objects
  document.querySelectorAll('.app-object').forEach(el => el.remove());

  _apps.forEach((app, i) => {
    const obj = document.createElement('div');
    obj.className = 'app-object';
    obj.id = 'app-obj-' + i;
    obj.title = app.path ? `Double-click: ${app.label}` : 'Right-click to configure';

    // Position
    const pos = _appsPos[i] || { x: 60 + (i % 4) * 90, y: 500 + Math.floor(i / 4) * 100 };
    obj.style.left = pos.x + 'px';
    obj.style.top = pos.y + 'px';

    // Icon
    const icon = document.createElement('span');
    icon.className = 'app-obj-icon';
    icon.textContent = app.icon || '📁';

    // Label
    const label = document.createElement('span');
    label.className = 'app-obj-label';
    label.textContent = app.label;

    // Delete button (appears on hover)
    const del = document.createElement('button');
    del.className = 'app-obj-del';
    del.textContent = '✕';
    del.title = 'Remove';
    del.onclick = e => { e.stopPropagation(); appDelete(i); };

    // No-config indicator
    if (!app.path) {
      const dot = document.createElement('span');
      dot.className = 'app-obj-nocfg';
      obj.appendChild(dot);
    }

    obj.appendChild(icon);
    obj.appendChild(label);
    obj.appendChild(del);
    document.body.appendChild(obj);

    // ── Double-click to launch ──
    obj.ondblclick = e => {
      e.preventDefault();
      if (app.path) _appLaunch(app);
      else _appConfig(i);
    };

    // ── Right-click to configure ──
    obj.oncontextmenu = e => { e.preventDefault(); _appConfig(i); };

    // ── Drag to move ──
    _makeAppDraggable(obj, i);
  });
}

// ── Dragging ──
let _appDragEl = null, _appDragI = -1, _appDragOX = 0, _appDragOY = 0;
let _appDragMoved = false;

function _makeAppDraggable(el, idx) {
  el.addEventListener('mousedown', e => {
    if (e.button !== 0) return;  // left click only
    if (e.target.classList.contains('app-obj-del')) return;
    e.preventDefault();
    _appDragEl = el;
    _appDragI = idx;
    _appDragMoved = false;
    const rect = el.getBoundingClientRect();
    _appDragOX = e.clientX - rect.left;
    _appDragOY = e.clientY - rect.top;
    el.style.zIndex = '500';
    el.classList.add('app-obj-dragging');
  });
}

document.addEventListener('mousemove', e => {
  if (!_appDragEl) return;
  _appDragMoved = true;
  const x = e.clientX - _appDragOX;
  const y = e.clientY - _appDragOY;
  _appDragEl.style.left = x + 'px';
  _appDragEl.style.top = y + 'px';
});

document.addEventListener('mouseup', () => {
  if (!_appDragEl) return;
  _appDragEl.style.zIndex = '';
  _appDragEl.classList.remove('app-obj-dragging');
  if (_appDragMoved) {
    _appsPos[_appDragI] = {
      x: parseInt(_appDragEl.style.left),
      y: parseInt(_appDragEl.style.top),
    };
    _appsPosSave();
  }
  _appDragEl = null;
  _appDragI = -1;
});

// ── Add form (in settings panel) ──
function _appShowAddForm() {
  const form = document.getElementById('apps-form');
  if (!form) return;
  const visible = form.style.display !== 'none';
  form.style.display = visible ? 'none' : 'flex';
  if (!visible) _renderPresets();
}

function _renderPresets() {
  const row = document.getElementById('apps-presets');
  if (!row) return;
  row.innerHTML = '';
  APP_PRESETS.forEach(p => {
    if (_apps.some(a => a.icon === p.icon && a.label === p.label)) return;
    const btn = document.createElement('button');
    btn.className = 'apps-preset-btn';
    btn.textContent = p.icon;
    btn.title = p.label;
    btn.onclick = () => {
      document.getElementById('apps-icon-inp').value = p.icon;
      document.getElementById('apps-label-inp').value = p.label;
      document.getElementById('apps-path-inp').focus();
    };
    row.appendChild(btn);
  });
}

// ── Browse for app via native file picker ──
let _browsing = false;
async function _appBrowse(targetInputId) {
  if (_browsing) return;
  _browsing = true;
  if (typeof showBubble === 'function') showBubble('Opening file picker...', 2000);
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 120000);
    const res = await fetch(`${BRIDGE_URL}/browse`, { signal: ctrl.signal });
    clearTimeout(timer);
    const data = await res.json();
    if (data.path) {
      const inp = document.getElementById(targetInputId);
      if (inp) { inp.value = data.path; inp.focus(); }
      if (typeof showBubble === 'function') showBubble('App selected!', 2000);
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      if (typeof showBubble === 'function') showBubble('File picker timed out', 3000);
    } else {
      if (typeof showBubble === 'function') showBubble('Bridge not available — start bridge first!', 3500);
    }
  } finally {
    _browsing = false;
  }
}

// ── Config dialog ──
let _configIdx = -1;
function _appConfig(i) {
  const app = _apps[i];
  if (!app) return;
  _configIdx = i;

  let overlay = document.getElementById('apps-config-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'apps-config-overlay';
    overlay.innerHTML = `
      <div class="apps-config-box">
        <div class="apps-config-title">Configure App</div>
        <div class="apps-config-row">
          <label>Icon</label>
          <input id="apps-cfg-icon" class="w-inp" type="text" maxlength="4" style="width:50px">
        </div>
        <div class="apps-config-row">
          <label>Label</label>
          <input id="apps-cfg-label" class="w-inp" type="text" maxlength="24">
        </div>
        <div class="apps-config-row">
          <label>App Path</label>
          <input id="apps-cfg-path" class="w-inp" type="text" maxlength="260" placeholder="C:\\...\\app.exe">
          <button class="w-btn apps-browse-btn" onclick="_appBrowse('apps-cfg-path')" title="Browse...">📂</button>
        </div>
        <div class="apps-config-row" style="gap:6px;justify-content:flex-end">
          <button class="w-btn" onclick="_appConfigSave()">Save</button>
          <button class="w-btn" onclick="_appConfigClose()" style="opacity:0.6">Cancel</button>
        </div>
      </div>
    `;
    overlay.onclick = e => { if (e.target === overlay) _appConfigClose(); };
    document.body.appendChild(overlay);
  }

  document.getElementById('apps-cfg-icon').value = app.icon || '';
  document.getElementById('apps-cfg-label').value = app.label || '';
  document.getElementById('apps-cfg-path').value = app.path || '';
  overlay.style.display = 'flex';
  document.getElementById('apps-cfg-path').focus();
}

function _appConfigSave() {
  if (_configIdx < 0 || !_apps[_configIdx]) return;
  const icon  = document.getElementById('apps-cfg-icon').value.trim();
  const label = document.getElementById('apps-cfg-label').value.trim();
  const path  = document.getElementById('apps-cfg-path').value.trim();
  if (!label) return;
  _apps[_configIdx].icon  = icon || '📁';
  _apps[_configIdx].label = label;
  _apps[_configIdx].path  = path;
  _appsSave();
  _appsRender();
  _appConfigClose();
  if (typeof showBubble === 'function') showBubble('App configured!', 2000);
}

function _appConfigClose() {
  const overlay = document.getElementById('apps-config-overlay');
  if (overlay) overlay.style.display = 'none';
  _configIdx = -1;
}

// ── Launch ──
async function _appLaunch(app) {
  try {
    const res = await fetch(`${BRIDGE_URL}/launch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: app.path })
    });
    const data = await res.json();
    if (res.ok) {
      if (typeof showBubble === 'function') {
        showBubble(`Opening ${app.label}! ${app.icon}`, 2500);
        setMood('excited', 2000);
      }
    } else {
      if (typeof showBubble === 'function') showBubble('Could not launch: ' + (data.error || 'unknown'), 3500);
    }
  } catch {
    if (typeof showBubble === 'function') showBubble('Bridge not available — start bridge first!', 3500);
  }
}

// ── Add / Delete ──
function appAdd() {
  const iconInp = document.getElementById('apps-icon-inp');
  const lblInp  = document.getElementById('apps-label-inp');
  const pathInp = document.getElementById('apps-path-inp');
  if (!lblInp || !lblInp.value.trim()) return;
  _apps.push({
    icon:  iconInp?.value.trim() || '📁',
    label: lblInp.value.trim(),
    path:  pathInp?.value.trim() || ''
  });
  if (iconInp) iconInp.value = '';
  lblInp.value = '';
  if (pathInp) pathInp.value = '';
  _appsSave();
  _appsRender();
  const form = document.getElementById('apps-form');
  if (form) form.style.display = 'none';
  if (typeof showBubble === 'function') {
    showBubble('App shortcut added!', 3000);
    setMood('happy', 2500);
  }
}

function appDelete(i) {
  _apps.splice(i, 1);
  // Shift positions
  const newPos = {};
  Object.keys(_appsPos).forEach(k => {
    const ki = parseInt(k);
    if (ki < i) newPos[ki] = _appsPos[ki];
    else if (ki > i) newPos[ki - 1] = _appsPos[ki];
  });
  _appsPos = newPos;
  _appsSave();
  _appsPosSave();
  _appsRender();
}

function initAppLauncher() {
  _appsLoad();
  _appsRender();
  const pathInp = document.getElementById('apps-path-inp');
  if (pathInp) pathInp.addEventListener('keydown', e => { if (e.key === 'Enter') appAdd(); });
}
