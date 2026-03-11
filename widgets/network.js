// ══════════════════════════════════════════════════
//  NETWORK SPEED WIDGET
//  Requires bridge: GET /network
// ══════════════════════════════════════════════════
function _netFmt(bytesPerSec) {
  if (bytesPerSec == null) return '—';
  if (bytesPerSec < 1024)       return bytesPerSec.toFixed(0) + ' B/s';
  if (bytesPerSec < 1048576)    return (bytesPerSec / 1024).toFixed(1) + ' KB/s';
  return (bytesPerSec / 1048576).toFixed(2) + ' MB/s';
}

async function _fetchNetwork() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2000);
    const res = await fetch(`${BRIDGE_URL}/network`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return;
    const d = await res.json();
    const up   = document.getElementById('net-up');
    const down = document.getElementById('net-down');
    const panel = document.getElementById('network-widget');
    if (up)    up.textContent   = _netFmt(d.tx_sec);
    if (down)  down.textContent = _netFmt(d.rx_sec);
    if (panel) panel.classList.add('visible');
  } catch { /* bridge not running */ }
}

function initNetwork() {
  _fetchNetwork();
  setInterval(_fetchNetwork, 2000);
}
