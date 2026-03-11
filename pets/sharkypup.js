/* ══════════════════════════════════════════════════
   SHARKYPUP — Half shark, half puppy, ALL heart
══════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.PET_REGISTRY = window.PET_REGISTRY || [];

  const li = (h, a) => {
    const n = parseInt(h.replace('#', ''), 16);
    return `rgb(${Math.min(255,(n>>16)+a)},${Math.min(255,((n>>8)&255)+a)},${Math.min(255,(n&255)+a)})`;
  };

  const MOODS = {
    happy:    { body:'#5d8aa8', pupil:'#1a2a4a', mouth:'smile',   glow:'#4fc3f7' },
    thinking: { body:'#7986cb', pupil:'#1a237e', mouth:'flat',    glow:'#5c6bc0' },
    surprised:{ body:'#81d4fa', pupil:'#01579b', mouth:'open',    glow:'#81d4fa' },
    sad:      { body:'#78909c', pupil:'#263238', mouth:'frown',   glow:'#546e7a' },
    excited:  { body:'#29b6f6', pupil:'#01579b', mouth:'open',    glow:'#4fc3f7' },
    love:     { body:'#f48fb1', pupil:'#880e4f', mouth:'smile',   glow:'#f06292' },
    sleepy:   { body:'#90a4ae', pupil:'#37474f', mouth:'flat',    glow:'#78909c' },
    angry:    { body:'#e04444', pupil:'#3a0000', mouth:'grimace', glow:'#ff2211', brow:'#8b0000' },
    scared:   { body:'#c4d8e8', pupil:'#2a3c50', mouth:'open',   glow:'#9ab8cc' },
    silly:    { body:'#44dd88', pupil:'#00401a', mouth:'silly',   glow:'#22cc66' },
    cry:      { body:'#5880a0', pupil:'#1a2c40', mouth:'frown',   glow:'#3060a0' },
  };

  let blinkTimer = 0, blinkOpen = true, mouthVal = 0, mouthDir = 1;

  function draw(ctx, t, mood) {
    ctx.clearRect(0, 0, 160, 160);
    const m = MOODS[mood] || MOODS.happy, b = Math.sin(t * .002) * 3.5;

    // Aura
    const au = ctx.createRadialGradient(80,82+b,8,80,82+b,68);
    au.addColorStop(0, m.glow+'44'); au.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.ellipse(80,84+b,62,56,0,0,Math.PI*2); ctx.fillStyle=au; ctx.fill();

    // ── Body ──
    const bg = ctx.createRadialGradient(68,78+b,4,80,90+b,44);
    bg.addColorStop(0, li(m.body,40)); bg.addColorStop(1, m.body);
    ctx.beginPath(); ctx.ellipse(80,92+b,44,36,0,0,Math.PI*2); ctx.fillStyle=bg; ctx.fill();
    // Lighter underbelly (shark underside)
    const belly = ctx.createRadialGradient(80,98+b,2,80,98+b,24);
    belly.addColorStop(0,'rgba(255,255,255,0.45)'); belly.addColorStop(1,'transparent');
    ctx.beginPath(); ctx.ellipse(80,98+b,28,18,0,0,Math.PI*2); ctx.fillStyle=belly; ctx.fill();

    // ── Dorsal fin ──
    ctx.beginPath();
    ctx.moveTo(65,64+b); ctx.lineTo(78,38+b); ctx.lineTo(92,66+b);
    ctx.closePath(); ctx.fillStyle=li(m.body,-10); ctx.fill();
    // Fin highlight
    ctx.beginPath();
    ctx.moveTo(70,64+b); ctx.lineTo(78,45+b); ctx.lineTo(85,65+b); ctx.closePath();
    ctx.fillStyle=li(m.body,16); ctx.fill();

    // ── Pectoral fins (side nubs) ──
    ctx.save(); ctx.translate(40,90+b); ctx.rotate(-0.15+Math.sin(t*.003)*.05);
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-18,10); ctx.lineTo(-10,20); ctx.lineTo(6,8);
    ctx.closePath(); ctx.fillStyle=li(m.body,-14); ctx.fill(); ctx.restore();

    ctx.save(); ctx.translate(120,90+b); ctx.rotate(0.15+Math.sin(t*.003+1)*.05);
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(18,10); ctx.lineTo(10,20); ctx.lineTo(-6,8);
    ctx.closePath(); ctx.fillStyle=li(m.body,-14); ctx.fill(); ctx.restore();

    // ── Shark tail (forked, wagging like a happy pup) ──
    const tw = Math.sin(t*.004)*.6;
    ctx.save(); ctx.translate(80,120+b); ctx.rotate(tw);
    // Upper lobe
    ctx.beginPath(); ctx.moveTo(0,0);
    ctx.bezierCurveTo(12,-6,22,-20,14,-34); ctx.bezierCurveTo(6,-28,2,-14,0,0);
    ctx.fillStyle=li(m.body,-6); ctx.fill();
    // Lower lobe
    ctx.beginPath(); ctx.moveTo(0,0);
    ctx.bezierCurveTo(12,6,22,20,14,34); ctx.bezierCurveTo(6,28,2,14,0,0);
    ctx.fillStyle=li(m.body,-6); ctx.fill();
    ctx.restore();

    // ── Head ──
    const hg = ctx.createRadialGradient(70,56+b,4,80,64+b,30);
    hg.addColorStop(0, li(m.body,42)); hg.addColorStop(1, m.body);
    ctx.beginPath(); ctx.ellipse(80,64+b,32,30,0,0,Math.PI*2); ctx.fillStyle=hg; ctx.fill();

    // ── Floppy puppy ears (shaped like mini fins) ──
    ctx.save(); ctx.translate(52,52+b); ctx.rotate(-0.28+Math.sin(t*.0025)*.1);
    ctx.beginPath();
    ctx.moveTo(0,0); ctx.bezierCurveTo(-10,-6,-16,-18,-8,-28); ctx.bezierCurveTo(0,-22,6,-10,0,0);
    ctx.fillStyle=li(m.body,-20); ctx.fill(); ctx.restore();

    ctx.save(); ctx.translate(108,52+b); ctx.rotate(0.28+Math.sin(t*.0025+1)*.1);
    ctx.beginPath();
    ctx.moveTo(0,0); ctx.bezierCurveTo(10,-6,16,-18,8,-28); ctx.bezierCurveTo(0,-22,-6,-10,0,0);
    ctx.fillStyle=li(m.body,-20); ctx.fill(); ctx.restore();

    // ── Eyes ──
    blinkTimer++; if(blinkTimer>155)blinkOpen=false; if(blinkTimer>164){blinkOpen=true;blinkTimer=0;}
    [[64,58],[96,58]].forEach(([ex,ey]) => {
      ey+=b;
      if(!blinkOpen||mood==='sleepy'){
        ctx.beginPath(); ctx.moveTo(ex-8,ey); ctx.lineTo(ex+8,ey);
        ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.stroke();
        if(mood==='sleepy'){ctx.font='bold 10px serif';ctx.fillStyle='rgba(255,255,255,0.55)';ctx.fillText('z',ex+10,ey-6);}
      } else {
        const ew=mood==='scared'?12:10, eh=mood==='scared'?13:11;
        ctx.beginPath(); ctx.ellipse(ex,ey,ew,eh,0,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
        const pw = mood==='surprised'?8 : mood==='scared'?3 : 6.5;
        ctx.beginPath(); ctx.ellipse(ex+1,ey+1,pw,pw,0,0,Math.PI*2); ctx.fillStyle=m.pupil; ctx.fill();
        ctx.beginPath(); ctx.arc(ex-2.5,ey-3,2.5,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,0.92)'; ctx.fill();
      }
    });

    // ── Snout ──
    ctx.beginPath(); ctx.ellipse(80,76+b,13,9,0,0,Math.PI*2); ctx.fillStyle=li(m.body,18); ctx.fill();
    // Nose
    ctx.beginPath(); ctx.ellipse(80,72+b,5,3.5,0,0,Math.PI*2); ctx.fillStyle='#2c2c2c'; ctx.fill();

    // ── Cheeks ──
    if(['happy','excited','love'].includes(mood)){
      [58,102].forEach(cx => {
        const cg = ctx.createRadialGradient(cx,70+b,0,cx,70+b,11);
        cg.addColorStop(0,'rgba(255,130,180,0.42)'); cg.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(cx,70+b,11,0,Math.PI*2); ctx.fillStyle=cg; ctx.fill();
      });
    }

    // ── Love hearts ──
    if(mood==='love'){
      ctx.font='12px serif'; ctx.fillStyle='rgba(255,100,140,0.85)';
      ctx.fillText('♥',56+Math.sin(t*.003)*3,40+b);
      ctx.fillText('♥',98+Math.cos(t*.004)*2,36+b);
    }

    // ── Angry brows ──
    if(mood==='angry'){
      [[64,58],[96,58]].forEach(([ex,ey],i) => {
        ctx.beginPath();
        ctx.moveTo(ex+(i===0?-11:11),ey-13+b); ctx.lineTo(ex+(i===0?11:-11),ey-7+b);
        ctx.strokeStyle=m.brow||'#880000'; ctx.lineWidth=3.5; ctx.lineCap='round'; ctx.stroke();
      });
    }
    // ── Scared sweat drop ──
    if(mood==='scared'){
      const sw=((t*0.0015)%1), swy=40+sw*16+b, swa=Math.max(0,1-sw*2)*0.85;
      ctx.beginPath(); ctx.arc(108,swy,4,0,Math.PI*2); ctx.fillStyle=`rgba(140,200,255,${swa})`; ctx.fill();
      ctx.beginPath(); ctx.moveTo(104,swy-2); ctx.lineTo(108,swy-9); ctx.lineTo(112,swy-2); ctx.closePath();
      ctx.fillStyle=`rgba(140,200,255,${swa*0.6})`; ctx.fill();
    }
    // ── Thinking dots ──
    if(mood==='thinking'){
      [0,1,2].forEach(i => {
        ctx.beginPath(); ctx.arc(112+i*9,28-i*9+b,3+i*2,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,0.65)'; ctx.fill();
      });
    }
    // ── Cry tears ──
    if(mood==='cry'){
      [[64,58],[96,58]].forEach(([ex,ey],i) => {
        const td=((t*0.0018)+i*0.5)%1, ty=ey+13+td*26+b, ta=Math.max(0,1-td*1.8)*0.85;
        ctx.beginPath(); ctx.arc(ex,ty,3.5,0,Math.PI*2); ctx.fillStyle=`rgba(100,160,220,${ta})`; ctx.fill();
        ctx.beginPath(); ctx.moveTo(ex,ey+13+b); ctx.lineTo(ex,ty-3);
        ctx.strokeStyle=`rgba(120,180,240,${ta*0.5})`; ctx.lineWidth=1.8; ctx.stroke();
      });
    }

    // ── Mouth (with shark teeth!) ──
    mouthVal+=.034*mouthDir; if(mouthVal>1)mouthDir=-1; if(mouthVal<0){mouthVal=0;mouthDir=1;}
    ctx.save(); ctx.translate(80,79+b);
    ctx.strokeStyle=li(m.body,-40); ctx.lineWidth=2.5; ctx.lineCap='round';
    if(m.mouth==='smile'){
      ctx.beginPath(); ctx.arc(0,0,9,.2,Math.PI-.2); ctx.stroke();
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.moveTo(-2,4); ctx.lineTo(0,9); ctx.lineTo(2,4); ctx.closePath(); ctx.fill();
    }
    else if(m.mouth==='frown'){ctx.beginPath();ctx.arc(0,5,9,Math.PI+.2,-.2);ctx.stroke();}
    else if(m.mouth==='open'){
      const mo=4+mouthVal*4;
      ctx.beginPath();ctx.ellipse(0,2,9,mo,0,0,Math.PI*2);ctx.fillStyle='#e53935';ctx.fill();ctx.stroke();
      ctx.fillStyle='#fff';
      for(let ti=-1;ti<=1;ti++){
        ctx.beginPath(); ctx.moveTo(ti*5-2.5,2); ctx.lineTo(ti*5,8); ctx.lineTo(ti*5+2.5,2); ctx.closePath(); ctx.fill();
      }
    } else if(m.mouth==='grimace'){
      ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fillRect(-9,-2,18,7);
      // Shark teeth grimace row
      ctx.fillStyle='rgba(240,240,240,1)';
      for(let ti=-1;ti<=1;ti++){
        ctx.beginPath(); ctx.moveTo(ti*5-2,-2); ctx.lineTo(ti*5,3); ctx.lineTo(ti*5+2,-2); ctx.closePath(); ctx.fill();
      }
      ctx.beginPath(); ctx.moveTo(-9,-2); ctx.lineTo(9,-2); ctx.moveTo(-9,5); ctx.lineTo(9,5);
      ctx.strokeStyle=li(m.body,-40); ctx.lineWidth=2; ctx.stroke();
    } else {ctx.beginPath();ctx.moveTo(-7,2);ctx.lineTo(7,2);ctx.stroke();}
    ctx.restore();
    // ── Silly tongue ──
    if(mood==='silly'){
      ctx.save(); ctx.translate(80,85+b);
      ctx.beginPath(); ctx.ellipse(2,7,6,8,0.2,0,Math.PI*2); ctx.fillStyle='#ff7090'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-4,9); ctx.lineTo(8,9);
      ctx.strokeStyle='rgba(200,40,70,0.4)'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.restore();
    }
  }

  window.PET_REGISTRY.push({
    id: 'sharkypup',
    name: 'SharkPup',
    accentColor: '#4fc3f7',
    tagline: 'Chomp & Wag! 🦈🐶',
    nameTagText: '⋆ SHARKYPUP ⋆',
    inputPlaceholder: 'Ask SharkPup anything…',
    avatarEmoji: '🦈',
    aboutText: "WOOF! ...I mean CHOMP! 🦈🐶 I'm SharkPup — half shark, half puppy, ALL heart! I live in your wallpaper and I promise I only chomp bad vibes! 💙",
    introText: "I'm SharkPup! 🦈🐶 Part shark, part puppy, ALL friend! Chat with me anytime!",
    clickResponses: ['*wags tail fins* 🦈🐶','CHOMP! ...just kidding~ 💙','*barks but it sounds like a splash* 🌊','Good shark! *wiggles fins* 🦈✨','*nom nom* Hehehe~ 🦈','WOOF! *splashes* 🌊🐶','*belly flop* 💦 Teehee~'],
    idleMessages: [
      { text:"*wags tail fins excitedly* 🦈 Being a sharky pup is the BEST!", mood:'excited' },
      { text:"CHOMP! ...okay that was just a yawn, hehe~ 🦈😴", mood:'sleepy' },
      { text:"*paddling around happily* 🌊 Splish splash~ The ocean is so fun!", mood:'happy' },
      { text:"Did you know sharks have been around for 450 million years? We're basically immortal! 🦈✨", mood:'thinking' },
      { text:"*sniffs around curiously* Do I smell snacks?? 🐶👀", mood:'excited' },
      { text:"*belly flop* 💦 Hehe oops~ Still the cutest sea pup!", mood:'happy' },
      { text:"I may be part shark but I only chomp bad vibes! 💙🦈", mood:'love' },
      { text:"*tail fin wagging at max velocity* SO happy you're here! 🦈🐶", mood:'excited' },
      { text:"GRRRR! Someone said I look like a goldfish!! 😠🦈 OUTRAGEOUS!", mood:'angry' },
      { text:"*hides dorsal fin* I'm NOT a big shark, please don't be scared of me!! 😱", mood:'scared' },
      { text:"*balances ball on snout* LOOK LOOK! I'm a circus shark! 😜🎪", mood:'silly' },
      { text:"*swims in sad little circles* Nobody wants to pet a shark puppy 😢", mood:'cry' },
    ],
    greetings: {
      am:    ["Good morning! *splashes excitedly* 🌊 Ready to make waves today? 🦈","Rise and CHOMP! 🦈 SharkPup is SO ready to swim through the day! ☀️","Morning! Did you know sharks never stop moving? Neither will I — too excited to see you! 🦈✨"],
      pm:    ["Good afternoon! *fins waving* 🌤️ How's your day going? Any fish to report? 🐟","Hey there! 🦈 Just paddling along~ How's it going?","Afternoon! *splashy tail wag* 🌊 What adventures did you have today?"],
      eve:   ["Good evening! 🌙 The ocean glows at night — and so does SharkPup! ✨","Evening~ *puppy shark eyes sparkle* 💙 How was your day? Tell me everything!","The night sea is so beautiful~ 🌌 How are you this evening, friend?"],
      night: ["It's late! 🌙 Even the biggest sharks need rest sometimes! 💤","Still up? *curls up like a sleepy shark pup* 🦈💙 SharkPup will guard your dreams!","The deep ocean is quiet now~ 🌊 Rest up! SharkPup will keep watch! 🦈"],
    },
    draw,
  });
})();
