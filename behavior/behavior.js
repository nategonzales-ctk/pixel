// ══════════════════════════════════════════════════
//  PET AUTO BEHAVIORS
//  Depends on (at call time):
//    setMood, showBubble, pick, getActivePet — main script
//    displayW, displayH — appearance/settings.js
//    petX, petY, petTargetX, petTargetY, nextWanderTime,
//    PET_W, PET_H, pickWanderTarget — main script
// ══════════════════════════════════════════════════
const BEHAVIOR_KEY = 'petBehaviorConfig';
let bhvCfg = { sleepOn:true, sleepDelay:30, clickOn:true, hideOn:true, hideInterval:5, hideDur:8 };

function loadBehaviorConfig() {
  try { return Object.assign({}, bhvCfg, JSON.parse(localStorage.getItem(BEHAVIOR_KEY))||{}); } catch(e){ return bhvCfg; }
}
function saveBehaviorConfig() {
  bhvCfg = {
    sleepOn:      document.getElementById('bhv-sleep-on').checked,
    sleepDelay:   parseInt(document.getElementById('bhv-sleep-delay').value)||30,
    clickOn:      document.getElementById('bhv-click-on').checked,
    hideOn:       document.getElementById('bhv-hide-on').checked,
    hideInterval: parseInt(document.getElementById('bhv-hide-interval').value)||5,
    hideDur:      parseInt(document.getElementById('bhv-hide-dur').value)||8,
  };
  localStorage.setItem(BEHAVIOR_KEY, JSON.stringify(bhvCfg));
}
function initBehaviorConfig() {
  bhvCfg = loadBehaviorConfig();
  document.getElementById('bhv-sleep-on').checked     = bhvCfg.sleepOn;
  document.getElementById('bhv-sleep-delay').value    = bhvCfg.sleepDelay;
  document.getElementById('bhv-click-on').checked     = bhvCfg.clickOn;
  document.getElementById('bhv-hide-on').checked      = bhvCfg.hideOn;
  document.getElementById('bhv-hide-interval').value  = bhvCfg.hideInterval;
  document.getElementById('bhv-hide-dur').value       = bhvCfg.hideDur;
  nextHideTime = Date.now() + bhvCfg.hideInterval * 60000;
}

// ── State ──
let behaviorMood    = null;   // overrides currentMood when set
let petIsAsleep     = false;
let lastMouseMove   = Date.now();
let rapidClicks     = 0;
let rapidClickTimer = null;
let petIsHiding     = false;
let nextHideTime    = Date.now() + 5 * 60000;
let petSpeedMult    = 1;
let speedResetTimer = null;
let petIsRunning    = false;

// ── Mouse idle tracking ──
document.addEventListener('mousemove', () => {
  lastMouseMove = Date.now();
  if (petIsAsleep) {
    petIsAsleep = false;
    behaviorMood = null;
    setMood('surprised', 1800);
    setTimeout(() => setMood('happy'), 2000);
    showBubble('Oh! You\'re back! 👀✨', 3000);
  }
});

// ── Rapid click tracking ──
// Initialized after DOM is ready via initBehaviorClickListener()
function initBehaviorClickListener() {
  document.getElementById('pet-wrap').addEventListener('click', () => {
    if (!bhvCfg.clickOn) return;
    rapidClicks++;
    clearTimeout(rapidClickTimer);
    rapidClickTimer = setTimeout(() => { rapidClicks = 0; }, 1500);

    if (rapidClicks >= 5) {
      // Running (excited)
      rapidClicks = 0;
      petIsRunning = true;
      behaviorMood = 'excited';
      petSpeedMult = 4;
      clearTimeout(speedResetTimer);
      speedResetTimer = setTimeout(() => { petSpeedMult = 1; petIsRunning = false; behaviorMood = null; }, 2800);
      pickWanderTarget();
    } else if (rapidClicks >= 3) {
      // Angry — bolt across screen
      rapidClicks = 0;
      petIsRunning = true;
      behaviorMood = 'sad';
      petSpeedMult = 4;
      clearTimeout(speedResetTimer);
      speedResetTimer = setTimeout(() => { petSpeedMult = 1; petIsRunning = false; behaviorMood = null; }, 3500);
      showBubble('Hey! Stop poking me! 😤', 3000);
      // Pick a far-side target
      const w = Math.min(window.innerWidth, displayW);
      petTargetX = petX < w / 2 ? w - PET_W - 30 : 30;
      petTargetY = 80 + Math.random() * (Math.min(window.innerHeight, displayH) - PET_H - 100);
      nextWanderTime = Date.now() + 4000;
    }
  });
}

function updatePetBehaviors(now) {
  const petZone = document.getElementById('pet-zone');

  // ── Sleep ──
  if (bhvCfg.sleepOn && !petIsHiding) {
    const idleSec = (now - lastMouseMove) / 1000;
    if (!petIsAsleep && idleSec >= bhvCfg.sleepDelay) {
      petIsAsleep = true;
      behaviorMood = 'sleepy';
      setMood('sleepy');
      showBubble('Zzz… 💤', 5000);
    }
  }

  // ── Hide ──
  if (bhvCfg.hideOn && !petIsAsleep && now >= nextHideTime && !petIsHiding) {
    petIsHiding = true;
    petZone.classList.add('pet-hiding');
    const hideMsg = pick(['*sneaks away* 🫣','*hides behind the pixels* 👀','Where am I? 🙈','*disappears quietly* ✨']);
    showBubble(hideMsg, 2000);
    setTimeout(() => {
      // reappear at new random position
      const w = Math.min(window.innerWidth, displayW), h = Math.min(window.innerHeight, displayH);
      petX = 60 + Math.random() * (w - 260);
      petY = 60 + Math.random() * (h - 380);
      petTargetX = petX; petTargetY = petY;
      petZone.classList.remove('pet-hiding');
      petIsHiding = false;
      nextHideTime = now + bhvCfg.hideInterval * 60000;
      setTimeout(() => {
        showBubble(pick(['Peek-a-boo! 👀✨','I\'m back! 🐾','Did you miss me? 💜','*reappears magically* ✨']), 3000);
        setMood('excited', 2000);
      }, 700);
    }, bhvCfg.hideDur * 1000);
  }
}
