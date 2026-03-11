// ══════════════════════════════════════════════════
//  WORLD CLOCKS WIDGET
//  Shows 3 configurable timezone clocks.
// ══════════════════════════════════════════════════
const WCLOCK_KEY = 'pixelWorldClocks';
const WCLOCK_DEFAULTS = [
  { label: 'UTC',      tz: 'UTC' },
  { label: 'New York', tz: 'America/New_York' },
  { label: 'Tokyo',    tz: 'Asia/Tokyo' },
];

let _wclocks = [];

function _wclockLoad() {
  try {
    const d = JSON.parse(localStorage.getItem(WCLOCK_KEY));
    _wclocks = (d && d.length) ? d : JSON.parse(JSON.stringify(WCLOCK_DEFAULTS));
  } catch {
    _wclocks = JSON.parse(JSON.stringify(WCLOCK_DEFAULTS));
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

function _wclockRender() {
  const list = document.getElementById('wclock-list');
  if (!list) return;
  list.innerHTML = '';
  _wclocks.forEach(c => {
    const row = document.createElement('div');
    row.className = 'wclock-row';

    const lbl = document.createElement('span');
    lbl.className = 'wclock-label';
    lbl.textContent = c.label;

    const time = document.createElement('span');
    time.className = 'wclock-time';
    time.textContent = _wclockFmt(c.tz);

    row.appendChild(lbl);
    row.appendChild(time);
    list.appendChild(row);
  });
}

function initWorldClock() {
  _wclockLoad();
  _wclockRender();
  setInterval(_wclockRender, 1000);
}
