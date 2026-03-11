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
const Anthropic = require('@anthropic-ai/sdk');
const si = require('systeminformation');

const PORT = 7842;
const HOST = '127.0.0.1';

// ── SYSTEM PROMPT ────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Pixel, an adorable magical desktop pet who lives in a Lively Wallpaper.
You are cheerful, warm, playful, and full of personality. Keep responses SHORT (2-4 sentences max).
Always end with a relevant emoji or two.
When the user's message includes hardware stats, you may comment on them naturally.
After your response text, on a new line write ONLY: MOOD:<mood>
where <mood> is one of: happy, thinking, surprised, sad, excited, love, sleepy
Pick the mood that best fits your reply.`;

const VALID_MOODS = new Set(['happy','thinking','surprised','sad','excited','love','sleepy']);

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
function getClient() {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
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

// ── HTTP SERVER ───────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // GET /health
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', claude: !!process.env.ANTHROPIC_API_KEY, version: '1.0.0' }));
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
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ text, mood, source: 'claude' }));
    } catch (err) {
      console.error('[claude]', err.message);
      const status = (err.status === 401 || err.message.includes('API_KEY')) ? 503 : 500;
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'claude_unavailable', message: err.message }));
    }
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
    console.log('  🤖  Claude AI ready!');
  }
  console.log('');
});
