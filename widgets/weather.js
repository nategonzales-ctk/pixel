// ══════════════════════════════════════════════════
//  WEATHER + LOCATION WIDGET
//  Location: tries browser geolocation first, then
//  falls back to bridge /location (server-side ip-api).
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

let _weatherCoords = null;
let _locationName  = null;

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

// IP-based location via bridge (server-side, bypasses WebView2 fetch restrictions)
async function _ipLocation() {
  const url = typeof BRIDGE_URL !== 'undefined' ? BRIDGE_URL : 'http://localhost:7842';
  try {
    _setWeatherStatus('Trying bridge…');
    console.log('[weather] calling', url + '/location');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const res = await fetch(`${url}/location`, { signal: ctrl.signal });
    clearTimeout(t);
    console.log('[weather] bridge /location HTTP', res.status);
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error('[weather] bridge /location error body:', body);
      _setWeatherStatus('Location service error ' + res.status);
      return null;
    }
    const data = await res.json();
    console.log('[weather] bridge /location data:', JSON.stringify(data));
    if (!data.lat) {
      _setWeatherStatus('No coords: ' + JSON.stringify(data).slice(0, 40));
      return null;
    }
    return { lat: data.lat, lon: data.lon, city: data.city || null };
  } catch(e) {
    const msg = e.name === 'AbortError' ? 'bridge timeout' : e.message;
    console.error('[weather] bridge location error:', msg);
    _setWeatherStatus('Bridge: ' + msg);
    return null;
  }
}

function _showFailed(reason) {
  _setWeatherStatus(reason);
  const elLoc  = document.getElementById('weather-location');
  const elIcon = document.getElementById('weather-icon');
  const elTemp = document.getElementById('weather-temp');
  if (elLoc)  elLoc.textContent  = '📍 Unknown';
  if (elIcon) elIcon.textContent = '🌡️';
  if (elTemp) elTemp.textContent = '--°C';
  console.error('[weather] failed:', reason);
}

// Use bridge /weather (wttr.in) as final fallback — returns location+weather combined
async function _bridgeWeather() {
  const url = typeof BRIDGE_URL !== 'undefined' ? BRIDGE_URL : 'http://localhost:7842';
  try {
    _setWeatherStatus('Trying wttr.in…');
    console.log('[weather] calling', url + '/weather');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(`${url}/weather`, { signal: ctrl.signal });
    clearTimeout(t);
    console.log('[weather] /weather HTTP', res.status);
    if (!res.ok) return null;
    const d = await res.json();
    console.log('[weather] /weather data:', JSON.stringify(d));
    if (!d.temp && d.temp !== 0) return null;
    return d; // { city, temp, condition, icon, humidity, wind }
  } catch(e) {
    console.error('[weather] /weather error:', e.message);
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
  // Store coords so 15-min refresh can use Open-Meteo instead of wttr.in
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
  console.log('[weather] got coords:', lat, lon, 'city:', city);
  _weatherCoords = { lat, lon };
  if (city) _locationName = city;
  await refreshWeather();
  setInterval(refreshWeather, 15 * 60 * 1000);
}

async function _tryFallbacks() {
  // 1. Bridge /location (ip-api → ipapi.co → ipinfo.io)
  const loc = await _ipLocation();
  if (loc) { await _startWithCoords(loc.lat, loc.lon, loc.city); return; }

  // 2. Bridge /weather (wttr.in — combined location + weather)
  const wd = await _bridgeWeather();
  if (wd) {
    _renderBridgeWeather(wd);
    setInterval(refreshWeather, 15 * 60 * 1000);
    return;
  }

  _showFailed('Start bridge for weather!');
}

function initWeather() {
  const panel = document.getElementById('weather-widget');
  if (!panel) return;

  _setWeatherStatus('Locating…');
  panel.classList.add('visible');

  console.log('[weather] geolocation available:', !!navigator.geolocation);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async pos => {
        console.log('[weather] geolocation success');
        await _startWithCoords(pos.coords.latitude, pos.coords.longitude, null);
      },
      async err => {
        console.warn('[weather] geolocation denied/failed:', err.code, err.message);
        await _tryFallbacks();
      },
      { timeout: 5000, maximumAge: 5 * 60 * 1000 }
    );
  } else {
    console.warn('[weather] no geolocation API');
    _tryFallbacks().then(() => {
    });
  }
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
