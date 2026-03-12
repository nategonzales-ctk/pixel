// ── Rapid click behavior ──
// 3 rapid clicks on pet → angry (bolt away)
// 5 rapid clicks on pet → excited zigzag
// Rapid clicks on empty screen → pet runs to click spot happily
// Call initBehaviorClickListener() after DOM is ready (done in behavior/index.js).

let _screenClicks = 0;
let _screenClickTimer = null;

function initBehaviorClickListener() {
  // Pet clicks — existing behavior
  document.getElementById('pet-wrap').addEventListener('click', () => {
    if (!bhvCfg.clickOn) return;
    rapidClicks++;
    clearTimeout(rapidClickTimer);
    rapidClickTimer = setTimeout(() => { rapidClicks = 0; }, 1500);

    if (rapidClicks >= 5) {
      // Running — excited zigzag
      rapidClicks = 0;
      petIsRunning = true;
      behaviorMood = 'excited';
      petSpeedMult = 4;
      clearTimeout(speedResetTimer);
      speedResetTimer = setTimeout(() => { petSpeedMult = 1; petIsRunning = false; behaviorMood = null; }, 4500);
      pickWanderTarget();

    } else if (rapidClicks >= 3) {
      // Angry — bolt to opposite side
      rapidClicks = 0;
      petIsRunning = true;
      behaviorMood = 'sad';
      petSpeedMult = 4;
      clearTimeout(speedResetTimer);
      speedResetTimer = setTimeout(() => { petSpeedMult = 1; petIsRunning = false; behaviorMood = null; }, 5000);
      showBubble('Hey! Stop poking me! 😤', 4500);
      const w = Math.min(window.innerWidth, displayW);
      petTargetX = petX < w / 2 ? w - PET_W - 30 : 30;
      petTargetY = 80 + Math.random() * (Math.min(window.innerHeight, displayH) - PET_H - 100);
      nextWanderTime = Date.now() + 6000;
    }
  });

  // Screen clicks — pet follows with happy face
  document.addEventListener('click', (e) => {
    if (!bhvCfg.clickOn) return;
    // Ignore clicks on UI elements
    if (e.target.closest('#pet-wrap') ||
        e.target.closest('#settings-panel') ||
        e.target.closest('#settings-btn') ||
        e.target.closest('#chat-panel') ||
        e.target.closest('#chat-bubble-btn') ||
        e.target.closest('#dn-btn') ||
        e.target.closest('.widget') ||
        e.target.closest('[id$="-widget"]') ||
        e.target.closest('#pill-row') ||
        e.target.closest('#mode-indicator') ||
        e.target.closest('#appearance-panel') ||
        e.target.closest('#pet-selector') ||
        e.target.closest('#open-pet-selector') ||
        e.target.closest('.buddy-zone')) return;

    _screenClicks++;
    clearTimeout(_screenClickTimer);
    _screenClickTimer = setTimeout(() => { _screenClicks = 0; }, 1500);

    if (_screenClicks >= 3) {
      _screenClicks = 0;
      _petFollowClick(e.clientX, e.clientY);
    }
  });
}

let _followWaypoints = [];
let _followFinalX = 0, _followFinalY = 0;
let _followActive = false;

function _petFollowClick(clickX, clickY) {
  if (petIsHiding || petIsAsleep) return;

  const w = Math.min(window.innerWidth, displayW);
  const h = Math.min(window.innerHeight, displayH);
  const destX = Math.max(10, Math.min(clickX - PET_W / 2, w - PET_W - 10));
  const destY = Math.max(100, Math.min(clickY - PET_H / 2, h - PET_H - 10));

  // Build 2-3 zigzag waypoints between current position and destination
  _followWaypoints = [];
  const steps = 2 + Math.floor(Math.random() * 2); // 2 or 3 waypoints
  for (let i = 1; i <= steps; i++) {
    const t = i / (steps + 1); // fraction along the path
    const midX = petX + (destX - petX) * t;
    const midY = petY + (destY - petY) * t;
    // Zigzag offset perpendicular to path, alternating sides
    const perpX = (destY - petY);
    const perpY = -(destX - petX);
    const len = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
    const offset = (i % 2 === 0 ? 1 : -1) * (80 + Math.random() * 100);
    const wpX = Math.max(10, Math.min(midX + (perpX / len) * offset, w - PET_W - 10));
    const wpY = Math.max(100, Math.min(midY + (perpY / len) * offset, h - PET_H - 10));
    _followWaypoints.push({ x: wpX, y: wpY });
  }
  _followFinalX = destX;
  _followFinalY = destY;
  _followActive = true;

  // Block idle/click bubbles during run so they don't override arrival message
  _bubblePriority = true;

  // Start running toward first waypoint
  petIsRunning = true;
  behaviorMood = 'excited';
  petSpeedMult = 4;
  petTargetX = _followWaypoints[0].x;
  petTargetY = _followWaypoints[0].y;
  nextWanderTime = Date.now() + 12000;

  clearTimeout(speedResetTimer);
  // Fallback timeout in case waypoints don't complete
  speedResetTimer = setTimeout(() => {
    _followArrived();
  }, 7000);
}

function _followArrived() {
  _followActive = false;
  _followWaypoints = [];
  petSpeedMult = 1;
  petIsRunning = false;
  behaviorMood = null;
  // Show arrival message after short pause, then unblock other bubbles
  setTimeout(() => {
    const msgs = [
      'I\'m here! 🥰', 'Made it! ✨', 'Hehe~ 💜', 'What\'s over here? 👀',
      'Wheee! That was fun! 🌟', 'Here I am! 😊', 'Ta-da! 💫',
    ];
    showBubble(msgs[Math.floor(Math.random() * msgs.length)], 6500, true);
    // Unblock other bubbles after arrival message is done
    setTimeout(() => { _bubblePriority = false; }, 6500);
  }, 600);
}

// Called from updatePetMovement — advances waypoints when pet reaches each one
function _updateFollowWaypoints() {
  if (!_followActive) return;
  const dx = petTargetX - petX, dy = petTargetY - petY;
  if (Math.sqrt(dx * dx + dy * dy) < 60) {
    if (_followWaypoints.length > 0) {
      const wp = _followWaypoints.shift();
      petTargetX = wp.x;
      petTargetY = wp.y;
    } else {
      // All waypoints done — head to final destination
      petTargetX = _followFinalX;
      petTargetY = _followFinalY;
      const fdx = _followFinalX - petX, fdy = _followFinalY - petY;
      if (Math.sqrt(fdx * fdx + fdy * fdy) < 80) {
        clearTimeout(speedResetTimer);
        _followArrived();
      }
    }
  }
}
