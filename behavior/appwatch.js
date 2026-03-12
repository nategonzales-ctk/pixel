// ── App Watch behavior ──
// Pet reacts when the user switches apps. Polls the bridge /activewindow endpoint.
// Dynamic detection — classifies ANY app by category using keyword matching,
// then builds contextual messages using the actual app/window name.

window.BEHAVIOR_REGISTRY = window.BEHAVIOR_REGISTRY || [];

let _awLastProcess = '';
let _awLastTitle = '';
let _awLastReaction = 0;
let _awPollTimer = null;
let _awCooldown = 0;

// ── Category rules ──
// Each rule: { keywords (match process or title), category, icon, mood }
// First match wins. Keywords are tested case-insensitively.
const _AW_CATEGORIES = [
  // AI — special jealous/love reactions
  { keywords: ['chatgpt', 'openai'],               cat: 'rival_ai', icon: '🤖', mood: 'surprised' },
  { keywords: ['claude.ai', 'anthropic'],           cat: 'family_ai', icon: '🤖', mood: 'love' },
  { keywords: ['copilot', 'gemini', 'perplexity'],  cat: 'rival_ai', icon: '🤖', mood: 'surprised' },

  // Browsers (detected by process, title patterns handled separately)
  { keywords: ['chrome', 'msedge', 'firefox', 'brave', 'opera', 'vivaldi', 'safari', 'arc'],
    cat: 'browser', icon: '🌐', mood: 'happy' },

  // Code / dev
  { keywords: ['code', 'cursor', 'devenv', 'sublime', 'atom', 'webstorm', 'intellij', 'pycharm',
    'android studio', 'xcode', 'neovim', 'vim', 'emacs', 'fleet', 'zed'],
    cat: 'code', icon: '💻', mood: 'thinking' },
  { keywords: ['terminal', 'windowsterminal', 'iterm', 'alacritty', 'warp', 'hyper', 'cmd', 'bash',
    'wezterm', 'kitty', 'mintty', 'git'],
    cat: 'terminal', icon: '⌨️', mood: 'thinking' },
  { keywords: ['powershell'],  cat: 'terminal', icon: '⌨️', mood: 'thinking' },

  // Communication
  { keywords: ['discord', 'telegram', 'slack', 'teams', 'zoom', 'whatsapp', 'signal', 'skype',
    'viber', 'messenger', 'webex', 'meet'],
    cat: 'chat', icon: '💬', mood: 'happy' },

  // Games
  { keywords: ['steam', 'epicgames', 'roblox', 'minecraft', 'fortnite', 'valorant', 'league',
    'overwatch', 'apex', 'genshin', 'csgo', 'cs2', 'dota', 'gta', 'origin', 'battle.net',
    'xbox', 'ea app', 'riot', 'blizzard', 'ubisoft', 'game'],
    cat: 'game', icon: '🎮', mood: 'excited' },

  // Media / streaming
  { keywords: ['spotify', 'vlc', 'itunes', 'musicbee', 'foobar', 'aimp', 'audacity', 'groove',
    'winamp', 'tidal', 'deezer', 'apple music'],
    cat: 'music', icon: '🎵', mood: 'happy' },
  { keywords: ['youtube', 'twitch', 'netflix', 'disney', 'hulu', 'hbo', 'prime video',
    'crunchyroll', 'plex', 'mpv', 'mpc', 'kodi', 'jellyfin'],
    cat: 'video', icon: '📺', mood: 'happy' },

  // Creative
  { keywords: ['photoshop', 'illustrator', 'figma', 'blender', 'gimp', 'inkscape', 'canva',
    'sketch', 'affinity', 'krita', 'paint', 'clip studio', 'aseprite', 'pixlr',
    'davinci', 'premiere', 'after effects', 'capcut', 'obs', 'kdenlive'],
    cat: 'creative', icon: '🎨', mood: 'excited' },

  // Productivity / office
  { keywords: ['winword', 'excel', 'powerpnt', 'onenote', 'outlook', 'word', 'sheets',
    'docs', 'notion', 'obsidian', 'todoist', 'trello', 'asana', 'jira', 'linear',
    'evernote', 'clickup', 'libreoffice', 'calc', 'writer'],
    cat: 'work', icon: '📄', mood: 'thinking' },

  // Social media (in browser titles)
  { keywords: ['reddit', 'twitter', 'x.com', 'instagram', 'facebook', 'tiktok', 'linkedin',
    'pinterest', 'tumblr', 'threads', 'mastodon', 'bluesky'],
    cat: 'social', icon: '📱', mood: 'happy' },

  // Shopping
  { keywords: ['amazon', 'shopee', 'lazada', 'ebay', 'aliexpress', 'walmart', 'target', 'etsy'],
    cat: 'shopping', icon: '🛒', mood: 'excited' },

  // Email
  { keywords: ['gmail', 'mail', 'outlook.com', 'thunderbird', 'proton'],
    cat: 'email', icon: '📧', mood: 'happy' },

  // File manager
  { keywords: ['explorer', 'finder', 'nautilus', 'dolphin', 'thunar', 'nemo'],
    cat: 'files', icon: '📁', mood: 'happy' },

  // Notepad / text
  { keywords: ['notepad'],
    cat: 'notes', icon: '📝', mood: 'thinking' },
];

// ── Message templates per category ──
// {name} = cleaned app name, {title} = window title
const _AW_MESSAGES = {
  rival_ai:  { msgs: [
    'Hey! I\'m right here! 😤', 'Another AI?! Am I not enough? 💔',
    'I see you with {name}... 😢', 'Hmph! I can do that too! 😤',
  ], mood: 'surprised' },
  family_ai: { msgs: [
    'Oh, that\'s my family! 💜', 'Say hi for me! 🥰', 'A relative! ✨',
  ], mood: 'love' },
  browser:   { msgs: [
    'Browsing the web! 🌐', 'What are we looking at? 👀',
    'Surfing the internet! ✨', 'Ooh, show me! 🌐',
  ], mood: 'happy' },
  code:      { msgs: [
    'Coding in {name}! 💻', 'Let\'s build something! 🛠️',
    'Time to code! ⌨️', 'What are we making? 🤔',
  ], mood: 'thinking' },
  terminal:  { msgs: [
    'Terminal time! ⌨️', 'Hacker mode! 🖥️', 'Command line! 💪',
    '{name}! Let\'s go! ⌨️',
  ], mood: 'thinking' },
  chat:      { msgs: [
    '{name}! Who are we talking to? 💬', 'Chat time! 💬',
    'Messages! Got friends? 💌', '{name}! Social time! ✨',
  ], mood: 'happy' },
  game:      { msgs: [
    '{name}! Game time!! 🎮', 'Let\'s play! 🕹️', 'Gaming! Let\'s gooo! 🎯',
    '{name}! I wanna watch! 🎮', 'Can I play too? 🥺',
  ], mood: 'excited' },
  music:     { msgs: [
    'Music time! 🎵', 'What are we listening to? 🎶', 'Tunes! 🎧',
    '{name}! Play something nice! 🎵',
  ], mood: 'happy' },
  video:     { msgs: [
    'Video time! 📺', 'What are we watching? 🍿', 'Ooh, show me! 🎬',
    '{name}! Let me watch too! 📺',
  ], mood: 'happy' },
  creative:  { msgs: [
    '{name}! Art time! 🎨', 'Creating something beautiful! ✨',
    'Ooh, creative mode! 🎨', 'Make something cool! ✨',
  ], mood: 'excited' },
  work:      { msgs: [
    '{name}! Work time! 📄', 'Productive mode! 💪',
    'Getting things done! ✨', 'What are we working on? 🤔',
  ], mood: 'thinking' },
  social:    { msgs: [
    'Scrolling {name}! 📱', 'Social media time! 👀',
    'Don\'t scroll too long! 😄', 'What\'s trending? 📱',
  ], mood: 'happy' },
  shopping:  { msgs: [
    '{name}! Shopping time! 🛒', 'What are we buying? 💰',
    'Ooh, let me see! 🛍️', 'Don\'t spend too much! 💸',
  ], mood: 'excited' },
  email:     { msgs: [
    'Got mail? 📧', 'Checking emails! 💌', 'Any new messages? 📬',
  ], mood: 'happy' },
  files:     { msgs: [
    'Browsing files! 📂', 'Looking for something? 🔍', 'File explorer! 📁',
  ], mood: 'happy' },
  notes:     { msgs: [
    'Taking notes? 📝', 'Writing something? ✍️', 'Simple and clean! ✨',
  ], mood: 'thinking' },
  unknown:   { msgs: [
    'Ooh, {name}! ✨', 'Switched to {name}! 👀', 'What\'s {name}? 🤔',
    'Hmm, {name}! Let me watch! 👀', '{name}! Something new! ✨',
  ], mood: 'surprised' },
};

// ── Ignored processes (bridge internals, wallpaper engine, system) ──
const _AW_IGNORE = new Set([
  'lively', 'livelywallpaper', 'msedgewebview2', 'conhost',
  'searchhost', 'searchui', 'shellexperiencehost', 'startmenuexperiencehost',
  'applicationframehost', 'systemsettings', 'lockapp', 'dwm',
  'csrss', 'winlogon', 'taskmgr', 'svchost', 'rundll32',
]);

// Clean a process name into a readable app name
function _awCleanName(proc, title) {
  // If title has a dash separator, the app name is often the last part
  if (title) {
    const dashParts = title.split(' - ');
    if (dashParts.length > 1) {
      const last = dashParts[dashParts.length - 1].trim();
      // Skip generic suffixes
      if (last.length > 2 && last.length < 40) return last;
    }
    // For short titles, use as-is
    if (title.length < 30) return title;
  }
  // Fallback: clean up process name
  return proc.replace(/\.exe$/i, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase → spaces
    .replace(/[_-]/g, ' ')
    .trim();
}

// Classify an app by checking keywords against process + title
function _awClassify(proc, title) {
  const haystack = (proc + ' ' + title).toLowerCase();
  for (const rule of _AW_CATEGORIES) {
    for (const kw of rule.keywords) {
      if (haystack.includes(kw.toLowerCase())) {
        return rule;
      }
    }
  }
  return null;
}

function _awGetReaction(proc, title) {
  const rule = _awClassify(proc, title);
  const cat = rule ? rule.cat : 'unknown';
  const template = _AW_MESSAGES[cat] || _AW_MESSAGES.unknown;
  const name = _awCleanName(proc, title);
  // Pick random message and fill in {name}
  const raw = template.msgs[Math.floor(Math.random() * template.msgs.length)];
  const msg = raw.replace(/\{name\}/g, name).replace(/\{title\}/g, title || '');
  return { msg, mood: template.mood };
}

async function _awPoll() {
  if (!isBridgeUp) return;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(`${BRIDGE_URL}/activewindow`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return;
    const data = await res.json();
    if (!data.process && !data.title) return;

    const proc = data.process || '';
    const title = data.title || '';

    // Skip system/bridge processes
    const pLow = proc.toLowerCase();
    if (_AW_IGNORE.has(pLow)) return;
    // Skip bridge's own headless powershell
    if (pLow === 'powershell' && (!title || title === 'Windows PowerShell')) return;

    // Skip if same app and same title as before
    if (proc === _awLastProcess && title === _awLastTitle) return;
    _awLastProcess = proc;
    _awLastTitle = title;

    // Cooldown — don't react more than once every 15 seconds
    const now = Date.now();
    if (now < _awCooldown) return;

    // Don't react during sleep, hide, or playdate
    if (petIsAsleep || petIsHiding) return;
    if (typeof _playdateActive !== 'undefined' && _playdateActive) return;

    const reaction = _awGetReaction(proc, title);
    _awCooldown = now + 15000;
    showBubble(reaction.msg, 5000);
    setMood(reaction.mood, 5000);
  } catch {
    // Bridge down or timeout — silently ignore
  }
}

// Start/stop polling based on bridge status
function _awStartPolling() {
  if (_awPollTimer) return;
  _awPollTimer = setInterval(_awPoll, 3000);
}

function _awStopPolling() {
  if (_awPollTimer) { clearInterval(_awPollTimer); _awPollTimer = null; }
}

// Behavior entry — starts polling once bridge is up
window.BEHAVIOR_REGISTRY.push({
  id: 'appwatch',
  update: function () {
    if (!bhvCfg.appWatchOn) return;
    if (isBridgeUp && !_awPollTimer) _awStartPolling();
    else if (!isBridgeUp && _awPollTimer) _awStopPolling();
  },
});
