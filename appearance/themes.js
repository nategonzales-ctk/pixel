// ══════════════════════════════════════════════════
//  THEMES & FONTS
// ══════════════════════════════════════════════════
const THEMES = {
  midnight:{ name:'Midnight', emoji:'🌌', bg:'#0d0d1a', surface:'#161628', surface2:'#1e1e35', accent:'#d966ff', accent2:'#00e5ff', text:'#eeeeff', bgTop:'#05050e', bgBot:'#0d0d1a', nebula:['rgba(217,102,255,','rgba(0,229,255,','rgba(105,255,71,'], stars:['#ffffff','#d966ff','#00e5ff','#69ff47','#ffcc44'] },
  ocean:   { name:'Ocean',    emoji:'🌊', bg:'#020d18', surface:'#071a28', surface2:'#0a2234', accent:'#00b4d8', accent2:'#90e0ef', text:'#e0f7fa', bgTop:'#010810', bgBot:'#020d18', nebula:['rgba(0,180,216,','rgba(0,229,255,','rgba(100,210,255,'], stars:['#ffffff','#00b4d8','#90e0ef','#caf0f8','#48cae4'] },
  forest:  { name:'Forest',   emoji:'🌿', bg:'#040d06', surface:'#091409', surface2:'#0e1c0f', accent:'#66bb6a', accent2:'#a5d6a7', text:'#e8f5e9', bgTop:'#020804', bgBot:'#040d06', nebula:['rgba(76,175,80,','rgba(102,187,106,','rgba(165,214,167,'],  stars:['#ffffff','#66bb6a','#a5d6a7','#c8e6c9','#81c784'] },
  sunset:  { name:'Sunset',   emoji:'🌅', bg:'#1a0808', surface:'#2a0e0e', surface2:'#351414', accent:'#ff6b35', accent2:'#ffd166', text:'#fff3e0', bgTop:'#100404', bgBot:'#1a0808', nebula:['rgba(255,107,53,','rgba(255,152,0,','rgba(255,209,102,'],  stars:['#ffffff','#ff6b35','#ffd166','#ffb300','#ff8a65'] },
  mono:    { name:'Mono',     emoji:'🖤', bg:'#0a0a0a', surface:'#141414', surface2:'#1c1c1c', accent:'#9e9e9e', accent2:'#e0e0e0', text:'#eeeeee', bgTop:'#050505', bgBot:'#0a0a0a', nebula:['rgba(120,120,120,','rgba(160,160,160,','rgba(200,200,200,'], stars:['#ffffff','#cccccc','#aaaaaa','#eeeeee','#bbbbbb'] },
  cherry:  { name:'Cherry',   emoji:'🌸', bg:'#160610', surface:'#220a18', surface2:'#2d0f22', accent:'#f06292', accent2:'#f48fb1', text:'#fce4ec', bgTop:'#0e0408', bgBot:'#160610', nebula:['rgba(240,98,146,','rgba(244,143,177,','rgba(255,128,171,'], stars:['#ffffff','#f06292','#f48fb1','#fce4ec','#e91e63'] },
};

const FONTS = [
  { id:'Nunito',     label:'Nunito'     },
  { id:'Orbitron',   label:'Orbitron'   },
  { id:'Poppins',    label:'Poppins'    },
  { id:'Inter',      label:'Inter'      },
  { id:'Comic Neue', label:'Comic Neue' },
];
