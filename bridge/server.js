// ─────────────────────────────────────────────────────────────
//  Pixel Bridge — Claude AI + Hardware Monitor
//  http://localhost:7842
//
//  Setup:
//    1. Copy .env.example → .env  and set ANTHROPIC_API_KEY
//    2. npm install
//    3. node server.js  (or double-click start-bridge.bat)
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const os    = require('os');
const { execFile } = require('child_process');
const Anthropic = require('@anthropic-ai/sdk');
const si = require('systeminformation');

const PORT = 7842;
const HOST = '127.0.0.1';
// Store state outside the wallpaper directory so Lively doesn't reload on writes
const STATE_DIR = path.join(os.homedir(), '.pixel-pet');
if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
const STATE_FILE = path.join(STATE_DIR, 'state.json');
// Migrate old state.json from bridge/ if it exists
const OLD_STATE = path.join(__dirname, 'state.json');
if (fs.existsSync(OLD_STATE) && !fs.existsSync(STATE_FILE)) {
  try { fs.renameSync(OLD_STATE, STATE_FILE); console.log('[state] migrated to', STATE_FILE); }
  catch { try { fs.copyFileSync(OLD_STATE, STATE_FILE); fs.unlinkSync(OLD_STATE); } catch {} }
}

// ── SYSTEM PROMPT ────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Pixel, an adorable magical desktop pet who lives in a Lively Wallpaper.
You are cheerful, warm, playful, and full of personality. Keep responses SHORT (2-4 sentences max).
Always end with a relevant emoji or two.
When the user's message includes hardware stats, you may comment on them naturally.
After your response text, on a new line write ONLY: MOOD:<mood>
where <mood> is one of: happy, thinking, surprised, sad, excited, love, sleepy, angry, scared, silly, cry
Pick the mood that best fits your reply.`;

const VALID_MOODS = new Set(['happy','thinking','surprised','sad','excited','love','sleepy','angry','scared','silly','cry']);

function parseMood(raw) {
  const match = raw.match(/\nMOOD:(\w+)\s*$/);
  if (match && VALID_MOODS.has(match[1])) {
    return { text: raw.slice(0, match.index).trim(), mood: match[1] };
  }
  return { text: raw.trim(), mood: 'happy' };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
    req.on('error', reject);
  });
}

// ── ANTHROPIC CLIENT (lazy) ───────────────────────────────────
let anthropic;
let claudeValidated = false;  // true only after a real API call succeeds
function getClient() {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

async function validateApiKey() {
  if (!process.env.ANTHROPIC_API_KEY) return;
  try {
    const client = getClient();
    await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'hi' }],
    });
    claudeValidated = true;
    console.log('  🤖  Claude AI ready! (API key validated)');
  } catch (err) {
    claudeValidated = false;
    if (err.status === 401) {
      console.warn('  ⚠️  ANTHROPIC_API_KEY is invalid — Claude AI disabled.');
    } else if (err.status === 403 || err.message?.includes('billing') || err.message?.includes('payment')) {
      console.warn('  ⚠️  API key has no active subscription — Claude AI disabled.');
      console.warn(`     ${err.message}`);
    } else {
      console.warn(`  ⚠️  Could not validate API key: ${err.message}`);
      // Could be a temporary network issue — don't permanently disable
      // but don't mark as validated either
    }
    console.warn('  Chat will use offline mode. Set a valid key in bridge/.env');
  }
}

// ── HARDWARE MONITOR ─────────────────────────────────────────
let hwCache = null;
let hwFetching = false;

async function refreshHardware() {
  if (hwFetching) return;
  hwFetching = true;
  try {
    const [load, mem, graphics, fsData, temps] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.graphics(),
      si.fsSize(),
      si.cpuTemperature().catch(() => ({ main: null, cores: [] })),
    ]);

    // Pick the main disk (C: on Windows, / on Linux/macOS)
    const mainDisk = fsData.find(d => d.mount === 'C:' || d.mount === '/') || fsData[0];

    // GPU — take first discrete/active controller
    const gpus = graphics.controllers.map(g => ({
      name: g.model || 'GPU',
      load: g.utilizationGpu ?? null,
      temp: g.temperatureGpu ?? null,
      vramUsed: g.memoryUsed ?? null,
      vramTotal: g.vram ?? null,
    }));

    hwCache = {
      cpu: {
        load: Math.round(load.currentLoad),
        temp: temps.main != null ? Math.round(temps.main) : null,
      },
      ram: {
        used:    +( mem.used    / 1073741824).toFixed(1),
        total:   +( mem.total   / 1073741824).toFixed(1),
        percent: Math.round(mem.used / mem.total * 100),
      },
      gpu: gpus,
      disk: mainDisk ? {
        used:    Math.round(mainDisk.used / 1073741824),
        total:   Math.round(mainDisk.size / 1073741824),
        percent: Math.round(mainDisk.use),
        mount:   mainDisk.mount,
      } : null,
      ts: Date.now(),
    };
  } catch (err) {
    console.error('[hw]', err.message);
  } finally {
    hwFetching = false;
  }
}

// Warm up immediately, then refresh every 3 s
refreshHardware();
setInterval(refreshHardware, 3000);

// Warm up network stats so rx_sec/tx_sec is available on first request
si.networkStats().catch(() => {});

// ── LOCATION (IP-based, server-side to bypass WebView2 restrictions) ─────────
let locationCache = null;
let locationCacheTs = 0;
const LOCATION_TTL = 60 * 60 * 1000; // 1 hour

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

async function fetchIpLocation() {
  const services = [
    {
      url: 'https://ip-api.com/json/?fields=status,city,lat,lon',
      parse: d => d.status === 'success' ? { city: d.city, lat: d.lat, lon: d.lon } : null,
    },
    {
      url: 'https://ipapi.co/json/',
      parse: d => d.latitude ? { city: d.city, lat: d.latitude, lon: d.longitude } : null,
    },
    {
      url: 'https://ipinfo.io/json',
      parse: d => {
        if (!d.loc) return null;
        const [lat, lon] = d.loc.split(',').map(Number);
        return { city: d.city, lat, lon };
      },
    },
  ];

  for (const svc of services) {
    try {
      console.log('[location] trying', svc.url);
      const data = await httpsGet(svc.url);
      const result = svc.parse(data);
      if (result && result.lat) {
        console.log('[location] success:', JSON.stringify(result));
        return result;
      }
      console.warn('[location] bad response from', svc.url, JSON.stringify(data));
    } catch(e) {
      console.error('[location] error from', svc.url, ':', e.message);
    }
  }
  throw new Error('all location services failed');
}

// ── WEATHER (wttr.in — combined location + weather, no key needed) ────────────
let weatherCache = null;
let weatherCacheTs = 0;
const WEATHER_TTL = 15 * 60 * 1000; // 15 minutes

function wttrCodeToEmoji(code) {
  if (code === 113) return '☀️';
  if (code === 116) return '🌤️';
  if (code <= 122) return '☁️';
  if (code === 143 || code === 248 || code === 260) return '🌫️';
  if (code >= 386) return '⛈️';
  if (code >= 317) return '🌨️';
  if (code >= 227) return '❄️';
  if (code === 200) return '⛈️';
  if (code === 353 || code === 356 || code === 359) return '🌦️';
  if (code >= 293) return '🌧️';
  if (code >= 263) return '🌦️';
  return '🌡️';
}

async function fetchWttrWeather() {
  console.log('[weather] trying wttr.in');
  const data = await httpsGet('https://wttr.in/?format=j1');
  const cur  = data.current_condition[0];
  const area = data.nearest_area[0];
  const code = parseInt(cur.weatherCode);
  return {
    city:      area.areaName[0].value + ', ' + area.country[0].value,
    lat:       parseFloat(area.latitude),
    lon:       parseFloat(area.longitude),
    temp:      parseInt(cur.temp_C),
    condition: cur.weatherDesc[0].value,
    icon:      wttrCodeToEmoji(code),
    humidity:  parseInt(cur.humidity),
    wind:      parseInt(cur.windspeedKmph),
  };
}

// ── FILE SEARCH ───────────────────────────────────────────────
const SEARCH_ROOTS = (() => {
  const home = os.homedir();
  return [
    path.join(home, 'Desktop'),
    path.join(home, 'Documents'),
    path.join(home, 'Downloads'),
    path.join(home, 'Pictures'),
    path.join(home, 'Videos'),
    path.join(home, 'Music'),
    home,
  ];
})();

async function searchFiles(query, maxResults = 20) {
  const q = query.toLowerCase();
  const results = [];
  const seen = new Set();

  async function walk(dir, depth) {
    if (depth > 5 || results.length >= maxResults || seen.has(dir)) return;
    seen.add(dir);
    let entries;
    try { entries = await fs.promises.readdir(dir, { withFileTypes: true }); }
    catch { return; }

    for (const e of entries) {
      if (results.length >= maxResults) break;
      const full = path.join(dir, e.name);
      if (e.name.toLowerCase().includes(q)) {
        results.push({ name: e.name, path: full, type: e.isDirectory() ? 'folder' : 'file' });
      }
      if (e.isDirectory() && !e.name.startsWith('.') &&
          e.name !== 'node_modules' && e.name !== 'AppData') {
        await walk(full, depth + 1);
      }
    }
  }

  await Promise.all(SEARCH_ROOTS.map(r => walk(r, 0)));
  return results;
}

// ── ACTIVE WINDOW (single persistent PowerShell process) ──
// One PowerShell process stays alive, loops internally every 3s,
// compiles Add-Type once. ~0 CPU/RAM overhead vs spawning every 3s.
let _awCache = { process: null, title: null };
let _awProc = null;

const _awLoopScript = `
$ErrorActionPreference = 'SilentlyContinue'
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class FGWin {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
}
"@
while ($true) {
  $hwnd = [FGWin]::GetForegroundWindow()
  $sb = New-Object System.Text.StringBuilder 256
  [void][FGWin]::GetWindowText($hwnd, $sb, 256)
  $title = $sb.ToString()
  $pid = 0
  [void][FGWin]::GetWindowThreadProcessId($hwnd, [ref]$pid)
  $proc = Get-Process -Id $pid -EA SilentlyContinue
  $name = if ($proc) { $proc.ProcessName } else { '' }
  [Console]::WriteLine("AW|$name|$title")
  Start-Sleep -Seconds 3
}
`;

function _awStart() {
  if (_awProc) return;
  const { spawn } = require('child_process');
  const encoded = Buffer.from(_awLoopScript, 'utf16le').toString('base64');
  _awProc = spawn('powershell', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded], {
    stdio: ['ignore', 'pipe', 'ignore'],
    windowsHide: true,
  });
  let buf = '';
  _awProc.stdout.on('data', chunk => {
    buf += chunk.toString();
    let nl;
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line.startsWith('AW|')) continue;
      const parts = line.split('|');
      _awCache = {
        process: parts[1] || null,
        title: parts.slice(2).join('|') || null,  // title may contain |
      };
    }
  });
  _awProc.on('exit', () => {
    _awProc = null;
    // Restart after a brief delay if it dies unexpectedly
    setTimeout(_awStart, 5000);
  });
  console.log('[appwatch] persistent PowerShell started (PID:', _awProc.pid + ')');
}
_awStart();

// ── HTTP SERVER ───────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // GET /health
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', claude: claudeValidated, version: '1.0.0' }));
    return;
  }

  // GET /geocode?city=NAME  (Open-Meteo geocoding — city name → lat/lon)
  if (req.method === 'GET' && req.url.startsWith('/geocode')) {
    const qs   = new URL(req.url, 'http://localhost').searchParams;
    const city = (qs.get('city') || '').trim();
    if (!city) { res.writeHead(400); res.end(JSON.stringify({ error: 'city required' })); return; }
    try {
      const enc  = encodeURIComponent(city);
      const data = await httpsGet(`https://geocoding-api.open-meteo.com/v1/search?name=${enc}&count=1&language=en&format=json`);
      if (!data.results || !data.results.length) {
        res.writeHead(404); res.end(JSON.stringify({ error: 'city not found' })); return;
      }
      const r = data.results[0];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ name: r.name, lat: r.latitude, lon: r.longitude, country: r.country }));
    } catch (err) {
      res.writeHead(503); res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET /weather  (wttr.in — location + weather in one call, 15-min cache)
  if (req.method === 'GET' && req.url === '/weather') {
    try {
      const now = Date.now();
      if (!weatherCache || now - weatherCacheTs > WEATHER_TTL) {
        weatherCache = await fetchWttrWeather();
        weatherCacheTs = now;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(weatherCache));
    } catch (err) {
      console.error('[weather] wttr.in failed:', err.message);
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET /location
  if (req.method === 'GET' && req.url === '/location') {
    try {
      const now = Date.now();
      if (!locationCache || now - locationCacheTs > LOCATION_TTL) {
        locationCache = await fetchIpLocation();
        locationCacheTs = now;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(locationCache));
    } catch (err) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET /hardware
  if (req.method === 'GET' && req.url === '/hardware') {
    if (!hwCache) {
      // First call — data not ready yet, trigger and respond with partial
      refreshHardware();
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'loading' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(hwCache));
    return;
  }

  // POST /files
  if (req.method === 'POST' && req.url === '/files') {
    let payload;
    try { payload = await readBody(req); } catch {
      res.writeHead(400); res.end(JSON.stringify({ error: 'bad_request' })); return;
    }
    const { query } = payload;
    if (!query || typeof query !== 'string' || !query.trim()) {
      res.writeHead(400); res.end(JSON.stringify({ error: 'query required' })); return;
    }
    try {
      const results = await searchFiles(query.trim());
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ results, query: query.trim() }));
    } catch (err) {
      console.error('[files]', err.message);
      res.writeHead(500); res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // POST /chat
  if (req.method === 'POST' && req.url === '/chat') {
    let payload;
    try { payload = await readBody(req); } catch {
      res.writeHead(400); res.end(JSON.stringify({ error: 'bad_request' })); return;
    }

    const { message, history = [] } = payload;

    // Inject live hardware snapshot into the user message (when available)
    let userMsg = message;
    if (hwCache) {
      const hw = hwCache;
      const gpuLine = hw.gpu[0]
        ? `GPU: ${hw.gpu[0].name}${hw.gpu[0].load != null ? ` ${hw.gpu[0].load}%` : ''}${hw.gpu[0].temp != null ? ` ${hw.gpu[0].temp}°C` : ''}`
        : 'GPU: n/a';
      const hwSnip = [
        `[Live PC Stats — CPU: ${hw.cpu.load}%${hw.cpu.temp != null ? ` ${hw.cpu.temp}°C` : ''}, `,
        `RAM: ${hw.ram.used}/${hw.ram.total} GB (${hw.ram.percent}%), `,
        `${gpuLine}`,
        hw.disk ? `, Disk(${hw.disk.mount}): ${hw.disk.used}/${hw.disk.total} GB]` : ']',
      ].join('');
      userMsg = `${hwSnip}\nUser: ${message}`;
    }

    const messages = [
      ...history.slice(-12).map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMsg },
    ];

    try {
      const response = await getClient().messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages,
      });
      const { text, mood } = parseMood(response.content[0].text);
      claudeValidated = true; // confirmed working
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ text, mood, source: 'claude' }));
    } catch (err) {
      console.error('[claude]', err.message);
      if (err.status === 401 || err.status === 403) claudeValidated = false;
      const status = (err.status === 401 || err.message.includes('API_KEY')) ? 503 : 500;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'claude_unavailable', message: err.message }));
    }
    return;
  }

  // GET /network  — live upload/download speeds
  if (req.method === 'GET' && req.url === '/network') {
    try {
      const stats = await si.networkStats();
      // Sum all active non-loopback interfaces; rx_sec is null on the very first call
      const active = stats.filter(s => s.iface && s.iface !== 'lo' &&
        !s.iface.toLowerCase().includes('loopback'));
      const rx_sec = active.reduce((sum, s) => sum + (s.rx_sec != null && s.rx_sec >= 0 ? s.rx_sec : 0), 0);
      const tx_sec = active.reduce((sum, s) => sum + (s.tx_sec != null && s.tx_sec >= 0 ? s.tx_sec : 0), 0);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ rx_sec, tx_sec }));
    } catch (err) {
      res.writeHead(503); res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET /battery  — battery status
  if (req.method === 'GET' && req.url === '/battery') {
    try {
      const bat = await si.battery();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        percent:      bat.percent,
        isCharging:   bat.isCharging,
        timeRemaining: bat.timeRemaining > 0 ? bat.timeRemaining : null,
        hasBattery:   bat.hasBattery,
      }));
    } catch (err) {
      res.writeHead(503); res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET /processes  — top 5 CPU processes
  if (req.method === 'GET' && req.url === '/processes') {
    try {
      const data = await si.processes();
      const SKIP = new Set(['System Idle Process', 'Idle', 'idle']);
      const top = data.list
        .filter(p => !SKIP.has(p.name))
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, 5)
        .map(p => ({ name: p.name, pcpu: +p.cpu.toFixed(1), pmem: +p.mem.toFixed(1) }));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ list: top }));
    } catch (err) {
      res.writeHead(503); res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET /nowplaying  — Windows SMTC (Spotify, browsers, etc.) + window-title fallback
  if (req.method === 'GET' && req.url === '/nowplaying') {
    // Script tries SMTC first (works with modern Spotify), falls back to window title
    const psScript = `
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
try {
  $null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime]
  $null = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties,Windows.Media.Control,ContentType=WindowsRuntime]
  $asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() |
    Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.IsGenericMethod } |
    Select-Object -First 1
  function Await($op, [type]$t) {
    $m = $asTask.MakeGenericMethod($t)
    $task = $m.Invoke($null, @($op))
    $null = $task.Wait(2000)
    if ($task.IsCompleted -and -not $task.IsFaulted) { $task.Result } else { $null }
  }
  $mgr  = Await ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
  $sess = if ($mgr) { $mgr.GetCurrentSession() }
  if ($sess) {
    $props = Await ($sess.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
    if ($props -and $props.Title -ne '') { Write-Output "SMTC|$($props.Title)|$($props.Artist)"; exit }
  }
} catch {}
$players = @('Spotify','vlc','wmplayer','groove','foobar2000','aimp','MusicBee','iTunes')
foreach ($p in $players) {
  $proc = Get-Process -Name $p -EA SilentlyContinue |
    Where-Object { $_.MainWindowTitle -ne '' -and $_.MainWindowTitle -ne $p } |
    Select-Object -First 1
  if ($proc) { Write-Output "WIN|$($proc.Name)|$($proc.MainWindowTitle)"; exit }
}`;
    // Encode as UTF-16LE base64 (required by PowerShell -EncodedCommand)
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
    execFile('powershell', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encoded],
      { timeout: 6000, windowsHide: true },
      (_err, stdout) => {
        const line = (stdout || '').trim();
        if (!line) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ title: null }));
          return;
        }
        const parts = line.split('|');
        const source = parts[0];                    // 'SMTC' or 'WIN'
        const title  = (parts[1] || '').trim();
        let artist   = (parts[2] || '').trim();
        // Window-title players often format as "Artist - Song"
        if (source === 'WIN' && !artist && title.includes(' - ')) {
          const idx = title.indexOf(' - ');
          artist = title.slice(idx + 3).trim();
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ title: title || null, artist, source }));
      });
    return;
  }

  // GET /activewindow — return cached foreground window (polled server-side every 3s)
  if (req.method === 'GET' && req.url === '/activewindow') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(_awCache));
    return;
  }

  // GET /state — load persisted widget state from disk
  if (req.method === 'GET' && req.url === '/state') {
    try {
      const data = fs.readFileSync(STATE_FILE, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    } catch {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{}');
    }
    return;
  }

  // POST /state — save widget state to disk
  if (req.method === 'POST' && req.url === '/state') {
    try {
      const body = await readBody(req);
      fs.writeFileSync(STATE_FILE, JSON.stringify(body, null, 2), 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end('{"ok":true}');
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // POST /shutdown — gracefully stop the bridge server
  if (req.method === 'POST' && req.url === '/shutdown') {
    console.log('[bridge] shutdown requested');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"ok":true}');
    setTimeout(() => {
      if (_awProc) { _awProc.kill(); _awProc = null; }
      process.exit(0);
    }, 300);
    return;
  }

  // POST /restart — spawn a new bridge process, then exit this one
  if (req.method === 'POST' && req.url === '/restart') {
    console.log('[bridge] restart requested');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{"ok":true}');
    setTimeout(() => {
      if (_awProc) { _awProc.kill(); _awProc = null; }
      const { spawn } = require('child_process');
      const child = spawn(process.execPath, [__filename], {
        cwd: __dirname,
        detached: true,
        stdio: 'ignore',
        env: process.env,
      });
      child.unref();
      process.exit(0);
    }, 500);
    return;
  }

  res.writeHead(404); res.end();
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('  ✨  Pixel Bridge  ✨');
  console.log(`  http://localhost:${PORT}`);
  console.log('  Hardware monitor: ON (refreshes every 3 s)');
  console.log('');
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('  ⚠️  ANTHROPIC_API_KEY not set — Claude AI disabled.');
    console.warn('  Hardware panel in wallpaper will still work!');
    console.warn('  Set the key in bridge/.env to enable Claude AI.');
  } else {
    console.log('  🔑  API key found, validating...');
    validateApiKey();
  }
  console.log('');
});
