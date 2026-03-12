/* ══════════════════════════════════════════════════
   FORDOLPHIN — Cheerful ocean dolphin companion
══════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.PET_REGISTRY = window.PET_REGISTRY || [];

  const li = (h, a) => {
    const n = parseInt(h.replace('#',''), 16);
    return `rgb(${Math.min(255,(n>>16)+a)},${Math.min(255,((n>>8)&255)+a)},${Math.min(255,(n&255)+a)})`;
  };

  const MOODS = {
    happy:    { body:'#00b4d8', belly:'#caf0f8', pupil:'#023e8a', mouth:'smile',   glow:'#48cae4' },
    thinking: { body:'#0096c7', belly:'#ade8f4', pupil:'#03045e', mouth:'flat',    glow:'#00b4d8' },
    surprised:{ body:'#48cae4', belly:'#e0f7fa', pupil:'#023e8a', mouth:'open',    glow:'#90e0ef' },
    sad:      { body:'#0077b6', belly:'#ade8f4', pupil:'#03045e', mouth:'frown',   glow:'#00b4d8' },
    excited:  { body:'#00d4f4', belly:'#e0f9ff', pupil:'#023e8a', mouth:'open',    glow:'#48cae4' },
    love:     { body:'#f48fb1', belly:'#ffe0f0', pupil:'#880e4f', mouth:'smile',   glow:'#f06292' },
    sleepy:   { body:'#0096c7', belly:'#caf0f8', pupil:'#03045e', mouth:'flat',    glow:'#0077b6' },
    angry:    { body:'#cc5544', belly:'#ffcccc', pupil:'#3a0000', mouth:'grimace', glow:'#ff4422', brow:'#8b0000' },
    scared:   { body:'#5888b0', belly:'#b8d8ee', pupil:'#02205a', mouth:'open',   glow:'#4070a0' },
    silly:    { body:'#22cce4', belly:'#d0f8ff', pupil:'#023e8a', mouth:'silly',   glow:'#00bbdd' },
    cry:      { body:'#3878a8', belly:'#9cc4dc', pupil:'#021850', mouth:'frown',   glow:'#2060a0' },
  };

  let blinkTimer = 0, blinkOpen = true, mouthVal = 0, mouthDir = 1;

  function draw(ctx, t, mood) {
    ctx.clearRect(0, 0, 160, 160);
    const m = MOODS[mood] || MOODS.happy;
    const b = Math.sin(t * 0.0018) * 4; // gentle bob

    // Water ripple glow
    const au = ctx.createRadialGradient(80, 84+b, 6, 80, 84+b, 68);
    au.addColorStop(0, m.glow + '55'); au.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.ellipse(80, 86+b, 62, 56, 0, 0, Math.PI*2);
    ctx.fillStyle = au; ctx.fill();

    // Tail fluke (behind body)
    const flukeWag = Math.sin(t * 0.005) * 0.45;
    ctx.save(); ctx.translate(80, 110+b); ctx.rotate(flukeWag);
    // Left fluke lobe
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-16, 8, -28, 6, -24, 20);
    ctx.bezierCurveTo(-18, 28, -6, 20, 0, 16);
    ctx.fillStyle = m.body; ctx.fill();
    // Right fluke lobe
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(16, 8, 28, 6, 24, 20);
    ctx.bezierCurveTo(18, 28, 6, 20, 0, 16);
    ctx.fillStyle = m.body; ctx.fill();
    // Fluke center notch
    ctx.beginPath(); ctx.moveTo(-6, 16); ctx.lineTo(0, 10); ctx.lineTo(6, 16);
    ctx.fillStyle = li(m.body, -20); ctx.fill();
    ctx.restore();

    // Body (oval, dolphin-like)
    const bg = ctx.createRadialGradient(68, 80+b, 4, 80, 88+b, 50);
    bg.addColorStop(0, li(m.body, 30)); bg.addColorStop(1, m.body);
    ctx.beginPath(); ctx.ellipse(80, 92+b, 36, 32, 0, 0, Math.PI*2);
    ctx.fillStyle = bg; ctx.fill();

    // Belly (lighter underside)
    const bl = ctx.createRadialGradient(80, 98+b, 2, 80, 100+b, 22);
    bl.addColorStop(0, m.belly); bl.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.ellipse(80, 100+b, 22, 18, 0, 0, Math.PI*2);
    ctx.fillStyle = bl; ctx.fill();

    // Pectoral fin (left side)
    ctx.save(); ctx.translate(54, 96+b);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-18, -4, -22, 12, -12, 18);
    ctx.bezierCurveTo(-4, 22, 4, 12, 0, 0);
    ctx.fillStyle = li(m.body, -10); ctx.fill();
    ctx.restore();

    // Pectoral fin (right side, mirrored)
    ctx.save(); ctx.translate(106, 96+b);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(18, -4, 22, 12, 12, 18);
    ctx.bezierCurveTo(4, 22, -4, 12, 0, 0);
    ctx.fillStyle = li(m.body, -10); ctx.fill();
    ctx.restore();

    // Dorsal fin (top of body)
    const dorsalWave = Math.sin(t * 0.003) * 0.1;
    ctx.save(); ctx.translate(80, 62+b); ctx.rotate(dorsalWave);
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-6, -18, -2, -28, 4, -26);
    ctx.bezierCurveTo(10, -24, 8, -10, 0, 0);
    ctx.fillStyle = m.body; ctx.fill();
    ctx.restore();

    // Head (rounded dolphin snout)
    const hg = ctx.createRadialGradient(72, 46+b, 4, 80, 54+b, 34);
    hg.addColorStop(0, li(m.body, 36)); hg.addColorStop(1, m.body);
    ctx.beginPath(); ctx.ellipse(80, 56+b, 30, 26, 0, 0, Math.PI*2);
    ctx.fillStyle = hg; ctx.fill();

    // Snout / beak (rostrum)
    const sg = ctx.createLinearGradient(80, 65+b, 80, 78+b);
    sg.addColorStop(0, li(m.body, 20)); sg.addColorStop(1, m.body);
    ctx.beginPath(); ctx.ellipse(80, 72+b, 14, 9, 0, 0, Math.PI*2);
    ctx.fillStyle = sg; ctx.fill();

    // Belly color on snout bottom
    ctx.beginPath(); ctx.ellipse(80, 73+b, 11, 6, 0, 0, Math.PI);
    ctx.fillStyle = m.belly + 'bb'; ctx.fill();

    // Blink
    blinkTimer++; if (blinkTimer > 155) blinkOpen = false; if (blinkTimer > 164) { blinkOpen = true; blinkTimer = 0; }
    [[62, 50], [98, 50]].forEach(([ex, ey]) => {
      ey += b;
      if (!blinkOpen || mood === 'sleepy') {
        ctx.beginPath(); ctx.moveTo(ex-8, ey); ctx.lineTo(ex+8, ey);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
        if (mood === 'sleepy') { ctx.font='bold 10px serif'; ctx.fillStyle='rgba(200,240,255,0.7)'; ctx.fillText('z', ex+10, ey-6); }
      } else if(mood==='love'){
        ctx.beginPath(); ctx.arc(ex,ey+2,8,Math.PI+0.3,-0.3);
        ctx.strokeStyle=m.pupil; ctx.lineWidth=3; ctx.lineCap='round'; ctx.stroke();
        ctx.beginPath(); ctx.arc(ex+4,ey-5,2.2,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fill();
      } else {
        const ew=mood==='scared'?11:9, eh=mood==='scared'?12:10;
        ctx.beginPath(); ctx.ellipse(ex, ey, ew, eh, 0, 0, Math.PI*2); ctx.fillStyle = '#fff'; ctx.fill();
        const pw = mood === 'surprised' ? 7 : mood === 'scared' ? 2.5 : 6;
        ctx.beginPath(); ctx.ellipse(ex+1, ey+1, pw, pw, 0, 0, Math.PI*2); ctx.fillStyle = m.pupil; ctx.fill();
        ctx.beginPath(); ctx.arc(ex-2, ey-3, 2.5, 0, Math.PI*2); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill();
      }
    });

    // Cheeks
    if (['happy','excited'].includes(mood)) {
      [58, 102].forEach(cx => {
        const cg = ctx.createRadialGradient(cx, 62+b, 0, cx, 62+b, 11);
        cg.addColorStop(0, 'rgba(100,220,255,0.4)'); cg.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(cx, 62+b, 11, 0, Math.PI*2); ctx.fillStyle = cg; ctx.fill();
      });
    }

    // Angry brows
    if (mood === 'angry') {
      [[62,50],[98,50]].forEach(([ex,ey],i) => {
        ctx.beginPath();
        ctx.moveTo(ex+(i===0?-11:11),ey-12+b); ctx.lineTo(ex+(i===0?11:-11),ey-6+b);
        ctx.strokeStyle=m.brow||'#8b0000'; ctx.lineWidth=3.5; ctx.lineCap='round'; ctx.stroke();
      });
    }
    // Scared sweat
    if (mood === 'scared') {
      const sw=((t*0.0015)%1), swy=34+sw*16+b, swa=Math.max(0,1-sw*2)*0.85;
      ctx.beginPath(); ctx.arc(110,swy,4,0,Math.PI*2); ctx.fillStyle=`rgba(140,200,255,${swa})`; ctx.fill();
      ctx.beginPath(); ctx.moveTo(106,swy-2); ctx.lineTo(110,swy-9); ctx.lineTo(114,swy-2); ctx.closePath();
      ctx.fillStyle=`rgba(140,200,255,${swa*0.6})`; ctx.fill();
    }
    // Cry tears
    if (mood === 'cry') {
      [[62,50],[98,50]].forEach(([ex,ey],i) => {
        const td=((t*0.0018)+i*0.5)%1, ty=ey+12+td*26+b, ta=Math.max(0,1-td*1.8)*0.85;
        ctx.beginPath(); ctx.arc(ex,ty,3.5,0,Math.PI*2); ctx.fillStyle=`rgba(100,160,220,${ta})`; ctx.fill();
        ctx.beginPath(); ctx.moveTo(ex,ey+12+b); ctx.lineTo(ex,ty-3);
        ctx.strokeStyle=`rgba(120,180,240,${ta*0.5})`; ctx.lineWidth=1.8; ctx.stroke();
      });
    }
    // Mouth (dolphin always has a natural smile curve)
    mouthVal += 0.034 * mouthDir; if (mouthVal > 1) mouthDir = -1; if (mouthVal < 0) { mouthVal = 0; mouthDir = 1; }
    ctx.save(); ctx.translate(80, 70+b);
    ctx.strokeStyle = li(m.body, -30); ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    if (m.mouth === 'smile' || m.mouth === 'flat') {
      ctx.beginPath(); ctx.arc(0, 2, 12, 0.1, Math.PI-0.1); ctx.stroke();
    } else if (m.mouth === 'frown') {
      ctx.beginPath(); ctx.arc(0, 10, 12, Math.PI+0.1, -0.1); ctx.stroke();
    } else if (m.mouth === 'open') {
      const mo = 3 + mouthVal * 3;
      ctx.beginPath(); ctx.ellipse(0, 4, 10, mo, 0, 0, Math.PI*2);
      ctx.fillStyle = '#004466'; ctx.fill(); ctx.stroke();
    } else if (m.mouth === 'grimace') {
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fillRect(-10,-2,20,7);
      ctx.beginPath(); ctx.moveTo(-10,-2); ctx.lineTo(10,-2); ctx.moveTo(-10,5); ctx.lineTo(10,5);
      ctx.strokeStyle = li(m.body,-30); ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
    // Silly tongue
    if (mood === 'silly') {
      ctx.save(); ctx.translate(80, 76+b);
      ctx.beginPath(); ctx.ellipse(3,8,7,9,0.15,0,Math.PI*2); ctx.fillStyle='#ff7090'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-4,10); ctx.lineTo(10,10);
      ctx.strokeStyle='rgba(200,40,70,0.4)'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.restore();
    }

    // Love — max cute
    if (mood === 'love') {
      [58, 102].forEach(cx => {
        const cg = ctx.createRadialGradient(cx, 62+b, 0, cx, 62+b, 14);
        cg.addColorStop(0, 'rgba(255,80,150,0.6)'); cg.addColorStop(1, 'transparent');
        ctx.beginPath(); ctx.arc(cx, 62+b, 14, 0, Math.PI*2); ctx.fillStyle = cg; ctx.fill();
      });
      ctx.font='13px serif'; ctx.fillStyle='rgba(255,80,150,0.9)';
      ctx.fillText('♥',54+Math.sin(t*.003)*5,32+b);
      ctx.fillText('♥',100+Math.cos(t*.004)*4,26+b);
      ctx.font='9px serif'; ctx.fillStyle='rgba(255,120,180,0.7)';
      ctx.fillText('♥',44+Math.sin(t*.005+1)*3,40+b);
      ctx.fillText('♥',110+Math.cos(t*.006+2)*3,36+b);
      [0,1,2,3].forEach(i => {
        const sx=48+i*24+Math.sin(t*.004+i)*4, sy=24+Math.cos(t*.005+i*1.5)*6+b;
        const sa=0.4+0.4*Math.sin(t*.006+i*2);
        ctx.beginPath(); ctx.arc(sx,sy,2,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${sa})`; ctx.fill();
      });
    }
    // Thinking bubbles
    if (mood === 'thinking') {
      [0,1,2].forEach(i => {
        ctx.beginPath(); ctx.arc(112+i*10, 28-i*9+b, 2.5+i*1.5, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(150,230,255,0.75)'; ctx.fill();
      });
    }
    // Splash sparkles when excited
    if (mood === 'excited') {
      const sparkles = [[-30,-12],[30,-10],[-24,20],[28,18],[-10,-22],[12,-20]];
      sparkles.forEach(([sx, sy], i) => {
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.012 + i * 1.2);
        ctx.beginPath(); ctx.arc(80+sx, 80+sy+b, 3 * pulse, 0, Math.PI*2);
        ctx.fillStyle = `rgba(150,240,255,${0.6*pulse})`; ctx.fill();
      });
    }
  }

  window.PET_REGISTRY.push({
    id: 'fordolphin',
    name: 'Fordolphin',
    accentColor: '#00b4d8',
    tagline: 'Joyful & Free 🐬',
    nameTagText: '✦ FORDOLPHIN ✦',
    inputPlaceholder: 'Chat with Fordolphin…',
    avatarEmoji: '🐬',
    aboutText: "Splash! I'm Fordolphin! 🐬 Your bubbly ocean friend, leaping through the waves of your desktop. Always happy, always splashing!",
    introText: "Fordolphin here! 🐬 Your cheerful aquatic companion. Connect the bridge or chat in the waves!",
    clickResponses: ['*clicks and squeaks* 🐬','Wheee~! Splash!','*spins in the water* 🌊','Eee eee! 🐬','*leaps with joy!*','Squeak squeak! 💙','*does a flip* 🌊'],
    idleMessages: [
      { text:"*leaps joyfully over the taskbar* SPLASH! 🐬", mood:'excited' },
      { text:"*floats gently and dreams of the ocean* 🌊", mood:'sleepy' },
      { text:"Did you know dolphins sleep with one eye open? Like me right now~ 👁️", mood:'thinking' },
      { text:"*clicks and whistles a little tune* 🎵🐬", mood:'happy' },
      { text:"The ocean is infinite, and so is my happiness! 💙", mood:'love' },
      { text:"*blows a bubble* Pop! Hehe 🫧", mood:'excited' },
      { text:"*circles playfully* Come swim with me sometime!", mood:'happy' },
      { text:"Waves say hi! 🌊 And so do I~ 🐬", mood:'happy' },
      { text:"EEK EEK EEK!! Someone threw plastic in the ocean AGAIN! 😠🐬", mood:'angry' },
      { text:"*hides behind wave* Was that a... f-fishing net?! 😱🌊", mood:'scared' },
      { text:"*balances seashell on snout* BEHOLD! The greatest trick! 😜🐚", mood:'silly' },
      { text:"*sad squeaks* I lost my favorite seashell in the current 😢🌊", mood:'cry' },
    ],
    greetings: {
      am:    ["Good morning! *leaps from the waves* A fresh new day! 🐬","Rise and splash! 🌊 Fordolphin is SO ready for today!","Morning! *clicks happily* The ocean is sparkling today~ 💙"],
      pm:    ["Good afternoon! 🌊 How are the currents treating you?","*splashes in* Afternoon! Still riding the waves of productivity? 🐬","Hey hey! 💙 Hope your afternoon is as blue as the sea!"],
      eve:   ["Evening! *floats on calm waters* How was your day? 🌊","*gentle splashing* Good evening~ The sea is calm tonight 🐬","The tide comes in as the day winds down~ 🌅 How are you?"],
      night: ["*quiet dolphin squeaks* Late night? I'll swim beside you 🌙","Night swimming! 🌊 The stars look like bioluminescence~ 🐬","Even the ocean sleeps at night 💙 You should too, friend~"],
    },
    draw,
  });
})();
