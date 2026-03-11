window.BACKGROUND_REGISTRY = window.BACKGROUND_REGISTRY || [];
window.BACKGROUND_REGISTRY.push({
  id: 'forest', name: 'Forest', icon: '🌲',
  draw: function(t) {
    const W=bgCanvas.width,H=bgCanvas.height;
    const sky=bgCtx.createLinearGradient(0,0,0,H*0.5);
    sky.addColorStop(0,'#010804'); sky.addColorStop(1,'#031208');
    bgCtx.fillStyle=sky; bgCtx.fillRect(0,0,W,H);
    bgCtx.save(); bgCtx.beginPath(); bgCtx.rect(0,0,W,H*0.38); bgCtx.clip();
    for(const s of STARS){
      const a=Math.max(0,0.08+Math.sin(t*s.spd+s.ph)*0.18);
      bgCtx.beginPath(); bgCtx.arc(s.x*W,s.y*H*0.38,s.r*0.6,0,Math.PI*2);
      bgCtx.fillStyle='#ccffcc'; bgCtx.globalAlpha=a*0.65; bgCtx.fill();
    }
    bgCtx.globalAlpha=1; bgCtx.restore();
    function pine(x,y,h,col){
      const w=h*0.48;
      for(let i=0;i<3;i++){
        const ty=y-h*0.28*i-h*0.18,tw=w*(1-i*0.18)*(1+i*0.08);
        bgCtx.beginPath(); bgCtx.moveTo(x,ty-h*0.32); bgCtx.lineTo(x-tw/2,ty); bgCtx.lineTo(x+tw/2,ty); bgCtx.closePath();
        bgCtx.fillStyle=col; bgCtx.fill();
      }
      bgCtx.fillStyle='#0e0804'; bgCtx.fillRect(x-3,y-h*0.12,6,h*0.16);
    }
    for(let i=0;i<22;i++) pine((i/22)*W*1.1-W*0.05,H*0.54,55+(i*37%38),'#061506');
    for(let i=0;i<15;i++) pine((i/15)*W*1.1-W*0.04,H*0.67,90+(i*53%55),'#040e04');
    const gnd=bgCtx.createLinearGradient(0,H*0.64,0,H);
    gnd.addColorStop(0,'#020c02'); gnd.addColorStop(1,'#010601');
    bgCtx.fillStyle=gnd; bgCtx.fillRect(0,H*0.64,W,H);
    for(let i=0;i<10;i++) pine((i/10)*W*1.1-W*0.05,H*0.88,150+(i*71%75),'#020802');
    for(let i=0;i<20;i++){
      const ph=i*2.399;
      const fx=(0.08+((Math.sin(t*0.00025+ph)*0.5+0.5)*0.84))*W;
      const fy=H*0.42+(Math.cos(t*0.00035+ph*1.3)*0.5+0.5)*H*0.38;
      const fa=Math.max(0,Math.sin(t*0.0022+ph)*0.65+0.35);
      if(fa>0.12){
        const fg=bgCtx.createRadialGradient(fx,fy,0,fx,fy,9);
        fg.addColorStop(0,`rgba(190,255,80,${fa*0.85})`); fg.addColorStop(1,'transparent');
        bgCtx.beginPath(); bgCtx.arc(fx,fy,9,0,Math.PI*2); bgCtx.fillStyle=fg; bgCtx.fill();
        bgCtx.beginPath(); bgCtx.arc(fx,fy,1.8,0,Math.PI*2); bgCtx.fillStyle=`rgba(210,255,130,${fa})`; bgCtx.fill();
      }
    }
    for(let i=0;i<5;i++){
      const fx=(Math.sin(t*0.00018+i*1.5)*0.3+0.15+i*0.17)*W;
      const fy=H*0.69+i*12;
      const fg=bgCtx.createRadialGradient(fx,fy,0,fx,fy,100+i*18);
      fg.addColorStop(0,'rgba(160,255,160,0.035)'); fg.addColorStop(1,'transparent');
      bgCtx.beginPath(); bgCtx.ellipse(fx,fy,130+i*28,18,0,0,Math.PI*2); bgCtx.fillStyle=fg; bgCtx.fill();
    }
  },
});
