/* ══════════════════════════════════════════════════
   VONLION — Majestic golden lion companion
══════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.PET_REGISTRY = window.PET_REGISTRY || [];

  const li = (h, a) => {
    const n = parseInt(h.replace('#',''), 16);
    return `rgb(${Math.min(255,(n>>16)+a)},${Math.min(255,((n>>8)&255)+a)},${Math.min(255,(n&255)+a)})`;
  };

  const MOODS = {
    happy:    { body:'#f4a827', mane:'#b5621e', pupil:'#3a1a00', mouth:'smile',   glow:'#ffd060' },
    thinking: { body:'#e8962a', mane:'#9e5219', pupil:'#2a1800', mouth:'flat',    glow:'#f4c050' },
    surprised:{ body:'#fbbf3a', mane:'#c46e22', pupil:'#3a1a00', mouth:'open',    glow:'#ffe080' },
    sad:      { body:'#c8922a', mane:'#7a4012', pupil:'#2a1200', mouth:'frown',   glow:'#b07820' },
    excited:  { body:'#ffcc44', mane:'#cc6a1a', pupil:'#3a1a00', mouth:'open',    glow:'#ffe044' },
    love:     { body:'#f4a827', mane:'#c4521a', pupil:'#3a1a00', mouth:'smile',   glow:'#ff9966' },
    sleepy:   { body:'#d49030', mane:'#8a4818', pupil:'#2a1a00', mouth:'flat',    glow:'#c08840' },
    angry:    { body:'#e05520', mane:'#8a2200', pupil:'#3a0000', mouth:'grimace', glow:'#ff4422', brow:'#6a1100' },
    scared:   { body:'#d4a858', mane:'#8a6828', pupil:'#3a2000', mouth:'open',   glow:'#b09040' },
    silly:    { body:'#ffe040', mane:'#dd8800', pupil:'#3a2400', mouth:'silly',   glow:'#ffd000' },
    cry:      { body:'#b07830', mane:'#6a4010', pupil:'#2a1800', mouth:'frown',   glow:'#806020' },
  };

  let blinkTimer = 0, blinkOpen = true, mouthVal = 0, mouthDir = 1;
  let tailWag = 0;

  function drawMane(ctx, cx, cy, r, color, t) {
    // spiky mane around head
    const spikes = 14;
    for (let i = 0; i < spikes; i++) {
      const ang = (i / spikes) * Math.PI * 2 + t * 0.0008;
      const wobble = 1 + 0.12 * Math.sin(t * 0.003 + i * 0.9);
      const or = r * wobble;
      const ir = r * 0.68;
      const ox = cx + Math.cos(ang) * or;
      const oy = cy + Math.sin(ang) * or;
      const ix1 = cx + Math.cos(ang - Math.PI/spikes) * ir;
      const iy1 = cy + Math.sin(ang - Math.PI/spikes) * ir;
      const ix2 = cx + Math.cos(ang + Math.PI/spikes) * ir;
      const iy2 = cy + Math.sin(ang + Math.PI/spikes) * ir;
      ctx.beginPath();
      ctx.moveTo(ix1, iy1);
      ctx.lineTo(ox, oy);
      ctx.lineTo(ix2, iy2);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }

  function draw(ctx, t, mood) {
    ctx.clearRect(0, 0, 160, 160);
    const m = MOODS[mood] || MOODS.happy;
    const b = Math.sin(t * 0.002) * 3;

    // Glow aura
    const au = ctx.createRadialGradient(80, 82+b, 8, 80, 82+b, 68);
    au.addColorStop(0, m.glow+'55'); au.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.ellipse(80, 86+b, 60, 56, 0, 0, Math.PI*2);
    ctx.fillStyle = au; ctx.fill();

    // Body
    const bg = ctx.createRadialGradient(68, 80+b, 4, 80, 90+b, 44);
    bg.addColorStop(0, li(m.body, 38)); bg.addColorStop(1, m.body);
    ctx.beginPath(); ctx.ellipse(80, 94+b, 40, 38, 0, 0, Math.PI*2);
    ctx.fillStyle = bg; ctx.fill();

    // Belly lighter patch
    const bl = ctx.createRadialGradient(80, 100+b, 2, 80, 100+b, 18);
    bl.addColorStop(0, 'rgba(255,255,220,0.55)'); bl.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.ellipse(80, 100+b, 18, 15, 0, 0, Math.PI*2);
    ctx.fillStyle = bl; ctx.fill();

    // Tail with tuft
    tailWag = Math.sin(t * 0.004) * 0.55;
    ctx.save(); ctx.translate(80, 118+b); ctx.rotate(tailWag);
    ctx.beginPath(); ctx.moveTo(0,0);
    ctx.bezierCurveTo(32,-6, 44,-26, 30,-42);
    ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.strokeStyle = m.body; ctx.stroke();
    // tuft
    ctx.beginPath(); ctx.arc(30, -42, 10, 0, Math.PI*2);
    ctx.fillStyle = m.mane; ctx.fill();
    ctx.restore();

    // Mane (behind head)
    drawMane(ctx, 80, 58+b, 38, m.mane, t);

    // Head
    const hg = ctx.createRadialGradient(72, 46+b, 4, 80, 58+b, 30);
    hg.addColorStop(0, li(m.body, 40)); hg.addColorStop(1, m.body);
    ctx.beginPath(); ctx.ellipse(80, 58+b, 30, 28, 0, 0, Math.PI*2);
    ctx.fillStyle = hg; ctx.fill();

    // Ears (small, rounded lion ears above mane)
    [[-1, 58, 33], [1, 102, 33]].forEach(([sd, ex, ey]) => {
      ctx.save(); ctx.translate(ex, ey+b); ctx.rotate(sd * 0.3);
      ctx.beginPath(); ctx.arc(0, -12, 11, 0, Math.PI*2);
      ctx.fillStyle = m.body; ctx.fill();
      ctx.beginPath(); ctx.arc(0, -12, 6, 0, Math.PI*2);
      ctx.fillStyle = li(m.body, 48); ctx.fill();
      ctx.restore();
    });

    // Blink
    blinkTimer++; if (blinkTimer > 155) blinkOpen = false; if (blinkTimer > 164) { blinkOpen = true; blinkTimer = 0; }
    [[64, 52], [96, 52]].forEach(([ex, ey]) => {
      ey += b;
      if (!blinkOpen || mood === 'sleepy') {
        ctx.beginPath(); ctx.moveTo(ex-8, ey); ctx.lineTo(ex+8, ey);
        ctx.strokeStyle = '#fff8'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
        if (mood === 'sleepy') { ctx.font='bold 10px serif'; ctx.fillStyle='rgba(255,255,200,0.6)'; ctx.fillText('z', ex+10, ey-6); }
      } else {
        const ew=mood==='scared'?11:9, eh=mood==='scared'?12:10;
        ctx.beginPath(); ctx.ellipse(ex, ey, ew, eh, 0, 0, Math.PI*2); ctx.fillStyle = '#fff'; ctx.fill();
        const pw = mood === 'surprised' ? 7 : mood === 'scared' ? 3 : 6;
        ctx.beginPath(); ctx.ellipse(ex+1, ey+1, pw, pw, 0, 0, Math.PI*2); ctx.fillStyle = m.pupil; ctx.fill();
        ctx.beginPath(); ctx.arc(ex-2, ey-3, 2.5, 0, Math.PI*2); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
      }
    });

    // Nose — lion triangle nose
    ctx.beginPath(); ctx.moveTo(80, 68+b); ctx.lineTo(76, 64+b); ctx.lineTo(84, 64+b); ctx.closePath();
    ctx.fillStyle = '#d4607a'; ctx.fill();

    // Cheeks
    if (['happy','excited','love'].includes(mood)) {
      [56, 104].forEach(cx => {
        const cg = ctx.createRadialGradient(cx, 65+b, 0, cx, 65+b, 11);
        cg.addColorStop(0, 'rgba(255,120,80,0.4)'); cg.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(cx, 65+b, 11, 0, Math.PI*2); ctx.fillStyle = cg; ctx.fill();
      });
    }

    // Whiskers
    [[-1, 68], [1, 68]].forEach(([sd, wy]) => {
      [-6, 0, 6].forEach(dy => {
        ctx.beginPath();
        ctx.moveTo(80, wy+dy+b);
        ctx.lineTo(80 + sd * 28, wy + dy - 2 + b);
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.stroke();
      });
    });

    // Angry brows
    if (mood === 'angry') {
      [[64,52],[96,52]].forEach(([ex,ey],i) => {
        ctx.beginPath();
        ctx.moveTo(ex+(i===0?-11:11),ey-13+b); ctx.lineTo(ex+(i===0?11:-11),ey-7+b);
        ctx.strokeStyle=m.brow||'#6a1100'; ctx.lineWidth=3.5; ctx.lineCap='round'; ctx.stroke();
      });
    }
    // Scared sweat
    if (mood === 'scared') {
      const sw=((t*0.0015)%1), swy=36+sw*16+b, swa=Math.max(0,1-sw*2)*0.85;
      ctx.beginPath(); ctx.arc(108,swy,4,0,Math.PI*2); ctx.fillStyle=`rgba(140,200,255,${swa})`; ctx.fill();
      ctx.beginPath(); ctx.moveTo(104,swy-2); ctx.lineTo(108,swy-9); ctx.lineTo(112,swy-2); ctx.closePath();
      ctx.fillStyle=`rgba(140,200,255,${swa*0.6})`; ctx.fill();
    }
    // Cry tears
    if (mood === 'cry') {
      [[64,52],[96,52]].forEach(([ex,ey],i) => {
        const td=((t*0.0018)+i*0.5)%1, ty=ey+14+td*28+b, ta=Math.max(0,1-td*1.8)*0.85;
        ctx.beginPath(); ctx.arc(ex,ty,3.5,0,Math.PI*2); ctx.fillStyle=`rgba(100,160,220,${ta})`; ctx.fill();
        ctx.beginPath(); ctx.moveTo(ex,ey+14+b); ctx.lineTo(ex,ty-3);
        ctx.strokeStyle=`rgba(120,180,240,${ta*0.5})`; ctx.lineWidth=1.8; ctx.stroke();
      });
    }
    // Mouth
    mouthVal += 0.034 * mouthDir; if (mouthVal > 1) mouthDir = -1; if (mouthVal < 0) { mouthVal = 0; mouthDir = 1; }
    ctx.save(); ctx.translate(80, 71+b);
    ctx.strokeStyle = li(m.body, -40); ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    if (m.mouth === 'smile') { ctx.beginPath(); ctx.arc(0, 0, 8, 0.2, Math.PI-0.2); ctx.stroke(); }
    else if (m.mouth === 'frown') { ctx.beginPath(); ctx.arc(0, 6, 8, Math.PI+0.2, -0.2); ctx.stroke(); }
    else if (m.mouth === 'open') {
      const mo = 4 + mouthVal * 4;
      ctx.beginPath(); ctx.ellipse(0, 2, 7, mo, 0, 0, Math.PI*2); ctx.fillStyle = '#c0304a'; ctx.fill(); ctx.stroke();
    } else if (m.mouth === 'grimace') {
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(-9,-2,18,7);
      ctx.beginPath(); ctx.moveTo(-9,-2); ctx.lineTo(9,-2); ctx.moveTo(-9,5); ctx.lineTo(9,5);
      ctx.strokeStyle = li(m.body,-40); ctx.lineWidth = 2; ctx.stroke();
    } else { ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(6, 2); ctx.stroke(); }
    ctx.restore();
    // Silly tongue
    if (mood === 'silly') {
      ctx.save(); ctx.translate(80, 77+b);
      ctx.beginPath(); ctx.ellipse(2,7,6,8,0.2,0,Math.PI*2); ctx.fillStyle='#ff7090'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-4,9); ctx.lineTo(8,9);
      ctx.strokeStyle='rgba(200,40,70,0.4)'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.restore();
    }

    // Love hearts
    if (mood === 'love') {
      ctx.font = '12px serif'; ctx.fillStyle = 'rgba(255,140,80,0.88)';
      ctx.fillText('♥', 60+Math.sin(t*0.003)*3, 36+b);
      ctx.fillText('♥', 96+Math.cos(t*0.004)*2, 32+b);
    }
    // Thinking dots
    if (mood === 'thinking') {
      [0,1,2].forEach(i => {
        ctx.beginPath(); ctx.arc(110+i*9, 28-i*8+b, 2.5+i*1.5, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,220,100,0.7)'; ctx.fill();
      });
    }
  }

  window.PET_REGISTRY.push({
    id: 'vonlion',
    name: 'VonLion',
    accentColor: '#f4a827',
    tagline: 'Majestic & Brave 🦁',
    nameTagText: '✦ VONLION ✦',
    inputPlaceholder: 'Speak to VonLion…',
    avatarEmoji: '🦁',
    aboutText: "Roar! I'm VonLion! 🦁 The mightiest companion in the wallpaper savanna. Noble, brave, and always by your side!",
    introText: "Greetings! I'm VonLion 🦁 Your majestic desktop guardian. Connect the bridge or chat offline!",
    clickResponses: ['*roars playfully* 🦁','That tickles my mane!','ROAR! 😤','*nuzzles you* 🧡','Hehe~ 🦁','*flicks tail* Careful!','Mighty! 💪'],
    idleMessages: [
      { text:"*surveys the desktop with noble authority* All is well. 🦁", mood:'happy' },
      { text:"*stretches with a huge yawn* Ahhh~ Even lions need rest. 😴", mood:'sleepy' },
      { text:"*practices roaring quietly to self* mrROAR... 🦁", mood:'excited' },
      { text:"*grooms mane carefully* Looking magnificent today~ 🧡", mood:'happy' },
      { text:"*watches your cursor with intense focus* ...", mood:'thinking' },
      { text:"Did you know lions sleep 18 hours a day? Relatable. 😴", mood:'sleepy' },
      { text:"*flicks tail rhythmically* Something interesting out there?", mood:'thinking' },
      { text:"You're doing great! Even the bravest lion needs encouragement 🦁", mood:'love' },
      { text:"ROOOOAR!! Someone dared to sit in MY sunny spot!! 😠🦁", mood:'angry' },
      { text:"*mane puffed up* W-was that thunder?! VonLion fears... nothing! *shaking* 😱", mood:'scared' },
      { text:"*wears flower crown* Hehe~ Don't tell anyone! 🌸😜", mood:'silly' },
      { text:"*quiet roar* Not every day can be a pride's day... 😢🦁", mood:'cry' },
    ],
    greetings: {
      am:    ["ROAR! Good morning! 🦁 The pride awakens!", "Rise, champion! VonLion greets the new day with you! ☀️", "Morning! *shakes mane* Ready to conquer the day? 🦁"],
      pm:    ["Good afternoon, noble one! 🦁 How goes the battle?", "The midday sun shines on us! 🌞 How are you faring?", "Afternoon! *stretches* VonLion has been guarding your desktop! 🦁"],
      eve:   ["Evening approaches! 🌅 A strong day deserves a proud rest.", "Good evening! 🦁 Tell me of your victories today!", "The savanna grows quiet... 🌙 How was your day?"],
      night: ["The night is VonLion's domain! 🌙 All is safe.", "Late night! *yawns majestically* Even lions sleep eventually 😴", "Stars guard the sky as I guard your desktop 🌟🦁"],
    },
    draw,
  });
})();
