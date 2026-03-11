window.BACKGROUND_REGISTRY = window.BACKGROUND_REGISTRY || [];
window.BACKGROUND_REGISTRY.push({
  id: 'ocean', name: 'Ocean', icon: '🏖️',
  draw: function(t) {
    const W=bgCanvas.width, H=bgCanvas.height, d=dayNightBlend, n=1-d;

    // ── Sky: lerp night navy → day blue ──
    const sky=bgCtx.createLinearGradient(0,0,0,H*0.6);
    sky.addColorStop(0,   _lc('#010a1a','#1e72c0',d));
    sky.addColorStop(0.5, _lc('#051830','#3a9ad4',d));
    sky.addColorStop(1,   _lc('#0a2848','#87ceeb',d));
    bgCtx.fillStyle=sky; bgCtx.fillRect(0,0,W,H*0.7);

    // Stars (night only)
    bgCtx.save(); bgCtx.beginPath(); bgCtx.rect(0,0,W,H*0.52); bgCtx.clip();
    for(const s of STARS){
      const a=Math.max(0,0.1+Math.sin(t*s.spd+s.ph)*0.2)*n;
      if(a<=0) continue;
      bgCtx.beginPath(); bgCtx.arc(s.x*W,s.y*H*0.52,s.r*0.7,0,Math.PI*2);
      bgCtx.fillStyle='#ffffff'; bgCtx.globalAlpha=a; bgCtx.fill();
    }
    bgCtx.globalAlpha=1; bgCtx.restore();

    // Moon (fades out at day)
    if(n>0.005){
      const mX=W*0.74, mY=H*0.14;
      const mg=bgCtx.createRadialGradient(mX,mY,0,mX,mY,65);
      mg.addColorStop(0,`rgba(200,220,255,${0.18*n})`); mg.addColorStop(1,'transparent');
      bgCtx.beginPath(); bgCtx.arc(mX,mY,65,0,Math.PI*2); bgCtx.fillStyle=mg; bgCtx.fill();
      bgCtx.globalAlpha=n;
      bgCtx.beginPath(); bgCtx.arc(mX,mY,19,0,Math.PI*2); bgCtx.fillStyle='#d4e8f5'; bgCtx.fill();
      bgCtx.globalAlpha=1;
    }

    // Sun (fades in at day) + clouds
    if(d>0.005){
      const sp=_sunPos(W,H);
      bgCtx.save(); bgCtx.globalAlpha=d;
      _drawDaySun(bgCtx,sp.x,sp.y);
      bgCtx.fillStyle='rgba(255,255,255,1)';
      for(const c of _CLOUDS.slice(0,3)){
        const cx=((c.ox+t*c.spd)%1.2-0.1)*W, cy=c.oy*H*0.55;
        bgCtx.globalAlpha=d*c.a*0.75;
        _drawDayCloud(bgCtx,cx,cy,c.w*W);
      }
      bgCtx.globalAlpha=1;
      bgCtx.restore();
    }

    // ── Water: lerp night dark → day bright blue ──
    const wY=H*0.58;
    const wat=bgCtx.createLinearGradient(0,wY,0,H*0.82);
    wat.addColorStop(0, _lc('#041520','#0a5a8a',d));
    wat.addColorStop(1, _lc('#061c30','#1278b0',d));
    bgCtx.fillStyle=wat; bgCtx.fillRect(0,wY,W,H*0.25);

    // Water reflection (moon → sun position)
    bgCtx.save(); bgCtx.beginPath(); bgCtx.rect(0,wY,W,H*0.25); bgCtx.clip();
    const reflX = W*(0.74*n + (_sunPos(W,H).x/W)*d);
    const refl=bgCtx.createLinearGradient(reflX-30,wY,reflX+30,wY);
    const reflCol = d>0.5 ? 'rgba(255,220,100,0.14)' : 'rgba(200,225,255,0.10)';
    refl.addColorStop(0,'transparent'); refl.addColorStop(0.5,reflCol); refl.addColorStop(1,'transparent');
    bgCtx.fillStyle=refl; bgCtx.fillRect(reflX-70,wY,140,H*0.25);
    bgCtx.restore();

    // Waves
    for(let l=0;l<4;l++){
      const yb=wY+l*20+8, amp=3+l*1.5, spd=0.0008+l*0.0003;
      const wc=d>0.5
        ? `rgba(140,210,255,${0.14-l*0.025})`
        : `rgba(100,180,220,${0.12-l*0.025})`;
      bgCtx.beginPath(); bgCtx.moveTo(0,yb);
      for(let x=0;x<=W;x+=4){ bgCtx.lineTo(x,yb+Math.sin(x*0.018+t*spd*1000)*amp); }
      bgCtx.strokeStyle=wc; bgCtx.lineWidth=1.5; bgCtx.stroke();
    }

    // ── Sand: lighten in day ──
    const sandY=H*0.82;
    const sand=bgCtx.createLinearGradient(0,sandY,0,H);
    sand.addColorStop(0,   _lc('#7a6445','#c4a870',d));
    sand.addColorStop(0.3, _lc('#967a58','#d4bc8a',d));
    sand.addColorStop(1,   _lc('#b8976e','#e8d0a0',d));
    bgCtx.fillStyle=sand; bgCtx.fillRect(0,sandY,W,H-sandY);

    const sAlpha=(0.18+Math.sin(t*0.0009)*0.06)*(n+d*0.5);
    const shim=bgCtx.createLinearGradient(0,sandY-2,0,sandY+14);
    shim.addColorStop(0,`rgba(${d>0.5?'200,220,140':'80,140,190'},${sAlpha})`);
    shim.addColorStop(1,'transparent');
    bgCtx.fillStyle=shim; bgCtx.fillRect(0,sandY-2,W,16);

    const hg=bgCtx.createLinearGradient(0,wY-20,0,wY+30);
    hg.addColorStop(0,'transparent');
    hg.addColorStop(0.5,`rgba(${d>0.5?'100,180,255':'60,130,200'},0.08)`);
    hg.addColorStop(1,'transparent');
    bgCtx.fillStyle=hg; bgCtx.fillRect(0,wY-20,W,50);
  },
});
