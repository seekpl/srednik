/* Średnik by .dot – ustawienia przed pierwszym malowaniem strony.
   Ładowany w <head> bez „defer”, żeby nie było mignięcia treści przed animacją. */
(function (d) {
  d.classList.remove('no-js'); d.classList.add('js');
  var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!rm) d.classList.add('anim');
  var seen = false; try { seen = sessionStorage.getItem('srednik-intro') === '1'; } catch (e) {}
  if (!rm && !seen) d.classList.add('has-intro');
  // Jeśli skrypty się nie wczytają, pokaż stronę bez animacji
  setTimeout(function () { if (!window.__sr) d.classList.remove('anim', 'has-intro'); }, 3500);
})(document.documentElement);
