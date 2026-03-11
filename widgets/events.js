// ══════════════════════════════════════════════════
//  PET EVENTS — Weather & Time-of-Day Reactions
//  Depends on: showBubble, setMood, pick (main script)
//              getWeatherForChat (widgets/weather.js)
// ══════════════════════════════════════════════════

// ── Helpers ──────────────────────────────────────
function _getTimePeriod(hr) {
  if (hr >= 6  && hr < 12) return 'morning';
  if (hr >= 12 && hr < 17) return 'afternoon';
  if (hr >= 17 && hr < 21) return 'evening';
  return 'night';
}

function _weatherCategory(w) {
  if (!w) return null;
  const desc = (w.desc || '').toLowerCase();
  const icon = w.icon || '';
  const temp = parseFloat(w.temp) || null;

  if (/thunder|storm/.test(desc) || icon === '⛈️') return 'stormy';
  if (/snow|blizzard|ice/.test(desc) || icon === '❄️' || icon === '🌨️') return 'snowy';
  if (/rain|shower|drizzle/.test(desc) || icon === '🌧️' || icon === '🌦️') return 'rainy';
  if (/fog|mist/.test(desc) || icon === '🌫️') return 'foggy';
  if (/overcast|cloudy/.test(desc) || icon === '☁️') return 'cloudy';
  if (/partly|mainly/.test(desc) || icon === '🌤️' || icon === '⛅') return 'partly';
  if (/clear|sunny/.test(desc) || icon === '☀️') return 'sunny';
  if (temp !== null && temp >= 35) return 'hot';
  if (temp !== null && temp <= 5)  return 'cold';
  return 'other';
}

// ── Message pools ─────────────────────────────────
const TIME_MESSAGES = {
  morning:   [
    "Good morning! ☀️ Rise and shine!",
    "Morning~! Did you sleep well? 🌸",
    "A new day begins! Let's make it great! ✨",
    "Good morning! Coffee time? ☕💜",
  ],
  afternoon: [
    "Good afternoon! How's your day going? 🌤️",
    "Afternoon already? Time flies! ⏰✨",
    "Hey! Don't forget to take a break! 💜",
    "Afternoon check-in: you're doing great! 🌟",
  ],
  evening: [
    "Good evening~ 🌙 Winding down?",
    "Evening! You worked hard today! 💪✨",
    "Hey, don't stay up too late! 🌙💜",
    "Evening vibes~ time to relax! 🌆",
  ],
  night: [
    "It's late… don't forget to sleep! 😴💤",
    "Up so late? I'll keep you company~ 🌟",
    "Psst… it's nighttime! 🌙✨",
    "Night owl mode: activated! 🦉💜",
  ],
};

const WEATHER_MESSAGES = {
  sunny:    ["It's so sunny out! ☀️ Perfect day!", "What a beautiful sunny day! ☀️💜", "Sunshine makes everything better! ☀️✨"],
  partly:   ["A few clouds but still nice! 🌤️", "Partly cloudy — cozy weather! ⛅💜"],
  cloudy:   ["Pretty overcast today… ☁️ But we're cozy in here!", "Gray skies? Still a great day! ☁️✨"],
  rainy:    ["It's raining outside! 🌧️ Stay cozy~", "Rain rain rain! Perfect excuse to stay in! 🌧️💜", "Rainy day vibes… 🌂 So peaceful!"],
  foggy:    ["Foggy out there! 🌫️ Mysterious~", "Can't see much through the fog! 🌫️✨"],
  stormy:   ["There's a storm outside! ⛈️ Stay safe!", "Thunder and lightning! ⛈️ Good thing we're inside!", "Scary storm out there! ⛈️💜 I'll protect you!"],
  snowy:    ["It's SNOWING! ❄️ So magical!", "Snow day~! ❄️ Can we make a snowman? ☃️💜", "Everything is white and sparkly! ❄️✨"],
  hot:      ["It's SO hot outside! 🥵 Stay hydrated!", "Whew, scorching out there! 🌡️💦 Drink water!"],
  cold:     ["Brrr! It's freezing outside! 🥶 Stay warm!", "So cold out there! 🧊 Bundle up! 💜"],
};

// ── State ─────────────────────────────────────────
let _lastTimePeriod    = null;
let _lastWeatherCat    = null;
let _eventsReady       = false;
let _eventCheckTimer   = null;

// ── Core logic ────────────────────────────────────
function _checkEvents(force) {
  const hr     = new Date().getHours();
  const period = _getTimePeriod(hr);

  // Time-of-day greeting (once per period)
  if (period !== _lastTimePeriod) {
    _lastTimePeriod = period;
    // Delay so it doesn't collide with the startup greeting
    const delay = force ? 0 : 1500;
    setTimeout(() => {
      showBubble(pick(TIME_MESSAGES[period]), 5000);
      const mood = period === 'morning' ? 'excited'
                 : period === 'afternoon' ? 'happy'
                 : period === 'evening'  ? 'love'
                 : 'sleepy';
      setMood(mood, 4000);
    }, delay);
  }

  // Weather reaction (once per weather category change)
  const w   = (typeof getWeatherForChat === 'function') ? getWeatherForChat() : null;
  const cat = _weatherCategory(w);
  if (cat && cat !== _lastWeatherCat) {
    _lastWeatherCat = cat;
    const pool = WEATHER_MESSAGES[cat];
    if (pool) {
      setTimeout(() => {
        showBubble(pick(pool), 5000);
        const wMood = cat === 'stormy' ? 'surprised'
                    : cat === 'snowy'  ? 'excited'
                    : cat === 'rainy'  ? 'love'
                    : cat === 'sunny'  ? 'excited'
                    : cat === 'hot'    ? 'surprised'
                    : cat === 'cold'   ? 'sad'
                    : 'happy';
        setMood(wMood, 4000);
      }, _lastTimePeriod !== period ? 7000 : 1500); // stagger if time msg also fired
    }
  }
}

// ── Init (called after weather loads) ─────────────
function initEvents() {
  // Don't fire time-of-day immediately — startup greeting already handles it.
  // Capture current period so the next change triggers a message.
  _lastTimePeriod = _getTimePeriod(new Date().getHours());

  // Check weather every 5 minutes; also re-check period each time
  _eventCheckTimer = setInterval(() => _checkEvents(false), 5 * 60 * 1000);

  // First weather check: wait 20 s for weather widget to finish loading
  setTimeout(() => {
    _eventsReady = true;
    _checkEvents(false);
  }, 20000);
}

// Called by weather.js after it successfully renders (optional hook)
function onWeatherReady() {
  if (_eventsReady) return; // already ran
  _eventsReady = true;
  clearTimeout(_eventCheckTimer);
  _checkEvents(false);
  _eventCheckTimer = setInterval(() => _checkEvents(false), 5 * 60 * 1000);
}
