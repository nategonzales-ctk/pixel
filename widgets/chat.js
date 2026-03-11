// ══════════════════════════════════════════════════
//  CHAT WIDGET
// ══════════════════════════════════════════════════
const chatHistEl = document.getElementById('chat-history');
const chatInput  = document.getElementById('chat-input');
let chatOpen = false;
let chatLog  = [];

function toggleChat() {
  chatOpen = !chatOpen;
  if (chatOpen) _positionChatPanel();
  document.getElementById('chat-panel').classList.toggle('chat-open', chatOpen);
  if (chatOpen) {
    document.getElementById('chat-unread-dot').style.display = 'none';
    setTimeout(() => chatHistEl.scrollTop = chatHistEl.scrollHeight, 50);
    setTimeout(_updatePillArrows, 80);
    chatInput.focus();
  }
}

// Position the chat panel relative to the bubble button based on screen quadrant
function _positionChatPanel() {
  const btn   = document.getElementById('chat-bubble-btn');
  const panel = document.getElementById('chat-panel');
  if (!btn || !panel) return;

  const r   = btn.getBoundingClientRect();
  const gap = 12;
  const vw  = window.innerWidth;
  const vh  = window.innerHeight;
  const PW  = 320; // panel width (matches CSS)

  panel.style.top = panel.style.bottom = panel.style.left = panel.style.right = '';

  const isLeft = (r.left + r.width  / 2) < vw / 2;
  const isTop  = (r.top  + r.height / 2) < vh / 2;

  // Horizontal: align panel edge with button edge, clamped on screen
  const rawLeft = isLeft ? r.left : r.right - PW;
  panel.style.left = Math.max(0, Math.min(vw - PW, rawLeft)) + 'px';

  // Vertical: open away from the nearest edge
  if (isTop) {
    panel.style.top = (r.bottom + gap) + 'px';
  } else {
    panel.style.bottom = (vh - r.top + gap) + 'px';
  }

  // Scale origin anchors to the corner closest to the button
  panel.style.transformOrigin = `${isTop ? 'top' : 'bottom'} ${isLeft ? 'left' : 'right'}`;
}

function markUnread() {
  if (!chatOpen) document.getElementById('chat-unread-dot').style.display = 'block';
}

function chatScroll(by) {
  chatHistEl.scrollBy({ top: by, behavior: 'smooth' });
}

// Drag-to-scroll (works even when mousewheel is swallowed by wallpaper engine)
(function () {
  let startY = 0, startScroll = 0, dragging = false;
  chatHistEl.addEventListener('mousedown', e => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
    dragging = true; startY = e.clientY; startScroll = chatHistEl.scrollTop;
    chatHistEl.classList.add('dragging'); e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    chatHistEl.scrollTop = startScroll - (e.clientY - startY);
  });
  document.addEventListener('mouseup', () => { dragging = false; chatHistEl.classList.remove('dragging'); });
})();

const sendBtn = document.getElementById('send-btn');

function addMessage(role, text) {
  chatLog.push({ role: role === 'user' ? 'user' : 'assistant', content: text });
  const row = document.createElement('div');
  row.className = 'msg-row ' + role;
  if (role === 'pet') {
    const av = document.createElement('div');
    av.className = 'msg-avatar';
    av.textContent = getActivePet()?.avatarEmoji || '🐾';
    row.appendChild(av);
  }
  const bub = document.createElement('div');
  bub.className = 'msg-bubble';
  bub.textContent = text;
  row.appendChild(bub);
  chatHistEl.appendChild(row);
  chatHistEl.scrollTop = chatHistEl.scrollHeight;
  if (role === 'pet') markUnread();
}

function handlePill(text) { chatInput.value = text; sendMessage(); }

function scrollPills(dir) {
  const row = document.getElementById('pill-row');
  if (!row) return;
  row.scrollLeft += dir * 120;
  setTimeout(_updatePillArrows, 150);
}
function _updatePillArrows() {
  const row = document.getElementById('pill-row');
  const l = document.getElementById('pill-arr-l');
  const r = document.getElementById('pill-arr-r');
  if (!row || !l || !r) return;
  l.disabled = row.scrollLeft <= 0;
  r.disabled = row.scrollLeft >= row.scrollWidth - row.clientWidth - 1;
}
// Init arrow state when chat opens
(function() {
  const row = document.getElementById('pill-row');
  if (row) {
    row.addEventListener('scroll', _updatePillArrows);
    setTimeout(_updatePillArrows, 300);
  }
})();

function getChatHistory() { return chatLog.slice(-12); }

// ── File search ───────────────────────────────────
function detectFileSearch(msg) {
  const m = msg.match(/\b(?:find|locate|search\s+for|where\s+is|where'?s)\s+(?:my\s+|the\s+|a\s+)?(.+)/i);
  return m ? m[1].trim() : null;
}

async function handleFileSearch(query) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(`${BRIDGE_URL}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: ctrl.signal,
      body: JSON.stringify({ query })
    });
    clearTimeout(t);
    if (res.ok) {
      const data = await res.json();
      if (data.results.length === 0) {
        addMessage('pet', `Couldn't find anything matching "${query}" in your common folders. 😅`);
        setMood('sad', 3000);
      } else {
        const lines = [`Found ${data.results.length} result${data.results.length > 1 ? 's' : ''} for "${query}" 🔍`];
        data.results.forEach(f => {
          lines.push(`${f.type === 'folder' ? '📁' : '📄'} ${f.name}`);
          lines.push(`   └ ${f.path}`);
        });
        addMessage('pet', lines.join('\n'));
        showBubble(`Found ${data.results.length} file(s)! 📂`, 3000);
        setMood('excited', 3000);
      }
    } else {
      const errBody = await res.json().catch(() => ({ error: 'status ' + res.status }));
      addMessage('pet', `File search error: ${errBody.error || res.status} 😅`);
      setMood('sad', 3000);
    }
  } catch {
    addMessage('pet', "Search timed out! Is the bridge still running? 🔌");
    setMood('thinking', 3000);
  }
}

async function sendMessage() {
  const msg = chatInput.value.trim(); if (!msg) return;
  chatInput.value = ''; chatInput.focus();
  addMessage('user', msg);
  sendBtn.disabled = true; setMood('thinking'); showTyping();

  const fileQuery = detectFileSearch(msg);
  if (fileQuery) {
    if (!isBridgeUp) {
      addMessage('pet', 'File search needs the bridge running! 🔌 Start it to search your PC files.');
      setMood('thinking', 3000);
    } else {
      await handleFileSearch(fileQuery);
    }
    sendBtn.disabled = false;
    return;
  }

  if (!isOnline) await new Promise(r => setTimeout(r, 400 + Math.random() * 500));
  const res = await getAIResponse(msg);
  const short = res.text.length > 110 ? res.text.slice(0, 107) + '…' : res.text;
  showBubble(short, 6000);
  addMessage('pet', res.text);
  setMood(res.mood || 'happy', 5000);
  sendBtn.disabled = false;
}

chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
