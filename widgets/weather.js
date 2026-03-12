// ══════════════════════════════════════════════════
//  WEATHER + LOCATION WIDGET
//  Priority: 1. Saved manual city  2. Browser geo
//            3. Bridge /location (IP)  4. Bridge /weather (wttr.in)
//  Weather: Open-Meteo (free, no key needed).
// ══════════════════════════════════════════════════

const WMO_CODES = {
  0:  ['☀️',  'Clear sky'],
  1:  ['🌤️', 'Mainly clear'],
  2:  ['⛅',  'Partly cloudy'],
  3:  ['☁️',  'Overcast'],
  45: ['🌫️', 'Foggy'],
  48: ['🌫️', 'Icy fog'],
  51: ['🌦️', 'Light drizzle'],
  53: ['🌦️', 'Drizzle'],
  55: ['🌧️', 'Heavy drizzle'],
  61: ['🌧️', 'Light rain'],
  63: ['🌧️', 'Rainy'],
  65: ['🌧️', 'Heavy rain'],
  71: ['❄️',  'Light snow'],
  73: ['❄️',  'Snowing'],
  75: ['❄️',  'Heavy snow'],
  77: ['🌨️', 'Snow grains'],
  80: ['🌦️', 'Rain showers'],
  81: ['🌧️', 'Heavy showers'],
  82: ['🌧️', 'Violent showers'],
  85: ['❄️',  'Snow showers'],
  86: ['❄️',  'Heavy snow showers'],
  95: ['⛈️',  'Thunderstorm'],
  96: ['⛈️',  'Thunderstorm + hail'],
  99: ['⛈️',  'Heavy thunderstorm'],
};

function _wmoInfo(code) {
  return WMO_CODES[code] || WMO_CODES[1] || ['🌡️', 'Unknown'];
}

const WEATHER_LOC_KEY = 'weatherManualCity';
let _weatherCoords = null;
let _locationName  = null;
let _refreshTimer  = null;

function _setWeatherStatus(text) {
  const el = document.getElementById('weather-desc');
  if (el) el.textContent = text;
  console.log('[weather]', text);
}

function _renderWeather(data, city) {
  const cur = data.current;
  const [icon, desc] = _wmoInfo(cur.weather_code);
  const temp     = Math.round(cur.temperature_2m);
  const humidity = Math.round(cur.relative_humidity_2m);
  const wind     = Math.round(cur.wind_speed_10m);

  const elLoc  = document.getElementById('weather-location');
  const elIcon = document.getElementById('weather-icon');
  const elTemp = document.getElementById('weather-temp');
  const elDesc = document.getElementById('weather-desc');
  const elHum  = document.getElementById('weather-humidity');
  const elWnd  = document.getElementById('weather-wind');

  if (elLoc)  elLoc.textContent  = city || 'Unknown location';
  if (elIcon) elIcon.textContent = icon;
  if (elTemp) elTemp.textContent = temp + '°C';
  if (elDesc) elDesc.textContent = desc;
  if (elHum)  elHum.textContent  = '💧 ' + humidity + '%';
  if (elWnd)  elWnd.textContent  = '💨 ' + wind + ' km/h';

  const panel = document.getElementById('weather-widget');
  if (panel) panel.classList.add('visible');
  if (typeof onWeatherReady === 'function') onWeatherReady();
}

async function _fetchWeather(lat, lon) {
  try {
    _setWeatherStatus('Fetching weather…');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m` +
      `&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`open-meteo HTTP ${res.status}`);
    return await res.json();
  } catch(e) {
    console.error('[weather] open-meteo error:', e.message);
    return null;
  }
}

// ── Geocoding: city name → lat/lon ────────────────
// Tries Open-Meteo geocoding directly, then bridge as fallback.
async function _geocodeCity(name) {
  const enc = encodeURIComponent(name);
  // Direct call (Open-Meteo geocoding)
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${enc}&count=1&language=en&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length) {
        const r = data.results[0];
        return { name: r.name, lat: r.latitude, lon: r.longitude, country: r.country };
      }
    }
  } catch(e) {
    console.warn('[weather] direct geocode failed:', e.message);
  }
  // Bridge fallback
  try {
    const bridgeUrl = typeof BRIDGE_URL !== 'undefined' ? BRIDGE_URL : 'http://localhost:7842';
    const res = await fetch(`${bridgeUrl}/geocode?city=${enc}`);
    if (res.ok) {
      const data = await res.json();
      if (data.lat) return data;
    }
  } catch(e) {
    console.warn('[weather] bridge geocode failed:', e.message);
  }
  return null;
}

// Called from settings UI when user types a city name
async function setWeatherCity(name) {
  name = (name || '').trim();
  if (!name) return;
  _setWeatherStatus('Looking up ' + name + '…');
  const loc = await _geocodeCity(name);
  if (!loc) {
    _setWeatherStatus('City not found: ' + name);
    return;
  }
  const label = loc.country ? `${loc.name}, ${loc.country}` : loc.name;
  localStorage.setItem(WEATHER_LOC_KEY, JSON.stringify({ name: label, lat: loc.lat, lon: loc.lon }));
  // Update input to show resolved name
  const inp = document.getElementById('weather-city-input');
  if (inp) inp.value = label;
  await _startWithCoords(loc.lat, loc.lon, label);
  if (typeof showBubble === 'function') {
    const msgs = [`Found ${label}! 📍`, `Weather for ${loc.name}! ☀️`, `Got it! Checking ${loc.name}! 🌤️`];
    showBubble(msgs[Math.floor(Math.random() * msgs.length)], 3500);
    setMood('happy', 3000);
  }
}

// Remove manual city — auto-detect on next call
function clearWeatherCity() {
  localStorage.removeItem(WEATHER_LOC_KEY);
  const inp = document.getElementById('weather-city-input');
  if (inp) inp.value = '';
  _showFailed('Location cleared — will auto-detect on reload');
}

// ── Auto-detection fallbacks ───────────────────────
async function _ipLocation() {
  const url = typeof BRIDGE_URL !== 'undefined' ? BRIDGE_URL : 'http://localhost:7842';
  try {
    _setWeatherStatus('Trying IP location…');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(`${url}/location`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.lat) return null;
    return { lat: data.lat, lon: data.lon, city: data.city || null };
  } catch(e) {
    console.warn('[weather] IP location failed:', e.message);
    return null;
  }
}

function _showFailed(reason) {
  _setWeatherStatus(reason);
  const elLoc  = document.getElementById('weather-location');
  const elIcon = document.getElementById('weather-icon');
  const elTemp = document.getElementById('weather-temp');
  if (elLoc)  elLoc.textContent  = '📍 Set city in Settings';
  if (elIcon) elIcon.textContent = '🌡️';
  if (elTemp) elTemp.textContent = '--°C';
}

async function _bridgeWeather() {
  const url = typeof BRIDGE_URL !== 'undefined' ? BRIDGE_URL : 'http://localhost:7842';
  try {
    _setWeatherStatus('Trying wttr.in…');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${url}/weather`, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return null;
    const d = await res.json();
    if (!d.temp && d.temp !== 0) return null;
    return d;
  } catch(e) {
    console.warn('[weather] wttr.in failed:', e.message);
    return null;
  }
}

function _renderBridgeWeather(d) {
  const elLoc  = document.getElementById('weather-location');
  const elIcon = document.getElementById('weather-icon');
  const elTemp = document.getElementById('weather-temp');
  const elDesc = document.getElementById('weather-desc');
  const elHum  = document.getElementById('weather-humidity');
  const elWnd  = document.getElementById('weather-wind');
  if (elLoc)  elLoc.textContent  = d.city || 'Unknown';
  if (elIcon) elIcon.textContent = d.icon || '🌡️';
  if (elTemp) elTemp.textContent = d.temp + '°C';
  if (elDesc) elDesc.textContent = d.condition || '';
  if (elHum)  elHum.textContent  = '💧 ' + d.humidity + '%';
  if (elWnd)  elWnd.textContent  = '💨 ' + d.wind + ' km/h';
  const panel = document.getElementById('weather-widget');
  if (panel) panel.classList.add('visible');
  if (typeof onWeatherReady === 'function') onWeatherReady();
  if (d.lat) { _weatherCoords = { lat: d.lat, lon: d.lon }; _locationName = d.city; }
}

async function refreshWeather() {
  if (!_weatherCoords) return;
  const { lat, lon } = _weatherCoords;
  const weatherData = await _fetchWeather(lat, lon);
  if (weatherData) _renderWeather(weatherData, _locationName);
  else _setWeatherStatus('Weather fetch failed');
}

async function _startWithCoords(lat, lon, city) {
  console.log('[weather] coords:', lat, lon, 'city:', city);
  _weatherCoords = { lat, lon };
  if (city) _locationName = city;
  await refreshWeather();
  if (_refreshTimer) clearInterval(_refreshTimer);
  _refreshTimer = setInterval(refreshWeather, 15 * 60 * 1000);
}

async function _tryFallbacks() {
  // 1. Browser geolocation
  if (navigator.geolocation) {
    const geo = await new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        ()  => resolve(null),
        { timeout: 5000, maximumAge: 5 * 60 * 1000 }
      );
    });
    if (geo) { await _startWithCoords(geo.lat, geo.lon, null); return; }
  }
  // 2. Bridge IP location
  const loc = await _ipLocation();
  if (loc) { await _startWithCoords(loc.lat, loc.lon, loc.city); return; }
  // 3. Bridge wttr.in
  const wd = await _bridgeWeather();
  if (wd) {
    _renderBridgeWeather(wd);
    if (_refreshTimer) clearInterval(_refreshTimer);
    _refreshTimer = setInterval(refreshWeather, 15 * 60 * 1000);
    return;
  }
  _showFailed('Set your city in Settings ⚙');
}

function initWeather() {
  const panel = document.getElementById('weather-widget');
  if (!panel) return;

  _setWeatherStatus('Locating…');
  panel.classList.add('visible');

  // Priority 1: user-saved manual city
  try {
    const saved = JSON.parse(localStorage.getItem(WEATHER_LOC_KEY));
    if (saved && saved.lat) {
      console.log('[weather] using saved city:', saved.name);
      const inp = document.getElementById('weather-city-input');
      if (inp) inp.value = saved.name;
      _startWithCoords(saved.lat, saved.lon, saved.name);
      return;
    }
  } catch(e) {}

  // Priority 2-4: auto-detect
  _tryFallbacks();
}

// ── Weather chat integration ───────────────────────
function getWeatherForChat() {
  const elIcon = document.getElementById('weather-icon');
  const elTemp = document.getElementById('weather-temp');
  const elDesc = document.getElementById('weather-desc');
  const elLoc  = document.getElementById('weather-location');
  if (!elTemp || elTemp.textContent === '--°C') return null;
  return {
    icon: elIcon?.textContent || '🌡️',
    temp: elTemp.textContent,
    desc: elDesc?.textContent || '',
    city: elLoc?.textContent || '',
  };
}
