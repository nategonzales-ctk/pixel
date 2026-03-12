// ══════════════════════════════════════════════════
//  TO-DO LIST WIDGET
//  Persists to localStorage. Supports add, complete, delete.
// ══════════════════════════════════════════════════

const TODO_KEY = 'pixelTodos';

let _todos = [];

function _saveTodos() {
  localStorage.setItem(TODO_KEY, JSON.stringify(_todos));
}

function _loadTodos() {
  try { _todos = JSON.parse(localStorage.getItem(TODO_KEY)) || []; } catch { _todos = []; }
}

function _renderTodos() {
  const list = document.getElementById('todo-list');
  if (!list) return;
  list.innerHTML = '';
  if (_todos.length === 0) return;
  _todos.forEach((item, i) => {
    const row = document.createElement('div');
    row.className = 'todo-row' + (item.done ? ' done' : '');

    const check = document.createElement('button');
    check.className = 'todo-check';
    check.title = item.done ? 'Uncheck' : 'Done!';
    check.textContent = item.done ? '✓' : '';
    check.onclick = () => todoToggle(i);

    const label = document.createElement('span');
    label.className = 'todo-label';
    label.textContent = item.text;

    const del = document.createElement('button');
    del.className = 'todo-del';
    del.title = 'Remove';
    del.textContent = '✕';
    del.onclick = () => todoDelete(i);

    row.appendChild(check);
    row.appendChild(label);
    row.appendChild(del);
    list.appendChild(row);
  });
}

const _TODO_ADD_MSGS = [
  'Added to the list! Let\'s get it done! ✅',
  'Got it! I believe in you! 💪',
  'New task! You\'re so organized! 📋',
  'I\'ll cheer you on! ✨',
];
const _TODO_DONE_MSGS = [
  'Yay! Task complete! 🎉',
  'Great job! One down! ✅',
  'You did it! So proud! 💜',
  'Checked off! Keep going! 🌟',
];

function todoAdd() {
  const inp = document.getElementById('todo-input');
  if (!inp) return;
  const text = inp.value.trim();
  if (!text) return;
  _todos.unshift({ text, done: false });
  inp.value = '';
  _saveTodos();
  _renderTodos();
  if (typeof showBubble === 'function') {
    showBubble(_TODO_ADD_MSGS[Math.floor(Math.random() * _TODO_ADD_MSGS.length)], 3500);
    setMood('happy', 3000);
  }
}

function todoToggle(i) {
  if (_todos[i]) {
    _todos[i].done = !_todos[i].done;
    _saveTodos();
    _renderTodos();
    if (_todos[i].done && typeof showBubble === 'function') {
      showBubble(_TODO_DONE_MSGS[Math.floor(Math.random() * _TODO_DONE_MSGS.length)], 3500);
      setMood('excited', 3000);
    }
  }
}

function todoDelete(i) {
  _todos.splice(i, 1);
  _saveTodos();
  _renderTodos();
}

function initTodo() {
  _loadTodos();
  _renderTodos();
  const inp = document.getElementById('todo-input');
  if (inp) {
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') todoAdd(); });
  }
}
