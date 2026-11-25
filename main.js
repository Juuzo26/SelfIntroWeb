// A* route finder hero: click a block to close/open a road.
const cv=document.getElementById('grid'),ctx=cv.getContext('2d');
const COLS=26,ROWS=10,S=[1,5],G=[24,4];
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let walls=new Set(),path=[],cell=0,dpr=1,t=0;
const key=(x,y)=>x+','+y;
// seed a few road closures with gaps
[6,11,16,20].forEach((x,i)=>{const gap=[2,7,4,6][i];for(let y=0;y<ROWS;y++)if(y!==gap&&y!==gap+1&&Math.abs(y-gap)<5)walls.add(key(x,y));});
function astar(){
  const h=(x,y)=>Math.abs(x-G[0])+Math.abs(y-G[1]);
  const open=[{x:S[0],y:S[1],g:0,f:h(...S),p:null}],seen=new Map([[key(...S),0]]);
  while(open.length){
    open.sort((a,b)=>a.f-b.f);const n=open.shift();
    if(n.x===G[0]&&n.y===G[1]){const r=[];for(let c=n;c;c=c.p)r.push([c.x,c.y]);return r.reverse();}
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){
      const x=n.x+dx,y=n.y+dy,k=key(x,y);
      if(x<0||y<0||x>=COLS||y>=ROWS||walls.has(k))continue;
      const g=n.g+1;if(seen.has(k)&&seen.get(k)<=g)continue;
      seen.set(k,g);open.push({x,y,g,f:g+h(x,y),p:n});
    }
  }return[];
}
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
function size(){
  dpr=devicePixelRatio||1;const w=cv.clientWidth;cell=w/COLS;
  cv.style.height=cell*ROWS+'px';cv.width=w*dpr;cv.height=cell*ROWS*dpr;draw();
}
function pt([x,y]){return[(x+.5)*cell,(y+.5)*cell];}
function draw(){
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,cv.width,cv.height);
  const ink=css('--ink'),line=css('--line'),route=css('--route');
  for(let x=0;x<COLS;x++)for(let y=0;y<ROWS;y++){
    const[px,py]=pt([x,y]);
    if(walls.has(key(x,y))){ctx.fillStyle=ink;ctx.globalAlpha=.85;ctx.beginPath();ctx.roundRect(x*cell+cell*.12,y*cell+cell*.12,cell*.76,cell*.76,cell*.14);ctx.fill();ctx.globalAlpha=1;}
    else{ctx.fillStyle=line;ctx.beginPath();ctx.arc(px,py,cell*.06,0,7);ctx.fill();}
  }
  if(path.length){
    ctx.strokeStyle=route;ctx.lineWidth=cell*.2;ctx.lineJoin=ctx.lineCap='round';ctx.beginPath();
    path.forEach((p,i)=>{const[a,b]=pt(p);i?ctx.lineTo(a,b):ctx.moveTo(a,b);});ctx.stroke();
    const i=Math.floor(t)%path.length,[vx,vy]=pt(path[i]);
    ctx.fillStyle=ink;ctx.beginPath();ctx.arc(vx,vy,cell*.2,0,7);ctx.fill();
    ctx.strokeStyle=route;ctx.lineWidth=cell*.08;ctx.stroke();
  }
  ctx.fillStyle=css('--blue');ctx.font=`700 ${cell*.5}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
  [[S,'A'],[G,'B']].forEach(([p,l])=>{const[a,b]=pt(p);ctx.beginPath();ctx.arc(a,b,cell*.36,0,7);ctx.fill();ctx.fillStyle=css('--card');ctx.fillText(l,a,b+1);ctx.fillStyle=css('--blue');});
}
cv.addEventListener('click',e=>{
  const r=cv.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)/cell),y=Math.floor((e.clientY-r.top)/cell),k=key(x,y);
  if([S,G].some(p=>p[0]===x&&p[1]===y))return;
  walls.has(k)?walls.delete(k):walls.add(k);path=astar();t=0;draw();
});
function loop(){t+=.25;draw();requestAnimationFrame(loop);}
path=astar();
new ResizeObserver(size).observe(cv);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',draw);
if(!reduce)requestAnimationFrame(loop);
document.getElementById('yr').textContent=new Date().getFullYear();

// ---------- page effects ----------
const $=(s,r=document)=>[...r.querySelectorAll(s)];
const smooth=(el)=>el.scrollIntoView({behavior:'smooth',block:'start'}); // always smooth for clicks

// click a nav link: glide to the section
$('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const id=a.getAttribute('href');e.preventDefault();
  if(id==='#'){scrollTo({top:0,behavior:'smooth'});history.pushState(null,'',location.pathname);return;}
  const t=document.querySelector(id);if(t){smooth(t);history.pushState(null,'',id);}
}));

// colour each project card
const palette=['--a1','--a2','--a3','--route','--a4'];
$('.card').forEach((c,i)=>c.style.setProperty('--c',`var(${palette[i%5]})`));

// reveal on scroll, with a stagger inside groups
const groups=['.about>*','#work h2','.cards .card','#activities h2','.carousel','.timeline li','#experience h2','#skills h2','.skills>div','#recognition h2','.awards li','.contact>*'];
groups.forEach(sel=>$(sel).forEach((el,i)=>{el.classList.add('rv');el.style.setProperty('--d',(sel.includes('>')||sel.includes(' li')?i%6*.1:0)+'s');}));
const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;e.target.classList.add('in');io.unobserve(e.target);
  if(e.target.matches('.facts li, .about>div'))countUp();
}),{threshold:.15,rootMargin:'0px 0px -6% 0px'});
$('.rv').forEach(el=>io.observe(el));
$('.facts li').forEach(el=>el.classList.add('rv'),io.observe);

// count-up numbers in the stats (runs once)
let counted=false;
function countUp(){
  if(counted||reduce)return;counted=true;
  $('.facts b').forEach(b=>{
    const m=b.textContent.match(/^([\d.]+)(.*)$/);if(!m)return;
    const end=parseFloat(m[1]),dec=(m[1].split('.')[1]||'').length,suf=m[2],t0=performance.now();
    (function step(now){const k=Math.min(1,(now-t0)/1400),v=end*(1-Math.pow(1-k,3));
      b.textContent=v.toFixed(dec)+suf;if(k<1)requestAnimationFrame(step);})(t0);
  });
}

// photo gallery: reads assets/carousel/photos.js (made by make_gallery.py)
const track=document.querySelector('.track'),dots=document.querySelector('.dots');
const pics=(window.PHOTOS&&window.PHOTOS.length)?window.PHOTOS:null;
(pics||['Add photos to assets/carousel','then run make_gallery.py','and they show up here']).forEach((p,i)=>{
  const f=document.createElement('figure');f.className='slide';f.style.setProperty('--c',`var(${palette[i%5]})`);
  if(pics){const im=new Image();im.loading='lazy';im.src='assets/web/carousel/'+p.file;im.alt=p.caption;f.append(im);}
  else f.textContent=p;
  track.append(f);
});
const cards=$('.slide',track);
cards.forEach((_,i)=>{const b=document.createElement('button');b.setAttribute('aria-label','Go to photo '+(i+1));b.onclick=()=>go(i);dots.append(b);});
const step=()=>cards.length>1?cards[1].offsetLeft-cards[0].offsetLeft:1;
function idx(){return Math.min(cards.length-1,Math.round(track.scrollLeft/step()));}
function go(i){track.scrollTo({left:i*step(),behavior:'smooth'});}
function sync(){$('button',dots).forEach((b,i)=>b.setAttribute('aria-current',i===idx()));}
const next=()=>go(idx()>=cards.length-1?0:idx()+1),prev=()=>go(Math.max(0,idx()-1));
document.querySelector('.prev').onclick=prev;document.querySelector('.next').onclick=next;
track.addEventListener('scroll',sync,{passive:true});
track.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();next();}if(e.key==='ArrowLeft'){e.preventDefault();prev();}});
let hold=false;const car=document.querySelector('.carousel');
['mouseenter','focusin','touchstart'].forEach(ev=>car.addEventListener(ev,()=>hold=true,{passive:true}));
['mouseleave','focusout'].forEach(ev=>car.addEventListener(ev,()=>hold=false));
if(pics&&!reduce)setInterval(()=>{if(!hold&&document.visibilityState==='visible')next();},4500);
sync();

// scroll progress bar + highlight the current section in the nav
const bar=document.querySelector('.progress'),links=$('nav a');
addEventListener('scroll',()=>{bar.style.setProperty('--p',scrollY/(document.documentElement.scrollHeight-innerHeight||1));},{passive:true});
const spy=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(l=>l.classList.toggle('active',l.getAttribute('href')==='#'+e.target.id));}),{rootMargin:'-45% 0px -50% 0px'});
$('main section[id]').forEach(s=>spy.observe(s));

// typed role line
(function(){
  const el=document.getElementById('role');if(!el||reduce)return;
  const roles=['fullstack developer','AI integration developer','data engineer','machine learning developer'];
  let r=0,n=0,del=false;
  (function tick(){
    const w=roles[r];n+=del?-1:1;el.textContent=w.slice(0,n);
    let t=del?35:75;
    if(!del&&n===w.length){del=true;t=1800;}
    else if(del&&n===0){del=false;r=(r+1)%roles.length;t=350;}
    setTimeout(tick,t);
  })();
})();