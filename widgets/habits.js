// ══════════════════════════════════════════════════
//  HABIT TRACKER WIDGET
//  Daily checkboxes with streak counts.
//  Resets at midnight. Persists to localStorage.
// ══════════════════════════════════════════════════
const HABITS_KEY = 'pixelHabits';
const DEFAULT_HABITS = [
  { id: 'water',    label: '💧 Water',     streak: 0, done: false },
  { id: 'exercise', label: '🏃 Exercise',  streak: 0, done: false },
  { id: 'read',     label: '📚 Read',      streak: 0, done: false },
  { id: 'sleep',    label: '😴 8h Sleep',  streak: 0, done: false },
  { id: 'eat',      label: '🥗 Eat Well',  streak: 0, done: false },
];

let _habits      = [];
let _habitsToday = '';   // 'YYYY-MM-DD' of last save

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
    if (raw && raw.habits) {
      _habits = raw.habits;
      if (raw.date !== today) {
        // New day — reset done, update streaks
        _habits.forEach(h => {
          h.streak = h.done ? (h.streak || 0) + 1 : 0;
          h.done   = false;
        });
        _habitsSave();
      }
      _habitsToday = today;
    } else {
      _habits = JSON.parse(JSON.stringify(DEFAULT_HABITS));
    }
  } catch {
    _habits = JSON.parse(JSON.stringify(DEFAULT_HABITS));
  }
}

function _habitsRender() {
  const list = document.getElementById('habits-list');
  if (!list) return;
  list.innerHTML = '';
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

    row.appendChild(chk);
    row.appendChild(lbl);
    row.appendChild(streak);
    list.appendChild(row);
  });
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
