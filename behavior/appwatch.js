// ── App Watch behavior ──
// Pet reacts when the user switches apps. Polls the bridge /activewindow endpoint.
// Detects foreground window changes and shows contextual reactions.

window.BEHAVIOR_REGISTRY = window.BEHAVIOR_REGISTRY || [];

let _awLastProcess = '';
let _awLastTitle = '';
let _awLastReaction = 0;
let _awPollTimer = null;
let _awCooldown = 0; // don't spam reactions

// App categories with pet reactions
const _APP_REACTIONS = {
  // Browsers
  chrome:    { icon: '🌐', mood: 'happy',    msgs: ['Browsing time! 🌐', 'What are we looking at? 👀', 'Ooh, the internet! ✨'] },
  msedge:    { icon: '🌐', mood: 'happy',    msgs: ['Edge, nice choice! 🌐', 'Browsing the web~ ✨', 'What are we searching? 👀'] },
  firefox:   { icon: '🦊', mood: 'happy',    msgs: ['Firefox! Let\'s explore! 🦊', 'Browsing time! 🌐', 'What are we looking at? 👀'] },
  brave:     { icon: '🦁', mood: 'happy',    msgs: ['Brave browser! 🦁', 'Let\'s surf the web! 🌐'] },
  opera:     { icon: '🌐', mood: 'happy',    msgs: ['Opera! Fancy! 🎭', 'Browsing time! 🌐'] },
  vivaldi:   { icon: '🌐', mood: 'happy',    msgs: ['Vivaldi! 🎵', 'Nice browser choice! 🌐'] },

  // Code editors
  Code:      { icon: '💻', mood: 'thinking', msgs: ['Coding time! 💻', 'Let\'s build something! 🛠️', 'VS Code! Time to code! ⌨️', 'What are we making? 🤔'] },
  cursor:    { icon: '💻', mood: 'thinking', msgs: ['Cursor! AI coding! 🤖', 'Let\'s code with AI! 💻'] },
  devenv:    { icon: '💻', mood: 'thinking', msgs: ['Visual Studio! Serious coding! 💻', 'Time to build! 🏗️'] },
  sublime_text: { icon: '✏️', mood: 'thinking', msgs: ['Sublime Text! Clean coding! ✏️'] },
  notepad:   { icon: '📝', mood: 'thinking', msgs: ['Taking notes? 📝', 'Notepad! Simple and clean! ✨'] },
  'notepad++': { icon: '📝', mood: 'thinking', msgs: ['Notepad++! Let\'s edit! 📝'] },
  WindowsTerminal: { icon: '⌨️', mood: 'thinking', msgs: ['Terminal time! ⌨️', 'Command line! Hacker mode! 🖥️'] },
  powershell: { icon: '⌨️', mood: 'thinking', msgs: ['PowerShell! 💪', 'Terminal power! ⌨️'] },
  cmd:       { icon: '⌨️', mood: 'thinking', msgs: ['Command prompt! Old school! 🖥️'] },

  // Communication
  Discord:   { icon: '💬', mood: 'excited',  msgs: ['Discord! Chatting with friends? 💬', 'Who are we talking to? 🎮', 'Gaming chat! 🎯'] },
  Telegram:  { icon: '💬', mood: 'happy',    msgs: ['Telegram! Got messages? 💌', 'Who\'s texting? 💬'] },
  slack:     { icon: '💬', mood: 'happy',    msgs: ['Slack! Work chat! 💼', 'Team messages! 💬'] },
  teams:     { icon: '💬', mood: 'happy',    msgs: ['Teams! Meeting time? 📹', 'Work call? 💼'] },
  Zoom:      { icon: '📹', mood: 'surprised',msgs: ['Zoom! Video call! 📹', 'Meeting time! Let me be quiet 🤫'] },
  WhatsApp:  { icon: '💬', mood: 'happy',    msgs: ['WhatsApp! Messages! 💌', 'Who\'s chatting? 💬'] },

  // Games
  steam:     { icon: '🎮', mood: 'excited',  msgs: ['Steam! Game time?! 🎮', 'Let\'s play! 🕹️', 'What are we playing? 🎯'] },
  EpicGamesLauncher: { icon: '🎮', mood: 'excited', msgs: ['Epic Games! Let\'s play! 🎮'] },
  Roblox:    { icon: '🎮', mood: 'excited',  msgs: ['Roblox! Let\'s goooo! 🎮', 'Game time! 🕹️'] },
  Minecraft: { icon: '⛏️', mood: 'excited',  msgs: ['Minecraft! Let\'s mine! ⛏️', 'Time to build! 🏠'] },
  javaw:     { icon: '🎮', mood: 'excited',  msgs: ['Java game? Minecraft? 🎮', 'Gaming time! 🕹️'] },
  GTA5:      { icon: '🎮', mood: 'excited',  msgs: ['GTA! Drive safe! 🚗💨'] },
  Fortnite:  { icon: '🎮', mood: 'excited',  msgs: ['Fortnite! Victory Royale! 🏆'] },
  Valorant:  { icon: '🎯', mood: 'excited',  msgs: ['Valorant! Let\'s go! 🎯', 'Time to clutch! 💪'] },
  LeagueClient: { icon: '🎮', mood: 'excited', msgs: ['League of Legends! GLHF! 🎮'] },

  // Media
  Spotify:   { icon: '🎵', mood: 'happy',    msgs: ['Spotify! Music time! 🎵', 'What are we listening to? 🎶', 'Tunes! 🎧'] },
  vlc:       { icon: '🎬', mood: 'happy',    msgs: ['VLC! Movie time? 🎬', 'Watching something? 🍿'] },
  IINA:      { icon: '🎬', mood: 'happy',    msgs: ['Movie time! 🎬🍿'] },

  // Creative
  Photoshop: { icon: '🎨', mood: 'excited',  msgs: ['Photoshop! Art time! 🎨', 'Creating something beautiful! ✨'] },
  Illustrator: { icon: '🎨', mood: 'excited', msgs: ['Illustrator! Design time! 🎨'] },
  Figma:     { icon: '🎨', mood: 'excited',  msgs: ['Figma! Designing! ✨', 'UI time! 🎨'] },
  blender:   { icon: '🎨', mood: 'excited',  msgs: ['Blender! 3D art! 🎨', 'Creating something cool! ✨'] },
  'clip studio': { icon: '🎨', mood: 'excited', msgs: ['Drawing time! 🎨✨'] },

  // Productivity
  WINWORD:   { icon: '📄', mood: 'thinking', msgs: ['Word! Writing time! 📄', 'What are we writing? ✍️'] },
  EXCEL:     { icon: '📊', mood: 'thinking', msgs: ['Excel! Spreadsheet time! 📊', 'Numbers! 🔢'] },
  POWERPNT:  { icon: '📊', mood: 'thinking', msgs: ['PowerPoint! Presentation time! 📊', 'Slides! ✨'] },
  Obsidian:  { icon: '📝', mood: 'thinking', msgs: ['Obsidian! Notes time! 📝', 'Knowledge base! 🧠'] },
  Notion:    { icon: '📝', mood: 'thinking', msgs: ['Notion! Organizing! 📝', 'Planning! 📋'] },

  // File manager
  explorer:  { icon: '📁', mood: 'happy',    msgs: ['File Explorer! Looking for something? 📁', 'Browsing files! 📂'] },
};

// Title-based detection for web apps in browsers
const _TITLE_PATTERNS = [
  { pattern: /youtube/i,       icon: '📺', mood: 'happy',    msgs: ['YouTube! Video time! 📺', 'What are we watching? 🍿', 'Ooh, YouTube! 🎬'] },
  { pattern: /twitch/i,        icon: '📺', mood: 'excited',  msgs: ['Twitch! Stream time! 📺', 'Who are we watching? 🎮'] },
  { pattern: /netflix/i,       icon: '🎬', mood: 'happy',    msgs: ['Netflix! Movie night! 🎬🍿', 'Chill time! 📺'] },
  { pattern: /github/i,        icon: '💻', mood: 'thinking', msgs: ['GitHub! Code time! 💻', 'Checking repos! 🔧'] },
  { pattern: /stackoverflow/i, icon: '💻', mood: 'thinking', msgs: ['Stack Overflow! Debugging? 🐛', 'Finding answers! 🔍'] },
  { pattern: /chatgpt/i,       icon: '🤖', mood: 'surprised',msgs: ['ChatGPT?! Hey, I\'m right here! 😤', 'Another AI? I\'m jealous! 💔', 'Am I not enough?! 😢'] },
  { pattern: /claude\.ai/i,    icon: '🤖', mood: 'love',     msgs: ['Oh, that\'s my family! 💜', 'Claude! A relative! ✨', 'Say hi for me! 🥰'] },
  { pattern: /reddit/i,        icon: '📱', mood: 'happy',    msgs: ['Reddit! Scrolling time! 📱', 'What subreddit? 👀'] },
  { pattern: /twitter|x\.com/i,icon: '🐦', mood: 'happy',    msgs: ['Twitter/X! What\'s trending? 🐦', 'Scrolling the feed! 📱'] },
  { pattern: /instagram/i,     icon: '📸', mood: 'happy',    msgs: ['Instagram! Pretty pictures! 📸', 'Scrolling the gram! ✨'] },
  { pattern: /facebook/i,      icon: '📱', mood: 'happy',    msgs: ['Facebook! Social time! 📱'] },
  { pattern: /tiktok/i,        icon: '📱', mood: 'excited',  msgs: ['TikTok! Short videos! 📱', 'Don\'t scroll too long! 😄'] },
  { pattern: /google docs/i,   icon: '📄', mood: 'thinking', msgs: ['Google Docs! Writing! ✍️'] },
  { pattern: /google sheets/i, icon: '📊', mood: 'thinking', msgs: ['Google Sheets! Numbers! 📊'] },
  { pattern: /gmail/i,         icon: '📧', mood: 'happy',    msgs: ['Gmail! Got mail? 📧', 'Checking emails! 💌'] },
  { pattern: /amazon/i,        icon: '🛒', mood: 'excited',  msgs: ['Amazon! Shopping! 🛒', 'What are we buying? 💰'] },
  { pattern: /spotify/i,       icon: '🎵', mood: 'happy',    msgs: ['Spotify in the browser! 🎵', 'Music time! 🎶'] },
  // Explorer window titles
  { pattern: /recycle bin/i,   icon: '🗑️', mood: 'surprised',msgs: ['Recycle Bin! Cleaning up? 🗑️', 'Taking out the trash! 🧹', 'What did you delete? 👀'] },
  { pattern: /downloads/i,     icon: '📥', mood: 'happy',    msgs: ['Downloads! Got something new? 📥', 'Checking downloads! 📦'] },
  { pattern: /desktop/i,       icon: '🖥️', mood: 'happy',    msgs: ['Browsing the desktop! 🖥️', 'That\'s my home! 🏠'] },
  { pattern: /documents/i,     icon: '📄', mood: 'thinking', msgs: ['Documents folder! 📄', 'Looking for something? 🔍'] },
  { pattern: /pictures|photos/i,icon:'📸', mood: 'happy',    msgs: ['Pictures! Ooh, show me! 📸', 'Photo time! 🖼️'] },
  { pattern: /videos|movies/i, icon: '🎬', mood: 'happy',    msgs: ['Videos folder! Movie time? 🎬', 'What are we watching? 🍿'] },
  { pattern: /music/i,         icon: '🎵', mood: 'happy',    msgs: ['Music folder! 🎵', 'What tunes do you have? 🎶'] },
];

function _awGetReaction(processName, title) {
  // Check title patterns first (catches web apps in browsers)
  for (const tp of _TITLE_PATTERNS) {
    if (tp.pattern.test(title)) return tp;
  }
  // Then check process name
  const pLower = (processName || '').toLowerCase();
  for (const [key, val] of Object.entries(_APP_REACTIONS)) {
    if (pLower === key.toLowerCase() || pLower.includes(key.toLowerCase())) return val;
  }
  return null;
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
    if (!reaction) return;

    _awCooldown = now + 15000;
    const msg = reaction.msgs[Math.floor(Math.random() * reaction.msgs.length)];
    showBubble(msg, 5000);
    setMood(reaction.mood, 5000);
  } catch {
    // Bridge down or timeout — silently ignore
  }
}

// Start/stop polling based on bridge status
function _awStartPolling() {
  if (_awPollTimer) return;
  _awPollTimer = setInterval(_awPoll, 3000); // poll every 3s
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
