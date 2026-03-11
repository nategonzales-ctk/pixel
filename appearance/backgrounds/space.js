window.BACKGROUND_REGISTRY = window.BACKGROUND_REGISTRY || [];
window.BACKGROUND_REGISTRY.push({
  id: 'space', name: 'Space', icon: '🌌',
  draw: function(t) {
    const W=bgCanvas.width, H=bgCanvas.height, d=dayNightBlend, n=1-d;

    // ── Night: dark gradient ──
    const grad=bgCtx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,bgGradTop); grad.addColorStop(1,bgGradBot);
    bgCtx.fillStyle=grad; bgCtx.fillRect(0,0,W,H);

    // Nebulas fade with night
    for(const nb of NEBULAS){
      const a=(0.022+Math.sin(t*nb.spd+nb.ph)*0.012)*n;
      if(a<=0) continue;
      const g=bgCtx.createRadialGradient(nb.x*W,nb.y*H,0,nb.x*W,nb.y*H,nb.r);
      g.addColorStop(0,nb.col+a+')'); g.addColorStop(1,nb.col+'0)');
      bgCtx.beginPath(); bgCtx.arc(nb.x*W,nb.y*H,nb.r,0,Math.PI*2);
      bgCtx.fillStyle=g; bgCtx.fill();
    }

    // Stars fade with night
    for(const s of STARS){
      const a=Math.max(0,0.15+Math.sin(t*s.spd+s.ph)*0.28)*n;
      if(a<=0) continue;
      bgCtx.beginPath(); bgCtx.arc(s.x*W,s.y*H,s.r,0,Math.PI*2);
      bgCtx.fillStyle=s.col; bgCtx.globalAlpha=a; bgCtx.fill();
    }
    bgCtx.globalAlpha=1;

    // Shooting stars only at night
    if(n>0.5 && Math.random()<0.0018) spawnShootingStar();
    for(let i=shootingStars.length-1;i>=0;i--){
      const s=shootingStars[i];
      bgCtx.save(); bgCtx.globalAlpha=s.life*0.75*n;
      const g=bgCtx.createLinearGradient(s.x,s.y,s.x+s.len,s.y+s.len*0.4);
      g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(1,'rgba(255,255,255,0.9)');
      bgCtx.strokeStyle=g; bgCtx.lineWidth=1.5;
      bgCtx.beginPath(); bgCtx.moveTo(s.x,s.y);
      bgCtx.lineTo(s.x+s.len*(1-s.life),s.y+s.len*0.4*(1-s.life)); bgCtx.stroke();
      bgCtx.restore();
      s.life-=s.spd; s.x+=3; s.y+=1.2;
      if(s.life<=0) shootingStars.splice(i,1);
    }

    // ── Day: blue sky + sun + clouds overlay ──
    if(d>0.005){
      bgCtx.save(); bgCtx.globalAlpha=d;
      const sky=bgCtx.createLinearGradient(0,0,0,H);
      sky.addColorStop(0,'#4A90D9'); sky.addColorStop(0.5,'#87CEEB'); sky.addColorStop(1,'#C9E8F5');
      bgCtx.fillStyle=sky; bgCtx.fillRect(0,0,W,H);
      bgCtx.globalAlpha=1;

      const sp=_sunPos(W,H);
      bgCtx.save(); bgCtx.globalAlpha=d; _drawDaySun(bgCtx,sp.x,sp.y); bgCtx.restore();

      bgCtx.fillStyle='rgba(255,255,255,1)';
      for(const c of _CLOUDS){
        const cx=((c.ox+t*c.spd)%1.2-0.1)*W, cy=c.oy*H;
        bgCtx.save(); bgCtx.globalAlpha=d*c.a;
        _drawDayCloud(bgCtx,cx,cy,c.w*W);
        bgCtx.restore();
      }
      bgCtx.restore();
    }
  },
});
