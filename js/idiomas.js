(function () {
  const RTL = ["ar"];
  const CLAVE_STORAGE = "ubuntu-canarias-idioma";
  const cache = {};

  function obtenerValor(obj, ruta) {
    return ruta.split(".").reduce((acc, parte) => (acc ? acc[parte] : undefined), obj);
  }

  async function cargarIdioma(idioma) {
    if (cache[idioma]) return cache[idioma];
    try {
      const res = await fetch(`/js/i18n/${idioma}.json`);
      if (!res.ok) throw new Error("No se pudo cargar el idioma " + idioma);
      const datos = await res.json();
      cache[idioma] = datos;
      return datos;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  function aplicarTraducciones(datos) {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const clave = el.getAttribute("data-i18n");
      const valor = obtenerValor(datos, clave);
      if (typeof valor === "string") el.innerHTML = valor;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const clave = el.getAttribute("data-i18n-placeholder");
      const valor = obtenerValor(datos, clave);
      if (typeof valor === "string") el.setAttribute("placeholder", valor);
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const clave = el.getAttribute("data-i18n-title");
      const valor = obtenerValor(datos, clave);
      if (typeof valor === "string") {
        el.setAttribute("title", valor);
        el.setAttribute("aria-label", valor);
      }
    });
    if (datos.meta) {
      if (datos.meta.title) document.title = datos.meta.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && datos.meta.description) metaDesc.setAttribute("content", datos.meta.description);
    }
  }

  function actualizarAtributosHtml(idioma) {
    const esRtl = RTL.includes(idioma);
    document.documentElement.setAttribute("lang", idioma);
    document.documentElement.setAttribute("dir", esRtl ? "rtl" : "ltr");
  }

  function actualizarSelector(idioma) {
    const banderas = {
      es: "/img/banderas/es.svg",
      en: "/img/banderas/gb.svg",
      fr: "/img/banderas/fr.svg",
      ar: "/img/banderas/sa.svg",
    };
    const imgBandera = document.querySelector(".selector-idioma__boton .bandera-actual");
    if (imgBandera && banderas[idioma]) imgBandera.src = banderas[idioma];
    const texto = document.querySelector(".selector-idioma__boton .idioma-actual-texto");
    if (texto) texto.textContent = idioma.toUpperCase();
  }

  // Aplica siempre el idioma activo (incluido "es") para que el DOM
  // quede en el estado correcto tanto en la carga inicial como al
  // restaurar la página desde la caché de navegación (bfcache).
  async function aplicarIdiomaActivo(idioma) {
    actualizarAtributosHtml(idioma);
    actualizarSelector(idioma);
    const datos = await cargarIdioma(idioma);
    if (datos) aplicarTraducciones(datos);
    document.documentElement.classList.remove("i18n-pendiente");
  }

  // Cada página traducida y "horneada" (generada de forma estática)
  // lleva un atributo data-page en <html> con su nombre de archivo
  // (p. ej. "quienes-somos.html"). Si existe, cambiar de idioma
  // significa navegar a la URL real de esa página en el idioma
  // elegido (p. ej. /en/quienes-somos.html), en vez de traducir el
  // DOM en el navegador. Esto es lo que permite que Google indexe
  // cada idioma como una URL independiente.
  function calcularUrlDestino(idioma) {
    const pagina = document.documentElement.dataset.page;
    if (!pagina) return null;
    if (idioma === "es") return "/" + (pagina === "index.html" ? "" : pagina);
    return "/" + idioma + "/" + pagina;
  }

  async function cambiarIdioma(idioma) {
    localStorage.setItem(CLAVE_STORAGE, idioma);
    const destino = calcularUrlDestino(idioma);
    if (destino) {
      window.location.href = destino;
      return;
    }
    // Páginas que todavía no tienen versión "horneada" por idioma
    // (por ejemplo, avisos legales): se mantiene el cambio en el
    // propio navegador como hasta ahora.
    await aplicarIdiomaActivo(idioma);
  }

  function inicializar() {
    const pagina = document.documentElement.dataset.page;
    if (pagina) {
      // La página ya se ha servido en el idioma correcto desde el
      // servidor: solo hace falta sincronizar el selector visual.
      const idiomaActual = document.documentElement.getAttribute("lang") || "es";
      actualizarSelector(idiomaActual);
      localStorage.setItem(CLAVE_STORAGE, idiomaActual);
      return;
    }
    const idioma = localStorage.getItem(CLAVE_STORAGE) || "es";
    aplicarIdiomaActivo(idioma);
  }

  document.addEventListener("DOMContentLoaded", inicializar);

  // Cuando el navegador restaura la página desde su caché interna
  // (por ejemplo al pulsar "atrás"/"adelante"), "DOMContentLoaded" no
  // se vuelve a disparar y la página se queda "congelada" con el
  // idioma que tenía la última vez que se cargó de verdad. El evento
  // "pageshow" con "persisted=true" detecta justo ese caso y vuelve
  // a aplicar el idioma guardado en ese momento.
  window.addEventListener("pageshow", (evento) => {
    const restauradaDesdeCache =
      evento.persisted ||
      (window.performance &&
        window.performance.getEntriesByType &&
        window.performance.getEntriesByType("navigation")[0]?.type === "back_forward");
    if (restauradaDesdeCache) inicializar();
  });

  window.UbuntuIdiomas = { cambiarIdioma };
})();
