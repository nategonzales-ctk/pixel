// ══════════════════════════════════════════════════
//  APPEARANCE — theme, font, accent, chat opacity
//  Depends on: THEME_REGISTRY (themes/*)
//              BACKGROUND_REGISTRY (backgrounds/*)
//              FONTS (themes/index.js)
//              STARS, NEBULAS (main script)
//              currentBgScene (backgrounds/index.js)
//              settingsPanelOpen (settings.js)
// ══════════════════════════════════════════════════
const APPEARANCE_KEY = 'appearanceSettings';
let appearanceOpen = false;
let bgGradTop = '#05050e', bgGradBot = '#0d0d1a';
let bgNebulaColors = ['rgba(217,102,255,','rgba(0,229,255,','rgba(105,255,71,'];

function hexToRgba(hex, alpha) {
  const n = parseInt(hex.replace('#',''), 16);
  return `rgba(${n>>16},${(n>>8)&255},${n&255},${alpha})`;
}

function _getTheme(id) {
  const reg = window.THEME_REGISTRY || [];
  return reg.find(t => t.id === id)
      || reg.find(t => t.id === 'midnight')
      || reg[0]
      || {};
}

function applyAppearance(cfg) {
  const r = document.documentElement;
  const t = _getTheme(cfg.theme);
  const accent = cfg.accent || t.accent;
  r.style.setProperty('--bg',       t.bg);
  r.style.setProperty('--surface',  t.surface);
  r.style.setProperty('--surface2', t.surface2);
  r.style.setProperty('--accent',   accent);
  r.style.setProperty('--accent2',  t.accent2);
  r.style.setProperty('--text',     t.text);
  r.style.setProperty('--text-dim', hexToRgba(t.text, 0.42));
  r.style.setProperty('--glow',     hexToRgba(accent, 0.4));
  bgGradTop = t.bgTop; bgGradBot = t.bgBot;
  bgNebulaColors = t.nebula;
  const sc = t.stars;
  STARS.forEach(s => { s.col = sc[0|Math.random()*sc.length]; });
  NEBULAS.forEach(n => { n.col = bgNebulaColors[0|Math.random()*bgNebulaColors.length]; });
  const font = cfg.font || 'Nunito';
  document.body.style.fontFamily = `'${font}', sans-serif`;
  const op = cfg.chatOpacity !== undefined ? cfg.chatOpacity : 0.97;
  const rgb = `${parseInt(t.bg.slice(1,3),16)},${parseInt(t.bg.slice(3,5),16)},${parseInt(t.bg.slice(5,7),16)}`;
  r.style.setProperty('--chat-panel-bg', `rgba(${rgb},${op})`);
}

function saveAppearance(cfg) {
  localStorage.setItem(APPEARANCE_KEY, JSON.stringify(cfg));
}

function loadAppearanceCfg() {
  try { return JSON.parse(localStorage.getItem(APPEARANCE_KEY)) || {}; } catch(e) { return {}; }
}

function initAppearance() {
  const cfg = loadAppearanceCfg();
  if (!cfg.theme) cfg.theme = 'midnight';
  if (!cfg.font)  cfg.font  = 'Nunito';
  if (cfg.chatOpacity === undefined) cfg.chatOpacity = 0.97;
  if (cfg.bgScene) currentBgScene = cfg.bgScene;
  applyAppearance(cfg);
}

function openAppearance() {
  appearanceOpen = true;
  settingsPanelOpen = false;
  document.getElementById('settings-panel').classList.remove('open');

  const cfg = loadAppearanceCfg();
  if (!cfg.theme) cfg.theme = 'midnight';
  if (!cfg.font)  cfg.font  = 'Nunito';
  if (cfg.chatOpacity === undefined) cfg.chatOpacity = 0.97;
  if (cfg.bgScene) currentBgScene = cfg.bgScene;

  // Build background scene grid from BACKGROUND_REGISTRY
  const bgGrid = document.getElementById('bg-scene-grid');
  bgGrid.innerHTML = '';
  (window.BACKGROUND_REGISTRY || []).forEach(sc => {
    const btn = document.createElement('button');
    btn.className = 'bg-scene-btn' + (currentBgScene === sc.id ? ' active' : '');
    btn.dataset.sceneId = sc.id;
    btn.innerHTML = `<div class="bg-scene-icon">${sc.icon}</div><div class="bg-scene-name">${sc.name}</div>`;
    btn.onclick = () => {
      currentBgScene = sc.id;
      cfg.bgScene = sc.id;
      bgGrid.querySelectorAll('.bg-scene-btn').forEach(b => b.classList.toggle('active', b.dataset.sceneId === sc.id));
      saveAppearance(cfg);
    };
    bgGrid.appendChild(btn);
  });

  // Build theme grid from THEME_REGISTRY
  const grid = document.getElementById('theme-grid');
  grid.innerHTML = '';
  (window.THEME_REGISTRY || []).forEach(th => {
    const btn = document.createElement('button');
    btn.className = 'theme-btn' + (cfg.theme === th.id ? ' active' : '');
    btn.dataset.themeId = th.id;
    btn.innerHTML = `<div class="theme-swatch" style="background:${th.bg};border:2px solid ${th.accent}">${th.emoji}</div><div class="theme-name">${th.name}</div>`;
    btn.onclick = () => {
      cfg.theme = th.id; cfg.accent = th.accent;
      document.getElementById('ap-accent').value = th.accent;
      grid.querySelectorAll('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.themeId === th.id));
      applyAppearance(cfg); saveAppearance(cfg);
    };
    grid.appendChild(btn);
  });

  // Build font grid
  const fg = document.getElementById('font-grid');
  fg.innerHTML = '';
  FONTS.forEach(f => {
    const btn = document.createElement('button');
    btn.className = 'font-btn' + (cfg.font === f.id ? ' active' : '');
    btn.textContent = f.label;
    btn.style.fontFamily = `'${f.id}', sans-serif`;
    btn.dataset.fontId = f.id;
    btn.onclick = () => {
      cfg.font = f.id;
      fg.querySelectorAll('.font-btn').forEach(b => b.classList.toggle('active', b.dataset.fontId === f.id));
      applyAppearance(cfg); saveAppearance(cfg);
    };
    fg.appendChild(btn);
  });

  document.getElementById('ap-accent').value = cfg.accent || _getTheme(cfg.theme).accent || '#d966ff';
  document.getElementById('ap-chat-opacity').value = cfg.chatOpacity;
  document.getElementById('appearance-overlay').classList.add('open');
}

function closeAppearance() {
  appearanceOpen = false;
  document.getElementById('appearance-overlay').classList.remove('open');
}

function onAccentChange(val) {
  const cfg = loadAppearanceCfg();
  cfg.accent = val;
  applyAppearance(cfg); saveAppearance(cfg);
}

function onChatOpacityChange(val) {
  const cfg = loadAppearanceCfg();
  cfg.chatOpacity = parseFloat(val);
  applyAppearance(cfg); saveAppearance(cfg);
}
