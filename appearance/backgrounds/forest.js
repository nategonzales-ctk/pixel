window.BACKGROUND_REGISTRY = window.BACKGROUND_REGISTRY || [];
window.BACKGROUND_REGISTRY.push({
  id: 'forest', name: 'Forest', icon: '🌲',
  draw: function(t) {
    const W=bgCanvas.width, H=bgCanvas.height, d=dayNightBlend, n=1-d;

    // ── Sky: dark night green → bright day blue/green ──
    const sky=bgCtx.createLinearGradient(0,0,0,H*0.5);
    sky.addColorStop(0, _lc('#010804','#5a9aca',d));
    sky.addColorStop(1, _lc('#031208','#7db84a',d));
    bgCtx.fillStyle=sky; bgCtx.fillRect(0,0,W,H);

    // Stars (night only, clipped to sky band)
    bgCtx.save(); bgCtx.beginPath(); bgCtx.rect(0,0,W,H*0.38); bgCtx.clip();
    for(const s of STARS){
      const a=Math.max(0,0.08+Math.sin(t*s.spd+s.ph)*0.18)*n;
      if(a<=0) continue;
      bgCtx.beginPath(); bgCtx.arc(s.x*W,s.y*H*0.38,s.r*0.6,0,Math.PI*2);
      bgCtx.fillStyle='#ccffcc'; bgCtx.globalAlpha=a*0.65; bgCtx.fill();
    }
    bgCtx.globalAlpha=1; bgCtx.restore();

    // Sun through the canopy (day only, clipped above tree line)
    if(d>0.005){
      const sp=_sunPos(W,H);
      bgCtx.save(); bgCtx.beginPath(); bgCtx.rect(0,0,W,H*0.50); bgCtx.clip();
      bgCtx.globalAlpha=d;
      _drawDaySun(bgCtx, sp.x, Math.min(sp.y, H*0.34), 22);
      bgCtx.restore();
    }

    // ── Trees — dark night silhouettes → slightly lighter day greens ──
    const pine = (x,y,h,cn,cd) => {
      const col=_lc(cn,cd,d), w=h*0.48;
      for(let i=0;i<3;i++){
        const ty=y-h*0.28*i-h*0.18, tw=w*(1-i*0.18)*(1+i*0.08);
        bgCtx.beginPath(); bgCtx.moveTo(x,ty-h*0.32);
        bgCtx.lineTo(x-tw/2,ty); bgCtx.lineTo(x+tw/2,ty); bgCtx.closePath();
        bgCtx.fillStyle=col; bgCtx.fill();
      }
      bgCtx.fillStyle=_lc('#0e0804','#2a1806',d);
      bgCtx.fillRect(x-3,y-h*0.12,6,h*0.16);
    };

    for(let i=0;i<22;i++) pine((i/22)*W*1.1-W*0.05, H*0.54, 55+(i*37%38), '#061506','#1d5a10');
    for(let i=0;i<15;i++) pine((i/15)*W*1.1-W*0.04, H*0.67, 90+(i*53%55), '#040e04','#163d0a');

    // Ground
    const gnd=bgCtx.createLinearGradient(0,H*0.64,0,H);
    gnd.addColorStop(0, _lc('#020c02','#0a2406',d));
    gnd.addColorStop(1, _lc('#010601','#051403',d));
    bgCtx.fillStyle=gnd; bgCtx.fillRect(0,H*0.64,W,H);

    for(let i=0;i<10;i++) pine((i/10)*W*1.1-W*0.05, H*0.88, 150+(i*71%75), '#020802','#102b06');

    // Fireflies (night only)
    for(let i=0;i<20;i++){
      const ph=i*2.399;
      const fx=(0.08+((Math.sin(t*0.00025+ph)*0.5+0.5)*0.84))*W;
      const fy=H*0.42+(Math.cos(t*0.00035+ph*1.3)*0.5+0.5)*H*0.38;
      const fa=Math.max(0,Math.sin(t*0.0022+ph)*0.65+0.35)*n;
      if(fa>0.08){
        const fg=bgCtx.createRadialGradient(fx,fy,0,fx,fy,9);
        fg.addColorStop(0,`rgba(190,255,80,${fa*0.85})`); fg.addColorStop(1,'transparent');
        bgCtx.beginPath(); bgCtx.arc(fx,fy,9,0,Math.PI*2); bgCtx.fillStyle=fg; bgCtx.fill();
        bgCtx.beginPath(); bgCtx.arc(fx,fy,1.8,0,Math.PI*2);
        bgCtx.fillStyle=`rgba(210,255,130,${fa})`; bgCtx.fill();
      }
    }

    // Sunbeams through the canopy (day only)
    if(d>0.05){
      const sp=_sunPos(W,H);
      for(let i=0;i<6;i++){
        const rx=sp.x+(i-2.5)*W*0.055;
        const rg=bgCtx.createLinearGradient(rx,0,rx+W*0.012,H*0.72);
        rg.addColorStop(0,`rgba(255,240,180,${d*0.07})`);
        rg.addColorStop(1,'transparent');
        bgCtx.fillStyle=rg;
        bgCtx.beginPath();
        bgCtx.moveTo(rx-W*0.008,0); bgCtx.lineTo(rx+W*0.038,H*0.72);
        bgCtx.lineTo(rx+W*0.058,H*0.72); bgCtx.lineTo(rx+W*0.012,0);
        bgCtx.closePath(); bgCtx.fill();
      }
    }

    // Ground ambient glow
    for(let i=0;i<5;i++){
      const fx=(Math.sin(t*0.00018+i*1.5)*0.3+0.15+i*0.17)*W;
      const fy=H*0.69+i*12;
      const gc=d>0.5 ? 'rgba(180,255,100,0.035)' : 'rgba(160,255,160,0.035)';
      const fg=bgCtx.createRadialGradient(fx,fy,0,fx,fy,100+i*18);
      fg.addColorStop(0,gc); fg.addColorStop(1,'transparent');
      bgCtx.beginPath(); bgCtx.ellipse(fx,fy,130+i*28,18,0,0,Math.PI*2);
      bgCtx.fillStyle=fg; bgCtx.fill();
    }
  },
});
