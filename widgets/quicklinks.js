// ══════════════════════════════════════════════════
//  QUICK LINKS WIDGET
//  Pinned URLs that open in browser. Max 8 links.
// ══════════════════════════════════════════════════
const QLINKS_KEY = 'pixelQuickLinks';
const QLINKS_MAX = 8;
let _qlinks = [];

function _qlinksLoad() {
  try { _qlinks = JSON.parse(localStorage.getItem(QLINKS_KEY)) || []; } catch { _qlinks = []; }
}
function _qlinksSave() {
  localStorage.setItem(QLINKS_KEY, JSON.stringify(_qlinks));
}

function _qlinksRender() {
  const list = document.getElementById('qlinks-list');
  const form = document.getElementById('qlinks-form');
  if (!list) return;
  list.innerHTML = '';

  if (_qlinks.length === 0) { /* empty — just show add form */ }

  _qlinks.forEach((lk, i) => {
    const row = document.createElement('div');
    row.className = 'qlinks-row';

    const a = document.createElement('button');
    a.className = 'qlinks-link';
    a.textContent = lk.label;
    a.title = lk.url;
    a.onclick = () => window.open(lk.url, '_blank');

    const del = document.createElement('button');
    del.className = 'qlinks-del';
    del.textContent = '✕';
    del.title = 'Remove';
    del.onclick = () => qlinkDelete(i);

    row.appendChild(a);
    row.appendChild(del);
    list.appendChild(row);
  });

  if (form) form.style.display = _qlinks.length >= QLINKS_MAX ? 'none' : '';
}

function qlinkAdd() {
  const lbl = document.getElementById('qlinks-label-inp');
  const url = document.getElementById('qlinks-url-inp');
  if (!lbl || !url || !lbl.value.trim() || !url.value.trim()) return;
  let href = url.value.trim();
  if (!/^https?:\/\//i.test(href)) href = 'https://' + href;
  _qlinks.push({ label: lbl.value.trim(), url: href });
  lbl.value = ''; url.value = '';
  _qlinksSave();
  _qlinksRender();
  if (typeof showBubble === 'function') {
    const msgs = ['Link saved! 🔗', 'Bookmarked! ✨', 'Quick access added! 📌', 'Nice link! 🌐'];
    showBubble(msgs[Math.floor(Math.random() * msgs.length)], 3000);
    setMood('happy', 2500);
  }
}

function qlinkDelete(i) {
  _qlinks.splice(i, 1);
  _qlinksSave();
  _qlinksRender();
}

function initQuickLinks() {
  _qlinksLoad();
  _qlinksRender();
  const lbl = document.getElementById('qlinks-label-inp');
  const url = document.getElementById('qlinks-url-inp');
  if (url) url.addEventListener('keydown', e => { if (e.key === 'Enter') qlinkAdd(); });
  if (lbl) lbl.addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('qlinks-url-inp')?.focus(); });
}
