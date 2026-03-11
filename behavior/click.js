// ── Rapid click behavior ──
// 3 rapid clicks → angry (bolt away), 5 rapid clicks → running (excited zigzag).
// Call initBehaviorClickListener() after DOM is ready (done in behavior/index.js).
function initBehaviorClickListener() {
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
      speedResetTimer = setTimeout(() => { petSpeedMult = 1; petIsRunning = false; behaviorMood = null; }, 2800);
      pickWanderTarget();

    } else if (rapidClicks >= 3) {
      // Angry — bolt to opposite side
      rapidClicks = 0;
      petIsRunning = true;
      behaviorMood = 'sad';
      petSpeedMult = 4;
      clearTimeout(speedResetTimer);
      speedResetTimer = setTimeout(() => { petSpeedMult = 1; petIsRunning = false; behaviorMood = null; }, 3500);
      showBubble('Hey! Stop poking me! 😤', 3000);
      const w = Math.min(window.innerWidth, displayW);
      petTargetX = petX < w / 2 ? w - PET_W - 30 : 30;
      petTargetY = 80 + Math.random() * (Math.min(window.innerHeight, displayH) - PET_H - 100);
      nextWanderTime = Date.now() + 4000;
    }
  });
}
