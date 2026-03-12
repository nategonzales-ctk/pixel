// ══════════════════════════════════════════════════
//  STICKY NOTE WIDGET
//  Freeform text pad with color presets. Auto-saves.
// ══════════════════════════════════════════════════
const STICKY_KEY = 'pixelSticky';
const STICKY_COLORS = [
  { bg: 'rgba(255,230,100,0.13)', border: 'rgba(255,210,0,0.35)',  name: 'yellow' },
  { bg: 'rgba(255,120,160,0.13)', border: 'rgba(255,100,140,0.35)', name: 'pink' },
  { bg: 'rgba(80,220,180,0.13)',  border: 'rgba(60,200,160,0.35)',  name: 'mint' },
  { bg: 'rgba(160,120,255,0.13)', border: 'rgba(140,100,255,0.35)', name: 'lavender' },
];
let _stickyColor = 0;

function _stickyLoad() {
  try {
    const d = JSON.parse(localStorage.getItem(STICKY_KEY));
    if (d) {
      const ta = document.getElementById('sticky-textarea');
      if (ta && d.text !== undefined) ta.value = d.text;
      _stickyColor = d.color || 0;
    }
  } catch {}
}

function _stickyApplyColor() {
  const c  = STICKY_COLORS[_stickyColor] || STICKY_COLORS[0];
  const el = document.getElementById('sticky-widget');
  if (el) {
    el.style.background = c.bg;
    el.style.borderColor = c.border;
  }
}

function stickySave() {
  const ta = document.getElementById('sticky-textarea');
  localStorage.setItem(STICKY_KEY, JSON.stringify({
    text:  ta ? ta.value : '',
    color: _stickyColor,
  }));
}

function stickySetColor(i) {
  _stickyColor = i;
  _stickyApplyColor();
  stickySave();
  // update active dot
  document.querySelectorAll('.sticky-dot').forEach((d, idx) => {
    d.classList.toggle('active', idx === i);
  });
  if (typeof showBubble === 'function') {
    const c = STICKY_COLORS[i];
    const msgs = [`Ooh, ${c ? c.name : 'new color'}! 🎨`, 'Pretty! ✨', 'Color changed! 🌈'];
    showBubble(msgs[Math.floor(Math.random() * msgs.length)], 2500);
    setMood('happy', 2000);
  }
}

function initSticky() {
  _stickyLoad();
  _stickyApplyColor();
  // mark active dot
  document.querySelectorAll('.sticky-dot').forEach((d, i) => {
    d.classList.toggle('active', i === _stickyColor);
  });
  const ta = document.getElementById('sticky-textarea');
  if (ta) ta.addEventListener('input', stickySave);
}
