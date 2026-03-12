// ══════════════════════════════════════════════════
//  CALENDAR WIDGET
//  Month/year navigation, per-day notes/events,
//  integration with countdown widget.
// ══════════════════════════════════════════════════

const CAL_DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const CAL_MONTHS = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
const CAL_NOTES_KEY = 'pixelCalendarNotes';

let _calYear, _calMonth;   // currently viewed month (0-indexed)
let _calNotes = {};         // { "2026-03-12": [{ text, time? }], ... }

function _calLoadNotes() {
  try { _calNotes = JSON.parse(localStorage.getItem(CAL_NOTES_KEY)) || {}; } catch { _calNotes = {}; }
}
function _calSaveNotes() {
  localStorage.setItem(CAL_NOTES_KEY, JSON.stringify(_calNotes));
}

function _calDateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function calPrev() {
  _calMonth--;
  if (_calMonth < 0) { _calMonth = 11; _calYear--; }
  _buildCalendar(_calYear, _calMonth);
}

function calNext() {
  _calMonth++;
  if (_calMonth > 11) { _calMonth = 0; _calYear++; }
  _buildCalendar(_calYear, _calMonth);
}

function calToday() {
  const now = new Date();
  _calYear = now.getFullYear();
  _calMonth = now.getMonth();
  _buildCalendar(_calYear, _calMonth);
}

function _buildCalendar(year, month) {
  const today     = new Date();
  const isToday   = (d) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const firstDay  = new Date(year, month, 1).getDay();
  const daysInMon = new Date(year, month + 1, 0).getDate();

  const grid = document.getElementById('cal-grid');
  const hdr  = document.getElementById('cal-month-year');
  if (!grid || !hdr) return;

  hdr.textContent = CAL_MONTHS[month] + ' ' + year;
  grid.innerHTML  = '';

  // Day-of-week header
  CAL_DAYS.forEach(d => {
    const cell = document.createElement('div');
    cell.className = 'cal-dow';
    cell.textContent = d;
    grid.appendChild(cell);
  });

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day cal-empty';
    grid.appendChild(cell);
  }

  // Day cells
  for (let d = 1; d <= daysInMon; d++) {
    const cell = document.createElement('div');
    const key = _calDateKey(year, month, d);
    const hasNote = _calNotes[key] && _calNotes[key].length > 0;
    cell.className = 'cal-day' + (isToday(d) ? ' cal-today' : '') + (hasNote ? ' cal-has-note' : '');
    cell.textContent = d;
    cell.title = hasNote ? _calNotes[key].map(n => n.text).join(', ') : '';
    cell.onclick = () => _calOpenDay(year, month, d);
    grid.appendChild(cell);
  }
}

// ── Day note popup ──
function _calOpenDay(year, month, day) {
  // Remove existing popup if any
  _calClosePopup();

  const key = _calDateKey(year, month, day);
  const notes = _calNotes[key] || [];
  const dateStr = `${CAL_MONTHS[month]} ${day}, ${year}`;

  const popup = document.createElement('div');
  popup.id = 'cal-popup';
  popup.className = 'cal-popup';

  // Header
  const hdr = document.createElement('div');
  hdr.className = 'cal-popup-hdr';
  hdr.innerHTML = `<span>${dateStr}</span><button class="cal-popup-close" onclick="_calClosePopup()">×</button>`;
  popup.appendChild(hdr);

  // Notes list
  const list = document.createElement('div');
  list.className = 'cal-popup-list';
  if (notes.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'cal-popup-empty';
    empty.textContent = 'No events';
    list.appendChild(empty);
  } else {
    notes.forEach((n, i) => {
      const row = document.createElement('div');
      row.className = 'cal-popup-note';
      const txt = document.createElement('span');
      txt.textContent = n.text;
      const del = document.createElement('button');
      del.className = 'cal-popup-del';
      del.textContent = '×';
      del.onclick = (e) => { e.stopPropagation(); _calDeleteNote(key, i); };
      row.appendChild(txt);
      row.appendChild(del);
      list.appendChild(row);
    });
  }
  popup.appendChild(list);

  // Add note form
  const form = document.createElement('div');
  form.className = 'cal-popup-form';
  const inp = document.createElement('input');
  inp.type = 'text';
  inp.className = 'cal-popup-inp';
  inp.placeholder = 'Add event…';
  inp.maxLength = 60;
  inp.onkeydown = (e) => { if (e.key === 'Enter') _calAddNote(key, inp, year, month, day); };
  const addBtn = document.createElement('button');
  addBtn.className = 'cal-popup-add';
  addBtn.textContent = '+';
  addBtn.onclick = () => _calAddNote(key, inp, year, month, day);
  form.appendChild(inp);
  form.appendChild(addBtn);
  popup.appendChild(form);

  // Countdown integration hint for future dates
  const target = new Date(year, month, day);
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  if (target > todayStart) {
    const hint = document.createElement('div');
    hint.className = 'cal-popup-hint';
    hint.innerHTML = '<label><input type="checkbox" id="cal-add-cdown" checked> Add to countdown</label>';
    popup.appendChild(hint);
  }

  document.getElementById('calendar-widget').appendChild(popup);
  inp.focus();
}

function _calClosePopup() {
  const p = document.getElementById('cal-popup');
  if (p) p.remove();
}

const _CAL_ADD_MSGS = [
  'Event added! I\'ll remember! 📅',
  'Noted! Sounds exciting! ✨',
  'Marked on the calendar! 🗓️',
  'Ooh, what\'s happening? 👀',
];

function _calAddNote(key, inp, year, month, day) {
  const text = inp.value.trim();
  if (!text) return;
  if (!_calNotes[key]) _calNotes[key] = [];
  _calNotes[key].push({ text });
  _calSaveNotes();

  // Optionally add to countdown widget
  const cdownCk = document.getElementById('cal-add-cdown');
  if (cdownCk && cdownCk.checked && typeof _countdowns !== 'undefined') {
    const dateStr = key; // "YYYY-MM-DD"
    if (_countdowns.length < 3) {
      _countdowns.push({ label: text, date: dateStr });
      _cdownSave();
      _cdownRender();
    }
  }

  _calClosePopup();
  _buildCalendar(_calYear, _calMonth);
  if (typeof showBubble === 'function') {
    showBubble(_CAL_ADD_MSGS[Math.floor(Math.random() * _CAL_ADD_MSGS.length)], 3500);
    setMood('happy', 3000);
  }
}

function _calDeleteNote(key, index) {
  if (_calNotes[key]) {
    const removed = _calNotes[key][index];
    _calNotes[key].splice(index, 1);
    if (_calNotes[key].length === 0) delete _calNotes[key];
    _calSaveNotes();
    // Remove matching countdown if exists
    if (removed && typeof _countdowns !== 'undefined') {
      const ci = _countdowns.findIndex(c => c.label === removed.text && c.date === key);
      if (ci !== -1) {
        _countdowns.splice(ci, 1);
        _cdownSave();
        _cdownRender();
      }
    }
  }
  _calClosePopup();
  _buildCalendar(_calYear, _calMonth);
}

// Close popup on outside click
document.addEventListener('click', e => {
  const popup = document.getElementById('cal-popup');
  if (popup && !e.target.closest('.cal-popup') && !e.target.closest('.cal-day')) {
    _calClosePopup();
  }
});

function initCalendar() {
  const now = new Date();
  _calYear = now.getFullYear();
  _calMonth = now.getMonth();
  _calLoadNotes();
  _buildCalendar(_calYear, _calMonth);

  // Rebuild at midnight
  const schedMidnight = () => {
    const n = new Date();
    const msUntilMidnight = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n;
    setTimeout(() => {
      const t = new Date();
      if (_calYear === n.getFullYear() && _calMonth === n.getMonth()) {
        _calYear = t.getFullYear();
        _calMonth = t.getMonth();
      }
      _buildCalendar(_calYear, _calMonth);
      schedMidnight();
    }, msUntilMidnight);
  };
  schedMidnight();
}
