// Show a labeled placeholder box when an image file hasn't been added yet
document.querySelectorAll('figure img').forEach(function (img) {
  function mark() { img.closest('figure').classList.add('missing'); }
  if (img.complete && img.naturalWidth === 0) mark();
  img.addEventListener('error', mark);
});

// Reveal sections as they scroll into view
const revealTargets = document.querySelectorAll(
  '.project h2, .project .tagline, .project .wrap > figure, .project .measure, .project .grid-2, .project pre'
);
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  revealTargets.forEach(el => el.classList.add('reveal'));
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealTargets.forEach(el => observer.observe(el));
}

// Click an image to view it full-screen
const lightbox = document.createElement('div');
lightbox.className = 'lightbox';
lightbox.innerHTML = '<img alt="">';
document.body.appendChild(lightbox);
const lightboxImg = lightbox.querySelector('img');

document.querySelectorAll('figure img').forEach(img => {
  img.addEventListener('click', () => {
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.classList.add('open');
  });
});
lightbox.addEventListener('click', () => lightbox.classList.remove('open'));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') lightbox.classList.remove('open');
});
  
// ===== Loading screen =====
(function () {
  const loader = document.getElementById('loader');
  if (!loader) return;
  loader.classList.add('js-ready'); // the script is running, so turn off the CSS safety net

  const finish = () => { loader.classList.add('done'); document.body.classList.remove('loading'); };

  // Show the intro once per visit, and skip it for people who prefer reduced motion
  let seen = false;
  try { seen = sessionStorage.getItem('introSeen') === '1'; sessionStorage.setItem('introSeen', '1'); } catch (e) {}
  if (seen || matchMedia('(prefers-reduced-motion: reduce)').matches) {
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