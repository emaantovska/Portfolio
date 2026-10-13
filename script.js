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

// ===== Mind map: lines that follow the bouncing orb =====
(function () {
  const hub = document.getElementById('hub');
  if (!hub) return;
  const svg = document.getElementById('hubLines');
  const orb = hub.querySelector('.orb');
  const NS = 'http://www.w3.org/2000/svg';

  const links = [...hub.querySelectorAll('.node')].map((node, i) => {
    const line = document.createElementNS(NS, 'path');
    line.setAttribute('class', 'hub-line');
    line.setAttribute('pathLength', '1');
    line.style.transitionDelay = (i * 0.2) + 's';
    const flow = document.createElementNS(NS, 'path');
    flow.setAttribute('class', 'hub-flow');
    flow.setAttribute('pathLength', '100');
    svg.append(line, flow);

    // Light up a line while its branch is hovered or focused
    ['mouseenter', 'focus'].forEach(ev => node.addEventListener(ev, () => line.classList.add('active')));
    ['mouseleave', 'blur'].forEach(ev => node.addEventListener(ev, () => line.classList.remove('active')));
    return { node, line, flow };
  });

  const centre = (el, box) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top];
  };

  function update() {
    const box = hub.getBoundingClientRect();
    const [x1, y1] = centre(orb, box);
    links.forEach(({ node, line, flow }) => {
      const [x2, y2] = centre(node, box);
      let d;
      if (Math.abs(x2 - x1) >= Math.abs(y2 - y1)) {
        const mx = (x1 + x2) / 2; // sideways S-curve
        d = `M${x1} ${y1} C${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
      } else {
        const my = (y1 + y2) / 2; // up-and-down S-curve (phones)
        d = `M${x1} ${y1} C${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`;
      }
      line.setAttribute('d', d);
      flow.setAttribute('d', d);
    });
  }

  // Redraw every frame while the map is on screen, so the lines stay attached to the orb
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

  function open(tile, button) {
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
    const t = tile.getBoundingClientRect();
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
