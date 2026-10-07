/* Carrusel de diapositivas deslizables — Ubuntu Canarias */
(function () {
  document.querySelectorAll('[data-carrusel]').forEach(function (c) {
    var pista = c.querySelector('.uc-carrusel__pista');
    var slides = Array.prototype.slice.call(pista.querySelectorAll('.uc-slide'));
    var prev = c.querySelector('[data-carrusel-prev]');
    var next = c.querySelector('[data-carrusel-next]');
    var puntos = c.querySelector('.uc-carrusel__puntos');
    var etq = puntos.getAttribute('data-etiqueta') || 'Diapositiva';
    var actual = 0;
    slides.forEach(function (s, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', etq + ' ' + (i + 1));
      b.addEventListener('click', function () { ir(i); });
      puntos.appendChild(b);
    });
    function ir(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      var s = slides[i];
      pista.scrollTo({ left: s.offsetLeft - pista.offsetLeft - (pista.clientWidth - s.clientWidth) / 2, behavior: 'smooth' });
    }
    function marcar(i) {
      actual = i;
      Array.prototype.forEach.call(puntos.children, function (b, j) { b.setAttribute('aria-current', j === i ? 'true' : 'false'); });
      prev.disabled = i === 0;
      next.disabled = i === slides.length - 1;
    }
    prev.addEventListener('click', function () { ir(actual - 1); });
    next.addEventListener('click', function () { ir(actual + 1); });
    pista.addEventListener('keydown', function (e) {
      var rtl = getComputedStyle(pista).direction === 'rtl';
      if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + (rtl ? -1 : 1)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual + (rtl ? 1 : -1)); }
    });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) { if (en.isIntersecting) marcar(slides.indexOf(en.target)); });
      }, { root: pista, threshold: 0.6 });
      slides.forEach(function (s) { io.observe(s); });
    }
    marcar(0);
  });
})();
