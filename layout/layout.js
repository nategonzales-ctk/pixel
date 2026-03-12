// ══════════════════════════════════════════════════
//  WIDGET LAYOUT — move & resize with grid snapping
//  Resize uses CSS transform:scale so content scales
//  proportionally (fixes clock font, hw-panel text).
//  To add a new draggable widget: push its ID to WIDGET_IDS.
// ══════════════════════════════════════════════════
const LAYOUT_KEY  = 'widgetPositions';
const GRID        = 20;
const MIN_VW      = 60;   // minimum visual width  (px)
const MIN_VH      = 36;   // minimum visual height (px)
const WIDGET_IDS  = ['clock-widget', 'hw-panel', 'chat-bubble-btn', 'chat-panel', 'settings-btn', 'open-pet-selector', 'dn-btn', 'mode-indicator', 'weather-widget', 'calendar-widget', 'todo-widget', 'pomodoro-widget', 'timer-widget', 'habits-widget', 'worldclock-widget', 'quote-widget', 'countdown-widget', 'sticky-widget', 'quicklinks-widget', 'network-widget', 'processes-widget', 'battery-widget', 'nowplaying-widget'];
const HANDLE_DIRS = ['nw','n','ne','e','se','s','sw','w'];
// Widgets that resize via real width/height (text reflows) instead of transform:scale
const REFLOW_IDS  = new Set(['chat-panel', 'todo-widget', 'sticky-widget', 'habits-widget', 'quicklinks-widget', 'countdown-widget', 'worldclock-widget']);

let layoutMode = false;
let gridCanvas = null;

// Move state
let dragEl   = null;
let dragOffX = 0, dragOffY = 0;

// Resize state
let resizeEl      = null;
let resizeDir     = '';
let resizeStartX  = 0, resizeStartY  = 0;
let resizeNatW    = 0, resizeNatH    = 0;   // natural (unscaled) offsetWidth/Height
let resizeStartVX = 0, resizeStartVY = 0;   // visual rect at drag start
let resizeStartVW = 0, resizeStartVH = 0;
let resizeOverlay = null;

// Overlay registry: widget id → overlay div
const _overlayMap = {};

// ── Init ──────────────────────────────────────────
let layoutToolbar = null;

function _createToolbar() {
  const bar = document.createElement('div');
  bar.id = 'layout-toolbar';
  bar.style.cssText = [
    'position:fixed', 'top:18px', 'left:50%', 'transform:translateX(-50%)',
    'z-index:1002', 'display:none', 'align-items:center', 'gap:10px',
    'background:rgba(13,13,26,0.95)', 'border:1px solid rgba(217,102,255,0.38)',
    'border-radius:999px', 'padding:8px 20px',
    'backdrop-filter:blur(16px)', 'box-shadow:0 4px 28px rgba(217,102,255,0.25)',
    'font-family:Nunito,sans-serif',
  ].join(';');

  const label = document.createElement('span');
  label.textContent = '⊞ Layout Edit';
  label.style.cssText = 'font-size:10px;font-weight:900;letter-spacing:0.16em;text-transform:uppercase;color:rgba(217,102,255,0.8);';

  const sep = document.createElement('span');
  sep.style.cssText = 'width:1px;height:14px;background:rgba(217,102,255,0.25);';

  const doneBtn = document.createElement('button');
  doneBtn.textContent = '✓ Done';
  doneBtn.style.cssText = [
    'font-family:Nunito,sans-serif', 'font-size:11px', 'font-weight:900',
    'letter-spacing:0.1em', 'text-transform:uppercase',
    'padding:5px 16px', 'border-radius:999px',
    'border:1.5px solid var(--accent)', 'background:rgba(217,102,255,0.15)',
    'color:var(--accent)', 'cursor:pointer', 'transition:background 0.15s',
  ].join(';');
  doneBtn.onmouseenter = () => doneBtn.style.background = 'rgba(217,102,255,0.3)';
  doneBtn.onmouseleave = () => doneBtn.style.background = 'rgba(217,102,255,0.15)';
  doneBtn.onclick = toggleLayoutMode;

  const resetBtn = document.createElement('button');
  resetBtn.textContent = '↺ Reset';
  resetBtn.style.cssText = [
    'font-family:Nunito,sans-serif', 'font-size:11px', 'font-weight:900',
    'letter-spacing:0.1em', 'text-transform:uppercase',
    'padding:5px 14px', 'border-radius:999px',
    'border:1.5px solid rgba(238,238,255,0.2)', 'background:none',
    'color:rgba(238,238,255,0.45)', 'cursor:pointer', 'transition:color 0.15s,border-color 0.15s',
  ].join(';');
  resetBtn.onmouseenter = () => { resetBtn.style.color = '#fff'; resetBtn.style.borderColor = 'rgba(238,238,255,0.5)'; };
  resetBtn.onmouseleave = () => { resetBtn.style.color = 'rgba(238,238,255,0.45)'; resetBtn.style.borderColor = 'rgba(238,238,255,0.2)'; };
  resetBtn.onclick = resetLayout;

  bar.appendChild(label);
  bar.appendChild(sep);
  bar.appendChild(doneBtn);
  bar.appendChild(resetBtn);
  document.body.appendChild(bar);
  return bar;
}

function initLayout() {
  gridCanvas = document.createElement('canvas');
  gridCanvas.id = 'layout-grid-canvas';
  gridCanvas.style.cssText = [
    'position:fixed', 'inset:0', 'width:100%', 'height:100%',
    'z-index:28', 'pointer-events:none', 'display:none',
  ].join(';');
  document.body.appendChild(gridCanvas);

  layoutToolbar = _createToolbar();

  // Attach move listeners to each widget
  WIDGET_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('mousedown', e => {
      if (!layoutMode) return;
      if (e.target.classList.contains('layout-resize-handle')) return;
      e.preventDefault(); e.stopPropagation();
      dragEl = el;
      const r = el.getBoundingClientRect();
      dragOffX = e.clientX - r.left;
      dragOffY = e.clientY - r.top;
    });
    // Suppress onclick / href / etc. while in layout mode (capture phase)
    el.addEventListener('click', e => {
      if (layoutMode) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  });

  document.addEventListener('mousemove', _onMouseMove);
  document.addEventListener('mouseup',   _onMouseUp);

  _applyAllPositions();
}

function _onMouseMove(e) {
  if (dragEl) {
    dragEl.style.left = (e.clientX - dragOffX) + 'px';
    dragEl.style.top  = (e.clientY - dragOffY) + 'px';
    _syncOverlay(dragEl);
    return;
  }
  if (!resizeEl || !resizeOverlay) return;

  const dx = e.clientX - resizeStartX;
  const dy = e.clientY - resizeStartY;

  // Compute new visual rect based on resize direction
  let vx = resizeStartVX, vy = resizeStartVY;
  let vw = resizeStartVW, vh = resizeStartVH;

  if (resizeDir.includes('e')) vw = Math.max(MIN_VW, resizeStartVW + dx);
  if (resizeDir.includes('s')) vh = Math.max(MIN_VH, resizeStartVH + dy);
  if (resizeDir.includes('w')) { vw = Math.max(MIN_VW, resizeStartVW - dx); vx = resizeStartVX + resizeStartVW - vw; }
  if (resizeDir.includes('n')) { vh = Math.max(MIN_VH, resizeStartVH - dy); vy = resizeStartVY + resizeStartVH - vh; }

  // Snap to grid
  vx = Math.round(vx / GRID) * GRID;
  vy = Math.round(vy / GRID) * GRID;
  vw = Math.max(GRID, Math.round(vw / GRID) * GRID);
  vh = Math.max(GRID, Math.round(vh / GRID) * GRID);

  resizeEl.style.left = vx + 'px';
  resizeEl.style.top  = vy + 'px';
  if (REFLOW_IDS.has(resizeEl.id)) {
    // Real width/height so text reflows instead of shrinking
    resizeEl.style.width     = vw + 'px';
    resizeEl.style.maxHeight = vh + 'px';
    resizeEl.style.height    = vh + 'px';
    resizeEl.style.transform = 'none';
  } else {
    const sx = vw / resizeNatW;
    const sy = vh / resizeNatH;
    resizeEl.style.transformOrigin = 'top left';
    resizeEl.style.transform       = `scaleX(${sx}) scaleY(${sy})`;
  }

  // Keep overlay aligned with new visual rect
  resizeOverlay.style.left   = vx + 'px';
  resizeOverlay.style.top    = vy + 'px';
  resizeOverlay.style.width  = vw + 'px';
  resizeOverlay.style.height = vh + 'px';
}

function _onMouseUp() {
  if (dragEl) {
    let x = Math.round(parseFloat(dragEl.style.left) / GRID) * GRID;
    let y = Math.round(parseFloat(dragEl.style.top)  / GRID) * GRID;
    const vr = dragEl.getBoundingClientRect();
    x = Math.max(0, Math.min(window.innerWidth  - vr.width,  x));
    y = Math.max(0, Math.min(window.innerHeight - vr.height, y));
    dragEl.style.left = x + 'px';
    dragEl.style.top  = y + 'px';
    _syncOverlay(dragEl);
    _savePos(dragEl.id, x, y);
    dragEl = null;
  }
  if (resizeEl && resizeOverlay) {
    let vx = parseFloat(resizeOverlay.style.left)   || 0;
    let vy = parseFloat(resizeOverlay.style.top)    || 0;
    let vw = parseFloat(resizeOverlay.style.width)  || resizeStartVW;
    let vh = parseFloat(resizeOverlay.style.height) || resizeStartVH;
    vx = Math.max(0, Math.min(window.innerWidth  - vw, vx));
    vy = Math.max(0, Math.min(window.innerHeight - vh, vy));
    resizeEl.style.left = vx + 'px';
    resizeEl.style.top  = vy + 'px';
    if (REFLOW_IDS.has(resizeEl.id)) {
      resizeEl.style.width     = vw + 'px';
      resizeEl.style.maxHeight = vh + 'px';
      resizeEl.style.height    = vh + 'px';
      resizeEl.style.transform = 'none';
      // Store w/h as sx/sy (reinterpreted on restore)
      _saveScale(resizeEl.id, vx, vy, vw, vh);
    } else {
      const sx = vw / resizeNatW;
      const sy = vh / resizeNatH;
      resizeEl.style.transform = `scaleX(${sx}) scaleY(${sy})`;
      _saveScale(resizeEl.id, vx, vy, sx, sy);
    }
    resizeOverlay.style.left = vx + 'px';
    resizeOverlay.style.top  = vy + 'px';
    resizeEl      = null;
    resizeOverlay = null;
    // Update widget body scroll arrows after resize
    if (typeof _updateAllWpArrows === 'function') setTimeout(_updateAllWpArrows, 50);
  }
}

// ── Toggle layout edit mode ───────────────────────
function toggleLayoutMode() {
  layoutMode = !layoutMode;
  const btn = document.getElementById('layout-edit-btn');

  if (layoutMode) {
    WIDGET_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (!el || el.style.display === 'none') return;
      // Skip elements hidden by opacity (e.g. chat-panel, settings-panel)
      const cs = window.getComputedStyle(el);
      if (cs.opacity === '0' || cs.visibility === 'hidden') return;
      // Add class FIRST — its transition:none !important stops any active CSS
      // transition before we read getBoundingClientRect() or change the transform.
      el.classList.add('layout-drag-mode');
      // getBoundingClientRect() forces a synchronous reflow, applying the class
      // so transition:none is active.  r now reflects the settled visual position.
      const r = el.getBoundingClientRect();
      // Preserve existing visual scale (handles elements with CSS transforms)
      const sx = r.width  / (el.offsetWidth  || 1);
      const sy = r.height / (el.offsetHeight || 1);
      el.style.left            = r.left + 'px';
      el.style.top             = r.top  + 'px';
      el.style.right           = 'auto'; // 'auto' overrides CSS bottom/right rules
      el.style.bottom          = 'auto'; // '' would only clear inline, letting CSS rule stretch the element
      el.style.transformOrigin = 'top left';
      el.style.transform       = `scaleX(${sx}) scaleY(${sy})`;
      _createOverlay(el);
    });
    gridCanvas.width  = window.innerWidth;
    gridCanvas.height = window.innerHeight;
    gridCanvas.style.display = 'block';
    _drawGrid();
    if (layoutToolbar) layoutToolbar.style.display = 'flex';
    if (btn) { btn.textContent = '✓ Done'; btn.style.color = 'var(--accent)'; }
  } else {
    WIDGET_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('layout-drag-mode');
      _removeOverlay(id);
    });
    gridCanvas.style.display = 'none';
    if (layoutToolbar) layoutToolbar.style.display = 'none';
    if (btn) { btn.textContent = '⊞ Edit Layout'; btn.style.color = ''; }
  }
}

// ── Reset all widget positions + sizes ────────────
// ── Default widget positions (non-overlapping 4-column grid) ──
// Left column x=36, col2 x=254, col3 x=464, right column anchored to right edge
// 'r' = offset from right edge of display,  'b' = offset from bottom
function _defaultPositions() {
  const dw = typeof displayW !== 'undefined' ? displayW : 1920;
  return {
    // — Left column —
    'clock-widget':      { top: 36,  left: 36 },
    'todo-widget':       { top: 140, left: 36 },
    'habits-widget':     { top: 440, left: 36 },
    'quicklinks-widget': { top: 590, left: 36 },
    // — Center-left column —
    'worldclock-widget': { top: 36,  left: 254 },
    'pomodoro-widget':   { top: 134, left: 254 },
    'timer-widget':      { top: 310, left: 254 },
    'countdown-widget':  { top: 446, left: 254 },
    // — Center column —
    'quote-widget':      { top: 36,  left: 464 },
    'sticky-widget':     { top: 134, left: 464 },
    'nowplaying-widget': { top: 330, left: 464 },
    // — Right column (anchored to display width) —
    'hw-panel':          { top: 36,  left: dw - 224 },
    'network-widget':    { top: 164, left: dw - 224 },
    'processes-widget':  { top: 252, left: dw - 224 },
    'battery-widget':    { top: 390, left: dw - 112 },
    'weather-widget':    { top: dw > 1200 ? 700 : 500, left: dw - 224 },
    'calendar-widget':   { top: dw > 1200 ? 700 : 500, left: dw - 440 },
    // — Buttons & Panels —
    'chat-bubble-btn':   { top: null, left: null },
    'chat-panel':        { top: null, left: null },
    'settings-btn':      { top: null, left: null },
    'open-pet-selector': { top: null, left: null },
    'dn-btn':            { top: null, left: null },
    'mode-indicator':    { top: null, left: null },
  };
}

function resetLayout() {
  // ── Pause persistence so stale intervals can't re-save old data ──
  _persistPaused = true;
  clearTimeout(_persistTimer);

  // ── Compute default positions ──
  const defaults = _defaultPositions();
  const saved = {};
  Object.entries(defaults).forEach(([id, pos]) => {
    if (pos && pos.top !== null && pos.left !== null) {
      saved[id] = { x: pos.left, y: pos.top, sx: 1, sy: 1 };
    }
  });

  // ── Build reset toggles (all OFF except chat + bubble) ──
  const resetToggles = {};
  ['clock','hw','chat','bubble','weather','calendar','todo','pomodoro',
   'timer','habits','worldclock','quote','countdown','sticky',
   'quicklinks','network','processes','battery','nowplaying'
  ].forEach(k => resetToggles[k] = false);
  resetToggles.chat = true;
  resetToggles.bubble = true;

  // ── Wipe localStorage and set clean defaults ──
  localStorage.clear();
  _origSetItem(LAYOUT_KEY, JSON.stringify(saved));
  _origSetItem('widgetSettings', JSON.stringify(resetToggles));

  // ── Clear widget data arrays in-place ──
  if (typeof _todos !== 'undefined')      _todos = [];
  if (typeof _habits !== 'undefined')     _habits = [];
  if (typeof _wclocks !== 'undefined')    _wclocks = [];
  if (typeof _qlinks !== 'undefined')     _qlinks = [];
  if (typeof _countdowns !== 'undefined') _countdowns = [];
  if (typeof _calNotes !== 'undefined')   _calNotes = {};

  // ── Stop running timers ──
  if (typeof _pomoTimer !== 'undefined' && _pomoTimer) { clearInterval(_pomoTimer); _pomoTimer = null; }
  if (typeof _timerRef !== 'undefined' && _timerRef)    { clearInterval(_timerRef); _timerRef = null; }
  if (typeof _refreshTimer !== 'undefined' && _refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }

  // ── Reset pomodoro state ──
  if (typeof _pomoState !== 'undefined') { _pomoState = 'idle'; _pomoSecs = typeof POMO_WORK !== 'undefined' ? POMO_WORK : 1500; _pomoSession = 0; _pomoRunning = false; }

  // ── Reset timer state ──
  if (typeof _timerRunning !== 'undefined') { _timerRunning = false; _timerMs = 0; _timerMode = 'stopwatch'; }

  // ── Reset sticky note ──
  _stickyColor = 0;
  const stickyTa = document.getElementById('sticky-textarea');
  if (stickyTa) stickyTa.value = '';
  if (typeof _stickyApplyColor === 'function') _stickyApplyColor();
  document.querySelectorAll('.sticky-dot').forEach((d, i) => d.classList.toggle('active', i === 0));

  // ── Reset now-playing ──
  if (typeof _npLast !== 'undefined') _npLast = '';
  if (typeof _npSetIdle === 'function') _npSetIdle('');

  // ── Re-render all widget DOMs (now empty) ──
  if (typeof _renderTodos === 'function')   _renderTodos();
  if (typeof _habitsRender === 'function')  _habitsRender();
  if (typeof _wclockRender === 'function')  _wclockRender();
  if (typeof _qlinksRender === 'function')  _qlinksRender();
  if (typeof _cdownRender === 'function')   _cdownRender();
  if (typeof _buildCalendar === 'function' && typeof _calYear !== 'undefined') {
    const now = new Date(); _calYear = now.getFullYear(); _calMonth = now.getMonth();
    _buildCalendar(_calYear, _calMonth);
  }
  if (typeof _pomoRender === 'function')    _pomoRender();
  if (typeof _timerRender === 'function')   _timerRender();

  // ── Reset widget positions on DOM ──
  Object.entries(saved).forEach(([id, pos]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.left            = pos.x + 'px';
    el.style.top             = pos.y + 'px';
    el.style.right           = 'auto';
    el.style.bottom          = 'auto';
    el.style.transformOrigin = 'top left';
    el.style.transform       = 'scaleX(1) scaleY(1)';
    // Clear reflow overrides
    if (REFLOW_IDS.has(id)) {
      el.style.width = '';
      el.style.maxHeight = '';
      el.style.height = '';
      el.style.transform = 'none';
    }
  });
  // ── Clear inline styles on CSS-positioned buttons so defaults take over ──
  Object.entries(defaults).forEach(([id, pos]) => {
    if (pos.top === null && pos.left === null) {
      const el = document.getElementById(id);
      if (el) {
        el.style.left = '';
        el.style.top = '';
        el.style.right = '';
        el.style.bottom = '';
        el.style.transform = '';
        el.style.transformOrigin = '';
      }
    }
  });

  // ── Reset widget toggle checkboxes and hide/show ──
  WIDGET_TOGGLES.forEach(([key]) => {
    const tog = document.getElementById('tog-' + key);
    if (tog) tog.checked = !!resetToggles[key];
  });
  WIDGET_TOGGLES.forEach(([key, elId]) => {
    const el = document.getElementById(elId);
    if (el) el.style.display = resetToggles[key] ? '' : 'none';
  });

  // ── Reset pet to Pixel ──
  if (typeof currentPetType !== 'undefined') {
    currentPetType = 'pixel';
    const pet = typeof getActivePet === 'function' ? getActivePet() : null;
    if (pet) {
      const nameTag = document.getElementById('name-tag');
      if (nameTag) nameTag.textContent = pet.nameTagText;
      const chatInput = document.getElementById('chat-input');
      if (chatInput) chatInput.placeholder = pet.inputPlaceholder;
      const bubbleEmoji = document.getElementById('chat-bubble-emoji');
      if (bubbleEmoji) bubbleEmoji.textContent = pet.avatarEmoji;
      const headerName = document.getElementById('chat-header-name');
      if (headerName) headerName.textContent = pet.name;
    }
  }

  // ── Reset appearance to defaults ──
  if (typeof applyAppearance === 'function') {
    applyAppearance({ theme: 'midnight', font: 'Nunito', chatOpacity: 0.97 });
  }

  // ── Reset day/night to night mode ──
  if (typeof setDayNight === 'function') {
    _dnAuto = false;
    setDayNight(false, false);
  }

  // ── Re-detect and apply display size (localStorage was cleared) ──
  if (typeof resetDisplaySize === 'function') resetDisplaySize();

  // ── Close any open panels ──
  if (typeof settingsPanelOpen !== 'undefined' && settingsPanelOpen) {
    settingsPanelOpen = false;
    const sp = document.getElementById('settings-panel');
    if (sp) sp.classList.remove('open');
  }
  if (typeof appearanceOpen !== 'undefined' && appearanceOpen && typeof closeAppearance === 'function') {
    closeAppearance();
  }

  // ── Exit layout mode if active ──
  if (layoutMode && typeof toggleLayoutMode === 'function') toggleLayoutMode();

  // ── Push clean state to bridge, then unpause persist ──
  const cleanState = {};
  PERSIST_KEYS.forEach(k => {
    const v = localStorage.getItem(k);
    if (v !== null) cleanState[k] = v;
  });
  fetch(`${BRIDGE_URL}/state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanState)
  }).catch(() => {}).finally(() => {
    _persistPaused = false;
  });

  // Show confirmation
  if (typeof showBubble === 'function') showBubble('Factory reset complete! ✨', 3000);
  if (typeof setMood === 'function') setMood('happy', 2000);
}

// ── Handle overlay helpers ────────────────────────
function _createOverlay(el) {
  const r = el.getBoundingClientRect();
  const ov = document.createElement('div');
  ov.className = 'layout-handle-overlay';
  ov.style.cssText = [
    'position:fixed',
    `left:${r.left}px`, `top:${r.top}px`,
    `width:${r.width}px`, `height:${r.height}px`,
    'z-index:1001', 'pointer-events:none',
    'box-sizing:border-box',
  ].join(';');

  HANDLE_DIRS.forEach(dir => {
    const handle = document.createElement('div');
    handle.className = 'layout-resize-handle';
    handle.dataset.dir = dir;
    handle.addEventListener('mousedown', e => {
      if (!layoutMode) return;
      e.preventDefault(); e.stopPropagation();
      resizeEl      = el;
      resizeDir     = dir;
      resizeStartX  = e.clientX;
      resizeStartY  = e.clientY;
      resizeNatW    = el.offsetWidth  || 1;
      resizeNatH    = el.offsetHeight || 1;
      const vr = el.getBoundingClientRect();
      resizeStartVX = vr.left;
      resizeStartVY = vr.top;
      resizeStartVW = vr.width;
      resizeStartVH = vr.height;
      resizeOverlay = ov;
    });
    ov.appendChild(handle);
  });

  document.body.appendChild(ov);
  _overlayMap[el.id] = ov;
  return ov;
}

function _removeOverlay(id) {
  const ov = _overlayMap[id];
  if (ov) { ov.remove(); delete _overlayMap[id]; }
}

function _syncOverlay(el) {
  const ov = _overlayMap[el.id];
  if (!ov) return;
  const r = el.getBoundingClientRect();
  ov.style.left   = r.left   + 'px';
  ov.style.top    = r.top    + 'px';
  ov.style.width  = r.width  + 'px';
  ov.style.height = r.height + 'px';
}

// ── Private helpers ───────────────────────────────
function _drawGrid() {
  const ctx = gridCanvas.getContext('2d');
  const W = gridCanvas.width, H = gridCanvas.height;
  ctx.clearRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(217,102,255,0.10)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += GRID) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += GRID) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  ctx.strokeStyle = 'rgba(217,102,255,0.22)';
  for (let x = 0; x < W; x += GRID*5) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += GRID*5) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  ctx.strokeStyle = 'rgba(217,102,255,0.35)';
  ctx.setLineDash([4,4]);
  ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke();
  ctx.setLineDash([]);
}

function _savePos(id, x, y) {
  try {
    const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY)) || {};
    const existing = saved[id] || {};
    saved[id] = { x, y, sx: existing.sx || 1, sy: existing.sy || 1 };
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(saved));
  } catch(e) {}
}

function _saveScale(id, x, y, sx, sy) {
  try {
    const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY)) || {};
    saved[id] = { x, y, sx, sy };
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(saved));
  } catch(e) {}
}

function _applyAllPositions() {
  try {
    let saved = JSON.parse(localStorage.getItem(LAYOUT_KEY)) || {};
    // First-time: no saved positions → apply defaults
    if (Object.keys(saved).length === 0) {
      const defaults = _defaultPositions();
      Object.entries(defaults).forEach(([id, pos]) => {
        if (pos && pos.top !== null && pos.left !== null) {
          saved[id] = { x: pos.left, y: pos.top, sx: 1, sy: 1 };
        }
      });
      localStorage.setItem(LAYOUT_KEY, JSON.stringify(saved));
    }
    Object.entries(saved).forEach(([id, pos]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.left   = pos.x + 'px';
      el.style.top    = pos.y + 'px';
      el.style.right  = 'auto';
      el.style.bottom = 'auto';
      if (REFLOW_IDS.has(id) && pos.sx > 10) {
        // sx/sy store actual pixel width/height for reflow widgets
        el.style.width     = pos.sx + 'px';
        el.style.maxHeight = pos.sy + 'px';
        el.style.height    = pos.sy + 'px';
        el.style.transform = 'none';
      } else {
        el.style.transformOrigin = 'top left';
        el.style.transform       = `scaleX(${pos.sx || 1}) scaleY(${pos.sy || 1})`;
      }
    });
  } catch(e) {}
}
