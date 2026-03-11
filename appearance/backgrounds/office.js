window.BACKGROUND_REGISTRY = window.BACKGROUND_REGISTRY || [];
window.BACKGROUND_REGISTRY.push({
  id: 'office', name: 'Office', icon: '🏢',
  draw: function(t) {
    const W=bgCanvas.width,H=bgCanvas.height;
    bgCtx.fillStyle='#0e0c0a'; bgCtx.fillRect(0,0,W,H);
    bgCtx.strokeStyle='rgba(255,255,255,0.014)'; bgCtx.lineWidth=1;
    for(let x=0;x<=W;x+=44){ bgCtx.beginPath(); bgCtx.moveTo(x,0); bgCtx.lineTo(x,H*0.74); bgCtx.stroke(); }
    for(let y=0;y<=H*0.74;y+=44){ bgCtx.beginPath(); bgCtx.moveTo(0,y); bgCtx.lineTo(W,y); bgCtx.stroke(); }
    const wX=W*0.15,wY=H*0.09,wW=W*0.28,wH=H*0.44;
    bgCtx.fillStyle='#04070e'; bgCtx.fillRect(wX,wY,wW,wH);
    bgCtx.save(); bgCtx.beginPath(); bgCtx.rect(wX,wY,wW,wH); bgCtx.clip();
    const buildings=[[0.05,0.55,0.12,0.45],[0.18,0.4,0.1,0.6],[0.3,0.6,0.13,0.4],[0.44,0.45,0.1,0.55],[0.56,0.65,0.11,0.35],[0.68,0.48,0.09,0.52],[0.8,0.58,0.14,0.42]];
    buildings.forEach(([bx,top,bw,bh])=>{
      bgCtx.fillStyle='#0a0e18';
      bgCtx.fillRect(wX+bx*wW,wY+top*wH,bw*wW,bh*wH);
      for(let wy2=0;wy2<5;wy2++) for(let wx2=0;wx2<3;wx2++){
        if(Math.sin(bx*97+wy2*13+wx2*7)>0.1){
          const fa=0.4+Math.sin(t*0.0008+bx*20+wy2*7)*0.3;
          const wc=['#ffdd88','#aaccff','#ffaa44','#88ddff'][((bx*17+wy2*5)&3)];
          bgCtx.fillStyle=wc; bgCtx.globalAlpha=fa;
          bgCtx.fillRect(wX+bx*wW+wx2*bw*wW*0.28+bw*wW*0.12,wY+top*wH+wy2*bh*wH*0.18+bh*wH*0.06,bw*wW*0.14,bh*wH*0.1);
        }
      }
      bgCtx.globalAlpha=1;
    });
    for(let i=0;i<22;i++){
      const rx=wX+(i*137.508%1)*wW;
      const ry=wY+((t*0.065+i*29)%(wH*1.3))-wH*0.15;
      const rl=5+(i%5)*3;
      bgCtx.beginPath(); bgCtx.moveTo(rx,ry); bgCtx.lineTo(rx-1,ry+rl);
      bgCtx.strokeStyle='rgba(140,190,255,0.32)'; bgCtx.lineWidth=1; bgCtx.stroke();
    }
    bgCtx.restore();
    const wglow=bgCtx.createRadialGradient(wX+wW/2,wY+wH/2,0,wX+wW/2,wY+wH/2,wW*0.95);
    wglow.addColorStop(0,'rgba(80,120,200,0.05)'); wglow.addColorStop(1,'transparent');
    bgCtx.beginPath(); bgCtx.ellipse(wX+wW/2,wY+wH/2,wW,wH*0.75,0,0,Math.PI*2); bgCtx.fillStyle=wglow; bgCtx.fill();
    bgCtx.strokeStyle='#2a2218'; bgCtx.lineWidth=6; bgCtx.strokeRect(wX,wY,wW,wH);
    bgCtx.beginPath(); bgCtx.moveTo(wX+wW/2,wY); bgCtx.lineTo(wX+wW/2,wY+wH); bgCtx.moveTo(wX,wY+wH/2); bgCtx.lineTo(wX+wW,wY+wH/2); bgCtx.stroke();
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
    const dY=H*0.72;
    const desk=bgCtx.createLinearGradient(0,dY,0,H*0.78);
    desk.addColorStop(0,'#281e12'); desk.addColorStop(1,'#1c1408');
    bgCtx.fillStyle=desk; bgCtx.fillRect(0,dY,W,H*0.08);
    bgCtx.fillStyle='rgba(255,190,100,0.07)'; bgCtx.fillRect(0,dY,W,2);
    const mng=bgCtx.createRadialGradient(W*0.35,dY-20,0,W*0.35,dY-90,115);
    mng.addColorStop(0,'rgba(90,140,255,0.1)'); mng.addColorStop(1,'transparent');
    bgCtx.beginPath(); bgCtx.ellipse(W*0.35,dY-10,125,80,0,0,Math.PI*2); bgCtx.fillStyle=mng; bgCtx.fill();
    const flr=bgCtx.createLinearGradient(0,H*0.78,0,H);
    flr.addColorStop(0,'#0c0a08'); flr.addColorStop(1,'#06040302');
    bgCtx.fillStyle=flr; bgCtx.fillRect(0,H*0.78,W,H);
  },
});
