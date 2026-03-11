// ══════════════════════════════════════════════════
//  POMODORO TIMER WIDGET
//  25-min work / 5-min break / 15-min long break
// ══════════════════════════════════════════════════
const POMO_WORK  = 25 * 60;
const POMO_SHORT = 5  * 60;
const POMO_LONG  = 15 * 60;
const POMO_KEY   = 'pixelPomodoro';

let _pomoState   = 'idle';   // idle | work | break
let _pomoSecs    = POMO_WORK;
let _pomoSession = 0;        // completed work sessions (0-3)
let _pomoTimer   = null;
let _pomoRunning = false;

function _pomoSave() {
  localStorage.setItem(POMO_KEY, JSON.stringify({ session: _pomoSession }));
}
function _pomoLoad() {
  try { const d = JSON.parse(localStorage.getItem(POMO_KEY)); if (d) _pomoSession = d.session || 0; } catch {}
}

function _pomoRender() {
  const disp  = document.getElementById('pomo-time');
  const state = document.getElementById('pomo-state');
  const dots  = document.getElementById('pomo-dots');
  const btn   = document.getElementById('pomo-btn');
  if (!disp) return;

  const m = String(Math.floor(_pomoSecs / 60)).padStart(2, '0');
  const s = String(_pomoSecs % 60).padStart(2, '0');
  disp.textContent = `${m}:${s}`;

  const stateMap = { idle: 'Ready', work: 'Focus', break: 'Break' };
  if (state) state.textContent = stateMap[_pomoState] || '';

  if (dots) {
    dots.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const d = document.createElement('span');
      d.className = 'pomo-dot' + (i < _pomoSession ? ' filled' : '');
      dots.appendChild(d);
    }
  }

  if (btn) btn.textContent = _pomoRunning ? '⏸ Pause' : (_pomoState === 'idle' ? '▶ Start' : '▶ Resume');
  disp.style.color = _pomoState === 'break' ? 'var(--accent2)' : (_pomoState === 'work' ? '#ff9966' : 'rgba(238,238,255,0.9)');
}

function _pomoTick() {
  if (!_pomoRunning) return;
  _pomoSecs--;
  if (_pomoSecs <= 0) {
    _pomoRunning = false;
    clearInterval(_pomoTimer);
    if (_pomoState === 'work') {
      _pomoSession = (_pomoSession + 1) % 5;
      _pomoSave();
      if (_pomoSession === 0) {
        // completed 4 sessions → long break
        _pomoState = 'break';
        _pomoSecs  = POMO_LONG;
        showBubble('You crushed 4 sessions! Long break time 🎉', 5000);
        setMood('excited', 4000);
      } else {
        _pomoState = 'break';
        _pomoSecs  = POMO_SHORT;
        showBubble('Nice work! Take a short break 😊', 4000);
        setMood('happy', 3000);
      }
      _pomoRunning = true;
      _pomoTimer = setInterval(_pomoTick, 1000);
    } else {
      _pomoState = 'idle';
      _pomoSecs  = POMO_WORK;
      showBubble("Break's over! Ready to focus? 💪", 4000);
      setMood('excited', 3000);
    }
  }
  _pomoRender();
}

function pomoToggle() {
  if (_pomoRunning) {
    _pomoRunning = false;
    clearInterval(_pomoTimer);
  } else {
    if (_pomoState === 'idle') _pomoState = 'work';
    _pomoRunning = true;
    _pomoTimer = setInterval(_pomoTick, 1000);
  }
  _pomoRender();
}

function pomoReset() {
  _pomoRunning = false;
  clearInterval(_pomoTimer);
  _pomoState = 'idle';
  _pomoSecs  = POMO_WORK;
  _pomoRender();
}

function initPomodoro() {
  _pomoLoad();
  _pomoRender();
}
