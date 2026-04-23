/* ═══════════════════════════════════════════════════════════
   DIJO AEROMARITIME S.A. — script.js v3.0
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── REVEAL ON SCROLL ── */
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('on');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.rv,.rl,.rr,.rs').forEach(el => obs.observe(el));

  /* ── NAV SCROLL ── */
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', scrollY > 60);
  }, { passive: true });

  /* ── MOBILE NAV ── */
  document.getElementById('hbg')?.addEventListener('click', () =>
    document.getElementById('mnav')?.classList.add('open'));
  document.getElementById('mclose')?.addEventListener('click', () =>
    document.getElementById('mnav')?.classList.remove('open'));
  window.mn = () => document.getElementById('mnav')?.classList.remove('open');

  /* ── LANGUAGE TOGGLE ── */
  const html = document.documentElement;
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      html.setAttribute('data-lang', btn.dataset.lng);
    });
  });

  /* ── PRODUCT CATEGORY TABS ── */
  const catObs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); catObs.unobserve(e.target); } });
  }, { threshold: 0.05 });

  document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.dataset.cat;
      document.querySelectorAll('.prod-cat-section').forEach(s => {
        s.classList.toggle('visible', s.id === 'cat-' + cat);
      });
      // Re-trigger reveal for newly shown cards
      document.querySelectorAll('#cat-' + cat + ' .rv').forEach(el => {
        el.classList.remove('on');
        setTimeout(() => catObs.observe(el), 30);
      });
    });
  });

  /* ── HERO PARALLAX ── */
  window.addEventListener('scroll', () => {
    const g = document.querySelector('.hgrid');
    if (g) g.style.transform = `translateY(${scrollY * .08}px)`;
  }, { passive: true });

  /* ── ACTIVE NAV LINKS ── */
  const secs = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nlinks a[href^="#"]');
  window.addEventListener('scroll', () => {
    let cur = '';
    secs.forEach(s => { if (scrollY >= s.offsetTop - 130) cur = s.id; });
    links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + cur));
  }, { passive: true });

  /* ── CONTACT FORM ── */
  window.handleForm = (e) => {
    e.preventDefault();
    const btn = document.getElementById('sbtn');
    const suc = document.getElementById('fsuccess');
    btn.disabled = true;
    btn.textContent = '...';
    setTimeout(() => {
      suc.style.display = 'block';
      btn.style.background = '#1a7a3c';
      btn.textContent = '✓';
    }, 900);
  };

  /* ── ANIMATED ROUTE MAP ── */
  initRouteMap();

  /* ── COUNTER ANIMATION ── */
  const counters = document.querySelectorAll('[data-count]');
  const cObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = parseFloat(el.dataset.count);
      const isFloat = String(target).includes('.');
      const dur = 1800;
      const step = target / (dur / 16);
      let cur = 0;
      const timer = setInterval(() => {
        cur += step;
        if (cur >= target) { cur = target; clearInterval(timer); }
        el.textContent = isFloat ? cur.toFixed(1) : Math.floor(cur).toLocaleString();
      }, 16);
      cObs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => cObs.observe(c));

});

/* ═══════════════════════════════════════════════════════════
   ROUTE MAP — SVG animated shipping routes
   ═══════════════════════════════════════════════════════════ */
function initRouteMap() {
  const svg = document.getElementById('routeMapSvg');
  if (!svg) return;

  /* Geographic coordinate → SVG coordinate converter
     Map covers roughly: lon -90 to 0, lat 35 to -15 (Caribbean + S.America) */
  const W = 900, H = 420;
  const lonMin = -90, lonMax = -55, latMax = 25, latMin = -25;

  function toXY(lon, lat) {
    const x = ((lon - lonMin) / (lonMax - lonMin)) * W;
    const y = ((latMax - lat) / (latMax - latMin)) * H;
    return { x: Math.round(x), y: Math.round(y) };
  }

  /* Key locations */
  const locs = {
    colon:    toXY(-79.9, 9.3),   // Panama - Colón / Cristóbal
    mariel:   toXY(-82.7, 22.9),  // Cuba - El Mariel
    cartagena:toXY(-75.5, 10.4),  // Colombia - Cartagena
    haiti:    toXY(-72.3, 18.5),  // Haiti - Port-au-Prince
    guyana:   toXY(-58.2, 6.8),   // Guyana - Georgetown
    santos:   toXY(-46.3, -23.9), // Brazil - Santos
    bogota:   toXY(-74.1, 4.7),   // Reference
  };

  /* Draw dotted world-map background dots (Caribbean + S. America region) */
  const dotsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  dotsGroup.setAttribute('opacity', '0.18');
  for (let lon = lonMin; lon <= lonMax; lon += 1.5) {
    for (let lat = latMin; lat <= latMax; lat += 1.2) {
      const { x, y } = toXY(lon, lat);
      if (isLand(lon, lat)) {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', '1.5');
        c.setAttribute('fill', '#2E86C1');
        dotsGroup.appendChild(c);
      }
    }
  }
  svg.appendChild(dotsGroup);

  /* Route A: Colón → El Mariel → Cartagena (gold) */
  const routeA = buildCurvePath([locs.colon, locs.mariel, locs.cartagena], 30);
  const pathA = makePath(routeA, 'route-path route-a');
  svg.appendChild(pathA);

  /* Route B: Colón → Haití → Cartagena (sky) */
  const routeB = buildCurvePath([locs.colon, locs.haiti, locs.cartagena], -25);
  const pathB = makePath(routeB, 'route-path route-b');
  svg.appendChild(pathB);

  /* Animated ship on route A */
  const shipA = makeShipDot(locs.colon.x, locs.colon.y, 'ship-dot');
  svg.appendChild(shipA);
  animateAlongPath(shipA, pathA, 8000, 0);

  /* Animated ship on route B */
  const shipB = makeShipDot(locs.colon.x, locs.colon.y, 'ship-dot2');
  svg.appendChild(shipB);
  animateAlongPath(shipB, pathB, 10000, 2000);

  /* Port markers + labels */
  const ports = [
    { loc: locs.colon,     label: 'Colón / Cristóbal',  color: '#C9A84C', sub: 'PANAMÁ' },
    { loc: locs.mariel,    label: 'El Mariel',           color: '#C9A84C', sub: 'CUBA' },
    { loc: locs.haiti,     label: 'Port-au-Prince',      color: '#2E86C1', sub: 'HAÏTI' },
    { loc: locs.cartagena, label: 'Cartagena',           color: '#8FA3BC', sub: 'COLOMBIA' },
    { loc: locs.guyana,    label: 'Georgetown',          color: '#8FA3BC', sub: 'GUYANA' },
    { loc: locs.santos,    label: 'Santos',              color: '#8FA3BC', sub: 'BRASIL' },
  ];
  ports.forEach(p => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    // Outer ring
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ring.setAttribute('cx', p.loc.x); ring.setAttribute('cy', p.loc.y); ring.setAttribute('r', '7');
    ring.setAttribute('fill', 'none'); ring.setAttribute('stroke', p.color); ring.setAttribute('stroke-width', '1'); ring.setAttribute('opacity', '.5');
    // Inner dot
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', p.loc.x); dot.setAttribute('cy', p.loc.y); dot.setAttribute('r', '3.5');
    dot.setAttribute('fill', p.color);
    // Label
    const lbl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    lbl.setAttribute('x', p.loc.x + 11); lbl.setAttribute('y', p.loc.y - 3);
    lbl.setAttribute('fill', '#EFF4F9'); lbl.setAttribute('font-size', '9');
    lbl.setAttribute('font-family', 'Barlow Condensed, sans-serif');
    lbl.setAttribute('letter-spacing', '1'); lbl.textContent = p.label;
    const sub = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sub.setAttribute('x', p.loc.x + 11); sub.setAttribute('y', p.loc.y + 8);
    sub.setAttribute('fill', p.color); sub.setAttribute('font-size', '7');
    sub.setAttribute('font-family', 'Barlow Condensed, sans-serif');
    sub.setAttribute('letter-spacing', '1.5'); sub.textContent = p.sub;
    g.appendChild(ring); g.appendChild(dot); g.appendChild(lbl); g.appendChild(sub);
    svg.appendChild(g);
  });
}

/* Rough land check for dot-map (Caribbean + S. America bounding boxes) */
function isLand(lon, lat) {
  // Panama
  if (lon>=-80&&lon<=-77&&lat>=7&&lat<=10) return true;
  // Colombia
  if (lon>=-78&&lon<=-66&&lat>=-4&&lat<=13) return true;
  // Cuba
  if (lon>=-85&&lon<=-74&&lat>=19&&lat<=23) return true;
  // Hispaniola (Haiti/DR)
  if (lon>=-74&&lon<=-68&&lat>=17&&lat<=20) return true;
  // Venezuela
  if (lon>=-73&&lon<=-60&&lat>=0&&lat<=13) return true;
  // Brazil (partial)
  if (lon>=-60&&lon<=-35&&lat>=-30&&lat<=5) return true;
  // Guyana + Suriname
  if (lon>=-62&&lon<=-52&&lat>=1&&lat<=9) return true;
  // Central America
  if (lon>=-90&&lon<=-77&&lat>=7&&lat<=18) return true;
  // Jamaica
  if (lon>=-78&&lon<=-76&&lat>=17&&lat<=19) return true;
  // Puerto Rico
  if (lon>=-67.3&&lon<=-65.6&&lat>=17.9&&lat<=18.6) return true;
  // Trinidad
  if (lon>=-62&&lon<=-60&&lat>=10&&lat<=12) return true;
  return false;
}

function buildCurvePath(points, curveOffset) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i], p2 = points[i + 1];
    const mx = (p1.x + p2.x) / 2;
    const my = (p1.y + p2.y) / 2 + curveOffset;
    d += ` Q ${mx} ${my} ${p2.x} ${p2.y}`;
  }
  return d;
}

function makePath(d, cls) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  path.setAttribute('class', cls);
  path.setAttribute('opacity', '0.7');
  return path;
}

function makeShipDot(x, y, cls) {
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  c.setAttribute('cx', x); c.setAttribute('cy', y); c.setAttribute('r', '5');
  c.setAttribute('class', cls);
  const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  pulse.setAttribute('cx', x); pulse.setAttribute('cy', y); pulse.setAttribute('r', '10');
  pulse.setAttribute('fill', 'none');
  pulse.setAttribute('stroke', cls === 'ship-dot' ? '#C9A84C' : '#2E86C1');
  pulse.setAttribute('stroke-width', '1'); pulse.setAttribute('opacity', '0');
  g._mainCircle = c; g._pulse = pulse;
  g.appendChild(pulse); g.appendChild(c);
  return g;
}

function animateAlongPath(shipGroup, pathEl, duration, delay) {
  const c = shipGroup._mainCircle;
  const pulse = shipGroup._pulse;
  const totalLength = pathEl.getTotalLength ? pathEl.getTotalLength() : 800;
  let start = null;

  function step(ts) {
    if (!start) start = ts + delay;
    if (ts < start) { requestAnimationFrame(step); return; }
    const elapsed = (ts - start) % duration;
    const progress = elapsed / duration;
    const pt = pathEl.getPointAtLength(progress * totalLength);
    const x = pt.x.toFixed(2), y = pt.y.toFixed(2);
    c.setAttribute('cx', x); c.setAttribute('cy', y);
    pulse.setAttribute('cx', x); pulse.setAttribute('cy', y);
    // Pulse every few seconds
    const pulsePhase = (elapsed % 3000) / 3000;
    pulse.setAttribute('r', (10 + pulsePhase * 10).toFixed(1));
    pulse.setAttribute('opacity', (0.6 * (1 - pulsePhase)).toFixed(2));
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
