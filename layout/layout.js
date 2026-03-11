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
const WIDGET_IDS  = ['clock-widget', 'hw-panel', 'chat-bubble-btn', 'settings-btn', 'open-pet-selector'];
const HANDLE_DIRS = ['nw','n','ne','e','se','s','sw','w'];

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

  // Apply scale transform (scales all content proportionally)
  const sx = vw / resizeNatW;
  const sy = vh / resizeNatH;
  resizeEl.style.left            = vx + 'px';
  resizeEl.style.top             = vy + 'px';
  resizeEl.style.transformOrigin = 'top left';
  resizeEl.style.transform       = `scaleX(${sx}) scaleY(${sy})`;

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
    const sx = vw / resizeNatW;
    const sy = vh / resizeNatH;
    resizeEl.style.left  = vx + 'px';
    resizeEl.style.top   = vy + 'px';
    resizeEl.style.transform = `scaleX(${sx}) scaleY(${sy})`;
    resizeOverlay.style.left   = vx + 'px';
    resizeOverlay.style.top    = vy + 'px';
    _saveScale(resizeEl.id, vx, vy, sx, sy);
    resizeEl      = null;
    resizeOverlay = null;
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
      const r = el.getBoundingClientRect();
      // Compute current visual scale (handles elements that have CSS transforms)
      const sx = r.width  / (el.offsetWidth  || 1);
      const sy = r.height / (el.offsetHeight || 1);
      el.style.left            = r.left + 'px';
      el.style.top             = r.top  + 'px';
      el.style.right           = '';
      el.style.bottom          = '';
      el.style.transformOrigin = 'top left';
      el.style.transform       = `scaleX(${sx}) scaleY(${sy})`;
      el.classList.add('layout-drag-mode');
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
function resetLayout() {
  localStorage.removeItem(LAYOUT_KEY);
  WIDGET_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.left = ''; el.style.top = '';
    el.style.right = ''; el.style.bottom = '';
    el.style.transform = '';       // restore CSS-defined transform
    el.style.transformOrigin = '';
    el.classList.remove('layout-drag-mode');
    _removeOverlay(id);
  });
  if (layoutMode) toggleLayoutMode();
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
    const saved = JSON.parse(localStorage.getItem(LAYOUT_KEY)) || {};
    Object.entries(saved).forEach(([id, pos]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.left            = pos.x + 'px';
      el.style.top             = pos.y + 'px';
      el.style.right           = '';
      el.style.bottom          = '';
      el.style.transformOrigin = 'top left';
      el.style.transform       = `scaleX(${pos.sx || 1}) scaleY(${pos.sy || 1})`;
    });
  } catch(e) {}
}
