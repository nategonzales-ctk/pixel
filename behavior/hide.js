// ── Hide behavior ──
// Pet disappears periodically, reappears at a random position.
// Interval and duration controlled by bhvCfg.hideInterval / bhvCfg.hideDur.
window.BEHAVIOR_REGISTRY = window.BEHAVIOR_REGISTRY || [];
window.BEHAVIOR_REGISTRY.push({
  id: 'hide',
  update: function(now) {
    if (!bhvCfg.hideOn || petIsAsleep || now < nextHideTime || petIsHiding) return;
    petIsHiding = true;
    const petZone = document.getElementById('pet-zone');
    petZone.classList.add('pet-hiding');
    showBubble(pick(['*sneaks away* 🫣','*hides behind the pixels* 👀','Where am I? 🙈','*disappears quietly* ✨']), 2000);
    setTimeout(() => {
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
  },
});
