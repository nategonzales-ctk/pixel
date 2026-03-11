// ── Background scene router ──
// To add a new scene: create a new file in this folder and push to BACKGROUND_REGISTRY.
// No changes needed here.
let currentBgScene = 'space';

function drawBg(t) {
  const bg = (window.BACKGROUND_REGISTRY || []).find(b => b.id === currentBgScene)
          || (window.BACKGROUND_REGISTRY || [])[0];
  if (bg) bg.draw(t);
}
