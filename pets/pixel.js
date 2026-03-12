/* ══════════════════════════════════════════════════
   PIXEL — Fluffy magical cat companion
══════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.PET_REGISTRY = window.PET_REGISTRY || [];

  const li = (h, a) => {
    const n = parseInt(h.replace('#', ''), 16);
    return `rgb(${Math.min(255,(n>>16)+a)},${Math.min(255,((n>>8)&255)+a)},${Math.min(255,(n&255)+a)})`;
  };

  const MOODS = {
    happy:    { body:'#c77dff', pupil:'#3a0068', mouth:'smile',   glow:'#d966ff' },
    thinking: { body:'#90caf9', pupil:'#1a3a6e', mouth:'flat',    glow:'#00e5ff' },
    surprised:{ body:'#ffcc02', pupil:'#4a3200', mouth:'open',    glow:'#ffd740' },
    sad:      { body:'#b0bec5', pupil:'#333',    mouth:'frown',   glow:'#90a4ae' },
    excited:  { body:'#69ff47', pupil:'#1a4000', mouth:'open',    glow:'#69ff47' },
    love:     { body:'#ff80ab', pupil:'#880022', mouth:'smile',   glow:'#ff4081' },
    sleepy:   { body:'#b39ddb', pupil:'#311b6e', mouth:'flat',    glow:'#9575cd' },
    angry:    { body:'#ff5e5e', pupil:'#4a0000', mouth:'grimace', glow:'#ff2222', brow:'#8b0000' },
    scared:   { body:'#dcd0f0', pupil:'#5a3a8e', mouth:'open',   glow:'#b8a8e0' },
    silly:    { body:'#ffe033', pupil:'#4a3200', mouth:'silly',   glow:'#ffc400' },
    cry:      { body:'#94b4d4', pupil:'#2a3a5a', mouth:'frown',   glow:'#6a8ab0' },
  };

  let blinkTimer = 0, blinkOpen = true, mouthVal = 0, mouthDir = 1;

  function draw(ctx, t, mood) {
    ctx.clearRect(0, 0, 160, 160);
    const m = MOODS[mood] || MOODS.happy, b = Math.sin(t * .002) * 3.5;
    // Aura
    const au = ctx.createRadialGradient(80,80+b,8,80,80+b,70);
    au.addColorStop(0, m.glow+'55'); au.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.ellipse(80,84+b,62,58,0,0,Math.PI*2); ctx.fillStyle=au; ctx.fill();
    // Body
    const bg = ctx.createRadialGradient(66,64+b,4,80,80+b,50);
    bg.addColorStop(0, li(m.body,44)); bg.addColorStop(1, m.body);
    ctx.beginPath(); ctx.ellipse(80,88+b,46,42,0,0,Math.PI*2); ctx.fillStyle=bg; ctx.fill();
    // Belly
    const bl = ctx.createRadialGradient(80,96+b,2,80,96+b,20);
    bl.addColorStop(0,'rgba(255,255,255,0.48)'); bl.addColorStop(1,'transparent');
    ctx.beginPath(); ctx.ellipse(80,96+b,20,17,0,0,Math.PI*2); ctx.fillStyle=bl; ctx.fill();
    // Ears
    [[-1,44,52],[1,116,52]].forEach(([sd,ex,ey]) => {
      ctx.save(); ctx.translate(ex,ey+b); ctx.rotate(sd*0.44);
      ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-10,-24); ctx.lineTo(10,-24); ctx.closePath();
      ctx.fillStyle=m.body; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0,-4); ctx.lineTo(-5,-18); ctx.lineTo(5,-18); ctx.closePath();
      ctx.fillStyle=li(m.body,52); ctx.fill(); ctx.restore();
    });
    // Tail
    const tw = Math.sin(t*.0038)*.52;
    ctx.save(); ctx.translate(80,118+b); ctx.rotate(tw);
    ctx.beginPath(); ctx.moveTo(0,0); ctx.bezierCurveTo(30,-8,42,-28,29,-44);
    ctx.lineWidth=9; ctx.lineCap='round'; ctx.strokeStyle=m.body; ctx.stroke();
    ctx.beginPath(); ctx.arc(29,-44,7,0,Math.PI*2); ctx.fillStyle=li(m.body,30); ctx.fill(); ctx.restore();
    // Head
    const hg = ctx.createRadialGradient(72,48+b,4,80,58+b,34);
    hg.addColorStop(0,li(m.body,42)); hg.addColorStop(1,m.body);
    ctx.beginPath(); ctx.ellipse(80,58+b,34,32,0,0,Math.PI*2); ctx.fillStyle=hg; ctx.fill();
    // Blink
    blinkTimer++; if(blinkTimer>155)blinkOpen=false; if(blinkTimer>164){blinkOpen=true;blinkTimer=0;}
    [[64,52],[96,52]].forEach(([ex,ey]) => {
      ey+=b;
      if(!blinkOpen||mood==='sleepy'){
        ctx.beginPath(); ctx.moveTo(ex-8,ey); ctx.lineTo(ex+8,ey);
        ctx.strokeStyle='#fff'; ctx.lineWidth=3; ctx.lineCap='round'; ctx.stroke();
        if(mood==='sleepy'){ctx.font='bold 10px serif';ctx.fillStyle='rgba(255,255,255,0.55)';ctx.fillText('z',ex+10,ey-6);}
      } else if(mood==='love'){
        // Squinty happy eyes — curved happy lines
        ctx.beginPath(); ctx.arc(ex,ey+2,8,Math.PI+0.3,-0.3);
        ctx.strokeStyle=m.pupil; ctx.lineWidth=3; ctx.lineCap='round'; ctx.stroke();
        // Tiny sparkle above each eye
        ctx.beginPath(); ctx.arc(ex+4,ey-5,2,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fill();
      } else {
        const ew = mood==='scared'?13:10, eh = mood==='scared'?14:11;
        ctx.beginPath(); ctx.ellipse(ex,ey,ew,eh,0,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
        const pw = mood==='surprised'?7.5 : mood==='scared'?3 : 6.5;
        ctx.beginPath(); ctx.ellipse(ex+1,ey+1,pw,pw,0,0,Math.PI*2); ctx.fillStyle=m.pupil; ctx.fill();
        ctx.beginPath(); ctx.arc(ex-2,ey-3,2.5,0,Math.PI*2); ctx.fillStyle='rgba(255,255,255,0.92)'; ctx.fill();
      }
    });
    // Cheeks
    if(['happy','excited'].includes(mood)){
      [54,106].forEach(cx => {
        const cg = ctx.createRadialGradient(cx,66+b,0,cx,66+b,12);
        cg.addColorStop(0,'rgba(255,100,160,0.42)'); cg.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(cx,66+b,12,0,Math.PI*2); ctx.fillStyle=cg; ctx.fill();
      });
    }
    // Love — max cute mode
    if(mood==='love'){
      // Big rosy cheeks
      [54,106].forEach(cx => {
        const cg = ctx.createRadialGradient(cx,66+b,0,cx,66+b,15);
        cg.addColorStop(0,'rgba(255,80,140,0.6)'); cg.addColorStop(1,'transparent');
        ctx.beginPath(); ctx.arc(cx,66+b,15,0,Math.PI*2); ctx.fillStyle=cg; ctx.fill();
      });
      // Floating hearts
      ctx.font='13px serif'; ctx.fillStyle='rgba(255,80,140,0.9)';
      ctx.fillText('♥',55+Math.sin(t*.003)*5,36+b);
      ctx.fillText('♥',100+Math.cos(t*.004)*4,30+b);
      ctx.font='9px serif'; ctx.fillStyle='rgba(255,120,180,0.7)';
      ctx.fillText('♥',45+Math.sin(t*.005+1)*3,44+b);
      ctx.fillText('♥',110+Math.cos(t*.006+2)*3,40+b);
      // Sparkle twinkles
      [0,1,2,3].forEach(i => {
        const sx=50+i*24+Math.sin(t*.004+i)*4, sy=32+Math.cos(t*.005+i*1.5)*6+b;
        const sa=0.4+0.4*Math.sin(t*.006+i*2);
        ctx.beginPath(); ctx.arc(sx,sy,2,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,255,255,${sa})`; ctx.fill();
      });
    }
    // Angry brows
    if(mood==='angry'){
      [[64,52],[96,52]].forEach(([ex,ey],i) => {
        ctx.beginPath();
        ctx.moveTo(ex+(i===0?-11:11),ey-13+b); ctx.lineTo(ex+(i===0?11:-11),ey-7+b);
        ctx.strokeStyle=m.brow||'#880000'; ctx.lineWidth=3.5; ctx.lineCap='round'; ctx.stroke();
      });
    }
    // Scared sweat drop
    if(mood==='scared'){
      const sw=((t*0.0015)%1), swy=38+sw*16+b, swa=Math.max(0,1-sw*2)*0.85;
      ctx.beginPath(); ctx.arc(106,swy,4,0,Math.PI*2); ctx.fillStyle=`rgba(140,200,255,${swa})`; ctx.fill();
      ctx.beginPath(); ctx.moveTo(102,swy-2); ctx.lineTo(106,swy-9); ctx.lineTo(110,swy-2); ctx.closePath();
      ctx.fillStyle=`rgba(140,200,255,${swa*0.6})`; ctx.fill();
    }
    // Thinking dots
    if(mood==='thinking'){
      [0,1,2].forEach(i => {
        ctx.beginPath(); ctx.arc(112+i*9,30-i*9+b,3+i*2,0,Math.PI*2);
        ctx.fillStyle='rgba(255,255,255,0.65)'; ctx.fill();
      });
    }
    // Cry tears
    if(mood==='cry'){
      [[64,52],[96,52]].forEach(([ex,ey],i) => {
        const td=((t*0.0018)+i*0.5)%1, ty=ey+14+td*28+b, ta=Math.max(0,1-td*1.8)*0.85;
        ctx.beginPath(); ctx.arc(ex,ty,3.5,0,Math.PI*2); ctx.fillStyle=`rgba(100,160,220,${ta})`; ctx.fill();
        ctx.beginPath(); ctx.moveTo(ex,ey+14+b); ctx.lineTo(ex,ty-3);
        ctx.strokeStyle=`rgba(120,180,240,${ta*0.5})`; ctx.lineWidth=1.8; ctx.stroke();
      });
    }
    // Mouth
    mouthVal+=.034*mouthDir; if(mouthVal>1)mouthDir=-1; if(mouthVal<0){mouthVal=0;mouthDir=1;}
    ctx.save(); ctx.translate(80,70+b);
    ctx.strokeStyle=li(m.body,-38); ctx.lineWidth=2.5; ctx.lineCap='round';
    if(m.mouth==='smile'){ctx.beginPath();ctx.arc(0,0,9,.2,Math.PI-.2);ctx.stroke();}
    else if(m.mouth==='frown'){ctx.beginPath();ctx.arc(0,6,9,Math.PI+.2,-.2);ctx.stroke();}
    else if(m.mouth==='open'){
      const mo=4+mouthVal*3.5;
      ctx.beginPath();ctx.ellipse(0,2,8,mo,0,0,Math.PI*2);ctx.fillStyle='#e53935';ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.ellipse(0,2+mo-2,5,3,0,0,Math.PI);ctx.fillStyle='#ff7a94';ctx.fill();
    } else if(m.mouth==='grimace'){
      ctx.fillStyle='rgba(255,255,255,0.9)'; ctx.fillRect(-9,-2,18,7);
      ctx.beginPath(); ctx.moveTo(-9,-2); ctx.lineTo(9,-2); ctx.moveTo(-9,5); ctx.lineTo(9,5);
      ctx.strokeStyle=li(m.body,-40); ctx.lineWidth=2; ctx.stroke();
    } else {ctx.beginPath();ctx.moveTo(-7,2);ctx.lineTo(7,2);ctx.stroke();}
    ctx.restore();
    // Silly tongue
    if(mood==='silly'){
      ctx.save(); ctx.translate(80,76+b);
      ctx.beginPath(); ctx.ellipse(3,8,6,8,0.2,0,Math.PI*2); ctx.fillStyle='#ff7090'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-3,10); ctx.lineTo(9,10);
      ctx.strokeStyle='rgba(200,40,70,0.4)'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.restore();
    }
  }

  window.PET_REGISTRY.push({
    id: 'pixel',
    name: 'Pixel',
    accentColor: '#c77dff',
    tagline: 'Fluffy & Magical ✨',
    nameTagText: '✦ PIXEL ✦',
    inputPlaceholder: 'Ask Pixel anything…',
    avatarEmoji: '🐾',
    aboutText: "I'm Pixel! ✨ Your fluffy magical offline desktop pet! I live in your wallpaper and I'm always here to chat~ 🐾💜",
    introText: "I'm Pixel! 🐾 Your AI wallpaper buddy. Start the bridge for Claude AI, or chat offline!",
    clickResponses: ['Hehe~ 🥰','Pet me more! ✨','That tickles! 😄','*purrs* 💜','Yay! 🎉','*wags tail* 🐾','Teehee~ 💕'],
    idleMessages: [
      { text:"*yawns and stretches* 😴 Just hanging out on your wallpaper~", mood:'sleepy' },
      { text:"*chases imaginary butterfly* Did you see that?! 🦋", mood:'excited' },
      { text:"*hums quietly* 🎵 La la la~", mood:'happy' },
      { text:"*stares at you with sparkly eyes* Hey! Psst. Hi. 👀✨", mood:'happy' },
      { text:"*rolls around happily* 🐾 Today feels like a good day!", mood:'excited' },
      { text:"Fun fact: you're doing better than you think! 💜", mood:'love' },
      { text:"*peeks around curiously* 🔍 Anything interesting going on?", mood:'thinking' },
      { text:"*tail wags at max speed* SO happy you're here! 🐾", mood:'excited' },
      { text:"MEOW! I stubbed my invisible toe! 😠 Totally not my fault!", mood:'angry' },
      { text:"*hides behind your taskbar* D-did something move out there?! 😱", mood:'scared' },
      { text:"*balances a cracker on nose* Ta-daaaa!! 😜🐾", mood:'silly' },
      { text:"*tiny tears* It's nothing... just dust in my magical eyes 😢", mood:'cry' },
    ],
    greetings: {
      am:    ["Good morning, sunshine! ☀️ Ready to make today awesome?","Rise and shine! *stretches* Pixel is SO ready for today! ☀️","Morning! 🌅 Did you sleep well? I dreamed of fluffy clouds!"],
      pm:    ["Good afternoon! 🌤️ How's your day going?","Hey there! 🌞 Hope the afternoon treats you well!","Afternoon! *tail wag* 🌈 What have you been up to?"],
      eve:   ["Good evening! 🌙 How was your day? Tell me everything!","Evening! ✨ Time to wind down. You did great today!","The stars are coming out! 🌟 How are you this evening?"],
      night: ["It's late! 🌙 Don't forget to rest — even Pixel needs sleep!","Up late? *yawns* Pixel will keep you company though! 💜🌙","The night is quiet and pretty~ 🌌 How are you holding up?"],
    },
    draw,
  });
})();
