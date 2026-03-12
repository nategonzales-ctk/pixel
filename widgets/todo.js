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

function todoAdd() {
  const inp = document.getElementById('todo-input');
  if (!inp) return;
  const text = inp.value.trim();
  if (!text) return;
  _todos.unshift({ text, done: false });
  inp.value = '';
  _saveTodos();
  _renderTodos();
}

function todoToggle(i) {
  if (_todos[i]) { _todos[i].done = !_todos[i].done; _saveTodos(); _renderTodos(); }
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
