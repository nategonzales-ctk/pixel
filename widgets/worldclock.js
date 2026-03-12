// ══════════════════════════════════════════════════
//  WORLD CLOCKS WIDGET
//  Configurable timezone clocks with add/remove.
// ══════════════════════════════════════════════════
const WCLOCK_KEY = 'pixelWorldClocks';
const MAX_WCLOCKS = 5;

// Common timezones for the dropdown
const WCLOCK_OPTIONS = [
  { label: 'UTC',         tz: 'UTC' },
  { label: 'New York',    tz: 'America/New_York' },
  { label: 'Los Angeles', tz: 'America/Los_Angeles' },
  { label: 'Chicago',     tz: 'America/Chicago' },
  { label: 'London',      tz: 'Europe/London' },
  { label: 'Paris',       tz: 'Europe/Paris' },
  { label: 'Berlin',      tz: 'Europe/Berlin' },
  { label: 'Moscow',      tz: 'Europe/Moscow' },
  { label: 'Dubai',       tz: 'Asia/Dubai' },
  { label: 'Mumbai',      tz: 'Asia/Kolkata' },
  { label: 'Manila',      tz: 'Asia/Manila' },
  { label: 'Singapore',   tz: 'Asia/Singapore' },
  { label: 'Tokyo',       tz: 'Asia/Tokyo' },
  { label: 'Seoul',       tz: 'Asia/Seoul' },
  { label: 'Shanghai',    tz: 'Asia/Shanghai' },
  { label: 'Sydney',      tz: 'Australia/Sydney' },
  { label: 'Auckland',    tz: 'Pacific/Auckland' },
  { label: 'São Paulo',   tz: 'America/Sao_Paulo' },
];

let _wclocks = [];

function _wclockSave() {
  localStorage.setItem(WCLOCK_KEY, JSON.stringify(_wclocks));
}

function _wclockLoad() {
  try {
    const d = JSON.parse(localStorage.getItem(WCLOCK_KEY));
    _wclocks = (d && d.length) ? d : [];
  } catch {
    _wclocks = [];
  }
}

function _wclockFmt(tz) {
  try {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: tz,
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
  } catch { return '--:--:--'; }
}

// Only update time text — no DOM rebuild (keeps select dropdown open)
function _wclockTick() {
  const times = document.querySelectorAll('.wclock-time');
  times.forEach((el, i) => {
    if (_wclocks[i]) el.textContent = _wclockFmt(_wclocks[i].tz);
  });
}

function _wclockRender() {
  const list = document.getElementById('wclock-list');
  if (!list) return;
  list.innerHTML = '';

  _wclocks.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'wclock-row';

    const lbl = document.createElement('span');
    lbl.className = 'wclock-label';
    lbl.textContent = c.label;

    const time = document.createElement('span');
    time.className = 'wclock-time';
    time.textContent = _wclockFmt(c.tz);

    const del = document.createElement('button');
    del.className = 'habit-del';
    del.textContent = '×';
    del.onclick = () => { _wclocks.splice(i, 1); _wclockSave(); _wclockRender(); };

    row.appendChild(lbl);
    row.appendChild(time);
    row.appendChild(del);
    list.appendChild(row);
  });

  // Add clock row
  if (_wclocks.length < MAX_WCLOCKS) {
    const addRow = document.createElement('div');
    addRow.className = 'habit-add-row';
    addRow.style.marginTop = '6px';
    const sel = document.createElement('select');
    sel.className = 'w-inp';
    sel.id = 'wclock-add-sel';
    sel.style.flex = '1';
    const opt0 = document.createElement('option');
    opt0.value = '';
    opt0.textContent = 'Add timezone…';
    opt0.disabled = true;
    opt0.selected = true;
    sel.appendChild(opt0);
    WCLOCK_OPTIONS.forEach(o => {
      // Skip already-added
      if (_wclocks.some(w => w.tz === o.tz)) return;
      const opt = document.createElement('option');
      opt.value = o.tz;
      opt.textContent = o.label;
      sel.appendChild(opt);
    });
    sel.onchange = () => {
      const tz = sel.value;
      if (!tz) return;
      const match = WCLOCK_OPTIONS.find(o => o.tz === tz);
      _wclocks.push({ label: match ? match.label : tz, tz });
      _wclockSave();
      _wclockRender();
    };
    addRow.appendChild(sel);
    list.appendChild(addRow);
  }
}

function initWorldClock() {
  _wclockLoad();
  _wclockRender();
  // Tick updates only time text, doesn't rebuild DOM
  setInterval(_wclockTick, 1000);
}
