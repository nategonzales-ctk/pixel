// ── Behavior orchestrator ──
// Runs all registered behaviors each frame and handles wake-on-mousemove.
// To add a new behavior: create a new file that pushes to window.BEHAVIOR_REGISTRY.

// Wake pet on mouse movement
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

// Called every animation frame from mainLoop
function updatePetBehaviors(now) {
  for (const b of (window.BEHAVIOR_REGISTRY || [])) {
    b.update(now);
  }
}
