window.BACKGROUND_REGISTRY = window.BACKGROUND_REGISTRY || [];
window.BACKGROUND_REGISTRY.push({
  id: 'space', name: 'Space', icon: '🌌',
  draw: function(t) {
    const W=bgCanvas.width,H=bgCanvas.height;
    const grad=bgCtx.createLinearGradient(0,0,0,H);
    grad.addColorStop(0,bgGradTop); grad.addColorStop(1,bgGradBot);
    bgCtx.fillStyle=grad; bgCtx.fillRect(0,0,W,H);
    for(const n of NEBULAS){
      const a=0.022+Math.sin(t*n.spd+n.ph)*0.012;
      const g=bgCtx.createRadialGradient(n.x*W,n.y*H,0,n.x*W,n.y*H,n.r);
      g.addColorStop(0,n.col+a+')'); g.addColorStop(1,n.col+'0)');
      bgCtx.beginPath(); bgCtx.arc(n.x*W,n.y*H,n.r,0,Math.PI*2);
      bgCtx.fillStyle=g; bgCtx.fill();
    }
    for(const s of STARS){
      const a=Math.max(0,0.15+Math.sin(t*s.spd+s.ph)*0.28);
      bgCtx.beginPath(); bgCtx.arc(s.x*W,s.y*H,s.r,0,Math.PI*2);
      bgCtx.fillStyle=s.col; bgCtx.globalAlpha=a; bgCtx.fill();
    }
    bgCtx.globalAlpha=1;
    if(Math.random()<0.0018) spawnShootingStar();
    for(let i=shootingStars.length-1;i>=0;i--){
      const s=shootingStars[i];
      bgCtx.save(); bgCtx.globalAlpha=s.life*0.75;
      const g=bgCtx.createLinearGradient(s.x,s.y,s.x+s.len,s.y+s.len*0.4);
      g.addColorStop(0,'rgba(255,255,255,0)'); g.addColorStop(1,'rgba(255,255,255,0.9)');
      bgCtx.strokeStyle=g; bgCtx.lineWidth=1.5;
      bgCtx.beginPath(); bgCtx.moveTo(s.x,s.y);
      bgCtx.lineTo(s.x+s.len*(1-s.life),s.y+s.len*0.4*(1-s.life)); bgCtx.stroke();
      bgCtx.restore();
      s.life-=s.spd; s.x+=3; s.y+=1.2;
      if(s.life<=0) shootingStars.splice(i,1);
    }
  },
});
