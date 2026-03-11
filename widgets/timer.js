// ══════════════════════════════════════════════════
//  STOPWATCH / COUNTDOWN TIMER WIDGET
// ══════════════════════════════════════════════════
let _timerMode    = 'stopwatch'; // 'stopwatch' | 'countdown'
let _timerRunning = false;
let _timerMs      = 0;         // elapsed ms (stopwatch) or remaining ms (countdown)
let _timerTarget  = 0;         // countdown target ms
let _timerRef     = null;      // setInterval handle
let _timerLast    = 0;         // Date.now() at last tick start

function _timerFmt(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function _timerRender() {
  const disp = document.getElementById('timer-display');
  const btn  = document.getElementById('timer-toggle-btn');
  const modeBtn = document.getElementById('timer-mode-btn');
  if (!disp) return;
  disp.textContent = _timerFmt(_timerMs);
  if (btn) btn.textContent = _timerRunning ? '⏸' : '▶';
  if (modeBtn) modeBtn.textContent = _timerMode === 'stopwatch' ? '⏱ SW' : '⬇ CD';
  disp.style.color = (_timerMode === 'countdown' && _timerMs < 10000 && _timerMs > 0)
    ? '#ff6b6b' : 'rgba(238,238,255,0.9)';
}

function _timerTick() {
  const now = Date.now();
  const delta = now - _timerLast;
  _timerLast = now;
  if (_timerMode === 'stopwatch') {
    _timerMs += delta;
  } else {
    _timerMs = Math.max(0, _timerMs - delta);
    if (_timerMs === 0) {
      _timerRunning = false;
      clearInterval(_timerRef);
      showBubble("Time's up! ⏰", 4000);
      setMood('surprised', 3000);
    }
  }
  _timerRender();
}

function timerToggle() {
  if (_timerRunning) {
    _timerRunning = false;
    clearInterval(_timerRef);
  } else {
    if (_timerMode === 'countdown' && _timerMs === 0) {
      // read from input
      const inp = document.getElementById('timer-cd-input');
      if (inp) {
        const parts = inp.value.split(':').map(Number);
        const m = parts[0] || 0, s = parts[1] || 0;
        _timerMs = (m * 60 + s) * 1000;
      }
      if (_timerMs <= 0) return;
    }
    _timerRunning = true;
    _timerLast = Date.now();
    _timerRef = setInterval(_timerTick, 50);
  }
  _timerRender();
}

function timerReset() {
  _timerRunning = false;
  clearInterval(_timerRef);
  _timerMs = 0;
  _timerRender();
}

function timerSwitchMode() {
  _timerRunning = false;
  clearInterval(_timerRef);
  _timerMs = 0;
  _timerMode = _timerMode === 'stopwatch' ? 'countdown' : 'stopwatch';
  const cdRow = document.getElementById('timer-cd-row');
  if (cdRow) cdRow.style.display = _timerMode === 'countdown' ? 'flex' : 'none';
  _timerRender();
}

function initTimer() {
  _timerRender();
}
