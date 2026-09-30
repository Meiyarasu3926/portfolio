// ── LIGHTBOX ──
function openLightbox(img) {
  const lb    = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  const lbCap = document.getElementById('lightboxCaption');
  lbImg.src = img.src;
  lbImg.alt = img.alt;
  lbCap.textContent = img.dataset.caption || img.alt;
  lb.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeLightboxBtn() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = '';
}
function closeLightbox(e) {
  if (e.target === document.getElementById('lightbox')) closeLightboxBtn();
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightboxBtn(); });

// ── STORY TOGGLE ──
function toggleStory(btn) {
  btn.classList.toggle('open');
  btn.nextElementSibling.classList.toggle('open');
}

// ── CURSOR ──
const dot  = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
let mx=0, my=0, rx=0, ry=0;
document.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; });
(function tick(){
  dot.style.left  = mx+'px'; dot.style.top  = my+'px';
  rx += (mx-rx)*.12; ry += (my-ry)*.12;
  ring.style.left = rx+'px'; ring.style.top = ry+'px';
  requestAnimationFrame(tick);
})();
document.querySelectorAll('a,button,video,.story-toggle,.result-img').forEach(el => {
  el.addEventListener('mouseenter', () => { ring.style.transform='translate(-50%,-50%) scale(1.5)'; ring.style.opacity='1'; });
  el.addEventListener('mouseleave', () => { ring.style.transform='translate(-50%,-50%) scale(1)';   ring.style.opacity='.6'; });
});

// ── SPACETIME CANVAS: drifting physics formulas, stars, a warped grid and a wave packet ──
const canvas = document.getElementById('neural-bg');
const ctx    = canvas.getContext('2d');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const VIOLET = '182,156,255', GOLD = '255,190,80';
const FORMULAS = [
  'iħ ∂ψ/∂t = Ĥψ',                 'Δx · Δp ≥ ħ/2',
  't′ = t / √(1 − v²/c²)',          'γ = 1 / √(1 − v²/c²)',
  'E = mc²',                        'E = hν',
  'G_μν + Λg_μν = (8πG/c⁴) T_μν',   'ds² = −c²dt² + dx² + dy² + dz²',
  'r_s = 2GM/c²',                   'Δτ = Δt √(1 − r_s/r)',
  '|ψ⟩ = α|0⟩ + β|1⟩',              '|Φ⁺⟩ = (|00⟩ + |11⟩)/√2',
  '[x̂, p̂] = iħ',                    'Û(t) = e^{−iĤt/ħ}',
  'ψ(x,t) = A e^{i(kx − ωt)}',      'λ = h / p',
  'T_H = ħc³ / 8πGMk_B',            'S = k_B ln Ω',
  '(iγ^μ ∂_μ − m)ψ = 0',            't′ = γ(t − vx/c²)',
  'ds² = −dt² + (dx − v_s f dt)² + dy² + dz²',
  '⟨x_f|e^{−iĤT/ħ}|x_i⟩ = ∫𝒟x e^{iS/ħ}',
  'ρ = Σ pᵢ |ψᵢ⟩⟨ψᵢ|',              '⟨ψ|ψ⟩ = 1'
];
let W, H, DPR = Math.min(window.devicePixelRatio || 1, 2), moved = false, T = 0;
function resize(){
  W = innerWidth; H = innerHeight;
  canvas.width = W*DPR; canvas.height = H*DPR;
  ctx.setTransform(DPR,0,0,DPR,0,0);
}
resize();
window.addEventListener('resize', resize);
window.addEventListener('mousemove', () => { moved = true; }, {once:true});

const stars = Array.from({length:90}, () => ({
  x: Math.random()*innerWidth, y: Math.random()*innerHeight,
  r: Math.random()*1.3+.3, ph: Math.random()*6.28, vy: .04+Math.random()*.08
}));
const glyphs = FORMULAS.map(t => ({
  t, x: Math.random()*innerWidth, y: Math.random()*innerHeight,
  vx: (Math.random()-.5)*.22, vy: (Math.random()-.5)*.16,
  size: 12 + Math.random()*8, ang: (Math.random()-.5)*.25,
  base: .12 + Math.random()*.14, ph: Math.random()*6.28,
  gold: Math.random() < .3, w: 0
}));

// Warped spacetime grid: a "mass" (the cursor, or a slow drift on touch screens) pulls grid points inward.
function drawGrid(gx, gy){
  const STEP = 64, SEG = 22, SIG2 = 2*190*190;
  ctx.lineWidth = .6;
  ctx.strokeStyle = `rgba(${VIOLET},.09)`;
  const warp = (x, y) => {
    const dx = gx-x, dy = gy-y, g = .38*Math.exp(-(dx*dx+dy*dy)/SIG2);
    return [x+dx*g, y+dy*g];
  };
  ctx.beginPath();
  for (let x = 0; x <= W+STEP; x += STEP){
    for (let y = 0; y <= H; y += SEG){ const p = warp(x, y); y ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]); }
  }
  for (let y = 0; y <= H+STEP; y += STEP){
    for (let x = 0; x <= W; x += SEG){ const p = warp(x, y); x ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1]); }
  }
  ctx.stroke();
}

// Gaussian wave packet: ψ(x,t) envelope × carrier, with |ψ|² shaded underneath.
function drawWave(){
  const base = H*.9, A = 46, sig = W*.13, c = ((T*38) % (W+400)) - 200, k = .055;
  ctx.beginPath();
  for (let x = 0; x <= W; x += 4){
    const env = Math.exp(-((x-c)*(x-c))/(2*sig*sig));
    const y = base - Math.sin(x*k - T*3)*A*env;
    x ? ctx.lineTo(x,y) : ctx.moveTo(x,y);
  }
  ctx.strokeStyle = `rgba(${VIOLET},.35)`; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, base);
  for (let x = 0; x <= W; x += 4){
    const env = Math.exp(-((x-c)*(x-c))/(2*sig*sig));
    ctx.lineTo(x, base - env*env*A*.8);
  }
  ctx.lineTo(W, base); ctx.closePath();
  ctx.fillStyle = `rgba(${GOLD},.07)`; ctx.fill();
}

function frame(){
  T += .008;
  ctx.clearRect(0,0,W,H);

  // pointer for gravity well + glyph highlight
  const px = moved ? rx : W*(.5 + .3*Math.sin(T*.7));
  const py = moved ? ry : H*(.45 + .2*Math.sin(T*.5 + 1));
  drawGrid(px, py);

  // stars
  for (const s of stars){
    s.y -= s.vy; if (s.y < -2){ s.y = H+2; s.x = Math.random()*W; }
    const a = .25 + .35*Math.sin(T*2 + s.ph);
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283);
    ctx.fillStyle = `rgba(${VIOLET},${Math.max(a,.05)})`; ctx.fill();
  }

  drawWave();

  // formulas
  ctx.textBaseline = 'middle';
  for (const g of glyphs){
    g.x += g.vx; g.y += g.vy;
    ctx.font = `${g.size}px 'JetBrains Mono', monospace`;
    if (!g.w) g.w = ctx.measureText(g.t).width;
    if (g.x < -g.w-40) g.x = W+40;  else if (g.x > W+40) g.x = -g.w-40;
    if (g.y < -30) g.y = H+30;      else if (g.y > H+30) g.y = -30;
    const d = Math.hypot(g.x+g.w/2-px, g.y-py);
    const boost = Math.max(0, 1 - d/260);
    const a = g.base*(.75 + .25*Math.sin(T*1.6 + g.ph)) + boost*.5;
    const col = g.gold ? GOLD : VIOLET;
    ctx.save();
    ctx.translate(g.x, g.y); ctx.rotate(g.ang);
    if (boost > .05){ ctx.shadowColor = `rgba(${col},.8)`; ctx.shadowBlur = 14*boost; }
    ctx.fillStyle = `rgba(${col},${Math.min(a,.85)})`;
    ctx.fillText(g.t, 0, 0);
    ctx.restore();
  }
  if (!reduceMotion) requestAnimationFrame(frame);
}
frame();

// ── SCROLL REVEAL ──
const revObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if(e.isIntersecting){ setTimeout(()=>e.target.classList.add('visible'),80); revObs.unobserve(e.target); } });
}, {threshold:.1, rootMargin:'0px 0px -40px 0px'});
document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

// ── VIDEO AUTO-PLAY ON SCROLL ──
const vidObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    const v = e.target;
    if(e.isIntersecting && e.intersectionRatio>=0.5){ v.play().catch(()=>{}); }
    else { v.pause(); }
  });
}, {threshold:[0,.25,.5,.75,1]});
document.querySelectorAll('.auto-play-video').forEach(v => {
  vidObs.observe(v);
  v.addEventListener('play', () => { document.querySelectorAll('.auto-play-video').forEach(o => { if(o!==v) o.pause(); }); });
});

// ── COUNTER ──
const statsEl = document.querySelector('.hero-stats');
if(statsEl){
  let done = false;
  new IntersectionObserver(entries => {
    if(entries[0].isIntersecting && !done){
      done = true;
      document.querySelectorAll('[data-count]').forEach(el => {
        const end=+el.dataset.count; let v=0; const step=end/60;
        const t=setInterval(()=>{ v+=step; if(v>=end){el.textContent=end;clearInterval(t);}else el.textContent=Math.floor(v); },20);
      });
    }
  },{threshold:.5}).observe(statsEl);
}

// ── NAVBAR ACTIVE ──
const allSecs = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let cur='';
  allSecs.forEach(s => { if(scrollY>=s.offsetTop-130) cur=s.id; });
  document.querySelectorAll('.nav-link').forEach(a => {
    a.style.color='';
    if(a.getAttribute('href')==='#'+cur) a.style.color='var(--cyan)';
  });
},{passive:true});