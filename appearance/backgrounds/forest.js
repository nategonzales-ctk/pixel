// ── Pine tree helper (shared across layers) ──────
function _forestPine(ctx, x, y, h, col, trunkCol) {
  const w = h * 0.52;
  for (let i = 0; i < 3; i++) {
    const ty = y - h*0.30*i - h*0.16;
    const tw = w * (1 - i*0.22) * (1 + i*0.06);
    ctx.beginPath();
    ctx.moveTo(x, ty - h*0.34);
    ctx.lineTo(x - tw/2, ty);
    ctx.lineTo(x + tw/2, ty);
    ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
  }
  ctx.fillStyle = trunkCol;
  ctx.fillRect(x - 2.5, y - h*0.10, 5, h*0.14);
}

window.BACKGROUND_REGISTRY = window.BACKGROUND_REGISTRY || [];
window.BACKGROUND_REGISTRY.push({
  id: 'forest', name: 'Forest', icon: '🌲',
  draw: function(t) {
    const W = bgCanvas.width, H = bgCanvas.height, d = dayNightBlend, n = 1-d;
    const PI2 = Math.PI * 2;

    // ── Sky ──────────────────────────────────────────
    // Night: deep midnight blue-purple → Day: warm sunrise gold → blue
    const sky = bgCtx.createLinearGradient(0, 0, 0, H * 0.58);
    sky.addColorStop(0,    _lc('#030612', '#2e7cc4', d));
    sky.addColorStop(0.45, _lc('#06101e', '#5aacde', d));
    sky.addColorStop(1,    _lc('#091520', '#8ecce0', d));
    bgCtx.fillStyle = sky; bgCtx.fillRect(0, 0, W, H);

    // Day horizon glow (sunrise/sunset warmth at tree line)
    if (d > 0.03) {
      const hor = bgCtx.createLinearGradient(0, H*0.30, 0, H*0.56);
      hor.addColorStop(0, `rgba(255,170,60,${d * 0.28})`);
      hor.addColorStop(1, 'transparent');
      bgCtx.fillStyle = hor; bgCtx.fillRect(0, H*0.30, W, H*0.26);
    }

    // ── Stars (night) ───────────────────────────────
    bgCtx.save(); bgCtx.beginPath(); bgCtx.rect(0, 0, W, H*0.44); bgCtx.clip();
    for (const s of STARS) {
      const a = Math.max(0, 0.12 + Math.sin(t*s.spd + s.ph) * 0.28) * n;
      if (a < 0.02) continue;
      bgCtx.beginPath(); bgCtx.arc(s.x*W, s.y*H*0.44, s.r * 0.65, 0, PI2);
      bgCtx.fillStyle = s.r > 1.1 ? '#ddeeff' : '#b8ccee';
      bgCtx.globalAlpha = a * 0.85; bgCtx.fill();
    }
    bgCtx.globalAlpha = 1; bgCtx.restore();

    // Milky Way band (night only)
    if (n > 0.1) {
      bgCtx.save();
      bgCtx.globalAlpha = n * 0.18;
      const mw = bgCtx.createLinearGradient(0, H*0.05, W, H*0.40);
      mw.addColorStop(0,   'transparent');
      mw.addColorStop(0.3, 'rgba(160,180,240,1)');
      mw.addColorStop(0.5, 'rgba(200,210,255,1)');
      mw.addColorStop(0.7, 'rgba(160,180,240,1)');
      mw.addColorStop(1,   'transparent');
      bgCtx.fillStyle = mw;
      bgCtx.beginPath();
      bgCtx.moveTo(0, H*0.05);   bgCtx.lineTo(W, H*0.40);
      bgCtx.lineTo(W, H*0.48);   bgCtx.lineTo(0, H*0.13);
      bgCtx.closePath(); bgCtx.fill();
      bgCtx.restore();
    }

    // ── Moon (night) ─────────────────────────────────
    if (n > 0.02) {
      const mX = W*0.18, mY = H*0.13;
      bgCtx.save(); bgCtx.globalAlpha = n;
      // Halo
      const mhalo = bgCtx.createRadialGradient(mX, mY, 0, mX, mY, 90);
      mhalo.addColorStop(0,   'rgba(180,200,255,0.14)');
      mhalo.addColorStop(0.5, 'rgba(140,170,255,0.05)');
      mhalo.addColorStop(1,   'transparent');
      bgCtx.beginPath(); bgCtx.arc(mX, mY, 90, 0, PI2);
      bgCtx.fillStyle = mhalo; bgCtx.fill();
      // Disc
      bgCtx.beginPath(); bgCtx.arc(mX, mY, 22, 0, PI2);
      bgCtx.fillStyle = '#dae8ff'; bgCtx.fill();
      // Crescent shadow using night sky color
      bgCtx.beginPath(); bgCtx.arc(mX + 9, mY - 5, 18, 0, PI2);
      bgCtx.fillStyle = '#030612'; bgCtx.fill();
      bgCtx.restore();
    }

    // ── Sun (day) ────────────────────────────────────
    if (d > 0.02) {
      const sp = _sunPos(W, H);
      const sx = sp.x, sy = Math.min(sp.y, H * 0.30);
      bgCtx.save();
      bgCtx.beginPath(); bgCtx.rect(0, 0, W, H*0.55); bgCtx.clip();
      bgCtx.globalAlpha = d;
      _drawDaySun(bgCtx, sx, sy, 28);
      // Warm bloom below sun at horizon
      const bloom = bgCtx.createRadialGradient(sx, H*0.50, 0, sx, H*0.50, W*0.45);
      bloom.addColorStop(0, `rgba(255,210,100,${d * 0.16})`);
      bloom.addColorStop(1, 'transparent');
      bgCtx.fillStyle = bloom; bgCtx.fillRect(0, H*0.25, W, H*0.35);
      bgCtx.restore();
    }

    // ── Clouds (day) ─────────────────────────────────
    if (d > 0.05) {
      bgCtx.save();
      bgCtx.beginPath(); bgCtx.rect(0, 0, W, H*0.50); bgCtx.clip();
      bgCtx.fillStyle = 'rgba(255,255,255,1)';
      for (const c of _CLOUDS) {
        const cx = ((c.ox + t * c.spd) % 1.2 - 0.1) * W;
        const cy = c.oy * H * 0.60;
        bgCtx.globalAlpha = d * c.a * 0.55;
        _drawDayCloud(bgCtx, cx, cy, c.w * W * 0.85);
      }
      bgCtx.globalAlpha = 1; bgCtx.restore();
    }

    // ── Distant hills silhouette ─────────────────────
    bgCtx.fillStyle = _lc('#040d07', '#1a4a18', d);
    bgCtx.beginPath(); bgCtx.moveTo(0, H*0.50);
    for (let x = 0; x <= W; x += W/60) {
      const hy = H*(0.42 + 0.06*Math.sin(x*0.006)*Math.sin(x*0.0021+1));
      bgCtx.lineTo(x, hy);
    }
    bgCtx.lineTo(W, H*0.50); bgCtx.closePath(); bgCtx.fill();

    // ── Atmospheric depth haze ───────────────────────
    const haze = bgCtx.createLinearGradient(0, H*0.30, 0, H*0.52);
    haze.addColorStop(0, 'transparent');
    haze.addColorStop(1, n > 0.5
      ? 'rgba(10,16,26,0.40)'
      : `rgba(150,205,230,${d * 0.20})`
    );
    bgCtx.fillStyle = haze; bgCtx.fillRect(0, H*0.30, W, H*0.22);

    // ── Back tree layer (distant, muted) ────────────
    const tBack  = _lc('#040e04', '#1e5a18', d);
    const tTrunk = _lc('#0e0804', '#2a1806', d);
    for (let i = 0; i < 30; i++) {
      const x = (i/30)*W*1.08 - W*0.04;
      const h = 42 + (i*37%34);
      _forestPine(bgCtx, x, H*0.50, h, tBack, tTrunk);
    }

    // ── Mid tree layer ───────────────────────────────
    const tMid = _lc('#061506', '#286b1c', d);
    for (let i = 0; i < 18; i++) {
      const x = (i/18)*W*1.10 - W*0.05;
      const h = 75 + (i*53%55);
      _forestPine(bgCtx, x, H*0.64, h, tMid, tTrunk);
    }

    // ── Ground ──────────────────────────────────────
    const gnd = bgCtx.createLinearGradient(0, H*0.62, 0, H);
    gnd.addColorStop(0, _lc('#020d02', '#0e2e08', d));
    gnd.addColorStop(1, _lc('#010601', '#071804', d));
    bgCtx.fillStyle = gnd; bgCtx.fillRect(0, H*0.62, W, H);

    // ── Foreground tree layer ───────────────────────
    const tFore = _lc('#020802', '#1c5a10', d);
    for (let i = 0; i < 12; i++) {
      const x = (i/12)*W*1.12 - W*0.06;
      const h = 140 + (i*71%78);
      _forestPine(bgCtx, x, H*0.90, h, tFore, tTrunk);
    }

    // ── Ground mist / fog ───────────────────────────
    for (let i = 0; i < 7; i++) {
      const mx = (Math.sin(t*0.00014 + i*1.18)*0.30 + 0.08 + i*0.14)*W;
      const my = H*0.66 + i*7;
      const mr = 150 + i*28;
      const mistA = n > 0.3
        ? 0.05 + i*0.004
        : d * 0.04;
      const mc = n > 0.3
        ? `rgba(130,155,195,${mistA})`
        : `rgba(215,235,255,${mistA})`;
      const mg = bgCtx.createRadialGradient(mx, my, 0, mx, my, mr);
      mg.addColorStop(0, mc); mg.addColorStop(1, 'transparent');
      bgCtx.beginPath(); bgCtx.ellipse(mx, my, mr, mr*0.22, 0, 0, PI2);
      bgCtx.fillStyle = mg; bgCtx.fill();
    }

    // ── Fireflies (night) ───────────────────────────
    if (n > 0.05) {
      for (let i = 0; i < 35; i++) {
        const ph = i * 2.399;
        const fx = (0.05 + ((Math.sin(t*0.00020+ph)*0.5+0.5)*0.90))*W;
        const fy = H*0.36 + (Math.cos(t*0.00030+ph*1.4)*0.5+0.5)*H*0.44;
        const fa = Math.max(0, Math.sin(t*0.0019+ph)*0.72 + 0.28) * n;
        if (fa < 0.08) continue;
        // Outer soft glow
        const fg = bgCtx.createRadialGradient(fx, fy, 0, fx, fy, 16);
        fg.addColorStop(0, `rgba(150,255,50,${fa * 0.55})`);
        fg.addColorStop(0.5,`rgba(100,220,30,${fa * 0.20})`);
        fg.addColorStop(1, 'transparent');
        bgCtx.beginPath(); bgCtx.arc(fx, fy, 16, 0, PI2);
        bgCtx.fillStyle = fg; bgCtx.fill();
        // Bright core
        bgCtx.beginPath(); bgCtx.arc(fx, fy, 1.8, 0, PI2);
        bgCtx.fillStyle = `rgba(220,255,150,${fa})`;
        bgCtx.fill();
      }
    }

    // ── Bioluminescent mushrooms (night) ────────────
    if (n > 0.15) {
      const shrX = [0.09, 0.23, 0.41, 0.57, 0.73, 0.88];
      for (let i = 0; i < shrX.length; i++) {
        const sx = shrX[i] * W + (i%3)*4;
        const sy = H * 0.74 + (i%4)*6;
        const sa = (0.45 + Math.sin(t*0.0012+i*1.1)*0.30) * n;
        // Glow
        const sg = bgCtx.createRadialGradient(sx, sy, 0, sx, sy, 22);
        sg.addColorStop(0, `rgba(80,255,170,${sa * 0.45})`);
        sg.addColorStop(1, 'transparent');
        bgCtx.beginPath(); bgCtx.arc(sx, sy, 22, 0, PI2);
        bgCtx.fillStyle = sg; bgCtx.fill();
        // Cap
        bgCtx.fillStyle = `rgba(60,210,140,${sa * 0.8})`;
        bgCtx.beginPath(); bgCtx.ellipse(sx, sy, 7, 5, 0, Math.PI, 0);
        bgCtx.fill();
        // Stem
        bgCtx.strokeStyle = `rgba(60,200,130,${sa * 0.55})`;
        bgCtx.lineWidth = 1.5;
        bgCtx.beginPath(); bgCtx.moveTo(sx, sy); bgCtx.lineTo(sx, sy+9);
        bgCtx.stroke();
      }
    }

    // ── God rays (day) ──────────────────────────────
    if (d > 0.04) {
      const sp = _sunPos(W, H);
      bgCtx.save();
      for (let i = 0; i < 9; i++) {
        const rx  = sp.x + (i - 4)*W*0.052 + Math.sin(t*0.00018+i*0.9)*W*0.012;
        const rg  = bgCtx.createLinearGradient(rx, 0, rx + (i-4)*W*0.015, H*0.78);
        rg.addColorStop(0,   `rgba(255,240,190,${d * 0.10})`);
        rg.addColorStop(0.5, `rgba(255,235,170,${d * 0.04})`);
        rg.addColorStop(1,   'transparent');
        bgCtx.fillStyle = rg;
        bgCtx.beginPath();
        bgCtx.moveTo(rx - W*0.006, 0); bgCtx.lineTo(rx + W*0.055, H*0.78);
        bgCtx.lineTo(rx + W*0.072, H*0.78); bgCtx.lineTo(rx + W*0.010, 0);
        bgCtx.closePath(); bgCtx.fill();
      }
      bgCtx.restore();
    }

    // ── Birds (day) ──────────────────────────────────
    if (d > 0.06) {
      const bt = t * 0.00026;
      for (let i = 0; i < 6; i++) {
        const bx = ((bt * 0.65 + i * 0.19) % 1.35 - 0.18) * W;
        const by = H * (0.10 + i*0.028 + Math.sin(bt*2.2 + i)*0.012);
        const bs = 0.65 + i*0.09;
        const wing = Math.sin(bt * 9 + i) * 0.5 + 0.5;
        bgCtx.save();
        bgCtx.globalAlpha = Math.min(1, d * 2.5) * (0.38 + wing*0.22);
        bgCtx.strokeStyle = '#1a1a1a'; bgCtx.lineWidth = 1.2;
        bgCtx.beginPath();
        bgCtx.moveTo(bx - bs*10, by);
        bgCtx.quadraticCurveTo(bx - bs*5, by - bs*5*wing, bx, by);
        bgCtx.quadraticCurveTo(bx + bs*5, by - bs*5*wing, bx + bs*10, by);
        bgCtx.stroke(); bgCtx.restore();
      }
    }

    // ── Pollen / floating dust (day) ─────────────────
    if (d > 0.05) {
      for (let i = 0; i < 24; i++) {
        const ph = i * 1.618;
        const px = ((Math.sin(t*0.00007+ph)*0.4 + 0.05 + i*0.042) % 1.08) * W;
        const py = H * (0.32 + (Math.cos(t*0.00010+ph)*0.18+0.18));
        const pa = (Math.sin(t*0.0011+ph)*0.5+0.5) * d * 0.55;
        if (pa < 0.05) continue;
        bgCtx.beginPath(); bgCtx.arc(px, py, 1.4, 0, PI2);
        bgCtx.fillStyle = `rgba(255,240,160,${pa})`;
        bgCtx.fill();
      }
    }

    // ── Wildflowers at ground (day) ─────────────────
    if (d > 0.05) {
      const fCols = ['#ff6b8a','#ffcc44','#cc88ff','#66ccff','#ff8844','#88ff66'];
      bgCtx.save();
      for (let i = 0; i < 22; i++) {
        const fx = (i/22)*W*1.05 - W*0.02 + (i*37%18);
        const fy = H*0.79 + (i*17%14);
        const fa = d * (0.45 + (i*19%12)*0.04);
        bgCtx.globalAlpha = fa;
        // Stem
        bgCtx.strokeStyle = `rgba(60,160,40,0.8)`;
        bgCtx.lineWidth = 0.9;
        bgCtx.beginPath(); bgCtx.moveTo(fx, fy+4); bgCtx.lineTo(fx, fy+11); bgCtx.stroke();
        // Petals
        bgCtx.fillStyle = fCols[i % fCols.length];
        bgCtx.beginPath(); bgCtx.arc(fx, fy, 3.2, 0, PI2); bgCtx.fill();
        // Center
        bgCtx.fillStyle = 'rgba(255,240,180,0.9)';
        bgCtx.beginPath(); bgCtx.arc(fx, fy, 1.2, 0, PI2); bgCtx.fill();
      }
      bgCtx.globalAlpha = 1; bgCtx.restore();
    }

    // ── Ground ambient emission ──────────────────────
    for (let i = 0; i < 6; i++) {
      const fx = (Math.sin(t*0.00017+i*1.55)*0.28+0.12+i*0.16)*W;
      const fy = H*0.70 + i*9;
      const gc = n > 0.5
        ? `rgba(120,220,100,0.030)`
        : `rgba(160,240,120,0.025)`;
      const glow = bgCtx.createRadialGradient(fx, fy, 0, fx, fy, 115+i*20);
      glow.addColorStop(0, gc); glow.addColorStop(1, 'transparent');
      bgCtx.beginPath(); bgCtx.ellipse(fx, fy, 135+i*26, 20, 0, 0, PI2);
      bgCtx.fillStyle = glow; bgCtx.fill();
    }
  },
});
