// ══════════════════════════════════════════════════
//  TOP PROCESSES WIDGET
//  Requires bridge: GET /processes
// ══════════════════════════════════════════════════
async function _fetchProcesses() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(`${BRIDGE_URL}/processes`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return;
    const d = await res.json();
    const list  = document.getElementById('proc-list');
    const panel = document.getElementById('processes-widget');
    if (!list) return;
    list.innerHTML = '';
    (d.list || []).slice(0, 5).forEach(p => {
      const row = document.createElement('div');
      row.className = 'proc-row';

      const name = document.createElement('span');
      name.className = 'proc-name';
      name.textContent = (p.name || '').replace('.exe', '').slice(0, 14);

      const bar = document.createElement('div');
      bar.className = 'proc-bar-wrap';
      const fill = document.createElement('div');
      fill.className = 'proc-bar-fill';
      fill.style.width = Math.min(p.pcpu || 0, 100) + '%';
      bar.appendChild(fill);

      const pct = document.createElement('span');
      pct.className = 'proc-pct';
      pct.textContent = (p.pcpu || 0).toFixed(1) + '%';

      row.appendChild(name);
      row.appendChild(bar);
      row.appendChild(pct);
      list.appendChild(row);
    });
    if (panel) panel.classList.add('visible');
  } catch { /* bridge not running */ }
}

function initProcesses() {
  _fetchProcesses();
  setInterval(_fetchProcesses, 5000);
}
