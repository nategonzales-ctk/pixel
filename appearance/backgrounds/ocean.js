window.BACKGROUND_REGISTRY = window.BACKGROUND_REGISTRY || [];
window.BACKGROUND_REGISTRY.push({
  id: 'ocean', name: 'Ocean', icon: '🏖️',
  draw: function(t) {
    const W=bgCanvas.width,H=bgCanvas.height;
    const sky=bgCtx.createLinearGradient(0,0,0,H*0.6);
    sky.addColorStop(0,'#010a1a'); sky.addColorStop(0.5,'#051830'); sky.addColorStop(1,'#0a2848');
    bgCtx.fillStyle=sky; bgCtx.fillRect(0,0,W,H*0.7);
    bgCtx.save(); bgCtx.beginPath(); bgCtx.rect(0,0,W,H*0.52); bgCtx.clip();
    for(const s of STARS){
      const a=Math.max(0,0.1+Math.sin(t*s.spd+s.ph)*0.2);
      bgCtx.beginPath(); bgCtx.arc(s.x*W,s.y*H*0.52,s.r*0.7,0,Math.PI*2);
      bgCtx.fillStyle='#ffffff'; bgCtx.globalAlpha=a; bgCtx.fill();
    }
    bgCtx.globalAlpha=1; bgCtx.restore();
    const mX=W*0.74,mY=H*0.14;
    const mg=bgCtx.createRadialGradient(mX,mY,0,mX,mY,65);
    mg.addColorStop(0,'rgba(200,220,255,0.18)'); mg.addColorStop(1,'transparent');
    bgCtx.beginPath(); bgCtx.arc(mX,mY,65,0,Math.PI*2); bgCtx.fillStyle=mg; bgCtx.fill();
    bgCtx.beginPath(); bgCtx.arc(mX,mY,19,0,Math.PI*2); bgCtx.fillStyle='#d4e8f5'; bgCtx.fill();
    const wY=H*0.58;
    const wat=bgCtx.createLinearGradient(0,wY,0,H*0.82);
    wat.addColorStop(0,'#041520'); wat.addColorStop(1,'#061c30');
    bgCtx.fillStyle=wat; bgCtx.fillRect(0,wY,W,H*0.25);
    bgCtx.save(); bgCtx.beginPath(); bgCtx.rect(0,wY,W,H*0.25); bgCtx.clip();
    const refl=bgCtx.createLinearGradient(mX-25,wY,mX+25,wY);
    refl.addColorStop(0,'transparent'); refl.addColorStop(0.5,'rgba(200,225,255,0.1)'); refl.addColorStop(1,'transparent');
    bgCtx.fillStyle=refl; bgCtx.fillRect(mX-50,wY,100,H*0.25); bgCtx.restore();
    for(let l=0;l<4;l++){
      const yb=wY+l*20+8,amp=3+l*1.5,spd=0.0008+l*0.0003;
      bgCtx.beginPath(); bgCtx.moveTo(0,yb);
      for(let x=0;x<=W;x+=4){ bgCtx.lineTo(x,yb+Math.sin(x*0.018+t*spd*1000)*amp); }
      bgCtx.strokeStyle=`rgba(100,180,220,${0.12-l*0.025})`; bgCtx.lineWidth=1.5; bgCtx.stroke();
    }
    const sandY=H*0.82;
    const sand=bgCtx.createLinearGradient(0,sandY,0,H);
    sand.addColorStop(0,'#7a6445'); sand.addColorStop(0.3,'#967a58'); sand.addColorStop(1,'#b8976e');
    bgCtx.fillStyle=sand; bgCtx.fillRect(0,sandY,W,H-sandY);
    const sAlpha=0.18+Math.sin(t*0.0009)*0.06;
    const shim=bgCtx.createLinearGradient(0,sandY-2,0,sandY+14);
    shim.addColorStop(0,`rgba(80,140,190,${sAlpha})`); shim.addColorStop(1,'transparent');
    bgCtx.fillStyle=shim; bgCtx.fillRect(0,sandY-2,W,16);
    const hg=bgCtx.createLinearGradient(0,wY-20,0,wY+30);
    hg.addColorStop(0,'transparent'); hg.addColorStop(0.5,'rgba(60,130,200,0.08)'); hg.addColorStop(1,'transparent');
    bgCtx.fillStyle=hg; bgCtx.fillRect(0,wY-20,W,50);
  },
});
