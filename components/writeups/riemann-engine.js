/* eslint-disable */
// Auto-derived from the standalone Riemann write-up. Framework-agnostic
// canvas + math engine; `root` scopes figure lookups to this component.
export function initRiemann(root, isDark) {

const T = isDark ? {
  grid: 'rgba(255,255,255,0.10)',
  gridFaint: 'rgba(255,255,255,0.07)',
  backdropCircle: 'rgba(255,255,255,0.08)',
  backdropSpoke: 'rgba(255,255,255,0.05)',
  axis: 'rgba(255,255,255,0.32)',
  frame: 'rgba(255,255,255,0.20)',
  tickText: '#9e9bab',
  labelText: '#e6e3da',
  strongText: 'rgba(230,227,218,0.92)',
  canvasBg: '#000000',
  refLine: '#e6e3da',
  tipDot: '#e6e3da',
  tipRing: 'rgba(255,255,255,0.28)',
  trendLine: 'rgba(170,168,178,0.85)',
  polarAxis: '#e6e3da',
  quadStroke: 'rgba(255,255,255,0.18)',
} : {
  grid: 'rgba(0,0,0,0.08)',
  gridFaint: 'rgba(0,0,0,0.05)',
  backdropCircle: 'rgba(0,0,0,0.06)',
  backdropSpoke: 'rgba(0,0,0,0.04)',
  axis: 'rgba(0,0,0,0.3)',
  frame: 'rgba(0,0,0,0.18)',
  tickText: '#5f5e5a',
  labelText: '#23221f',
  strongText: 'rgba(23,22,15,0.92)',
  canvasBg: '#ffffff',
  refLine: '#ffffff',
  tipDot: '#1a1a2e',
  tipRing: 'rgba(0,0,0,0.25)',
  trendLine: 'rgba(110,108,100,0.85)',
  polarAxis: '#111111',
  quadStroke: 'rgba(10,14,23,0.35)',
};

/* =====================================================================
   Complex arithmetic + Riemann zeta (Borwein acceleration + functional eq)
   ===================================================================== */
const C  = (re, im=0) => ({re, im});
const cadd=(a,b)=>({re:a.re+b.re, im:a.im+b.im});
const csub=(a,b)=>({re:a.re-b.re, im:a.im-b.im});
const cmul=(a,b)=>({re:a.re*b.re-a.im*b.im, im:a.re*b.im+a.im*b.re});
const cdiv=(a,b)=>{const d=b.re*b.re+b.im*b.im; return {re:(a.re*b.re+a.im*b.im)/d, im:(a.im*b.re-a.re*b.im)/d};};
const cexp=a=>{const e=Math.exp(a.re); return {re:e*Math.cos(a.im), im:e*Math.sin(a.im)};};
const clog=a=>({re:0.5*Math.log(a.re*a.re+a.im*a.im), im:Math.atan2(a.im,a.re)});
const cpow=(a,b)=>(a.re===0&&a.im===0)?C(0):cexp(cmul(b,clog(a)));
const csin=a=>({re:Math.sin(a.re)*Math.cosh(a.im), im:Math.cos(a.re)*Math.sinh(a.im)});
const cabs=a=>Math.hypot(a.re,a.im);

const _G=7;
const _Lc=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,
           -176.61502916214059,12.507343278686905,-0.13857109526572012,
           9.9843695780195716e-6,1.5056327351493116e-7];
function cgamma(z){
  if(z.re<0.5){
    const s=csin(cmul(C(Math.PI),z));
    return cdiv(C(Math.PI), cmul(s, cgamma(csub(C(1),z))));
  }
  z=csub(z,C(1));
  let x=C(_Lc[0]);
  for(let i=1;i<_G+2;i++) x=cadd(x, cdiv(C(_Lc[i]), cadd(z,C(i))));
  const t=cadd(z,C(_G+0.5));
  const tp=cpow(t, cadd(z,C(0.5)));
  const et=cexp(cmul(C(-1),t));
  return cmul(C(Math.sqrt(2*Math.PI)), cmul(tp, cmul(et,x)));
}
const _BN=24;
const _d=(()=>{const d=[]; const f=[1]; for(let i=1;i<=2*_BN+2;i++) f[i]=f[i-1]*i;
  for(let k=0;k<=_BN;k++){let s=0; for(let i=0;i<=k;i++) s+=f[_BN+i-1]*Math.pow(4,i)/(f[_BN-i]*f[2*i]); d[k]=_BN*s;}
  return d;})();
function ceta(s){
  const dn=_d[_BN]; let sum=C(0);
  for(let k=0;k<_BN;k++){
    let t=cdiv(C(_d[k]-dn), cpow(C(k+1), s));
    if(k&1) t={re:-t.re, im:-t.im};
    sum=cadd(sum,t);
  }
  return {re:-sum.re/dn, im:-sum.im/dn};
}
function czeta(s){
  if(Math.abs(s.re)<1e-9 && Math.abs(s.im)<1e-9) return C(-0.5);
  if(Math.abs(s.re-1)<1e-7 && Math.abs(s.im)<1e-7) return C(1e9);
  if(s.re<0.5){
    const os=csub(C(1),s);
    const zt=czeta(os);
    return cmul(cpow(C(2),s),
             cmul(cpow(C(Math.PI),csub(s,C(1))),
               cmul(csin(cmul(C(Math.PI/2),s)),
                 cmul(cgamma(os), zt))));
  }
  return cdiv(ceta(s), csub(C(1), cpow(C(2), csub(C(1),s))));
}
const zetaReal = x => czeta(C(x,0)).re;

const ZEROS=[14.134725142,21.022039639,25.01085758,30.424876126,32.935061588,
  37.586178159,40.918719012,43.327073281,48.005150881,49.773832478,
  52.970321478,56.446247697,59.347044003,60.831778525,65.112544048,
  67.079810529,69.546401711,72.067157674,75.704690699,77.144840069,
  79.33737502,82.910380854,84.735492981,87.425274613,88.809111208,
  92.491899271,94.651344041,95.870634228,98.831194218,101.317851006,
  103.72553804,105.446623052,107.168611184,111.029535543,111.874659177,
  114.320220915,116.226680321,118.790782866,121.370125002,122.946829294,
  124.256634,127.516707,129.578751,131.08758,133.49794,
  134.756309,138.116292,139.735729,141.124155,143.111603,
  146.001223,147.42254,150.053633,150.925278,153.024528,
  156.11361,157.596226,158.850766,161.188791,163.030719,
  165.537213,167.184152,169.095076,169.911521,173.411805,
  174.753805,176.441755,178.377136,179.91668,182.206968,
  184.874731,185.598501,187.22901,189.416136,192.02664,
  193.079771,195.265316,196.876627,198.015191,201.264908,
  202.493337,204.189976,205.39446,207.906414,209.576341,
  211.691058,213.347645,214.547267,216.169461,219.06758,
  220.715184,221.430362,224.007487,224.982761,227.421752,
  229.337158,231.250492,231.987039,233.693398,236.524327];

/* =====================================================================
   Prime machinery
   ===================================================================== */
function sieve(n){
  const p=new Uint8Array(n+1); p.fill(1); p[0]=p[1]=0;
  for(let i=2;i*i<=n;i++) if(p[i]) for(let j=i*i;j<=n;j+=i) p[j]=0;
  const out=[]; for(let i=2;i<=n;i++) if(p[i]) out.push(i);
  return out;
}
const PRIMES = sieve(100000);
function piStairs(X){
  const v=[[0,0]]; let c=0;
  for(const p of PRIMES){ if(p>X) break; v.push([p,c]); c++; v.push([p,c]); }
  v.push([X,c]); return v;
}
function liTable(X,step){
  const out=[[2,0]]; let acc=0, prev=2, prevF=1/Math.log(2);
  for(let x=2+step;x<=X+1e-9;x+=step){
    const f=1/Math.log(x); acc+=(f+prevF)*0.5*(x-prev); prevF=f; prev=x; out.push([x,acc]);
  }
  return out;
}

/* =====================================================================
   Generic interactive plot (pan / zoom / drag)
   ===================================================================== */
class Plot{
  constructor(canvas, series, view, opts={}){
    this.cv=canvas; this.ctx=canvas.getContext('2d');
    this.series=series; this.opts=opts;
    this.init={...view}; this.view={...view};
    this.m={l:54,r:16,t:12,b:36}; this.readout=null;
    this._bind(); this.resize();
  }
  resize(){
    const w=this.cv.clientWidth||600, h=this.opts.height||330;
    const dpr=window.devicePixelRatio||1;
    this.cv.width=w*dpr; this.cv.height=h*dpr; this.cv.style.height=h+'px';
    this.ctx.setTransform(dpr,0,0,dpr,0,0); this.W=w; this.H=h; this.draw();
  }
  px(x){const {l,r}=this.m; return l+(x-this.view.x0)/(this.view.x1-this.view.x0)*(this.W-l-r);}
  py(y){const {t,b}=this.m; return t+(1-(y-this.view.y0)/(this.view.y1-this.view.y0))*(this.H-t-b);}
  ix(p){const {l,r}=this.m; return this.view.x0+(p-l)/(this.W-l-r)*(this.view.x1-this.view.x0);}
  iy(p){const {t,b}=this.m; return this.view.y0+(1-(p-t)/(this.H-t-b))*(this.view.y1-this.view.y0);}
  _bind(){
    const cv=this.cv; let drag=null;
    cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId); drag={x:e.offsetX,y:e.offsetY};});
    cv.addEventListener('pointerup',()=>drag=null);
    cv.addEventListener('pointerleave',()=>{if(this.readout)this.readout.style.opacity=0;});
    cv.addEventListener('pointermove',e=>{
      if(drag){
        const w=this.W-this.m.l-this.m.r, h=this.H-this.m.t-this.m.b;
        const ddx=(e.offsetX-drag.x)/w*(this.view.x1-this.view.x0);
        const ddy=(e.offsetY-drag.y)/h*(this.view.y1-this.view.y0);
        this.view.x0-=ddx; this.view.x1-=ddx; this.view.y0+=ddy; this.view.y1+=ddy;
        drag={x:e.offsetX,y:e.offsetY}; this.draw();
      } else if(this.readout){
        this.readout.textContent='x='+fmt(this.ix(e.offsetX))+'  y='+fmt(this.iy(e.offsetY));
        this.readout.style.opacity=1;
      }
    });
    cv.addEventListener('wheel',e=>{
      e.preventDefault();
      const f=e.deltaY<0?0.86:1/0.86;
      const mx=this.ix(e.offsetX), my=this.iy(e.offsetY);
      this.view.x0=mx-(mx-this.view.x0)*f; this.view.x1=mx-(mx-this.view.x1)*f;
      this.view.y0=my-(my-this.view.y0)*f; this.view.y1=my-(my-this.view.y1)*f;
      this.draw();
    },{passive:false});
    cv.addEventListener('dblclick',()=>{this.view={...this.init}; this.draw();});
    window.addEventListener('resize',()=>this.resize());
  }
  _grid(){
    const c=this.ctx, {l,r,t,b}=this.m;
    c.save(); c.font='11px "Source Code Pro", monospace'; c.textAlign='center'; c.textBaseline='top';
    for(const x of ticks(this.view.x0,this.view.x1)){ const X=this.px(x);
      if(X<l-1||X>this.W-r+1)continue;
      c.strokeStyle=T.grid; c.beginPath(); c.moveTo(X,t); c.lineTo(X,this.H-b); c.stroke();
      c.fillStyle=T.tickText; c.fillText(fmt(x),X,this.H-b+6);
    }
    c.textAlign='right'; c.textBaseline='middle';
    for(const y of ticks(this.view.y0,this.view.y1)){ const Y=this.py(y);
      if(Y<t-1||Y>this.H-b+1)continue;
      c.strokeStyle=T.grid; c.beginPath(); c.moveTo(l,Y); c.lineTo(this.W-r,Y); c.stroke();
      c.fillStyle=T.tickText; c.fillText(fmt(y),l-6,Y);
    }
    c.fillStyle=T.tickText; c.font='12px "Space Grotesk", sans-serif';
    if(this.opts.xlabel){c.textAlign='center';c.textBaseline='bottom';c.fillText(this.opts.xlabel,(l+this.W-r)/2,this.H+3);}
    if(this.opts.ylabel){c.save();c.translate(13,(t+this.H-b)/2);c.rotate(-Math.PI/2);c.textAlign='center';c.textBaseline='top';c.fillText(this.opts.ylabel,0,0);c.restore();}
    c.restore();
  }
  _clip(fn){const c=this.ctx,{l,r,t,b}=this.m; c.save(); c.beginPath(); c.rect(l,t,this.W-l-r,this.H-t-b); c.clip(); fn(); c.restore();}
  draw(){
    const c=this.ctx; c.clearRect(0,0,this.W,this.H);
    this._clip(()=>{
      for(const rg of (this.opts.regions||[])){
        c.fillStyle=rg.color; const x0=this.px(rg.x0), x1=this.px(rg.x1);
        c.fillRect(x0,this.m.t,x1-x0,this.H-this.m.t-this.m.b);
      }
    });
    this._grid();
    this._clip(()=>{
      for(const s of this.series){ if(s.type!=='bar')continue;
        c.fillStyle=s.color; const bw=s.bw||1;
        for(const d of s.data){const X=this.px(d[0]),Y=this.py(d[1]),Y0=this.py(0);
          const w=this.px(d[0]+bw)-X; c.fillRect(X-w/2,Math.min(Y,Y0),Math.max(w-1,1),Math.abs(Y0-Y));}
      }
      for(const v of (this.opts.vlines||[])){const X=this.px(v.x);
        c.strokeStyle=v.color; c.lineWidth=v.width||1; c.setLineDash(v.dash||[]);
        c.beginPath(); c.moveTo(X,this.m.t); c.lineTo(X,this.H-this.m.b); c.stroke(); c.setLineDash([]);}
      for(const v of (this.opts.hlines||[])){const Y=this.py(v.y);
        c.strokeStyle=v.color; c.lineWidth=v.width||1; c.setLineDash(v.dash||[]);
        c.beginPath(); c.moveTo(this.m.l,Y); c.lineTo(this.W-this.m.r,Y); c.stroke(); c.setLineDash([]);}
      for(const s of this.series){ if(s.type&&s.type!=='line')continue;
        c.strokeStyle=s.color; c.lineWidth=s.width||2; c.setLineDash(s.dash||[]); c.lineJoin='round'; c.beginPath(); let started=false;
        for(const d of s.data){
          if(d[1]==null||!isFinite(d[1])){started=false;continue;}
          const X=this.px(d[0]),Y=this.py(d[1]);
          if(!started){c.moveTo(X,Y);started=true;} else c.lineTo(X,Y);
        }
        c.stroke(); c.setLineDash([]);
      }
      for(const s of this.series){ if(s.type!=='scatter')continue;
        c.fillStyle=s.color; const r=s.r||2.4;
        for(const d of s.data){ if(!isFinite(d[1]))continue; c.beginPath(); c.arc(this.px(d[0]),this.py(d[1]),r,0,7); c.fill();}
      }
      for(const mk of (this.opts.markers||[])){
        const X=this.px(mk.x),Y=this.py(mk.y);
        c.fillStyle=mk.color; c.beginPath(); c.arc(X,Y,mk.r||4,0,7); c.fill();
        if(mk.label){c.fillStyle=T.labelText; c.font='11px "Source Code Pro", monospace'; c.textAlign=mk.ta||'left'; c.textBaseline='bottom'; c.fillText(mk.label,X+(mk.ta==='right'?-7:7),Y-4);}
      }
    });
    c.strokeStyle=T.frame; c.lineWidth=1;
    c.strokeRect(this.m.l+.5,this.m.t+.5,this.W-this.m.l-this.m.r-1,this.H-this.m.t-this.m.b-1);
  }
}
function niceNum(range,round){
  const exp=Math.floor(Math.log10(range||1)); const f=(range||1)/Math.pow(10,exp);
  let nf; if(round) nf=f<1.5?1:f<3?2:f<7?5:10; else nf=f<=1?1:f<=2?2:f<=5?5:10;
  return nf*Math.pow(10,exp);
}
function ticks(min,max,n=6){
  if(!(max>min)) return [];
  const step=niceNum(niceNum(max-min,false)/(n-1),true);
  const start=Math.ceil(min/step)*step, out=[];
  for(let v=start;v<=max+step*0.5;v+=step) out.push(Math.round(v/step)*step);
  return out;
}
function fmt(v){
  if(Math.abs(v)<1e-9) return '0';
  const a=Math.abs(v);
  if(a>=1e4||a<1e-3) return v.toExponential(1);
  if(a>=100) return v.toFixed(0);
  if(a>=1) return (Math.round(v*100)/100).toString();
  return (Math.round(v*1000)/1000).toString();
}
function mount(figId,{title,caption,legend,controls}){
  const fig=root.querySelector('#'+figId);
  const box=document.createElement('div'); box.className='plotbox';
  if(title){const t=document.createElement('div'); t.className='plot-title'; t.textContent=title; box.appendChild(t);}
  const bar=document.createElement('div'); bar.className='plot-toolbar';
  bar.innerHTML='<span class="hint">Scroll = zoom &middot; Drag = pan &middot; Double&#8209;click = reset</span>';
  const reset=document.createElement('button'); reset.className='btn'; reset.textContent='Reset view';
  bar.appendChild(reset);
  if(controls) controls(bar);
  box.appendChild(bar);
  const wrap=document.createElement('div'); wrap.className='plot-canvas-wrap';
  const cv=document.createElement('canvas'); cv.className='plot';
  const ro=document.createElement('div'); ro.className='readout';
  wrap.appendChild(cv); wrap.appendChild(ro); box.appendChild(wrap);
  if(legend){
    const lg=document.createElement('div'); lg.className='legend';
    lg.innerHTML=legend.map(i=>'<span class="item"><span class="swatch '+(i.dot?'dot':'')+'" style="background:'+i.color+'"></span>'+i.label+'</span>').join('');
    box.appendChild(lg);
  }
  fig.appendChild(box);
  if(caption){const fc=document.createElement('figcaption'); fc.innerHTML=caption; fig.appendChild(fc);}
  return {cv, reset, ro};
}
const COL={blue:'#2f8fd8',teal:'#0f9e89',green:'#5fa72e',yellow:'#c99a12',
  orange:'#e07b12',red:'#d43d3d',pink:'#c94e9e',purple:'#8452c9'};
function hexToRgb(h){h=h.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function lerpCol(a,b,f){const pa=hexToRgb(a),pb=hexToRgb(b);return 'rgb('+Math.round(pa[0]+(pb[0]-pa[0])*f)+','+Math.round(pa[1]+(pb[1]-pa[1])*f)+','+Math.round(pa[2]+(pb[2]-pa[2])*f)+')';}

/* =====================================================================
   FIGURE 1 — zeta on the real line
   ===================================================================== */
(function(){
  const sumPart=[], contPart=[];
  for(let x=-8;x<=8;x+=0.02){
    if(x>0.72&&x<1.28){sumPart.push([x,null]);contPart.push([x,null]);continue;}
    let y=zetaReal(x); if(y>18||y<-6)y=null;
    if(x>=1){ sumPart.push([x,y]); contPart.push([x,null]); }
    else { contPart.push([x,y]); sumPart.push([x,null]); }
  }
  const {cv,reset,ro}=mount('fig-real',{
    title:'ζ(s) along the real line',
    legend:[{label:'ζ(s), s>1, the original sum',color:COL.teal},
            {label:'ζ(s) for s<1 (analytic continuation)',color:COL.purple,dot:1},
            {label:'trivial zeros (−2,−4,−6)',color:COL.yellow,dot:1},
            {label:'ζ(2)=π²/6',color:COL.green,dot:1},{label:'pole at s=1',color:COL.red}],
    caption:'Figure 1. Solid teal (\(s>1\)) is where the defining sum \(\sum 1/n^s\) actually converges. Dashed purple (\(s<1\)) is the <em>analytically continued</em> function, the sum diverges there, yet the extended \(\zeta\) is still perfectly smooth and well-defined. The shaded band marks the continued region; see Section&nbsp;5 for why that extension exists and is unique.'
  });
  const markers=[{x:2,y:zetaReal(2),color:COL.green,label:'ζ(2)'}];
  for(const k of [-2,-4,-6]) markers.push({x:k,y:0,color:COL.yellow});
  const p=new Plot(cv,[
    {data:contPart,color:COL.purple,width:2.2,dash:[6,4]},
    {data:sumPart,color:COL.teal,width:2.4},
  ],
    {x0:-8,x1:8,y0:-6,y1:12},
    {xlabel:'s',ylabel:'ζ(s)',hlines:[{y:0,color:'rgba(150,175,210,0.35)'}],
     regions:[{x0:-8,x1:1,color:'rgba(178,133,240,0.08)'}],
     vlines:[{x:1,color:COL.red,dash:[5,4],width:1.5}], markers});
  p.readout=ro; reset.onclick=()=>{p.view={...p.init};p.draw();};
})();

/* =====================================================================
   FIGURE 2 — spiral of partial sums (interactive + animated)
   ===================================================================== */
(function(){
  const fig=root.querySelector('#'+'fig-spiral');
  const box=document.createElement('div'); box.className='plotbox';
  const t=document.createElement('div'); t.className='plot-title';
  t.textContent='Partial sums of Σ 1/nˢ spiraling toward ζ(s)'; box.appendChild(t);
  const bar=document.createElement('div'); bar.className='plot-toolbar';
  bar.innerHTML='<span class="hint">Scroll = zoom &middot; Drag = pan</span>';
  const playBtn=document.createElement('button'); playBtn.className='btn primary'; playBtn.textContent='▶ Play';
  const reset=document.createElement('button'); reset.className='btn'; reset.textContent='Reset';
  bar.appendChild(playBtn); bar.appendChild(reset);
  const mkSlider=(label,min,max,step,val)=>{
    const wrap=document.createElement('span'); wrap.className='ctrl';
    const l=document.createElement('label'); l.textContent=label;
    const sl=document.createElement('input'); sl.type='range'; sl.min=min; sl.max=max; sl.step=step; sl.value=val;
    const lab=document.createElement('span'); lab.className='val'; lab.textContent=val;
    wrap.appendChild(l); wrap.appendChild(sl); wrap.appendChild(lab); return {wrap,sl,lab};
  };
  const sigC=mkSlider('σ:',1.05,3,0.05,1.3);
  const tC=mkSlider('t:',0,120,1,45);
  bar.appendChild(sigC.wrap); bar.appendChild(tC.wrap); box.appendChild(bar);
  const wrap=document.createElement('div'); wrap.className='plot-canvas-wrap';
  const cv=document.createElement('canvas'); cv.className='plot';
  const ro=document.createElement('div'); ro.className='readout';
  wrap.appendChild(cv); wrap.appendChild(ro); box.appendChild(wrap);
  const lg=document.createElement('div'); lg.className='legend';
  lg.innerHTML='<span class="item"><span class="swatch" style="background:linear-gradient(90deg,'+COL.teal+','+COL.yellow+')"></span>partial-sum path (n = 1, 2, 3, …)</span>'+
    '<span class="item"><span class="swatch dot" style="background:'+T.tipDot+'"></span>final point = ζ(σ+it)</span>';
  box.appendChild(lg);
  fig.appendChild(box);
  const fc=document.createElement('figcaption');
  fc.innerHTML='Figure 2. Each segment is one term \(1/n^{s}\) laid nose-to-tail. Press Play to draw the spiral term by term; drag the sliders to change \(s = \sigma+it\).';
  fig.appendChild(fc);

  const H=380, N=600;
  let view=null, initView=null, pts=null, head=N, playing=false, raf=null;
  function computePath(sigma,t){
    const arr=[{re:0,im:0}]; let re=0, im=0;
    for(let n=1;n<=N;n++){ const r=Math.pow(n,-sigma), th=-t*Math.log(n); re+=r*Math.cos(th); im+=r*Math.sin(th); arr.push({re,im}); }
    return arr;
  }
  function autoView(){
    let xmin=1e9,xmax=-1e9,ymin=1e9,ymax=-1e9;
    for(const p of pts){xmin=Math.min(xmin,p.re);xmax=Math.max(xmax,p.re);ymin=Math.min(ymin,p.im);ymax=Math.max(ymax,p.im);}
    const pad=Math.max(xmax-xmin,ymax-ymin,0.4)*0.16+0.05;
    view={x0:xmin-pad,x1:xmax+pad,y0:ymin-pad,y1:ymax+pad}; initView={...view};
  }
  pts=computePath(+sigC.sl.value,+tC.sl.value); autoView();
  const PW=()=>cv.clientWidth-54-16, PH=()=>H-12-36;
  const px=x=>54+(x-view.x0)/(view.x1-view.x0)*PW();
  const py=y=>12+(1-(y-view.y0)/(view.y1-view.y0))*PH();
  const ix=p=>view.x0+(p-54)/PW()*(view.x1-view.x0);
  const iy=p=>view.y0+(1-(p-12)/PH())*(view.y1-view.y0);
  function draw(){
    const w=cv.clientWidth||600, dpr=window.devicePixelRatio||1;
    cv.width=w*dpr; cv.height=H*dpr; cv.style.height=H+'px';
    const c=cv.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,w,H);
    c.save(); c.beginPath(); c.rect(54,12,w-54-16,H-12-36); c.clip();
    const cx=px(0), cy=py(0), maxR=Math.max(w,H);
    c.strokeStyle=T.backdropCircle;
    for(let rr=40;rr<maxR;rr+=40){ c.beginPath(); c.arc(cx,cy,rr,0,7); c.stroke(); }
    c.strokeStyle=T.backdropSpoke;
    for(let a=0;a<360;a+=30){ const ang=a*Math.PI/180; c.beginPath(); c.moveTo(cx,cy); c.lineTo(cx+Math.cos(ang)*maxR,cy+Math.sin(ang)*maxR); c.stroke(); }
    c.strokeStyle=T.axis; c.lineWidth=1;
    c.beginPath(); c.moveTo(54,cy); c.lineTo(w-16,cy); c.stroke();
    c.beginPath(); c.moveTo(cx,12); c.lineTo(cx,H-36); c.stroke();
    const hd=Math.max(1,Math.min(N,Math.round(head)));
    for(let i=1;i<=hd;i++){
      c.strokeStyle=lerpCol(COL.teal,COL.yellow,i/N); c.lineWidth=1.6;
      c.beginPath(); c.moveTo(px(pts[i-1].re),py(pts[i-1].im)); c.lineTo(px(pts[i].re),py(pts[i].im)); c.stroke();
    }
    const tip=pts[hd];
    c.fillStyle=T.tipDot; c.beginPath(); c.arc(px(tip.re),py(tip.im),4.5,0,7); c.fill();
    c.strokeStyle=T.tipRing; c.lineWidth=1; c.beginPath(); c.arc(px(tip.re),py(tip.im),8,0,7); c.stroke();
    c.restore();
    c.font='11px "Source Code Pro", monospace'; c.fillStyle=T.tickText; c.textAlign='center'; c.textBaseline='top';
    for(const x of ticks(view.x0,view.x1)){const X=px(x); if(X<54||X>w-16)continue; c.fillText(fmt(x),X,H-30);}
    c.textAlign='right'; c.textBaseline='middle';
    for(const y of ticks(view.y0,view.y1)){const Y=py(y); if(Y<12||Y>H-36)continue; c.fillText(fmt(y),48,Y);}
    const last=pts[N];
    c.fillStyle=T.labelText; c.textAlign='left'; c.fillText('ζ ≈ '+fmt(last.re)+(last.im>=0?'+':'')+fmt(last.im)+'i', 60, 22);
    c.strokeStyle=T.frame; c.lineWidth=1; c.strokeRect(54.5,12.5,w-54-16-1,H-12-36-1);
  }
  function stop(){playing=false;playBtn.textContent='▶ Play';playBtn.classList.add('primary');if(raf)cancelAnimationFrame(raf);raf=null;}
  function step(){ head+=6; if(head>=N){head=N; draw(); stop(); return;} draw(); raf=requestAnimationFrame(step); }
  playBtn.onclick=()=>{ if(playing){stop();} else {playing=true;playBtn.textContent='❚❚ Pause';playBtn.classList.remove('primary');head=0;step();} };
  let drag=null;
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);drag={x:e.offsetX,y:e.offsetY,v:{...view}};});
  cv.addEventListener('pointerup',()=>drag=null);
  cv.addEventListener('pointerleave',()=>ro.style.opacity=0);
  cv.addEventListener('pointermove',e=>{
    if(drag){
      const ddx=(e.offsetX-drag.x)/PW()*(drag.v.x1-drag.v.x0), ddy=(e.offsetY-drag.y)/PH()*(drag.v.y1-drag.v.y0);
      view.x0=drag.v.x0-ddx; view.x1=drag.v.x1-ddx; view.y0=drag.v.y0+ddy; view.y1=drag.v.y1+ddy; draw();
    }else{ ro.textContent='Re='+fmt(ix(e.offsetX))+' Im='+fmt(iy(e.offsetY)); ro.style.opacity=1; }
  });
  cv.addEventListener('wheel',e=>{
    e.preventDefault(); const f=e.deltaY<0?0.86:1/0.86; const mx=ix(e.offsetX), my=iy(e.offsetY);
    view.x0=mx-(mx-view.x0)*f; view.x1=mx-(mx-view.x1)*f; view.y0=my-(my-view.y0)*f; view.y1=my-(my-view.y1)*f; draw();
  },{passive:false});
  reset.onclick=()=>{stop();head=N;view={...initView};draw();};
  window.addEventListener('resize',draw);
  function recompute(){ pts=computePath(+sigC.sl.value,+tC.sl.value); autoView(); head=N; draw(); }
  sigC.sl.addEventListener('input',()=>{sigC.lab.textContent=(+sigC.sl.value).toFixed(2);stop();recompute();});
  tC.sl.addEventListener('input',()=>{tC.lab.textContent=tC.sl.value;stop();recompute();});
  draw();
})();

/* =====================================================================
   FIGURE 3 — the zeta transformation (animated full-plane grid morph)
   ===================================================================== */
(function(){
  const fig=root.querySelector('#'+'fig-transform');
  const box=document.createElement('div'); box.className='plotbox';
  const t=document.createElement('div'); t.className='plot-title';
  t.textContent='The whole plane of inputs s bending into outputs ζ(s)'; box.appendChild(t);
  const bar=document.createElement('div'); bar.className='plot-toolbar';
  bar.innerHTML='<span class="hint">Scroll = zoom &middot; Drag = pan</span>';
  const playBtn=document.createElement('button'); playBtn.className='btn primary'; playBtn.textContent='▶ Play';
  const reset=document.createElement('button'); reset.className='btn'; reset.textContent='Reset';
  bar.appendChild(playBtn); bar.appendChild(reset);
  const wrapC=document.createElement('span'); wrapC.className='ctrl';
  const l=document.createElement('label'); l.textContent='morph:';
  const sl=document.createElement('input'); sl.type='range'; sl.min=0; sl.max=1; sl.step=0.01; sl.value=0;
  wrapC.appendChild(l); wrapC.appendChild(sl); bar.appendChild(wrapC); box.appendChild(bar);
  const wrap=document.createElement('div'); wrap.className='plot-canvas-wrap';
  const cv=document.createElement('canvas'); cv.className='plot';
  const ro=document.createElement('div'); ro.className='readout';
  wrap.appendChild(cv); wrap.appendChild(ro); box.appendChild(wrap);
  const lg=document.createElement('div'); lg.className='legend';
  lg.innerHTML='<span class="item">colour = direction of the input point (a rainbow around the origin)</span>'+
    '<span class="item">morph 0 = plain grid &nbsp;·&nbsp; morph 1 = ζ(grid)</span>';
  box.appendChild(lg);
  fig.appendChild(box);
  const fc=document.createElement('figcaption');
  fc.innerHTML='Figure 3. The full complex grid, coloured by direction, transformed by \(\zeta\). At morph 0 it is the ordinary plane; press Play and every point \(s\) flows to \(\zeta(s)\), folding the grid into interlocking spirals, the geometric signature of the zeta function.';
  fig.appendChild(fc);

  const H=470, SAMP=170;
  const hueOf=(re,im)=>((Math.atan2(im,re)/(2*Math.PI))+1)%1;
  const hcol=(h,a)=>'hsla('+(h*360).toFixed(0)+',78%,46%,'+a+')';
  const lines=[];
  for(let re=-6; re<=7.0001; re+=0.2){
    const pts=[]; for(let k=0;k<=SAMP;k++){ const im=-3.4+6.8*k/SAMP; pts.push({sx:re,sy:im,z:czeta(C(re,im)),h:hueOf(re,im)}); }
    lines.push(pts);
  }
  for(let im=-3.3; im<=3.3001; im+=0.2){
    const pts=[]; for(let k=0;k<=SAMP;k++){ const re=-6+13*k/SAMP; pts.push({sx:re,sy:im,z:czeta(C(re,im)),h:hueOf(re,im)}); }
    lines.push(pts);
  }
  let view={x0:-6.6,x1:7.6,y0:-3.9,y1:3.9}, initView={...view};
  let morph=0, playing=false, raf=null, dir=1;
  const PW=()=>cv.clientWidth-54-16, PH=()=>H-12-36;
  const px=x=>54+(x-view.x0)/(view.x1-view.x0)*PW();
  const py=y=>12+(1-(y-view.y0)/(view.y1-view.y0))*PH();
  const ix=p=>view.x0+(p-54)/PW()*(view.x1-view.x0);
  const iy=p=>view.y0+(1-(p-12)/PH())*(view.y1-view.y0);
  function draw(){
    const w=cv.clientWidth||600, dpr=window.devicePixelRatio||1;
    cv.width=w*dpr; cv.height=H*dpr; cv.style.height=H+'px';
    const c=cv.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,w,H);
    c.save(); c.beginPath(); c.rect(54,12,w-54-16,H-12-36); c.clip();
    // polar backdrop (grey circles + radial spokes) around the origin
    const cx=px(0), cy=py(0), maxR=Math.max(w,H)*1.4;
    c.strokeStyle=T.gridFaint; c.lineWidth=1;
    const rstep=Math.abs(px(1)-px(0));
    for(let rr=rstep; rr<maxR; rr+=rstep){ c.beginPath(); c.arc(cx,cy,rr,0,7); c.stroke(); }
    for(let a=0;a<360;a+=15){ const ang=a*Math.PI/180; c.beginPath(); c.moveTo(cx,cy); c.lineTo(cx+Math.cos(ang)*maxR,cy+Math.sin(ang)*maxR); c.stroke(); }
    // axes
    c.strokeStyle=T.axis; c.lineWidth=1.1;
    if(view.y0<0&&view.y1>0){c.beginPath();c.moveTo(54,cy);c.lineTo(w-16,cy);c.stroke();}
    if(view.x0<0&&view.x1>0){c.beginPath();c.moveTo(cx,12);c.lineTo(cx,H-36);c.stroke();}
    // the transformed grid
    c.lineWidth=1.4;
    for(const pts of lines){
      let prev=null, prevH=0;
      for(const pt of pts){
        const z=pt.z;
        if(!isFinite(z.re)||!isFinite(z.im)||cabs(z)>30){prev=null;continue;}
        const X=px((1-morph)*pt.sx+morph*z.re), Y=py((1-morph)*pt.sy+morph*z.im);
        if(prev){ c.strokeStyle=hcol(pt.h,0.85); c.beginPath(); c.moveTo(prev[0],prev[1]); c.lineTo(X,Y); c.stroke(); }
        prev=[X,Y]; prevH=pt.h;
      }
    }
    // ζ = Σ 1/nˢ label + pole dot
    c.fillStyle=T.strongText; c.font='600 15px "Space Grotesk", sans-serif'; c.textAlign='left'; c.textBaseline='top';
    c.fillText('ζ(s) = Σ 1/nˢ', 62, 20);
    const pX=px((1-morph)*1+morph*1e9);
    c.restore();
    c.font='11px "Source Code Pro", monospace'; c.fillStyle=T.tickText; c.textAlign='center'; c.textBaseline='top';
    for(const x of ticks(view.x0,view.x1)){const X=px(x); if(X<54||X>w-16)continue; c.fillText(fmt(x),X,H-30);}
    c.textAlign='right'; c.textBaseline='middle';
    for(const y of ticks(view.y0,view.y1)){const Y=py(y); if(Y<12||Y>H-36)continue; c.fillText(fmt(y)+'i',48,Y);}
    c.fillStyle=T.labelText; c.textAlign='right'; c.textBaseline='top'; c.font='11px "Source Code Pro", monospace';
    c.fillText('morph = '+morph.toFixed(2), w-22, 20);
    c.strokeStyle=T.frame; c.lineWidth=1; c.strokeRect(54.5,12.5,w-54-16-1,H-12-36-1);
  }
  function stop(){playing=false;playBtn.textContent='▶ Play';playBtn.classList.add('primary');if(raf)cancelAnimationFrame(raf);raf=null;}
  function step(){ morph+=dir*0.007; if(morph>=1){morph=1;dir=-1;} else if(morph<=0){morph=0;dir=1;} sl.value=morph; draw(); raf=requestAnimationFrame(step); }
  playBtn.onclick=()=>{ if(playing){stop();} else {playing=true;playBtn.textContent='❚❚ Pause';playBtn.classList.remove('primary');step();} };
  sl.addEventListener('input',()=>{stop();morph=+sl.value;draw();});
  let drag=null;
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);drag={x:e.offsetX,y:e.offsetY,v:{...view}};});
  cv.addEventListener('pointerup',()=>drag=null);
  cv.addEventListener('pointerleave',()=>ro.style.opacity=0);
  cv.addEventListener('pointermove',e=>{
    if(drag){ const ddx=(e.offsetX-drag.x)/PW()*(drag.v.x1-drag.v.x0), ddy=(e.offsetY-drag.y)/PH()*(drag.v.y1-drag.v.y0);
      view.x0=drag.v.x0-ddx; view.x1=drag.v.x1-ddx; view.y0=drag.v.y0+ddy; view.y1=drag.v.y1+ddy; draw();
    }else{ ro.textContent='s = '+fmt(ix(e.offsetX))+(iy(e.offsetY)>=0?' + ':' − ')+fmt(Math.abs(iy(e.offsetY)))+'i'; ro.style.opacity=1; }
  });
  cv.addEventListener('wheel',e=>{ e.preventDefault(); const f=e.deltaY<0?0.86:1/0.86; const mx=ix(e.offsetX), my=iy(e.offsetY);
    view.x0=mx-(mx-view.x0)*f; view.x1=mx-(mx-view.x1)*f; view.y0=my-(my-view.y0)*f; view.y1=my-(my-view.y1)*f; draw(); },{passive:false});
  reset.onclick=()=>{stop();morph=0;sl.value=0;view={...initView};draw();};
  window.addEventListener('resize',draw);
  draw();
})();

/* =====================================================================
   FIGURE 4 — Euler product convergence (slider)
   ===================================================================== */
(function(){
  const xs=[]; for(let x=1.06;x<=6;x+=0.03) xs.push(x);
  const truth=xs.map(x=>[x,zetaReal(x)]);
  function partial(np){ const ps=PRIMES.slice(0,np); return xs.map(x=>{let prod=1; for(const p of ps) prod*=1/(1-Math.pow(p,-x)); return [x,prod];}); }
  let np=1, plot, sl, lab;
  const {cv,reset,ro}=mount('fig-euler',{
    title:'Building ζ(s) one prime at a time',
    legend:[{label:'true ζ(s)',color:T.refLine},{label:'product over first N primes',color:COL.orange}],
    caption:'Figure 4. Each prime adds one factor and pulls the orange product (dashed) toward the true \(\zeta(s)\) (white). Slide to add primes.',
    controls:(bar)=>{
      const w=document.createElement('span'); w.className='ctrl';
      const l=document.createElement('label'); l.textContent='primes:';
      sl=document.createElement('input'); sl.type='range'; sl.min=1; sl.max=25; sl.value=1;
      lab=document.createElement('span'); lab.className='val';
      w.appendChild(l); w.appendChild(sl); w.appendChild(lab); bar.appendChild(w);
    }
  });
  plot=new Plot(cv,[{data:truth,color:T.refLine,width:2},{data:partial(1),color:COL.orange,width:2.2,dash:[6,4]}],
    {x0:1,x1:6,y0:0,y1:9},{xlabel:'s',ylabel:'ζ(s)'});
  plot.readout=ro;
  function redraw(){ const ps=PRIMES.slice(0,np); const s=ps.join(','); lab.textContent=np+' ('+(s.length>20?s.slice(0,20)+'…':s)+')'; plot.series[1].data=partial(np); plot.draw(); }
  sl.addEventListener('input',()=>{np=+sl.value;redraw();});
  reset.onclick=()=>{plot.view={...plot.init};plot.draw();};
  redraw();
})();

/* =====================================================================
   FIGURE 5 — pi(x) staircase vs x/ln x vs Li(x)
   ===================================================================== */
(function(){
  const X=1000;
  const stair=piStairs(X);
  const xln=[]; for(let x=2;x<=X;x+=2) xln.push([x,x/Math.log(x)]);
  const li=liTable(X,2);
  const {cv,reset,ro}=mount('fig-pi',{
    title:'The prime-counting staircase π(x) and its approximations',
    legend:[{label:'π(x), exact prime count',color:COL.blue},{label:'x / ln x (Gauss)',color:COL.yellow},{label:'Li(x) (log integral)',color:COL.green}],
    caption:'Figure 5. The blue staircase jumps \(+1\) at every prime; \(\operatorname{Li}(x)\) (green) tracks it far more tightly than \(x/\ln x\) (yellow). Zoom near a step to see the jumps.'
  });
  const p=new Plot(cv,[
    {data:xln,color:COL.yellow,width:1.8,dash:[7,4]},
    {data:li,color:COL.green,width:1.8,dash:[2,3]},
    {data:stair,color:COL.blue,width:2},
  ],{x0:0,x1:X,y0:0,y1:170},{xlabel:'x',ylabel:'count'});
  p.readout=ro; reset.onclick=()=>{p.view={...p.init};p.draw();};
})();

/* =====================================================================
   FIGURE 6 — explicit formula: more zeros -> better prime approximation
   ===================================================================== */
(function(){
  const X=50;
  const jumps=[];
  for(const p of PRIMES){ if(p>X)break; let pk=p; while(pk<=X){ jumps.push([pk,Math.log(p)]); pk*=p; } }
  jumps.sort((a,b)=>a[0]-b[0]);
  const stair=[[0,0]]; let acc=0;
  for(const j of jumps){ stair.push([j[0],acc]); acc+=j[1]; stair.push([j[0],acc]); }
  stair.push([X,acc]);
  function approx(nz){
    const out=[];
    for(let x=2;x<=X;x+=0.05){
      let s=x-Math.log(2*Math.PI); const lnx=Math.log(x), sq=Math.sqrt(x);
      for(let k=0;k<nz;k++){ const g=ZEROS[k]; const num=cmul(C(sq,0), cexp(C(0,g*lnx))); s-=2*cdiv(num, C(0.5,g)).re; }
      out.push([x,s]);
    }
    return out;
  }
  let nz=2, plot, sl, lab, playBtn, playing=false, raf=null;
  const {cv,reset,ro}=mount('fig-psi',{
    title:'More zeros → a sharper approximation of the primes',
    legend:[{label:'exact prime staircase ψ(x)',color:COL.blue},{label:'trend y = x',color:T.trendLine},{label:'approx. from N zero-pairs',color:COL.purple}],
    caption:'Figure 6. The blue staircase is the (weighted) prime count. Start from the smooth trend \(y=x\) and add the wave from one more zero at a time, press <em>Play</em>. Each extra zero of \(\zeta\) sharpens the approximation until the purple curve reproduces the exact prime steps. This is, literally, the primes being rebuilt from the zeros.',
    controls:(bar)=>{
      playBtn=document.createElement('button'); playBtn.className='btn primary'; playBtn.textContent='▶ Play';
      bar.appendChild(playBtn);
      const w=document.createElement('span'); w.className='ctrl';
      const l=document.createElement('label'); l.textContent='zero-pairs:';
      sl=document.createElement('input'); sl.type='range'; sl.min=0; sl.max=ZEROS.length; sl.value=2;
      lab=document.createElement('span'); lab.className='val';
      w.appendChild(l); w.appendChild(sl); w.appendChild(lab); bar.appendChild(w);
    }
  });
  plot=new Plot(cv,[
    {data:[[2,2],[X,X]],color:T.trendLine,width:1.5,dash:[5,4]},
    {data:approx(2),color:COL.purple,width:2},
    {data:stair,color:COL.blue,width:2},
  ],{x0:2,x1:X,y0:0,y1:X+6},{xlabel:'x',ylabel:'ψ(x)'});
  plot.readout=ro;
  function redraw(){lab.textContent=nz; sl.value=nz; plot.series[1].data=approx(nz); plot.draw();}
  function stop(){playing=false;playBtn.textContent='▶ Play';playBtn.classList.add('primary');if(raf)cancelAnimationFrame(raf);raf=null;}
  let acc2=0;
  function step(ts){ acc2+=1; if(acc2>=3){acc2=0; nz++; if(nz>ZEROS.length){nz=ZEROS.length; redraw(); stop(); return;} redraw();} raf=requestAnimationFrame(step); }
  playBtn.onclick=()=>{ if(playing){stop();} else {playing=true;playBtn.textContent='❚❚ Pause';playBtn.classList.remove('primary'); nz=0; redraw(); raf=requestAnimationFrame(step);} };
  sl.addEventListener('input',()=>{stop();nz=+sl.value;redraw();});
  reset.onclick=()=>{stop();plot.view={...plot.init};plot.draw();};
  redraw();
})();

/* =====================================================================
   FIGURE 7 — polar curve of zeta(1/2 + it): the beauty shot
   ===================================================================== */
(function(){
  const fig=root.querySelector('#'+'fig-polar');

  const formula=document.createElement('p'); formula.className='eq';
  formula.innerHTML='\\[ \\zeta(s) = \\sum_{n=1}^{\\infty} \\frac{1}{n^{s}} \\]';
  fig.appendChild(formula);

  const box=document.createElement('div'); box.className='plotbox'; box.style.background=T.canvasBg;
  const col=document.createElement('div'); col.className='polar-canvas-col';
  const topRow=document.createElement('div'); topRow.style.display='flex'; topRow.style.justifyContent='space-between'; topRow.style.alignItems='baseline'; topRow.style.marginBottom='4px';
  const ttl=document.createElement('div'); ttl.style.fontWeight='600'; ttl.style.fontSize='0.95em'; ttl.style.color=T.labelText; ttl.textContent='Polar graph of Riemann ζ(½ + it)';
  topRow.appendChild(ttl); col.appendChild(topRow);

  const bar=document.createElement('div'); bar.className='plot-toolbar'; bar.style.color=T.tickText;
  bar.innerHTML='<span class="hint">Scroll = zoom &middot; Drag = pan</span>';
  const playBtn=document.createElement('button'); playBtn.className='btn primary'; playBtn.textContent='▶ Play';
  const reset=document.createElement('button'); reset.className='btn'; reset.textContent='Reset';
  bar.appendChild(playBtn); bar.appendChild(reset);
  const wrapC=document.createElement('span'); wrapC.className='ctrl';
  const l=document.createElement('label'); l.textContent='t up to:';
  const sl=document.createElement('input'); sl.type='range'; sl.min=1; sl.max=100; sl.step=0.5; sl.value=70;
  const lab=document.createElement('span'); lab.className='val'; lab.textContent='70';
  wrapC.appendChild(l); wrapC.appendChild(sl); wrapC.appendChild(lab); bar.appendChild(wrapC); col.appendChild(bar);

  const wrap=document.createElement('div'); wrap.className='plot-canvas-wrap light';
  const cv=document.createElement('canvas'); cv.className='plot';
  const ro=document.createElement('div'); ro.className='readout';
  wrap.appendChild(cv); wrap.appendChild(ro); col.appendChild(wrap);
  box.appendChild(col);
  fig.appendChild(box);
  const fc=document.createElement('figcaption');
  fc.innerHTML='Figure 7. The polar graph of \\(\\zeta(\\tfrac12+it)\\): the same picture as the textbook plot, but live. Each time the red curve sweeps back through the origin, \\(t\\) has hit the imaginary part of a nontrivial zero. Raise \\(t_{\\max}\\) or press Play to keep tracing.';
  fig.appendChild(fc);

  const H=440, STEP=0.02;
  let tmax=70, view=null, initView=null, pts=null;
  function computeCurve(T){
    const arr=[]; for(let t=0;t<=T+1e-9;t+=STEP){ arr.push(czeta(C(0.5,t))); } return arr;
  }
  function autoView(){
    view={x0:-2.1,x1:3.4,y0:-2.4,y1:2.4}; initView={...view};
  }
  pts=computeCurve(tmax); autoView();
  const PW=()=>cv.clientWidth-58-16, PH=()=>H-30-40;
  function scaleInfo(){
    const pw=PW(), ph=PH();
    const ux=(view.x1-view.x0), uy=(view.y1-view.y0);
    const s=Math.min(pw/ux, ph/uy);
    return {s, ox:58+(pw-ux*s)/2, oy:30+(ph-uy*s)/2};
  }
  const px=x=>{const S=scaleInfo(); return S.ox+(x-view.x0)*S.s;};
  const py=y=>{const S=scaleInfo(); return S.oy+(view.y1-y)*S.s;};
  const ix=p=>{const S=scaleInfo(); return view.x0+(p-S.ox)/S.s;};
  const iy=p=>{const S=scaleInfo(); return view.y1-(p-S.oy)/S.s;};
  let head=pts.length, playing=false, raf=null;
  function draw(){
    const w=cv.clientWidth||600, dpr=window.devicePixelRatio||1;
    cv.width=w*dpr; cv.height=H*dpr; cv.style.height=H+'px';
    const c=cv.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0);
    c.fillStyle=T.canvasBg; c.fillRect(0,0,w,H);
    c.save(); c.beginPath(); c.rect(58,30,w-58-16,H-30-40); c.clip();
    // axis lines (textbook style, no grid)
    c.strokeStyle=T.polarAxis; c.lineWidth=1.2;
    c.beginPath(); c.moveTo(58,py(0)); c.lineTo(w-16,py(0)); c.stroke();
    c.beginPath(); c.moveTo(px(0),30); c.lineTo(px(0),H-40); c.stroke();
    // tick marks
    c.strokeStyle=T.polarAxis; c.lineWidth=1;
    for(const gx of ticks(view.x0,view.x1)){ if(Math.abs(gx)<1e-9) continue; const X=px(gx); if(X<58||X>w-16)continue;
      c.beginPath(); c.moveTo(X,py(0)-4); c.lineTo(X,py(0)+4); c.stroke(); }
    for(const gy of ticks(view.y0,view.y1)){ if(Math.abs(gy)<1e-9) continue; const Y=py(gy); if(Y<30||Y>H-40)continue;
      c.beginPath(); c.moveTo(px(0)-4,Y); c.lineTo(px(0)+4,Y); c.stroke(); }
    // the curve
    const hd=Math.max(2,Math.min(pts.length,Math.round(head)));
    c.strokeStyle='#e21b1b'; c.lineWidth=1.8; c.beginPath();
    for(let i=0;i<hd;i++){ const X=px(pts[i].re),Y=py(pts[i].im); if(i===0)c.moveTo(X,Y); else c.lineTo(X,Y); }
    c.stroke();
    c.restore();
    // tick labels (small serif-ish)
    c.font='11px "Space Grotesk", sans-serif'; c.fillStyle=T.polarAxis; c.textAlign='center'; c.textBaseline='top';
    for(const gx of ticks(view.x0,view.x1)){ const X=px(gx); if(X<58||X>w-16)continue; c.fillText(fmt(gx),X,py(0)+7); }
    c.textAlign='right'; c.textBaseline='middle';
    for(const gy of ticks(view.y0,view.y1)){ const Y=py(gy); if(Y<30||Y>H-40)continue; c.fillText(fmt(gy),px(0)-7,Y); }
    // axis labels
    c.fillStyle=T.polarAxis; c.font='12px "Space Grotesk", sans-serif';
    c.textAlign='right'; c.textBaseline='bottom'; c.fillText('Re ζ(½ + it)', w-16, H-42);
    c.save(); c.translate(px(0)-38,30); c.textAlign='left'; c.textBaseline='top'; c.fillText('Im ζ(½ + it)',0,0); c.restore();
    c.fillStyle=T.tickText; c.textAlign='left'; c.textBaseline='top'; c.font='11px "Source Code Pro", monospace';
    c.fillText('t = 0 → '+((hd-1)*STEP).toFixed(1), 64, 36);
  }
  function stop(){playing=false;playBtn.textContent='▶ Play';playBtn.classList.add('primary');if(raf)cancelAnimationFrame(raf);raf=null;}
  function step(){ head+=Math.max(2,pts.length/260); if(head>=pts.length){head=pts.length;draw();stop();return;} draw(); raf=requestAnimationFrame(step); }
  playBtn.onclick=()=>{ if(playing){stop();} else {playing=true;playBtn.textContent='❚❚ Pause';playBtn.classList.remove('primary');head=1;step();} };
  sl.addEventListener('input',()=>{ stop(); tmax=+sl.value; lab.textContent=tmax.toFixed(0); pts=computeCurve(tmax); head=pts.length; draw(); });
  let drag=null;
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);drag={x:e.offsetX,y:e.offsetY,v:{...view}};});
  cv.addEventListener('pointerup',()=>drag=null);
  cv.addEventListener('pointerleave',()=>ro.style.opacity=0);
  cv.addEventListener('pointermove',e=>{
    if(drag){ const ddx=(e.offsetX-drag.x)/PW()*(drag.v.x1-drag.v.x0), ddy=(e.offsetY-drag.y)/PH()*(drag.v.y1-drag.v.y0);
      view.x0=drag.v.x0-ddx; view.x1=drag.v.x1-ddx; view.y0=drag.v.y0+ddy; view.y1=drag.v.y1+ddy; draw();
    }else{ ro.textContent='Re='+fmt(ix(e.offsetX))+' Im='+fmt(iy(e.offsetY)); ro.style.opacity=1; }
  });
  cv.addEventListener('wheel',e=>{ e.preventDefault(); const f=e.deltaY<0?0.86:1/0.86; const mx=ix(e.offsetX), my=iy(e.offsetY);
    view.x0=mx-(mx-view.x0)*f; view.x1=mx-(mx-view.x1)*f; view.y0=my-(my-view.y0)*f; view.y1=my-(my-view.y1)*f; draw(); },{passive:false});
  reset.onclick=()=>{stop();view={...initView};head=pts.length;draw();};
  window.addEventListener('resize',draw);
  draw();
})();

/* =====================================================================
   FIGURE 8 — the zeros
})();

/* =====================================================================
   FIGURE 8 — the zeros: trivial (real axis) + nontrivial (critical line)
   ===================================================================== */
(function(){
  const nz=[]; for(const g of ZEROS){nz.push([0.5,g]);nz.push([0.5,-g]);}
  const {cv,reset,ro}=mount('fig-zeros',{
    title:'Every known zero of ζ(s): trivial on the real axis, nontrivial on Re = ½',
    legend:[{label:'critical strip 0 ≤ Re ≤ 1',color:'rgba(178,133,240,0.35)'},
            {label:'critical line Re = ½',color:COL.yellow},
            {label:'nontrivial zeros',color:COL.teal,dot:1},
            {label:'trivial zeros (−2,−4,…)',color:COL.orange,dot:1},
            {label:'pole s = 1',color:COL.red,dot:1}],
    caption:'Figure 8. The map of the zeros. Trivial zeros (orange) sit at every negative even integer on the real axis; every nontrivial zero (teal) computed to date lies exactly on the yellow critical line \(\operatorname{Re}(s)=\tfrac12\). The Riemann Hypothesis says <em>all</em> of them do, forever. Drag up the line to see more.'
  });
  const trivial=[]; for(let k=-2;k>=-14;k-=2) trivial.push([k,0]);
  const markers=[
    {x:1,y:0,color:COL.red,r:4},
    {x:0.5,y:ZEROS[0],color:COL.teal,r:4,label:'½ + '+ZEROS[0].toFixed(2)+'i'},
    {x:0.5,y:ZEROS[1],color:COL.teal,r:4,label:'½ + '+ZEROS[1].toFixed(2)+'i'},
    {x:-2,y:0,color:COL.orange,r:4,label:'−2',ta:'right'},
    {x:-4,y:0,color:COL.orange,r:4,label:'−4',ta:'right'},
  ];
  const p=new Plot(cv,[
    {type:'scatter',data:nz,color:COL.teal,r:3.4},
    {type:'scatter',data:trivial,color:COL.orange,r:4},
  ],{x0:-15,x1:3,y0:-45,y1:45},
    {xlabel:'Re(s)  (real part)',ylabel:'Im(s)  (imaginary part)', height:430,
     regions:[{x0:0,x1:1,color:'rgba(178,133,240,0.16)'}],
     vlines:[{x:0.5,color:COL.yellow,dash:[6,4],width:1.5}],
     hlines:[{y:0,color:'rgba(150,175,210,0.3)'}], markers});
  p.readout=ro; reset.onclick=()=>{p.view={...p.init};p.draw();};
})();

/* =====================================================================
   FIGURE 9 — the |zeta(s)| landscape, isometric surface with a rotate slider
   ===================================================================== */
(function(){
  const fig=root.querySelector('#'+'fig-surface');
  const box=document.createElement('div'); box.className='plotbox';
  const t=document.createElement('div'); t.className='plot-title';
  t.textContent='The surface |ζ(σ+it)|: a mountain at the pole, a trench of valleys at the zeros'; box.appendChild(t);
  const bar=document.createElement('div'); bar.className='plot-toolbar';
  bar.innerHTML='<span class="hint">Drag the rotate slider to spin the terrain</span>';
  const playBtn=document.createElement('button'); playBtn.className='btn primary'; playBtn.textContent='▶ Rotate';
  const reset=document.createElement('button'); reset.className='btn'; reset.textContent='Reset';
  bar.appendChild(playBtn); bar.appendChild(reset);
  const wrapC=document.createElement('span'); wrapC.className='ctrl';
  const l=document.createElement('label'); l.textContent='angle:';
  const sl=document.createElement('input'); sl.type='range'; sl.min=-60; sl.max=60; sl.step=1; sl.value=0;
  wrapC.appendChild(l); wrapC.appendChild(sl); bar.appendChild(wrapC); box.appendChild(bar);
  const wrap=document.createElement('div'); wrap.className='plot-canvas-wrap';
  const cv=document.createElement('canvas'); cv.className='plot';
  wrap.appendChild(cv); box.appendChild(wrap);
  const lg=document.createElement('div'); lg.className='legend';
  lg.innerHTML='<span class="item"><span class="swatch" style="background:linear-gradient(90deg,#2a5ea8,#35d0ba,#ffd24a,#ff6b6b)"></span>height = |ζ(σ+it)|, low (blue) → high (red)</span>'+
    '<span class="item"><span class="swatch dot" style="background:'+COL.yellow+'"></span>critical line σ = ½ runs along the trench of zeros</span>';
  box.appendChild(lg);
  fig.appendChild(box);
  const fc=document.createElement('figcaption');
  fc.innerHTML='Figure 9. An isometric height-map of \\(|\\zeta(\\sigma+it)|\\) over \\(\\sigma\\in[-0.5,1.5]\\), \\(t\\in[0,40]\\), clamped near the pole. The spike is \\(s=1\\); each valley touching the floor is a nontrivial zero, all lined up along \\(\\sigma=\\tfrac12\\).';
  fig.appendChild(fc);

  const H=440;
  const NS=26, NT=64; // sigma, t sample counts
  const S0=-0.6, S1=1.6, T0=0, T1=40, CLAMP=5.2;
  const heights=[];
  for(let i=0;i<=NS;i++){
    const row=[];
    const sigma=S0+(S1-S0)*i/NS;
    for(let j=0;j<=NT;j++){
      const tt=T0+(T1-T0)*j/NT;
      let m;
      if(Math.abs(sigma-1)<0.05 && tt<0.6){ m=CLAMP; }
      else { m=Math.min(CLAMP, cabs(czeta(C(sigma,tt)))); }
      row.push(m);
    }
    heights.push(row);
  }
  function colormap(v){ // 0..CLAMP -> blue..teal..gold..red
    const f=Math.max(0,Math.min(1,v/CLAMP));
    const stops=[[42,94,168],[53,208,186],[255,210,74],[255,107,107]];
    const seg=f*3; const i=Math.min(2,Math.floor(seg)); const lf=seg-i;
    const a=stops[i], b=stops[i+1];
    const r=Math.round(a[0]+(b[0]-a[0])*lf), g=Math.round(a[1]+(b[1]-a[1])*lf), bl=Math.round(a[2]+(b[2]-a[2])*lf);
    return 'rgb('+r+','+g+','+bl+')';
  }
  let angle=0, spinning=false, raf=null;
  function project(i,j,h,w,cx,cy,cell,hscale,ang){
    const rad=ang*Math.PI/180;
    const u=i-NS/2, v=j-NT/2*(NS/NT);
    const ur=u*Math.cos(rad)-v*Math.sin(rad);
    const vr=u*Math.sin(rad)+v*Math.cos(rad);
    const isoA=Math.PI/6;
    const X=cx+(ur-vr)*Math.cos(isoA)*cell;
    const Y=cy+(ur+vr)*Math.sin(isoA)*cell*0.6 - h*hscale;
    return [X,Y];
  }
  function draw(){
    const w=cv.clientWidth||600, dpr=window.devicePixelRatio||1;
    cv.width=w*dpr; cv.height=H*dpr; cv.style.height=H+'px';
    const c=cv.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); c.clearRect(0,0,w,H);
    const cx=w/2, cy=H*0.62, cell=Math.min(w/(NS*1.7), 10), hscale=26;
    const quads=[];
    for(let i=0;i<NS;i++){
      for(let j=0;j<NT;j++){
        const h00=heights[i][j], h10=heights[i+1][j], h11=heights[i+1][j+1], h01=heights[i][j+1];
        const p00=project(i,j,h00,w,cx,cy,cell,hscale,angle);
        const p10=project(i+1,j,h10,w,cx,cy,cell,hscale,angle);
        const p11=project(i+1,j+1,h11,w,cx,cy,cell,hscale,angle);
        const p01=project(i,j+1,h01,w,cx,cy,cell,hscale,angle);
        const havg=(h00+h10+h11+h01)/4;
        quads.push({pts:[p00,p10,p11,p01], h:havg, depth:i+j});
      }
    }
    quads.sort((a,b)=>a.depth-b.depth);
    for(const q of quads){
      c.fillStyle=colormap(q.h);
      c.beginPath(); c.moveTo(q.pts[0][0],q.pts[0][1]);
      for(let k=1;k<4;k++) c.lineTo(q.pts[k][0],q.pts[k][1]);
      c.closePath(); c.fill();
      c.strokeStyle=T.quadStroke; c.lineWidth=0.6; c.stroke();
    }
    const critI = Math.round((0.5-S0)/(S1-S0)*NS);
    c.strokeStyle=COL.yellow; c.lineWidth=2; c.beginPath();
    for(let j=0;j<=NT;j++){ const P=project(critI,j,heights[critI][j],w,cx,cy,cell,hscale,angle); j===0?c.moveTo(P[0],P[1]):c.lineTo(P[0],P[1]); }
    c.stroke();
    c.fillStyle=T.labelText; c.font='12px "Space Grotesk", sans-serif'; c.textAlign='left'; c.textBaseline='top';
    c.fillText('pole at s=1 →', 14, 14);
    c.fillStyle=T.tickText; c.font='11px "Source Code Pro", monospace';
    c.fillText('σ (real part) & t (imaginary part) →, height = |ζ(s)|', 14, H-18);
  }
  function stop(){spinning=false;playBtn.textContent='▶ Rotate';playBtn.classList.add('primary');if(raf)cancelAnimationFrame(raf);raf=null;}
  function step(){ angle+=0.6; if(angle>60){angle=60;stop();sl.value=60;draw();return;} sl.value=Math.round(angle); draw(); raf=requestAnimationFrame(step); }
  playBtn.onclick=()=>{ if(spinning){stop();} else {spinning=true;playBtn.textContent='❚❚ Stop';playBtn.classList.remove('primary'); if(angle>=60)angle=-60; step();} };
  sl.addEventListener('input',()=>{stop();angle=+sl.value;draw();});
  reset.onclick=()=>{stop();angle=0;sl.value=0;draw();};
  window.addEventListener('resize',draw);
  draw();
})();

/* =====================================================================
   FIGURE 10 — prime gaps scatter
   ===================================================================== */
(function(){
  const X=5000; const gaps=[];
  for(let i=1;i<PRIMES.length && PRIMES[i]<=X;i++) gaps.push([PRIMES[i],PRIMES[i]-PRIMES[i-1]]);
  const {cv,reset,ro}=mount('fig-gaps',{
    title:'Gaps between consecutive primes (up to 5,000)',
    legend:[{label:'gap to the next prime',color:COL.orange,dot:1}],
    caption:'Figure 10. Each dot is the gap from a prime to the next. Chaotic up close, yet banded at even values (2, 4, 6, …) and bounded in a lawful way. Zoom in to explore.'
  });
  const p=new Plot(cv,[{type:'scatter',data:gaps,color:COL.orange,r:1.8}],
    {x0:0,x1:X,y0:0,y1:40},{xlabel:'prime p',ylabel:'gap to next prime'});
  p.readout=ro; reset.onclick=()=>{p.view={...p.init};p.draw();};
})();

}
