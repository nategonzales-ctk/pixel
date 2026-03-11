// ══════════════════════════════════════════════════
//  COUNTDOWN TO DATE WIDGET
//  User sets a label + target date. Persists to localStorage.
// ══════════════════════════════════════════════════
const CDOWN_KEY = 'pixelCountdowns';
let _countdowns  = [];   // [{label, date}]  (max 3)

function _cdownLoad() {
  try { _countdowns = JSON.parse(localStorage.getItem(CDOWN_KEY)) || []; } catch { _countdowns = []; }
}
function _cdownSave() {
  localStorage.setItem(CDOWN_KEY, JSON.stringify(_countdowns));
}

function _cdownFmt(ms) {
  if (ms <= 0) return 'Now! 🎉';
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m`;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function _cdownRender() {
  const list = document.getElementById('cdown-list');
  const form = document.getElementById('cdown-form');
  if (!list) return;
  list.innerHTML = '';

  if (_countdowns.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'cdown-empty';
    empty.textContent = 'No countdowns yet';
    list.appendChild(empty);
  }

  _countdowns.forEach((c, i) => {
    const ms   = new Date(c.date) - Date.now();
    const row  = document.createElement('div');
    row.className = 'cdown-row';

    const lbl = document.createElement('div');
    lbl.className = 'cdown-label';
    lbl.textContent = c.label;

    const time = document.createElement('div');
    time.className = 'cdown-time';
    time.id = `cdown-time-${i}`;
    time.textContent = _cdownFmt(ms);

    const del = document.createElement('button');
    del.className = 'cdown-del';
    del.textContent = '✕';
    del.title = 'Remove';
    del.onclick = () => cdownDelete(i);

    row.appendChild(lbl);
    row.appendChild(time);
    row.appendChild(del);
    list.appendChild(row);
  });

  if (form) form.style.display = _countdowns.length >= 3 ? 'none' : '';
}

function _cdownTick() {
  _countdowns.forEach((c, i) => {
    const el = document.getElementById(`cdown-time-${i}`);
    if (el) el.textContent = _cdownFmt(new Date(c.date) - Date.now());
  });
}

function cdownAdd() {
  const lbl  = document.getElementById('cdown-label-inp');
  const date = document.getElementById('cdown-date-inp');
  if (!lbl || !date || !lbl.value.trim() || !date.value) return;
  _countdowns.push({ label: lbl.value.trim(), date: date.value });
  lbl.value = ''; date.value = '';
  _cdownSave();
  _cdownRender();
}

function cdownDelete(i) {
  _countdowns.splice(i, 1);
  _cdownSave();
  _cdownRender();
}

function initCountdown() {
  _cdownLoad();
  _cdownRender();
  setInterval(_cdownTick, 1000);
}
