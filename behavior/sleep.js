// ── Sleep behavior ──
// Pet falls asleep after mouse is idle for bhvCfg.sleepDelay seconds.
// Wakes on any mouse movement (handled in behavior/index.js mousemove listener).
window.BEHAVIOR_REGISTRY = window.BEHAVIOR_REGISTRY || [];
window.BEHAVIOR_REGISTRY.push({
  id: 'sleep',
  update: function(now) {
    if (!bhvCfg.sleepOn || petIsHiding) return;
    const idleSec = (now - lastMouseMove) / 1000;
    if (!petIsAsleep && idleSec >= bhvCfg.sleepDelay) {
      petIsAsleep = true;
      behaviorMood = 'sleepy';
      setMood('sleepy');
      showBubble('Zzz… 💤', 5000);
    }
  },
});
