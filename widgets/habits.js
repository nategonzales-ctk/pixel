// ══════════════════════════════════════════════════
//  HABIT TRACKER WIDGET
//  Daily checkboxes with streak counts.
//  Resets at midnight. Persists to localStorage.
// ══════════════════════════════════════════════════
const HABITS_KEY = 'pixelHabits';
const MAX_HABITS = 8;

let _habits      = [];
let _habitsToday = '';

function _habitsDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function _habitsSave() {
  localStorage.setItem(HABITS_KEY, JSON.stringify({ date: _habitsDateStr(), habits: _habits }));
}

function _habitsLoad() {
  try {
    const raw = JSON.parse(localStorage.getItem(HABITS_KEY));
    const today = _habitsDateStr();
    if (raw && raw.habits && raw.habits.length) {
      _habits = raw.habits;
      if (raw.date !== today) {
        _habits.forEach(h => {
          h.streak = h.done ? (h.streak || 0) + 1 : 0;
          h.done   = false;
        });
        _habitsSave();
      }
      _habitsToday = today;
    } else {
      _habits = [];
    }
  } catch {
    _habits = [];
  }
}

function _habitsRender() {
  const list = document.getElementById('habits-list');
  if (!list) return;
  list.innerHTML = '';

  if (_habits.length === 0) { /* empty — just show add input */ }

  _habits.forEach((h, i) => {
    const row = document.createElement('div');
    row.className = 'habit-row' + (h.done ? ' done' : '');

    const chk = document.createElement('button');
    chk.className = 'habit-check';
    chk.textContent = h.done ? '✓' : '';
    chk.onclick = () => habitToggle(i);

    const lbl = document.createElement('span');
    lbl.className = 'habit-label';
    lbl.textContent = h.label;

    const streak = document.createElement('span');
    streak.className = 'habit-streak';
    streak.textContent = h.streak > 0 ? `🔥${h.streak}` : '';

    const del = document.createElement('button');
    del.className = 'habit-del';
    del.textContent = '×';
    del.onclick = () => { _habits.splice(i, 1); _habitsSave(); _habitsRender(); };

    row.appendChild(chk);
    row.appendChild(lbl);
    row.appendChild(streak);
    row.appendChild(del);
    list.appendChild(row);
  });

  // Add habit input row
  if (_habits.length < MAX_HABITS) {
    const addRow = document.createElement('div');
    addRow.className = 'habit-add-row';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'w-inp';
    inp.placeholder = 'New habit…';
    inp.maxLength = 30;
    inp.id = 'habit-add-inp';
    const btn = document.createElement('button');
    btn.className = 'w-sm-btn';
    btn.textContent = '+';
    btn.onclick = () => _habitAdd(inp);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') _habitAdd(inp); });
    addRow.appendChild(inp);
    addRow.appendChild(btn);
    list.appendChild(addRow);
  }
}

function _habitAdd(inp) {
  const text = (inp.value || '').trim();
  if (!text || _habits.length >= MAX_HABITS) return;
  _habits.push({ id: 'h' + Date.now(), label: text, streak: 0, done: false });
  _habitsSave();
  _habitsRender();
}

function habitToggle(i) {
  if (!_habits[i]) return;
  _habits[i].done = !_habits[i].done;
  _habitsSave();
  _habitsRender();
  if (_habits[i].done && _habits.every(h => h.done)) {
    showBubble('All habits done today! You\'re amazing! 🌟', 5000);
    setMood('excited', 4000);
  }
}

function _habitsMidnightReset() {
  const n = new Date();
  const msUntilMidnight = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n;
  setTimeout(() => {
    _habits.forEach(h => {
      h.streak = h.done ? (h.streak || 0) + 1 : 0;
      h.done   = false;
    });
    _habitsSave();
    _habitsRender();
    _habitsMidnightReset();
  }, msUntilMidnight);
}

function initHabits() {
  _habitsLoad();
  _habitsRender();
  _habitsMidnightReset();
}
