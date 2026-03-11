// ── Shared behavior state ──
// All behavior modules read/write these globals.
// Real values are set by initBehaviorConfig() at startup.
let behaviorMood    = null;   // overrides currentMood in drawPet when set
let petIsAsleep     = false;
let petIsRunning    = false;
let petIsHiding     = false;
let lastMouseMove   = Date.now();
let nextHideTime    = 0;      // set by initBehaviorConfig
let petSpeedMult    = 1;
let speedResetTimer = null;
let rapidClicks     = 0;
let rapidClickTimer = null;
