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
  