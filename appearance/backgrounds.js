// ══════════════════════════════════════════════════
//  BACKGROUND SCENES
//  Depends on: bgCanvas, bgCtx, bgGradTop, bgGradBot,
//              bgNebulaColors, STARS, NEBULAS,
//              shootingStars, spawnShootingStar
// ══════════════════════════════════════════════════
let currentBgScene = 'space';

function drawBg(t) {
  switch(currentBgScene) {
    case 'ocean':  drawBgOcean(t);  break;
    case 'forest': drawBgForest(t); break;
    case 'office': drawBgOffice(t); break;
    default:       drawBgSpace(t);  break;
  }
}

function drawBgSpace(t){
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
}

function drawBgOcean(t) {
  const W=bgCanvas.width,H=bgCanvas.height;
  // Sky
  const sky=bgCtx.createLinearGradient(0,0,0,H*0.6);
  sky.addColorStop(0,'#010a1a'); sky.addColorStop(0.5,'#051830'); sky.addColorStop(1,'#0a2848');
  bgCtx.fillStyle=sky; bgCtx.fillRect(0,0,W,H*0.7);
  // Stars
  bgCtx.save(); bgCtx.beginPath(); bgCtx.rect(0,0,W,H*0.52); bgCtx.clip();
  for(const s of STARS){
    const a=Math.max(0,0.1+Math.sin(t*s.spd+s.ph)*0.2);
    bgCtx.beginPath(); bgCtx.arc(s.x*W,s.y*H*0.52,s.r*0.7,0,Math.PI*2);
    bgCtx.fillStyle='#ffffff'; bgCtx.globalAlpha=a; bgCtx.fill();
  }
  bgCtx.globalAlpha=1; bgCtx.restore();
  // Moon
  const mX=W*0.74,mY=H*0.14;
  const mg=bgCtx.createRadialGradient(mX,mY,0,mX,mY,65);
  mg.addColorStop(0,'rgba(200,220,255,0.18)'); mg.addColorStop(1,'transparent');
  bgCtx.beginPath(); bgCtx.arc(mX,mY,65,0,Math.PI*2); bgCtx.fillStyle=mg; bgCtx.fill();
  bgCtx.beginPath(); bgCtx.arc(mX,mY,19,0,Math.PI*2); bgCtx.fillStyle='#d4e8f5'; bgCtx.fill();
  // Water
  const wY=H*0.58;
  const wat=bgCtx.createLinearGradient(0,wY,0,H*0.82);
  wat.addColorStop(0,'#041520'); wat.addColorStop(1,'#061c30');
  bgCtx.fillStyle=wat; bgCtx.fillRect(0,wY,W,H*0.25);
  // Moon reflection
  bgCtx.save(); bgCtx.beginPath(); bgCtx.rect(0,wY,W,H*0.25); bgCtx.clip();
  const refl=bgCtx.createLinearGradient(mX-25,wY,mX+25,wY);
  refl.addColorStop(0,'transparent'); refl.addColorStop(0.5,'rgba(200,225,255,0.1)'); refl.addColorStop(1,'transparent');
  bgCtx.fillStyle=refl; bgCtx.fillRect(mX-50,wY,100,H*0.25); bgCtx.restore();
  // Waves
  for(let l=0;l<4;l++){
    const yb=wY+l*20+8, amp=3+l*1.5, spd=0.0008+l*0.0003;
    bgCtx.beginPath(); bgCtx.moveTo(0,yb);
    for(let x=0;x<=W;x+=4){ bgCtx.lineTo(x,yb+Math.sin(x*0.018+t*spd*1000)*amp); }
    bgCtx.strokeStyle=`rgba(100,180,220,${0.12-l*0.025})`; bgCtx.lineWidth=1.5; bgCtx.stroke();
  }
  // Sand
  const sandY=H*0.82;
  const sand=bgCtx.createLinearGradient(0,sandY,0,H);
  sand.addColorStop(0,'#7a6445'); sand.addColorStop(0.3,'#967a58'); sand.addColorStop(1,'#b8976e');
  bgCtx.fillStyle=sand; bgCtx.fillRect(0,sandY,W,H-sandY);
  // Wet sand shimmer
  const sAlpha=0.18+Math.sin(t*0.0009)*0.06;
  const shim=bgCtx.createLinearGradient(0,sandY-2,0,sandY+14);
  shim.addColorStop(0,`rgba(80,140,190,${sAlpha})`); shim.addColorStop(1,'transparent');
  bgCtx.fillStyle=shim; bgCtx.fillRect(0,sandY-2,W,16);
  // Horizon glow
  const hg=bgCtx.createLinearGradient(0,wY-20,0,wY+30);
  hg.addColorStop(0,'transparent'); hg.addColorStop(0.5,'rgba(60,130,200,0.08)'); hg.addColorStop(1,'transparent');
  bgCtx.fillStyle=hg; bgCtx.fillRect(0,wY-20,W,50);
}

function drawBgForest(t) {
  const W=bgCanvas.width,H=bgCanvas.height;
  // Sky
  const sky=bgCtx.createLinearGradient(0,0,0,H*0.5);
  sky.addColorStop(0,'#010804'); sky.addColorStop(1,'#031208');
  bgCtx.fillStyle=sky; bgCtx.fillRect(0,0,W,H);
  // Stars through canopy
  bgCtx.save(); bgCtx.beginPath(); bgCtx.rect(0,0,W,H*0.38); bgCtx.clip();
  for(const s of STARS){
    const a=Math.max(0,0.08+Math.sin(t*s.spd+s.ph)*0.18);
    bgCtx.beginPath(); bgCtx.arc(s.x*W,s.y*H*0.38,s.r*0.6,0,Math.PI*2);
    bgCtx.fillStyle='#ccffcc'; bgCtx.globalAlpha=a*0.65; bgCtx.fill();
  }
  bgCtx.globalAlpha=1; bgCtx.restore();
  // Pine tree helper
  function pine(x,y,h,col){
    const w=h*0.48;
    for(let i=0;i<3;i++){
      const ty=y-h*0.28*i-h*0.18, tw=w*(1-i*0.18)*(1+i*0.08);
      bgCtx.beginPath(); bgCtx.moveTo(x,ty-h*0.32); bgCtx.lineTo(x-tw/2,ty); bgCtx.lineTo(x+tw/2,ty); bgCtx.closePath();
      bgCtx.fillStyle=col; bgCtx.fill();
    }
    bgCtx.fillStyle='#0e0804'; bgCtx.fillRect(x-3,y-h*0.12,6,h*0.16);
  }
  // Far trees
  for(let i=0;i<22;i++){
    pine((i/22)*W*1.1-W*0.05, H*0.54, 55+(i*37%38), '#061506');
  }
  // Mid trees
  for(let i=0;i<15;i++){
    pine((i/15)*W*1.1-W*0.04, H*0.67, 90+(i*53%55), '#040e04');
  }
  // Ground
  const gnd=bgCtx.createLinearGradient(0,H*0.64,0,H);
  gnd.addColorStop(0,'#020c02'); gnd.addColorStop(1,'#010601');
  bgCtx.fillStyle=gnd; bgCtx.fillRect(0,H*0.64,W,H);
  // Near trees
  for(let i=0;i<10;i++){
    pine((i/10)*W*1.1-W*0.05, H*0.88, 150+(i*71%75), '#020802');
  }
  // Fireflies
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
  // Ground fog
  for(let i=0;i<5;i++){
    const fx=(Math.sin(t*0.00018+i*1.5)*0.3+0.15+i*0.17)*W;
    const fy=H*0.69+i*12;
    const fg=bgCtx.createRadialGradient(fx,fy,0,fx,fy,100+i*18);
    fg.addColorStop(0,'rgba(160,255,160,0.035)'); fg.addColorStop(1,'transparent');
    bgCtx.beginPath(); bgCtx.ellipse(fx,fy,130+i*28,18,0,0,Math.PI*2); bgCtx.fillStyle=fg; bgCtx.fill();
  }
}

function drawBgOffice(t) {
  const W=bgCanvas.width,H=bgCanvas.height;
  // Room walls
  bgCtx.fillStyle='#0e0c0a'; bgCtx.fillRect(0,0,W,H);
  // Subtle wall grid
  bgCtx.strokeStyle='rgba(255,255,255,0.014)'; bgCtx.lineWidth=1;
  for(let x=0;x<=W;x+=44){ bgCtx.beginPath(); bgCtx.moveTo(x,0); bgCtx.lineTo(x,H*0.74); bgCtx.stroke(); }
  for(let y=0;y<=H*0.74;y+=44){ bgCtx.beginPath(); bgCtx.moveTo(0,y); bgCtx.lineTo(W,y); bgCtx.stroke(); }
  // Window
  const wX=W*0.15,wY=H*0.09,wW=W*0.28,wH=H*0.44;
  bgCtx.fillStyle='#04070e'; bgCtx.fillRect(wX,wY,wW,wH);
  bgCtx.save(); bgCtx.beginPath(); bgCtx.rect(wX,wY,wW,wH); bgCtx.clip();
  // City building silhouettes
  const buildings=[[0.05,0.55,0.12,0.45],[0.18,0.4,0.1,0.6],[0.3,0.6,0.13,0.4],[0.44,0.45,0.1,0.55],[0.56,0.65,0.11,0.35],[0.68,0.48,0.09,0.52],[0.8,0.58,0.14,0.42]];
  buildings.forEach(([bx,top,bw,bh])=>{
    bgCtx.fillStyle='#0a0e18';
    bgCtx.fillRect(wX+bx*wW, wY+top*wH, bw*wW, bh*wH);
    // windows on buildings
    for(let wy2=0;wy2<5;wy2++) for(let wx2=0;wx2<3;wx2++){
      if(Math.sin(bx*97+wy2*13+wx2*7)>0.1){
        const fa=0.4+Math.sin(t*0.0008+bx*20+wy2*7)*0.3;
        const wc=['#ffdd88','#aaccff','#ffaa44','#88ddff'][((bx*17+wy2*5)&3)];
        bgCtx.fillStyle=wc; bgCtx.globalAlpha=fa;
        bgCtx.fillRect(wX+bx*wW+wx2*bw*wW*0.28+bw*wW*0.12, wY+top*wH+wy2*bh*wH*0.18+bh*wH*0.06, bw*wW*0.14, bh*wH*0.1);
      }
    }
    bgCtx.globalAlpha=1;
  });
  // Rain
  for(let i=0;i<22;i++){
    const rx=wX+(i*137.508%1)*wW;
    const ry=wY+((t*0.065+i*29)%(wH*1.3))-wH*0.15;
    const rl=5+(i%5)*3;
    bgCtx.beginPath(); bgCtx.moveTo(rx,ry); bgCtx.lineTo(rx-1,ry+rl);
    bgCtx.strokeStyle='rgba(140,190,255,0.32)'; bgCtx.lineWidth=1; bgCtx.stroke();
  }
  bgCtx.restore();
  // Window glow spill
  const wglow=bgCtx.createRadialGradient(wX+wW/2,wY+wH/2,0,wX+wW/2,wY+wH/2,wW*0.95);
  wglow.addColorStop(0,'rgba(80,120,200,0.05)'); wglow.addColorStop(1,'transparent');
  bgCtx.beginPath(); bgCtx.ellipse(wX+wW/2,wY+wH/2,wW,wH*0.75,0,0,Math.PI*2); bgCtx.fillStyle=wglow; bgCtx.fill();
  // Window frame
  bgCtx.strokeStyle='#2a2218'; bgCtx.lineWidth=6; bgCtx.strokeRect(wX,wY,wW,wH);
  bgCtx.beginPath(); bgCtx.moveTo(wX+wW/2,wY); bgCtx.lineTo(wX+wW/2,wY+wH); bgCtx.moveTo(wX,wY+wH/2); bgCtx.lineTo(wX+wW,wY+wH/2); bgCtx.stroke();
  // Desk lamp
  const lX=W*0.82,lY=H*0.4;
  const lg=bgCtx.createRadialGradient(lX,lY+40,0,lX,lY+40,130);
  lg.addColorStop(0,`rgba(255,215,90,${0.2+Math.sin(t*0.0009)*0.02})`);
  lg.addColorStop(0.5,'rgba(255,170,40,0.06)'); lg.addColorStop(1,'transparent');
  bgCtx.beginPath(); bgCtx.ellipse(lX,lY+70,145,90,0,0,Math.PI*2); bgCtx.fillStyle=lg; bgCtx.fill();
  bgCtx.fillStyle='#2a2014';
  bgCtx.beginPath(); bgCtx.ellipse(lX,lY,23,13,-0.3,0,Math.PI*2); bgCtx.fill();
  bgCtx.fillStyle='#ffe07a';
  bgCtx.beginPath(); bgCtx.ellipse(lX+2,lY-2,10,6,-0.3,0,Math.PI*2); bgCtx.fill();
  bgCtx.strokeStyle='#1e1810'; bgCtx.lineWidth=3;
  bgCtx.beginPath(); bgCtx.moveTo(lX-4,lY+8); bgCtx.lineTo(lX-8,lY+56); bgCtx.stroke();
  // Bookshelf
  bgCtx.fillStyle='#181410'; bgCtx.fillRect(W*0.88,H*0.04,W*0.1,H*0.56);
  const bkCols=['#7a3030','#305a7a','#30784a','#786030','#5a2e78','#784830'];
  let bx2=W*0.893;
  for(let i=0;i<9;i++){
    const bw2=11+(i%3)*5,bh2=55+(i%4)*18,by2=H*0.06+(75-bh2)/2;
    bgCtx.fillStyle=bkCols[i%bkCols.length]; bgCtx.globalAlpha=0.72;
    bgCtx.fillRect(bx2,by2,bw2-1,bh2); bx2+=bw2;
    if(bx2>W*0.975) break;
  }
  bgCtx.globalAlpha=1;
  // Desk
  const dY=H*0.72;
  const desk=bgCtx.createLinearGradient(0,dY,0,H*0.78);
  desk.addColorStop(0,'#281e12'); desk.addColorStop(1,'#1c1408');
  bgCtx.fillStyle=desk; bgCtx.fillRect(0,dY,W,H*0.08);
  bgCtx.fillStyle='rgba(255,190,100,0.07)'; bgCtx.fillRect(0,dY,W,2);
  // Monitor glow on desk
  const mng=bgCtx.createRadialGradient(W*0.35,dY-20,0,W*0.35,dY-90,115);
  mng.addColorStop(0,'rgba(90,140,255,0.1)'); mng.addColorStop(1,'transparent');
  bgCtx.beginPath(); bgCtx.ellipse(W*0.35,dY-10,125,80,0,0,Math.PI*2); bgCtx.fillStyle=mng; bgCtx.fill();
  // Floor
  const flr=bgCtx.createLinearGradient(0,H*0.78,0,H);
  flr.addColorStop(0,'#0c0a08'); flr.addColorStop(1,'#06040302');
  bgCtx.fillStyle=flr; bgCtx.fillRect(0,H*0.78,W,H);
}
