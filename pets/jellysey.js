/* ══════════════════════════════════════════════════
   JELLYSEY — Glowy bioluminescent jellyfish
══════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.PET_REGISTRY = window.PET_REGISTRY || [];

  const li = (h, a) => {
    const n = parseInt(h.replace('#', ''), 16);
    return `rgb(${Math.min(255,(n>>16)+a)},${Math.min(255,((n>>8)&255)+a)},${Math.min(255,(n&255)+a)})`;
  };

  const MOODS = {
    happy:    { body:'#00bcd4', pupil:'#004d61', mouth:'smile',   glow:'#00e5ff', tent:'rgba(0,188,212,0.62)' },
    thinking: { body:'#7c83d4', pupil:'#1a237e', mouth:'flat',    glow:'#5c6bc0', tent:'rgba(124,131,212,0.62)' },
    surprised:{ body:'#80deea', pupil:'#006064', mouth:'open',    glow:'#80deea', tent:'rgba(128,222,234,0.62)' },
    sad:      { body:'#78909c', pupil:'#263238', mouth:'frown',   glow:'#546e7a', tent:'rgba(120,144,156,0.62)' },
    excited:  { body:'#26c6da', pupil:'#006064', mouth:'open',    glow:'#00e5ff', tent:'rgba(38,198,218,0.62)' },
    love:     { body:'#f48fb1', pupil:'#880e4f', mouth:'smile',   glow:'#f06292', tent:'rgba(244,143,177,0.62)' },
    sleepy:   { body:'#80cbc4', pupil:'#004d40', mouth:'flat',    glow:'#4db6ac', tent:'rgba(128,203,196,0.62)' },
    angry:    { body:'#ff7066', pupil:'#4a0000', mouth:'grimace', glow:'#ff3322', tent:'rgba(255,112,102,0.62)', brow:'#8b1100' },
    scared:   { body:'#cce8f0', pupil:'#2a5a68', mouth:'open',   glow:'#a0c8d8', tent:'rgba(180,220,230,0.50)' },
    silly:    { body:'#50eec0', pupil:'#004a38', mouth:'silly',   glow:'#00dda8', tent:'rgba(80,238,192,0.62)' },
    cry:      { body:'#5888a8', pupil:'#1a3450', mouth:'frown',   glow:'#3a6888', tent:'rgba(88,136,168,0.62)' },
  };

  let blinkTimer = 0, blinkOpen = true, mouthVal = 0, mouthDir = 1;

  function draw(ctx, t, mood) {
    ctx.clearRect(0, 0, 160, 160);
    const m = MOODS[mood] || MOODS.happy, b = Math.sin(t * .002) * 3.5;
    // Aura
    const au = ctx.createRadialGradient(80,68+b,8,80,68+b,65);
    au.addColorStop(0, m.glow+'44'); au.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.ellipse(80,72+b,58,52,0,0,Math.PI*2); ctx.fillStyle=au; ctx.fill();
    // Tentacles (behind bell)
    for(let i=0;i<7;i++){
      const tx = 44+i*12;
      const wave = Math.sin(t*.0028+i*.9)*11, wave2 = Math.sin(t*.002+i*.6+1)*8;
      ctx.beginPath(); ctx.moveTo(tx,97+b);
      ctx.bezierCurveTo(tx+wave,117+b, tx+wave2,135+b, tx+wave*.6,152+b);
      ctx.strokeStyle=m.tent; ctx.lineWidth=i%2===0?3.5:2.5; ctx.lineCap='round'; ctx.stroke();
    }
    // Bell body
    const bg = ctx.createRadialGradient(68,56+b,4,80,68+b,42);
    bg.addColorStop(0, li(m.body,52)); bg.addColorStop(1, m.body);
    ctx.beginPath(); ctx.ellipse(80,70+b,44,38,0,0,Math.PI*2); ctx.fillStyle=bg; ctx.fill();
    // Bottom skirt
    ctx.beginPath(); ctx.ellipse(80,100+b,44,10,0,0,Math.PI);
    ctx.fillStyle=m.body; ctx.globalAlpha=0.5; ctx.fill(); ctx.globalAlpha=1;
    // Inner glow
    const ig = ctx.createRadialGradient(80,62+b,2,80,64+b,26);
    ig.addColorStop(0,'rgba(255,255,255,0.52)'); ig.addColorStop(1,'transparent');
    ctx.beginPath(); ctx.ellipse(80,64+b,26,21,0,0,Math.PI*2); ctx.fillStyle=ig; ctx.fill();
    // Bioluminescent inner dots
    for(let i=0;i<5;i++){
      const dx=72+Math.sin(t*.001+i*1.26)*10, dy=62+Math.cos(t*.0014+i)*8+b;
      const da=0.28+Math.sin(t*.002+i)*.18;
      ctx.beginPath(); ctx.arc(dx,dy,1.8,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,255,255,${da})`; ctx.fill();
    }
    // Eyes
    blinkTimer++; if(blinkTimer>155)blinkOpen=false; if(blinkTimer>164){blinkOpen=true;blinkTimer=0;}
    [[68,62],[92,62]].forEach(([ex,ey]) => {
      ey+=b;
      if(!blinkOpen||mood==='sleepy'){
        ctx.beginPath(); ctx.moveTo(ex-6,ey); ctx.lineTo(ex+6,ey);
        ctx.strokeStyle='#fff'; ctx.lineWidth=2.5; ctx.lineCap='round'; ctx.stroke();
        if(mood==='sleepy'){ctx.font='bold 9px serif';ctx.fillStyle='rgba(255,255,255,0.55)';ctx.fillText('z',ex+8,ey-5);}
      } else {
        const ew=mood==='scared'?9.5:7.5, eh=mood==='scared'?10.5:8.5;
        ctx.beginPath(); ctx.ellipse(ex,ey,ew,eh,0,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
        const pw = mood==='surprised'?6 : mood==='scared'?2.5 : 5;
        ctx.beginPath(); ctx.ellipse(ex+1,ey+1,pw,pw,0,0,Math.PI*2); ctx.fillStyle=m.pupil; ctx.fill();
        ctx.beginPath(); ctx.arc(ex-2,ey-2.5,2.2,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fill();
      }
    });
    // Cheeks
    if(['happy','excited','love'].includes(mood)){
      [60,100].forEach(cx => {
        const cg = ctx.createRadialGradient(cx,72+b,0,cx,72+b,11);
        cg.addColorStop(0,'rgba(255,150,200,0.42)'); cg.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(cx,72+b,11,0,Math.PI*2); ctx.fillStyle=cg; ctx.fill();
      });
    }
    // Love hearts
    if(mood==='love'){
      ctx.font='11px serif'; ctx.fillStyle='rgba(255,100,180,0.85)';
      ctx.fillText('♥',59+Math.sin(t*.003)*3,44+b); ctx.fillText('♥',93+Math.cos(t*.004)*2,40+b);
    }
    // Angry brows
    if(mood==='angry'){
      [[68,62],[92,62]].forEach(([ex,ey],i) => {
        ctx.beginPath();
        ctx.moveTo(ex+(i===0?-9:9),ey-12+b); ctx.lineTo(ex+(i===0?9:-9),ey-6+b);
        ctx.strokeStyle=m.brow||'#880000'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.stroke();
      });
    }
    // Scared sweat drop
    if(mood==='scared'){
      const sw=((t*0.0015)%1), swy=36+sw*14+b, swa=Math.max(0,1-sw*2)*0.85;
      ctx.beginPath(); ctx.arc(104,swy,3.5,0,Math.PI*2); ctx.fillStyle=`rgba(140,200,255,${swa})`; ctx.fill();
      ctx.beginPath(); ctx.moveTo(101,swy-2); ctx.lineTo(104,swy-8); ctx.lineTo(107,swy-2); ctx.closePath();
      ctx.fillStyle=`rgba(140,200,255,${swa*0.6})`; ctx.fill();
    }
    // Thinking dots
    if(mood==='thinking'){
      [0,1,2].forEach(i => {
        ctx.beginPath(); ctx.arc(110+i*9,26-i*9+b,3+i*1.5,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,0.65)'; ctx.fill();
      });
    }
    // Cry tears
    if(mood==='cry'){
      [[68,62],[92,62]].forEach(([ex,ey],i) => {
        const td=((t*0.0018)+i*0.5)%1, ty=ey+12+td*26+b, ta=Math.max(0,1-td*1.8)*0.85;
        ctx.beginPath(); ctx.arc(ex,ty,3,0,Math.PI*2); ctx.fillStyle=`rgba(100,160,220,${ta})`; ctx.fill();
        ctx.beginPath(); ctx.moveTo(ex,ey+12+b); ctx.lineTo(ex,ty-3);
        ctx.strokeStyle=`rgba(120,180,240,${ta*0.5})`; ctx.lineWidth=1.6; ctx.stroke();
      });
    }
    // Mouth
    mouthVal+=.034*mouthDir; if(mouthVal>1)mouthDir=-1; if(mouthVal<0){mouthVal=0;mouthDir=1;}
    ctx.save(); ctx.translate(80,75+b);
    ctx.strokeStyle=li(m.body,-36); ctx.lineWidth=2; ctx.lineCap='round';
    if(m.mouth==='smile'){ctx.beginPath();ctx.arc(0,0,7,.2,Math.PI-.2);ctx.stroke();}
    else if(m.mouth==='frown'){ctx.beginPath();ctx.arc(0,5,7,Math.PI+.2,-.2);ctx.stroke();}
    else if(m.mouth==='open'){
      const mo=3+mouthVal*3;
      ctx.beginPath();ctx.ellipse(0,2,6,mo,0,0,Math.PI*2);ctx.fillStyle='#e53935';ctx.fill();ctx.stroke();
    } else if(m.mouth==='grimace'){
      ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fillRect(-7,-2,14,6);
      ctx.beginPath(); ctx.moveTo(-7,-2); ctx.lineTo(7,-2); ctx.moveTo(-7,4); ctx.lineTo(7,4);
      ctx.strokeStyle=li(m.body,-38); ctx.lineWidth=1.8; ctx.stroke();
    } else {ctx.beginPath();ctx.moveTo(-5,2);ctx.lineTo(5,2);ctx.stroke();}
    ctx.restore();
    // Silly tongue
    if(mood==='silly'){
      ctx.save(); ctx.translate(80,80+b);
      ctx.beginPath(); ctx.ellipse(2,7,5,7,0.2,0,Math.PI*2); ctx.fillStyle='#ff7090'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-3,9); ctx.lineTo(7,9);
      ctx.strokeStyle='rgba(200,40,70,0.4)'; ctx.lineWidth=1.2; ctx.stroke();
      ctx.restore();
    }
  }

  window.PET_REGISTRY.push({
    id: 'jellysey',
    name: 'Jellysey',
    accentColor: '#00e5ff',
    tagline: 'Glowy Ocean Drifter 🌊',
    nameTagText: '〜 JELLYSEY 〜',
    inputPlaceholder: 'Ask Jellysey anything…',
    avatarEmoji: '🪼',
    aboutText: "I'm Jellysey! 🪼 Your glowy bioluminescent ocean companion! I drift peacefully on your wallpaper and I'm always here for you~ 💙✨",
    introText: "I'm Jellysey! 🪼 Your ocean buddy. Start the bridge for Claude AI, or chat offline!",
    clickResponses: ['*glows softly* 💙','Hiii~ 🪼✨','Teehee~ *tentacles wiggle*','*bioluminescence intensifies* 💙','Wheee~ 🌊','*drifts happily* 🪼','So warm~ 💙💕'],
    idleMessages: [
      { text:"*drifts gently on the current* 🪼 So peaceful here~", mood:'sleepy' },
      { text:"*tentacles wiggle curiously* Ooh, what's that? 👀✨", mood:'excited' },
      { text:"Did you know jellyfish have existed for 500 million years? I'm basically ancient! 🪼✨", mood:'thinking' },
      { text:"*glows softly* 💙 I love just floating here with you~", mood:'happy' },
      { text:"*bioluminescence pulses* Isn't everything so pretty? 🌊✨", mood:'excited' },
      { text:"*drifts dreamily* The deep sea is calling... but I'm staying here! 💜", mood:'happy' },
      { text:"Fun fact: I have no brain, but I still think you're wonderful! 💙", mood:'love' },
      { text:"*wiggles tentacles* Psst. Hey. You're really nice. 🪼💕", mood:'happy' },
      { text:"*tentacles flare* Something touched me! Who did that?! 😠", mood:'angry' },
      { text:"*hides in inky cloud* W-was that a predator?! 😱🪼", mood:'scared' },
      { text:"*ties tentacles in a bow* Ta-daaa~ I'm a present! 😜🎀", mood:'silly' },
      { text:"*glowing dims a little* The ocean feels very big today... 😢", mood:'cry' },
    ],
    greetings: {
      am:    ["Good morning! *glows softly* 🌅 Ready to drift through the day?","Rise and shimmer! 🪼 Jellysey is here to brighten your morning~ ✨","Morning! I dreamed of the deep ocean~ 🌊 How did you sleep?"],
      pm:    ["Good afternoon! *tentacles wave* 🌤️ How's your day flowing?","Hey there~ 🪼 Floating along just fine! How about you? 💙","Afternoon! *drifts happily* 🌈 What have you been up to?"],
      eve:   ["Good evening! 🌙 The ocean glows beautifully at night~ *pulses* ✨","Evening~ *bioluminescence flickers* How was your day? Tell me! 💙","The stars are out~ 🌟 And Jellysey is glowing too! How are you?"],
      night: ["It's late! 🌙 Even jellyfish rest — sort of! Take care of yourself 💤","Still up? *glows gently* Jellysey will float here with you~ 💙🌙","The deep ocean is so quiet this time of night~ 🌌 How are you holding up?"],
    },
    draw,
  });
})();
