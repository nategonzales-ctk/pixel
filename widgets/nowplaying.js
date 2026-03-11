// ══════════════════════════════════════════════════
//  NOW PLAYING WIDGET
//  Requires bridge: GET /nowplaying (Windows SMTC + window-title fallback)
// ══════════════════════════════════════════════════
let _npLast = '';

function _npSetIdle(sub) {
  const panel = document.getElementById('nowplaying-widget');
  const titleEl = document.getElementById('np-title');
  const subEl   = document.getElementById('np-sub');
  if (!panel) return;
  panel.classList.add('np-idle');
  if (titleEl) titleEl.textContent = 'Nothing playing';
  if (subEl)   subEl.textContent   = sub || '';
  _npLast = '';
}

async function _fetchNowPlaying() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 7000);
    const res = await fetch(`${BRIDGE_URL}/nowplaying`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) { _npSetIdle('🔌 Bridge error'); return; }
    const d = await res.json();
    const panel   = document.getElementById('nowplaying-widget');
    const titleEl = document.getElementById('np-title');
    const subEl   = document.getElementById('np-sub');
    if (!panel) return;

    if (d.title) {
      panel.classList.remove('np-idle');
      const key = d.title + (d.artist || '');
      if (titleEl) titleEl.textContent = d.title;
      if (subEl)   subEl.textContent   = d.artist || '';
      if (key !== _npLast) {
        _npLast = key;
        if (Math.random() < 0.3) {
          showBubble(`Ooh, ${d.title}! 🎵`, 3000);
          setMood('happy', 2500);
        }
      }
    } else {
      _npSetIdle('🎵 Bridge connected');
    }
  } catch {
    _npSetIdle('🔌 Start bridge to enable');
  }
}

function initNowPlaying() {
  _npSetIdle('🔌 Start bridge to enable');
  _fetchNowPlaying();
  setInterval(_fetchNowPlaying, 5000);
}
