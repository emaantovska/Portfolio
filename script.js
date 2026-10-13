const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== Placeholder boxes for images you haven't added yet =====
function markMissing(root) {
  root.querySelectorAll('figure img').forEach(img => {
    const mark = () => img.closest('figure').classList.add('missing');
    if (img.complete && img.naturalWidth === 0) mark();
    img.addEventListener('error', mark);
  });
}

// ===== Click an image to view it full-screen =====
const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox ? lightbox.querySelector('img') : null;
function enableLightbox(root) {
  if (!lightbox || typeof lightbox.showModal !== 'function') return;
  root.querySelectorAll('figure img').forEach(img => {
    img.addEventListener('click', () => {
      if (img.closest('figure').classList.contains('missing')) return;
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightbox.showModal();
    });
  });
}
if (lightbox) lightbox.addEventListener('click', () => lightbox.close());

markMissing(document);
enableLightbox(document);

// ===== Loading screen =====
(function () {
  const loader = document.getElementById('loader');
  const introDone = () => {
    window.introDone = true;
    document.dispatchEvent(new Event('intro:done'));
  };
  if (!loader) { introDone(); return; }
  loader.classList.add('js-ready'); // the script is running, so turn off the CSS safety net

  const finish = () => {
    loader.classList.add('done');
    document.body.classList.remove('loading');
    introDone();
  };

  // Show the intro once per visit, and skip it for people who prefer reduced motion
  let seen = false;
  try { seen = sessionStorage.getItem('introSeen') === '1'; sessionStorage.setItem('introSeen', '1'); } catch (e) {}
  if (seen || prefersReducedMotion) {
    loader.style.transition = 'none';
    finish();
    return;
  }

  document.body.classList.add('loading');

  const line1 = document.getElementById('line1');
  const line2 = document.getElementById('line2');
  const fill = document.getElementById('loaderFill');
  const pct = document.getElementById('loaderPct');
  const progress = document.getElementById('loaderProgress');
  const btn = document.getElementById('loaderBtn');
  const duration = 3200; // how long the bar takes to fill, in milliseconds
  let start = null, swapped = false;

  setTimeout(() => line1.classList.add('show'), 200);

  function step(now) {
    if (!start) start = now;
    const t = Math.min((now - start) / duration, 1);
    const eased = t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // smooth start and finish
    const value = Math.round(eased * 100);
    fill.style.width = value + '%';
    pct.textContent = value + '%';

    if (!swapped && value >= 80) { // swap the text near the end
      swapped = true;
      line1.classList.replace('show', 'hide');
      setTimeout(() => line2.classList.add('show'), 350);
    }
    if (t < 1) requestAnimationFrame(step);
    else setTimeout(showButton, 400);
  }

  // When the bar is full, turn it into the Welcome button
  function showButton() {
    progress.classList.add('hide');
    setTimeout(() => {
      btn.classList.add('show');
      btn.focus({ preventScroll: true }); // so pressing Enter also works
    }, 250);
  }

  btn.addEventListener('click', finish);
  requestAnimationFrame(step);
})();

// ===== Mind map: lines that follow the bouncing orb, and branches that sprout =====
(function () {
  const hub = document.getElementById('hub');
  if (!hub) return;
  const svg = document.getElementById('hubLines');
  const orb = document.getElementById('orb');
  const NS = 'http://www.w3.org/2000/svg';
  const isPhone = () => matchMedia('(max-width: 700px)').matches;
  const noHover = matchMedia('(hover: none)').matches;

  // Your photo: if it isn't there yet, show the plain glowing sphere instead
  const photo = orb.querySelector('.orb-photo');
  const noPhoto = () => { orb.classList.add('no-photo'); if (photo) photo.remove(); };
  if (photo) {
    if (photo.complete && photo.naturalWidth === 0) noPhoto();
    photo.addEventListener('error', noPhoto);
  }

  // Sprout pictures: if one is missing, the letters underneath show instead
  hub.querySelectorAll('.sprout-bubble img').forEach(img => {
    if (img.complete && img.naturalWidth === 0) img.remove();
    img.addEventListener('error', () => img.remove());
  });

  const makePath = (cls, length) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('class', cls);
    p.setAttribute('pathLength', length);
    return p;
  };

  const branches = [...hub.querySelectorAll('.branch')].map((el, i) => {
    const node = el.querySelector('.node');
    const line = makePath('hub-line', '1');
    line.style.transitionDelay = (i * 0.2) + 's';
    const flow = makePath('hub-flow', '100');
    const sprouts = [...el.querySelectorAll('.sprout')].map((sprout, j) => {
      sprout.style.setProperty('--i', j);
      const sline = makePath('sprout-line', '1');
      sline.style.transitionDelay = (j * 0.06) + 's';
      return { el: sprout, bubble: sprout.querySelector('.sprout-bubble'), line: sline };
    });
    svg.append(line, flow, ...sprouts.map(s => s.line));
    return { el, node, line, flow, sprouts };
  });

  const centre = (el, box) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
  };
  const curve = (x1, y1, x2, y2) => {
    if (Math.abs(x2 - x1) >= Math.abs(y2 - y1)) {
      const mx = (x1 + x2) / 2;
      return `M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
    }
    const my = (y1 + y2) / 2;
    return `M${x1} ${y1} C${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
  };

  // Place a branch's bubbles in a ring all around it (on phones, in an arc underneath)
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  function layout(b) {
    const box = hub.getBoundingClientRect();
    const r = b.node.getBoundingClientRect();
    const nx = r.left + r.width / 2 - box.left;
    const ny = r.top + r.height / 2 - box.top;
    const n = b.sprouts.length;
    const phone = isPhone();
    const edge = phone ? 36 : 44;
    const minX = -box.left + edge, maxX = innerWidth - box.left - edge; // keep bubbles on screen
    const minY = edge, maxY = box.height + 30;

    if (phone) {
      const spacing = 80, width = spacing * (n - 1);
      const startX = clamp(nx - width / 2, minX, maxX - width);
      b.sprouts.forEach((s, i) => {
        const t = n > 1 ? (i / (n - 1)) * 2 - 1 : 0;
        s.el.style.left = (startX + i * spacing) + 'px';
        s.el.style.top = (ny + r.height / 2 + 50 + 22 * (1 - t * t)) + 'px';
        s.el.dataset.side = 'bottom';
      });
      return;
    }

    const [ox, oy] = centre(orb, box);
    const towardOrb = Math.atan2(oy - ny, ox - nx);
    const gap = 110 * Math.PI / 180;           // leave room for the orb and the line coming from it
    const step = (2 * Math.PI - gap) / n;
    const rx = r.width / 2 + 84, ry = r.height / 2 + 74;
    // Spots around the ring, used clockwise starting from the top
    const TAU = 2 * Math.PI, fromTop = a => ((a + Math.PI / 2) % TAU + TAU) % TAU;
    const spots = b.sprouts.map((_, i) => towardOrb + gap / 2 + (i + 0.5) * step)
      .sort((p, q) => fromTop(p) - fromTop(q));
    b.sprouts.forEach((s, i) => {
      const angle = spots[i];
      const cx = Math.cos(angle), cy = Math.sin(angle);
      const x = clamp(nx + rx * cx, minX, maxX);
      const y = clamp(ny + ry * cy, minY, maxY);
      // Put each label on the outside of its bubble, so nothing overlaps the branch
      let side = Math.abs(cx) > Math.abs(cy) * 1.2 ? (cx > 0 ? 'right' : 'left') : (cy > 0 ? 'bottom' : 'top');
      if (side === 'right' && x + 150 > maxX + edge) side = cy > 0 ? 'bottom' : 'top';
      if (side === 'left' && x - 150 < minX - edge) side = cy > 0 ? 'bottom' : 'top';
      s.el.style.left = x + 'px';
      s.el.style.top = y + 'px';
      s.el.dataset.side = side;
    });
  }

  function update() {
    const box = hub.getBoundingClientRect();
    const [x1, y1] = centre(orb, box);
    branches.forEach(b => {
      const [x2, y2] = centre(b.node, box);
      const d = curve(x1, y1, x2, y2);
      b.line.setAttribute('d', d);
      b.flow.setAttribute('d', d);
      b.sprouts.forEach(s => {
        const [sx, sy] = centre(s.bubble, box);
        s.line.setAttribute('d', `M${x2} ${y2} L${sx} ${sy}`);
      });
    });
  }

  // Open and close branches
  let openBranch = null, closeTimer = null;
  function open(b) {
    clearTimeout(closeTimer);
    if (openBranch === b) return;
    if (openBranch) close(openBranch);
    layout(b);
    b.el.classList.add('is-open');
    b.node.setAttribute('aria-expanded', 'true');
    b.line.classList.add('active');
    b.sprouts.forEach(s => s.line.classList.add('on'));
    hub.classList.add('has-open');
    openBranch = b;
    b.openedAt = performance.now();
  }
  function close(b) {
    b.el.classList.remove('is-open');
    b.node.setAttribute('aria-expanded', 'false');
    b.line.classList.remove('active');
    b.sprouts.forEach(s => s.line.classList.remove('on'));
    if (openBranch === b) { openBranch = null; hub.classList.remove('has-open'); }
  }
  const closeSoon = b => { clearTimeout(closeTimer); closeTimer = setTimeout(() => close(b), 350); };

  branches.forEach(b => {
    // Mouse: open while hovering the branch or its bubbles
    b.el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') open(b); });
    b.el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') closeSoon(b); });
    // Keyboard: open while focus is inside the branch
    b.el.addEventListener('focusin', () => open(b));
    b.el.addEventListener('focusout', e => { if (!b.el.contains(e.relatedTarget)) closeSoon(b); });
    // Touch screens: first tap opens the bubbles, second tap goes to the section
    b.node.addEventListener('click', e => {
      const justOpened = performance.now() - (b.openedAt || 0) < 500; // the tap itself just opened it
      if (noHover && (openBranch !== b || justOpened)) { e.preventDefault(); open(b); }
    });
    // Project bubbles open that project's window
    b.sprouts.forEach(s => {
      const id = s.el.dataset.project;
      if (!id) return;
      s.el.addEventListener('click', e => {
        if (typeof window.openProject === 'function') {
          e.preventDefault();
          window.openProject(id, s.bubble);
        }
      });
    });
  });
  document.addEventListener('click', e => { if (openBranch && !openBranch.el.contains(e.target)) close(openBranch); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && openBranch) close(openBranch); });
  addEventListener('resize', () => { if (openBranch) layout(openBranch); });

  // Redraw every frame while the map is on screen, so the lines stay attached
  let running = false;
  const loop = () => { update(); if (running) requestAnimationFrame(loop); };
  const startLoop = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { if (entry.isIntersecting) startLoop(); else running = false; }).observe(hub);
  } else {
    startLoop();
  }
  update();

  // Draw the lines once the intro is finished
  const draw = () => requestAnimationFrame(() => hub.classList.add('drawn'));
  if (window.introDone) draw();
  else document.addEventListener('intro:done', draw, { once: true });
})();

// ===== Project tiles: open into an expanded view =====
(function () {
  const modal = document.getElementById('projectModal');
  const body = document.getElementById('modalBody');
  if (!modal || !body || typeof modal.showModal !== 'function') return;
  let lastButton = null;

  function open(tile, button, origin) {
    const template = tile.querySelector('template.tile-detail');
    if (!template) return;
    body.replaceChildren(template.content.cloneNode(true));
    const title = body.querySelector('h2');
    if (title) title.id = 'modalTitle';
    markMissing(body);
    enableLightbox(body);

    modal.classList.remove('closing');
    modal.showModal();
    modal.scrollTop = 0;

    // Grow the window out of the tile that was clicked
    const t = (origin || tile).getBoundingClientRect();
    const m = modal.getBoundingClientRect();
    modal.style.transformOrigin = `${t.left + t.width / 2 - m.left}px ${t.top + t.height / 2 - m.top}px`;
    lastButton = button;
  }

  function close() {
    if (!modal.open || modal.classList.contains('closing')) return;
    if (prefersReducedMotion) { modal.close(); return; }
    modal.classList.add('closing');
    const done = e => {
      if (e.target !== modal) return;
      modal.removeEventListener('animationend', done);
      modal.classList.remove('closing');
      modal.close();
    };
    modal.addEventListener('animationend', done);
  }

  // Lets the mind-map bubbles open a project directly
  window.openProject = (id, origin) => {
    const tile = document.getElementById('project-' + id);
    if (tile) open(tile, (origin && origin.closest('a')) || origin, origin);
  };

  document.querySelectorAll('.tile').forEach(tile => {
    const button = tile.querySelector('.tile-btn');
    if (button) button.addEventListener('click', () => open(tile, button));
  });
  modal.querySelector('.modal-close').addEventListener('click', close);
  modal.addEventListener('cancel', e => { e.preventDefault(); close(); }); // Escape key
  modal.addEventListener('click', e => { if (e.target === modal) close(); }); // click outside the window
  modal.addEventListener('close', () => { if (lastButton) lastButton.focus({ preventScroll: true }); });
})();

// ===== Reveal sections as they scroll into view =====
(function () {
  const targets = document.querySelectorAll(
    '.section .eyebrow, .section h2, .section .tagline, .section-intro, .about-text, .about-facts, ' +
    '.tile, #zombies dl.meta, #zombies .wrap > figure, #zombies .measure'
  );
  if (!('IntersectionObserver' in window) || prefersReducedMotion) return;
  document.querySelectorAll('.tile').forEach((tile, i) => tile.style.setProperty('--delay', (i % 2) * 0.12 + 's'));
  targets.forEach(el => el.classList.add('reveal'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  targets.forEach(el => observer.observe(el));
})();
