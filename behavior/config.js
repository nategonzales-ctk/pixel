// ── Behavior configuration ──
// To add a new configurable option: add a field here, a UI element in settings HTML,
// read it in saveBehaviorConfig, and apply it in the relevant behavior module.
const BEHAVIOR_KEY = 'petBehaviorConfig';
let bhvCfg = { sleepOn:true, sleepDelay:30, clickOn:true, hideOn:true, hideInterval:5, hideDur:8 };

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
