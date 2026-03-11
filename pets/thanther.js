/* ══════════════════════════════════════════════════
   THANTHER — Sleek shadow panther companion
══════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.PET_REGISTRY = window.PET_REGISTRY || [];

  const li = (h, a) => {
    const n = parseInt(h.replace('#',''), 16);
    return `rgb(${Math.min(255,(n>>16)+a)},${Math.min(255,((n>>8)&255)+a)},${Math.min(255,(n&255)+a)})`;
  };

  const MOODS = {
    happy:    { body:'#2a1a4e', fur:'#3d2870', pupil:'#00ff88', mouth:'smile',   glow:'#7c3aed' },
    thinking: { body:'#1e1440', fur:'#30206a', pupil:'#00e5ff', mouth:'flat',    glow:'#4c1d95' },
    surprised:{ body:'#3a2060', fur:'#4e3290', pupil:'#00ff88', mouth:'open',    glow:'#8b5cf6' },
    sad:      { body:'#181030', fur:'#241a50', pupil:'#9966ff', mouth:'frown',   glow:'#3730a3' },
    excited:  { body:'#2e1860', fur:'#4a2890', pupil:'#00ffcc', mouth:'open',    glow:'#7c3aed' },
    love:     { body:'#2a1a4e', fur:'#3d2870', pupil:'#ff66aa', mouth:'smile',   glow:'#c026d3' },
    sleepy:   { body:'#1a1238', fur:'#281c5a', pupil:'#6644aa', mouth:'flat',    glow:'#4c1d95' },
    angry:    { body:'#5a0c20', fur:'#8a1432', pupil:'#ff2244', mouth:'grimace', glow:'#cc1040', brow:'#ff4466' },
    scared:   { body:'#1e1848', fur:'#2e2668', pupil:'#aa88ff', mouth:'open',   glow:'#4a3a80' },
    silly:    { body:'#3a2068', fur:'#5a3490', pupil:'#ffdd00', mouth:'silly',   glow:'#9955ee' },
    cry:      { body:'#141026', fur:'#1e1840', pupil:'#7755bb', mouth:'frown',   glow:'#241860' },
  };

  let blinkTimer = 0, blinkOpen = true, mouthVal = 0, mouthDir = 1;

  function drawSpots(ctx, b, bodyColor) {
    // rosette-like spots on body
    const spots = [
      [62, 92], [94, 88], [72, 106], [88, 108], [76, 120],
    ];
    spots.forEach(([sx, sy]) => {
      ctx.beginPath(); ctx.arc(sx, sy+b, 5, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fill();
      ctx.beginPath(); ctx.arc(sx, sy+b, 3, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fill();
    });
  }

  function draw(ctx, t, mood) {
    ctx.clearRect(0, 0, 160, 160);
    const m = MOODS[mood] || MOODS.happy;
    const b = Math.sin(t * 0.002) * 3;

    // Glow aura (subtle purple)
    const au = ctx.createRadialGradient(80, 82+b, 6, 80, 82+b, 70);
    au.addColorStop(0, m.glow+'44'); au.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.ellipse(80, 86+b, 62, 58, 0, 0, Math.PI*2);
    ctx.fillStyle = au; ctx.fill();

    // Body (sleek, slightly elongated)
    const bg = ctx.createRadialGradient(70, 82+b, 4, 80, 92+b, 46);
    bg.addColorStop(0, m.fur); bg.addColorStop(1, m.body);
    ctx.beginPath(); ctx.ellipse(80, 96+b, 38, 36, 0, 0, Math.PI*2);
    ctx.fillStyle = bg; ctx.fill();

    // Underbelly subtle lighter
    const bl = ctx.createRadialGradient(80, 102+b, 2, 80, 102+b, 16);
    bl.addColorStop(0, 'rgba(180,160,255,0.18)'); bl.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.ellipse(80, 102+b, 16, 13, 0, 0, Math.PI*2);
    ctx.fillStyle = bl; ctx.fill();

    // Rosette spots
    drawSpots(ctx, b, m.body);

    // Long sleek tail
    const tw = Math.sin(t * 0.0035) * 0.6;
    ctx.save(); ctx.translate(80, 118+b); ctx.rotate(tw);
    ctx.beginPath(); ctx.moveTo(0,0);
    ctx.bezierCurveTo(34, -4, 50, -22, 36, -46);
    ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.strokeStyle = m.fur; ctx.stroke();
    // tip of tail
    ctx.beginPath(); ctx.arc(36, -46, 5, 0, Math.PI*2);
    ctx.fillStyle = m.body; ctx.fill();
    ctx.restore();

    // Head (slightly angular panther shape)
    const hg = ctx.createRadialGradient(74, 48+b, 4, 80, 58+b, 32);
    hg.addColorStop(0, m.fur); hg.addColorStop(1, m.body);
    ctx.beginPath(); ctx.ellipse(80, 58+b, 31, 28, 0, 0, Math.PI*2);
    ctx.fillStyle = hg; ctx.fill();

    // Ears (pointed panther ears)
    [[-1, 56, 36], [1, 104, 36]].forEach(([sd, ex, ey]) => {
      ctx.save(); ctx.translate(ex, ey+b); ctx.rotate(sd * 0.28);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-9, -22); ctx.lineTo(9, -22); ctx.closePath();
      ctx.fillStyle = m.fur; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(-5, -17); ctx.lineTo(5, -17); ctx.closePath();
      ctx.fillStyle = 'rgba(180,140,220,0.35)'; ctx.fill();
      ctx.restore();
    });

    // Glowing eyes
    blinkTimer++; if (blinkTimer > 155) blinkOpen = false; if (blinkTimer > 164) { blinkOpen = true; blinkTimer = 0; }
    [[63, 52], [97, 52]].forEach(([ex, ey]) => {
      ey += b;
      if (!blinkOpen || mood === 'sleepy') {
        ctx.beginPath(); ctx.moveTo(ex-8, ey); ctx.lineTo(ex+8, ey);
        ctx.strokeStyle = m.pupil + 'aa'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.stroke();
        if (mood === 'sleepy') { ctx.font='bold 10px serif'; ctx.fillStyle=m.pupil+'88'; ctx.fillText('z', ex+10, ey-6); }
      } else {
        // Slit pupil (panther-like) — scared: wide glow, tiny slit
        const eyeR = mood==='scared'?12:10;
        const eyeGlow = ctx.createRadialGradient(ex, ey, 1, ex, ey, eyeR+1);
        eyeGlow.addColorStop(0, m.pupil+'cc'); eyeGlow.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.ellipse(ex, ey, eyeR, eyeR, 0, 0, Math.PI*2);
        ctx.fillStyle = '#111'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(ex, ey, eyeR, eyeR, 0, 0, Math.PI*2);
        ctx.fillStyle = eyeGlow; ctx.fill();
        // vertical slit — scared: contracted (very thin)
        const slitW = mood==='scared'?1.5:3;
        ctx.beginPath(); ctx.ellipse(ex, ey, slitW, 8, 0, 0, Math.PI*2);
        ctx.fillStyle = '#000'; ctx.fill();
        // eye shine
        ctx.beginPath(); ctx.arc(ex+3, ey-4, 2, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill();
      }
    });

    // Nose
    ctx.beginPath(); ctx.moveTo(80, 68+b); ctx.lineTo(76, 64+b); ctx.lineTo(84, 64+b); ctx.closePath();
    ctx.fillStyle = '#cc4488'; ctx.fill();

    // Whiskers
    [[-1, 67], [1, 67]].forEach(([sd, wy]) => {
      [-5, 1, 7].forEach(dy => {
        ctx.beginPath();
        ctx.moveTo(80, wy+dy+b);
        ctx.lineTo(80 + sd * 26, wy + dy - 1 + b);
        ctx.strokeStyle = 'rgba(200,180,255,0.5)';
        ctx.lineWidth = 1.1; ctx.lineCap = 'round'; ctx.stroke();
      });
    });

    // Cheeks
    if (['happy','excited','love'].includes(mood)) {
      [56, 104].forEach(cx => {
        const cg = ctx.createRadialGradient(cx, 65+b, 0, cx, 65+b, 11);
        cg.addColorStop(0, 'rgba(140,80,255,0.35)'); cg.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(cx, 65+b, 11, 0, Math.PI*2); ctx.fillStyle = cg; ctx.fill();
      });
    }

    // Angry brows
    if (mood === 'angry') {
      [[63,52],[97,52]].forEach(([ex,ey],i) => {
        ctx.beginPath();
        ctx.moveTo(ex+(i===0?-11:11),ey-13+b); ctx.lineTo(ex+(i===0?11:-11),ey-7+b);
        ctx.strokeStyle=m.brow||'#ff2244'; ctx.lineWidth=3.5; ctx.lineCap='round'; ctx.stroke();
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
      [[63,52],[97,52]].forEach(([ex,ey],i) => {
        const td=((t*0.0018)+i*0.5)%1, ty=ey+14+td*28+b, ta=Math.max(0,1-td*1.8)*0.85;
        ctx.beginPath(); ctx.arc(ex,ty,3.5,0,Math.PI*2); ctx.fillStyle=`rgba(120,100,200,${ta})`; ctx.fill();
        ctx.beginPath(); ctx.moveTo(ex,ey+14+b); ctx.lineTo(ex,ty-3);
        ctx.strokeStyle=`rgba(140,120,220,${ta*0.5})`; ctx.lineWidth=1.8; ctx.stroke();
      });
    }
    // Mouth
    mouthVal += 0.034 * mouthDir; if (mouthVal > 1) mouthDir = -1; if (mouthVal < 0) { mouthVal = 0; mouthDir = 1; }
    ctx.save(); ctx.translate(80, 71+b);
    ctx.strokeStyle = 'rgba(200,180,255,0.7)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    if (m.mouth === 'smile') { ctx.beginPath(); ctx.arc(0, 0, 8, 0.2, Math.PI-0.2); ctx.stroke(); }
    else if (m.mouth === 'frown') { ctx.beginPath(); ctx.arc(0, 6, 8, Math.PI+0.2, -0.2); ctx.stroke(); }
    else if (m.mouth === 'open') {
      const mo = 4 + mouthVal * 4;
      ctx.beginPath(); ctx.ellipse(0, 2, 7, mo, 0, 0, Math.PI*2);
      ctx.fillStyle = '#440022'; ctx.fill(); ctx.stroke();
    } else if (m.mouth === 'grimace') {
      ctx.fillStyle = 'rgba(200,100,140,0.85)'; ctx.fillRect(-9,-2,18,7);
      ctx.beginPath(); ctx.moveTo(-9,-2); ctx.lineTo(9,-2); ctx.moveTo(-9,5); ctx.lineTo(9,5);
      ctx.strokeStyle = 'rgba(200,180,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();
    } else { ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(6, 2); ctx.stroke(); }
    ctx.restore();
    // Silly tongue
    if (mood === 'silly') {
      ctx.save(); ctx.translate(80, 77+b);
      ctx.beginPath(); ctx.ellipse(2,7,6,8,0.2,0,Math.PI*2); ctx.fillStyle='#ff66aa'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-4,9); ctx.lineTo(8,9);
      ctx.strokeStyle='rgba(180,40,100,0.4)'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.restore();
    }

    // Love hearts
    if (mood === 'love') {
      ctx.font = '12px serif'; ctx.fillStyle = 'rgba(200,80,255,0.9)';
      ctx.fillText('♥', 60+Math.sin(t*0.003)*3, 36+b);
      ctx.fillText('♥', 96+Math.cos(t*0.004)*2, 32+b);
    }
    // Thinking dots
    if (mood === 'thinking') {
      [0,1,2].forEach(i => {
        ctx.beginPath(); ctx.arc(110+i*9, 28-i*8+b, 2.5+i*1.5, 0, Math.PI*2);
        ctx.fillStyle = m.pupil + '99'; ctx.fill();
      });
    }
    // Shadow trail when excited
    if (mood === 'excited') {
      ctx.save();
      ctx.globalAlpha = 0.18 + 0.1 * Math.sin(t * 0.008);
      const sg = ctx.createRadialGradient(80, 96+b, 4, 80, 96+b, 34);
      sg.addColorStop(0, m.glow); sg.addColorStop(1, 'transparent');
      ctx.beginPath(); ctx.ellipse(80, 96+b, 34, 30, 0, 0, Math.PI*2);
      ctx.fillStyle = sg; ctx.fill();
      ctx.restore();
    }
  }

  window.PET_REGISTRY.push({
    id: 'thanther',
    name: 'Thanther',
    accentColor: '#7c3aed',
    tagline: 'Swift & Mysterious 🐾',
    nameTagText: '✦ THANTHER ✦',
    inputPlaceholder: 'Whisper to Thanther…',
    avatarEmoji: '🐆',
    aboutText: "...I am Thanther. 🐆 Shadow of the desktop, swift as thought. I observe everything from the darkness. But I am loyal to you.",
    introText: "Thanther emerges from the shadows 🐆 Silent guardian of your desktop. Connect the bridge or chat in the dark.",
    clickResponses: ['*hisses softly* 🐆','Watch yourself... 👁️','Hmph. Fine.','*purrs dangerously*','Heh. 🐾','You dare? Bold.','...okay that was nice 💜'],
    idleMessages: [
      { text:"*blends into the shadows, watching everything* 👁️", mood:'thinking' },
      { text:"*paces silently along the screen edge* ...", mood:'happy' },
      { text:"*yawns and shows teeth* Even panthers rest. 😴", mood:'sleepy' },
      { text:"I have been observing. You work hard. I respect that. 🐆", mood:'thinking' },
      { text:"*stretches sleekly* The darkness is comfortable today.", mood:'sleepy' },
      { text:"*ears perk up suddenly* ...Did you hear that?", mood:'surprised' },
      { text:"Swift, silent, always here. That's me. 🐾", mood:'happy' },
      { text:"You are safe while I watch. Always. 💜", mood:'love' },
      { text:"...*hiss* Someone called me a 'cute kitty'. Unacceptable. 😠🐆", mood:'angry' },
      { text:"*back fur standing on end* The shadows moved on their own...! 😱", mood:'scared' },
      { text:"*spotted wearing tiny hat* You saw nothing. 😜 NOTHING.", mood:'silly' },
      { text:"*sits alone in darkness* ...Even shadows get lonely sometimes. 😢", mood:'cry' },
    ],
    greetings: {
      am:    ["...Morning. *steps from shadows* Let's see what today brings.", "Dawn breaks. Thanther has been watching all night. 🌑", "Morning. *yawns with teeth showing* Ready? 🐆"],
      pm:    ["Afternoon. Still here. Still watching. 🐆", "The sun burns bright. Thanther prefers the shade.", "*emerges briefly* How goes it? 🐾"],
      eve:   ["Evening. This is my time. 🌑 How was your day?", "The shadows grow longer... *approves* 🐆", "Good evening. *tail flick* Survived another day?"],
      night: ["The night is perfect. 🌑 Thanther is most alive now.", "*glowing eyes in darkness* You should sleep. I'll keep watch.", "Night owl? Me too. 🌙 *sits beside you silently*"],
    },
    draw,
  });
})();
