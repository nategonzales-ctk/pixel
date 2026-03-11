// ── Background scene router ──
// To add a new scene: create a new file in this folder and push to BACKGROUND_REGISTRY.
let currentBgScene = 'space';

// ── Day / Night blend (0 = night, 1 = full day) ──
let dayNightBlend   = 0;
let _dayNightTarget = 0;

// ── Shared day-mode helpers (used by each background) ──
function _lc(c1, c2, t) {
  // Lerp between two #rrggbb hex colors, returns rgb() string
  const h = s => parseInt(s, 16);
  const p = (a, b) => Math.round(a + (b - a) * t);
  return `rgb(${p(h(c1.slice(1,3)),h(c2.slice(1,3)))},${p(h(c1.slice(3,5)),h(c2.slice(3,5)))},${p(h(c1.slice(5,7)),h(c2.slice(5,7)))})`;
}

function _sunPos(W, H) {
  // Real-clock sun arc: left edge at 6 am, apex at noon, right edge at 6 pm
  const hr = new Date().getHours() + new Date().getMinutes() / 60;
  const f  = Math.max(0, Math.min(1, (hr - 6) / 12));
  return { x: W * (0.08 + f * 0.84), y: H * 0.12 - Math.sin(f * Math.PI) * H * 0.07 };
}

function _drawDaySun(ctx, x, y, r) {
  r = r || 28;
  const sg = ctx.createRadialGradient(x, y, 0, x, y, r * 5);
  sg.addColorStop(0,    'rgba(255,240,140,0.55)');
  sg.addColorStop(0.35, 'rgba(255,200,60,0.22)');
  sg.addColorStop(1,    'transparent');
  ctx.beginPath(); ctx.arc(x, y, r * 5, 0, Math.PI * 2);
  ctx.fillStyle = sg; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#FFE040'; ctx.fill();
}

function _drawDayCloud(ctx, x, y, w) {
  const h = w * 0.38;
  ctx.beginPath();
  ctx.ellipse(x,           y,           w * 0.42, h * 0.65, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.25, y - h * 0.3, w * 0.32, h * 0.75, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.55, y - h * 0.1, w * 0.38, h * 0.65, 0, 0, Math.PI * 2);
  ctx.ellipse(x + w * 0.78, y + h * 0.1, w * 0.28, h * 0.50, 0, 0, Math.PI * 2);
  ctx.fill();
}

const _CLOUDS = [
  { ox: 0.12, oy: 0.20, spd: 0.000018, w: 0.18, a: 0.80 },
  { ox: 0.44, oy: 0.13, spd: 0.000013, w: 0.22, a: 0.65 },
  { ox: 0.70, oy: 0.24, spd: 0.000021, w: 0.16, a: 0.55 },
  { ox: 0.30, oy: 0.30, spd: 0.000016, w: 0.14, a: 0.45 },
];

function drawBg(t) {
  // Smooth blend towards target (~4 s full transition at 60 fps)
  if (dayNightBlend < _dayNightTarget)
    dayNightBlend = Math.min(_dayNightTarget, dayNightBlend + 0.004);
  else if (dayNightBlend > _dayNightTarget)
    dayNightBlend = Math.max(_dayNightTarget, dayNightBlend - 0.004);

  const bg = (window.BACKGROUND_REGISTRY || []).find(b => b.id === currentBgScene)
          || (window.BACKGROUND_REGISTRY || [])[0];
  if (bg) bg.draw(t);
}
