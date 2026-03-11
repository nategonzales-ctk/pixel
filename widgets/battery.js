// ══════════════════════════════════════════════════
//  BATTERY WIDGET
//  Uses bridge GET /battery, falls back to navigator.getBattery()
// ══════════════════════════════════════════════════
function _batteryRender(pct, charging, minutesLeft) {
  const panel = document.getElementById('battery-widget');
  const fill  = document.getElementById('bat-fill');
  const label = document.getElementById('bat-label');
  const icon  = document.getElementById('bat-icon');
  if (!panel) return;

  panel.classList.add('visible');
  const p = Math.round(Math.min(100, Math.max(0, pct)));

  if (fill) {
    fill.style.width = p + '%';
    fill.style.background = p > 50 ? '#55ee88' : p > 20 ? '#ffcc44' : '#ff5555';
  }

  if (label) {
    let txt = p + '%';
    if (minutesLeft != null && minutesLeft > 0) {
      const h = Math.floor(minutesLeft / 60);
      const m = minutesLeft % 60;
      txt += h > 0 ? ` · ${h}h ${m}m` : ` · ${m}m`;
    }
    label.textContent = txt;
  }

  if (icon) icon.textContent = charging ? '⚡' : (p < 15 ? '🪫' : '🔋');
}

async function _fetchBattery() {
  // Try bridge first
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`${BRIDGE_URL}/battery`, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const d = await res.json();
      if (d.percent != null) {
        _batteryRender(d.percent, d.isCharging, d.timeRemaining);
        return;
      }
    }
  } catch {}

  // Fallback: browser battery API
  if (navigator.getBattery) {
    try {
      const bat = await navigator.getBattery();
      const mins = bat.dischargingTime !== Infinity ? Math.round(bat.dischargingTime / 60) : null;
      _batteryRender(bat.level * 100, bat.charging, mins);
    } catch {}
  }
}

function initBattery() {
  _fetchBattery();
  setInterval(_fetchBattery, 30000);
}
