// ── Behavior configuration ──
// To add a new configurable option: add a field here, a UI element in settings HTML,
// read it in saveBehaviorConfig, and apply it in the relevant behavior module.
const BEHAVIOR_KEY = 'petBehaviorConfig';
let bhvCfg = { sleepOn:true, sleepDelay:30, clickOn:true, hideOn:true, hideInterval:5, hideDur:8, playdateOn:true, playdateInterval:10, appWatchOn:true };

function loadBehaviorConfig() {
  try { return Object.assign({}, bhvCfg, JSON.parse(localStorage.getItem(BEHAVIOR_KEY)) || {}); } catch(e) { return bhvCfg; }
}

function saveBehaviorConfig() {
  bhvCfg = {
    sleepOn:      document.getElementById('bhv-sleep-on').checked,
    sleepDelay:   parseInt(document.getElementById('bhv-sleep-delay').value) || 30,
    clickOn:      document.getElementById('bhv-click-on').checked,
    hideOn:       document.getElementById('bhv-hide-on').checked,
    hideInterval: parseInt(document.getElementById('bhv-hide-interval').value) || 5,
    hideDur:      parseInt(document.getElementById('bhv-hide-dur').value) || 8,
    playdateOn:       document.getElementById('bhv-playdate-on').checked,
    playdateInterval: parseInt(document.getElementById('bhv-playdate-interval').value) || 10,
    appWatchOn:       document.getElementById('bhv-appwatch-on').checked,
  };
  localStorage.setItem(BEHAVIOR_KEY, JSON.stringify(bhvCfg));
  // Reschedule playdate when interval changes
  if (typeof _nextPlaydate !== 'undefined' && typeof _buddyActive !== 'undefined' && !_buddyActive) {
    _nextPlaydate = Date.now() + bhvCfg.playdateInterval * 60000;
  }
}

function initBehaviorConfig() {
  bhvCfg = loadBehaviorConfig();
  document.getElementById('bhv-sleep-on').checked     = bhvCfg.sleepOn;
  document.getElementById('bhv-sleep-delay').value    = bhvCfg.sleepDelay;
  document.getElementById('bhv-click-on').checked     = bhvCfg.clickOn;
  document.getElementById('bhv-hide-on').checked      = bhvCfg.hideOn;
  document.getElementById('bhv-hide-interval').value  = bhvCfg.hideInterval;
  document.getElementById('bhv-hide-dur').value       = bhvCfg.hideDur;
  document.getElementById('bhv-playdate-on').checked     = bhvCfg.playdateOn;
  document.getElementById('bhv-playdate-interval').value = bhvCfg.playdateInterval;
  document.getElementById('bhv-appwatch-on').checked     = bhvCfg.appWatchOn;
  nextHideTime = Date.now() + bhvCfg.hideInterval * 60000;
  if (typeof _nextPlaydate !== 'undefined') _nextPlaydate = Date.now() + bhvCfg.playdateInterval * 60000;
}
