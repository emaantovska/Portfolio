// Show a labeled placeholder box when an image file hasn't been added yet
  document.querySelectorAll('figure img').forEach(function (img) {
    function mark() { img.closest('figure').classList.add('missing'); }
    if (img.complete && img.naturalWidth === 0) mark();
    img.addEventListener('error', mark);
  });