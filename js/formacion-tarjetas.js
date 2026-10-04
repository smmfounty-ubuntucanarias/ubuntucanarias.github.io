/* Formación gratuita: convierte cada ficha (.fg-curso) en una tarjeta con «Saber más».
   Datos cortos de cada tarjeta: atributos data-* del <article>.
   data-cat (salud|idiomas|empleo|profesional|convivencia), data-chips ("a|b|c"),
   data-cuando, data-lugar, data-org, data-gratis ("1") */
(function () {
  var sec = document.getElementById('formacion-gratuita');
  if (!sec || !window.HTMLDialogElement) return;
  var cursos = [].slice.call(sec.querySelectorAll('article.fg-curso'));
  if (!cursos.length) return;
  var lang = (document.documentElement.lang || 'es').slice(0, 2);
  var T = {
    es: { todas: 'Todas', mas: 'Saber más', buscar: 'Buscar: español, empleo, informática…', gratis: 'Gratis', cerrar: 'Cerrar', vacio: 'No hay formaciones con ese filtro.', cats: { salud: 'Salud y bienestar', idiomas: 'Idiomas', empleo: 'Empleo', profesional: 'Formación profesional', convivencia: 'Convivencia' } },
    en: { todas: 'All', mas: 'Learn more', buscar: 'Search: Spanish, jobs, computers…', gratis: 'Free', cerrar: 'Close', vacio: 'No courses match this filter.', cats: { salud: 'Health and wellbeing', idiomas: 'Languages', empleo: 'Employment', profesional: 'Vocational training', convivencia: 'Living together' } },
    fr: { todas: 'Tous', mas: 'En savoir plus', buscar: 'Rechercher : espagnol, emploi, informatique…', gratis: 'Gratuit', cerrar: 'Fermer', vacio: 'Aucune formation pour ce filtre.', cats: { salud: 'Santé et bien-être', idiomas: 'Langues', empleo: 'Emploi', profesional: 'Formation professionnelle', convivencia: 'Vivre ensemble' } },
    ar: { todas: 'الكل', mas: 'اعرف المزيد', buscar: 'ابحث: الإسبانية، العمل، الحاسوب…', gratis: 'مجاني', cerrar: 'إغلاق', vacio: 'لا توجد دورات بهذا الاختيار.', cats: { salud: 'الصحة والرفاه', idiomas: 'اللغات', empleo: 'التشغيل', profesional: 'التكوين المهني', convivencia: 'العيش المشترك' } },
    pt: { todas: 'Todos', mas: 'Saber mais', buscar: 'Pesquisar: espanhol, emprego, informática…', gratis: 'Grátis', cerrar: 'Fechar', vacio: 'Não há formações com este filtro.', cats: { salud: 'Saúde e bem-estar', idiomas: 'Línguas', empleo: 'Emprego', profesional: 'Formação profissional', convivencia: 'Convivência' } }
  }[lang] || null;
  if (!T) return;
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  var rejilla = el('div', 'fct-rejilla');
  var usadas = {};
  var dialogos = {};
  cursos.forEach(function (art) {
    var id = art.id, cat = art.getAttribute('data-cat') || '';
    usadas[cat] = true;
    var img = art.querySelector('.fg-curso__img img');
    var card = el('article', 'fct');
    card.setAttribute('data-cat', cat);
    var marco = el('button', 'fct__img'); marco.type = 'button'; marco.setAttribute('aria-label', T.mas);
    if (img) {
      var src = img.currentSrc || img.src;
      var f1 = el('img', 'fct__fondo'); f1.src = src; f1.alt = ''; f1.loading = 'lazy';
      var f2 = el('img', 'fct__foto'); f2.src = src; f2.alt = img.alt || ''; f2.loading = 'lazy';
      marco.appendChild(f1); marco.appendChild(f2);
    }
    card.appendChild(marco);
    if (cat && T.cats[cat]) card.appendChild(el('span', 'fct__cat fct__cat--' + cat, T.cats[cat]));
    var h = art.querySelector('h2');
    card.appendChild(el('h3', 'fct__titulo', h ? h.textContent : ''));
    var chips = (art.getAttribute('data-chips') || '').split('|').filter(Boolean);
    if (chips.length) { var c = el('div', 'fct__chips'); chips.forEach(function (x) { c.appendChild(el('span', 'fct__chip', x)); }); card.appendChild(c); }
    var meta = el('ul', 'fct__meta');
    if (art.getAttribute('data-cuando')) meta.appendChild(el('li', null, '📅 ' + art.getAttribute('data-cuando')));
    if (art.getAttribute('data-lugar')) meta.appendChild(el('li', null, '📍 ' + art.getAttribute('data-lugar')));
    card.appendChild(meta);
    var pie = el('div', 'fct__pie');
    pie.appendChild(el('span', 'fct__org', art.getAttribute('data-org') || ''));
    if (art.getAttribute('data-gratis') === '1') pie.appendChild(el('span', 'fct__precio', T.gratis));
    card.appendChild(pie);
    var btn = el('button', 'fct__boton', T.mas + (document.documentElement.dir === 'rtl' ? ' ←' : ' →')); btn.type = 'button';
    card.appendChild(btn);

    var dlg = el('dialog', 'fct-dialogo');
    var x = el('button', 'fct-dialogo__cerrar', '×'); x.type = 'button'; x.setAttribute('aria-label', T.cerrar);
    x.addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { if (location.hash === '#' + id) history.replaceState(null, '', location.pathname + location.search); });
    dlg.appendChild(x);
    art.parentNode.insertBefore(card, art);
    dlg.appendChild(art);
    document.body.appendChild(dlg);
    dialogos[id] = dlg;
    function abrir() { dlg.showModal(); dlg.scrollTop = 0; history.replaceState(null, '', '#' + id); }
    marco.addEventListener('click', abrir); btn.addEventListener('click', abrir);
    card.setAttribute('data-texto', (card.textContent + ' ' + art.textContent).toLowerCase());
    rejilla.appendChild(card);
  });
  sec.insertBefore(rejilla, sec.firstChild);

  // Filtros y buscador
  var barra = el('div', 'fct-filtros');
  var q = el('input', 'fct-filtros__buscar'); q.type = 'search'; q.placeholder = T.buscar; q.setAttribute('aria-label', T.buscar);
  barra.appendChild(q);
  var actual = '';
  var botones = [];
  [''].concat(Object.keys(T.cats).filter(function (k) { return usadas[k]; })).forEach(function (k) {
    var b = el('button', 'fct-filtros__btn', k ? T.cats[k] : T.todas); b.type = 'button';
    b.setAttribute('aria-pressed', k === '' ? 'true' : 'false');
    b.addEventListener('click', function () { actual = k; botones.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); }); filtra(); });
    botones.push(b); barra.appendChild(b);
  });
  var vacio = el('p', 'fct-vacio', T.vacio); vacio.hidden = true;
  sec.insertBefore(barra, rejilla);
  sec.insertBefore(vacio, rejilla.nextSibling);
  function filtra() {
    var t = q.value.trim().toLowerCase(), n = 0;
    [].forEach.call(rejilla.children, function (c) {
      var ok = (!actual || c.getAttribute('data-cat') === actual) && (!t || c.getAttribute('data-texto').indexOf(t) > -1);
      c.hidden = !ok; if (ok) n++;
    });
    vacio.hidden = n > 0;
  }
  q.addEventListener('input', filtra);

  // Enlaces compartidos (#id) abren la ficha
  function porHash() { var id = decodeURIComponent(location.hash.slice(1)); if (dialogos[id] && !dialogos[id].open) dialogos[id].showModal(); }
  porHash(); window.addEventListener('hashchange', porHash);
  document.documentElement.classList.add('fct-activo');
})();
