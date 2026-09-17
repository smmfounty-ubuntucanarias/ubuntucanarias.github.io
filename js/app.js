document.addEventListener("DOMContentLoaded", () => {
  // --- Menú móvil ---
  const botonMenu = document.querySelector(".boton-menu-movil");
  const navPrincipal = document.querySelector(".nav-principal");
  if (botonMenu && navPrincipal) {
    botonMenu.addEventListener("click", () => {
      const abierto = navPrincipal.getAttribute("data-abierto") === "true";
      navPrincipal.setAttribute("data-abierto", String(!abierto));
      document.body.setAttribute("data-menu-abierto", String(!abierto));
      botonMenu.setAttribute("aria-expanded", String(!abierto));
    });
    navPrincipal.querySelectorAll("a").forEach((enlace) => {
      enlace.addEventListener("click", () => {
        navPrincipal.setAttribute("data-abierto", "false");
        document.body.setAttribute("data-menu-abierto", "false");
        botonMenu.setAttribute("aria-expanded", "false");
      });
    });
  }

  // --- Selector de idioma ---
  const selectoresIdioma = document.querySelectorAll(".selector-idioma");
  selectoresIdioma.forEach((selector) => {
    const boton = selector.querySelector(".selector-idioma__boton");
    const lista = selector.querySelector(".selector-idioma__lista");
    if (!boton || !lista) return;
    boton.addEventListener("click", (evento) => {
      evento.stopPropagation();
      const abierto = selector.getAttribute("data-abierto") === "true";
      selector.setAttribute("data-abierto", String(!abierto));
      boton.setAttribute("aria-expanded", String(!abierto));
    });
    lista.querySelectorAll("button[data-idioma]").forEach((opcion) => {
      opcion.addEventListener("click", () => {
        const idioma = opcion.getAttribute("data-idioma");
        window.UbuntuIdiomas && window.UbuntuIdiomas.cambiarIdioma(idioma);
        selector.setAttribute("data-abierto", "false");
      });
    });
  });
  document.addEventListener("click", () => {
    selectoresIdioma.forEach((selector) => selector.setAttribute("data-abierto", "false"));
  });
  document.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") {
      selectoresIdioma.forEach((selector) => selector.setAttribute("data-abierto", "false"));
      if (navPrincipal) {
        navPrincipal.setAttribute("data-abierto", "false");
        document.body.setAttribute("data-menu-abierto", "false");
      }
    }
  });

  // --- Filtros de la rejilla de artículos ---
  const rejillaArticulos = document.getElementById("rejilla-articulos");
  if (rejillaArticulos) {
    const botonesFiltro = document.querySelectorAll("[data-filtro]");
    const tarjetas = document.querySelectorAll("[data-categoria]");
    const mensajeVacio = document.querySelector("[data-mensaje-vacio]");
    botonesFiltro.forEach((boton) => {
      boton.addEventListener("click", () => {
        const filtro = boton.getAttribute("data-filtro");
        let visibles = 0;
        botonesFiltro.forEach((b) => {
          b.setAttribute("aria-pressed", String(b.getAttribute("data-filtro") === filtro));
        });
        tarjetas.forEach((tarjeta) => {
          const mostrar = filtro === "todo" || tarjeta.getAttribute("data-categoria") === filtro;
          tarjeta.hidden = !mostrar;
          if (mostrar) visibles += 1;
        });
        if (mensajeVacio) mensajeVacio.hidden = visibles > 0;
        rejillaArticulos.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  // --- Botones de compartir (LinkedIn / Instagram / WhatsApp) ---

  // Textos de las notas de "copiado" (con fallback en español si no
  // se puede cargar el idioma activo o si falta la clave).
  const NOTAS_POR_DEFECTO = {
    notaLinkedin:
      "Hemos copiado el titular y el resumen: pégalos en el cuadro de texto de tu publicación de LinkedIn si quieres incluirlos antes de compartir.",
    notaInstagram:
      "Hemos copiado el titular, el resumen y el enlace, y hemos abierto Instagram: pégalos en tu historia o publicación.",
  };

  async function obtenerNotasCompartir() {
    const idioma = (document.documentElement.getAttribute("lang") || localStorage.getItem("ubuntu-canarias-idioma") || "es");
    if (idioma === "es") return NOTAS_POR_DEFECTO;
    try {
      const res = await fetch(`/js/i18n/${idioma}.json`);
      if (!res.ok) throw new Error("No se pudo cargar el idioma");
      const datos = await res.json();
      return { ...NOTAS_POR_DEFECTO, ...(datos.compartirMini || {}) };
    } catch {
      return NOTAS_POR_DEFECTO;
    }
  }

  // Copia texto al portapapeles con un método de respaldo (execCommand)
  // para navegadores donde la API moderna no esté disponible.
  async function copiarAlPortapapeles(texto) {
    try {
      await navigator.clipboard.writeText(texto);
      return true;
    } catch {
      try {
        const area = document.createElement("textarea");
        area.value = texto;
        area.style.position = "fixed";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        document.body.removeChild(area);
        return true;
      } catch {
        return false;
      }
    }
  }

  async function mostrarNota(contenedor, texto) {
    const nota = contenedor.querySelector("[data-nota-instagram]");
    if (!nota) return;
    nota.textContent = texto;
    nota.hidden = false;
    clearTimeout(nota._temporizador);
    nota._temporizador = setTimeout(() => {
      nota.hidden = true;
    }, 9000);
  }

  // Convierte una ruta (relativa o absoluta) en la URL real, usando
  // SIEMPRE el dominio en el que la página se está sirviendo en este
  // momento (window.location) y no un dominio distinto grabado a mano
  // en el HTML. Así, el enlace que se comparte lleva exactamente al
  // sitio donde está alojada la web, sea cual sea ese dominio.
  function urlAbsolutaDesde(rutaOEnlace) {
    try {
      return new URL(rutaOEnlace, window.location.href).href;
    } catch {
      return window.location.href;
    }
  }

  // A diferencia de la versión anterior, "configurarCompartir" ya no
  // recibe la url/título/resumen ya calculados una sola vez al cargar
  // la página (eso hacía que, si la persona cambiaba de idioma después,
  // WhatsApp/LinkedIn/Instagram se siguieran compartiendo en español).
  // Ahora recibe una función "obtenerDatos()" que se llama justo en el
  // momento de pulsar cada botón, para recoger siempre el título y el
  // resumen tal y como se ven en pantalla en ese instante (en el idioma
  // que la persona tenga seleccionado entonces).
  function configurarCompartir(contenedor, obtenerDatos) {
    contenedor.querySelectorAll('[data-compartir="whatsapp"]').forEach((enlace) => {
      enlace.addEventListener("click", (evento) => {
        evento.preventDefault();
        const { url, titulo, resumen } = obtenerDatos();
        const textoWhatsapp = resumen ? `${titulo}\n${resumen}\n${url}` : `${titulo} ${url}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(textoWhatsapp)}`, "_blank", "noopener,noreferrer");
      });
    });

    contenedor.querySelectorAll('[data-compartir="facebook"]').forEach((enlace) => {
      enlace.addEventListener("click", (evento) => {
        evento.preventDefault();
        const { url } = obtenerDatos();
        const urlCompartirFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(urlCompartirFacebook, "_blank", "noopener,noreferrer,width=600,height=600");
      });
    });

    // LinkedIn no permite prellenar el cuadro de texto de la publicación
    // mediante parámetros de la URL (esa opción la retiró LinkedIn hace
    // tiempo): solo puede mostrar automáticamente una tarjeta de vista
    // previa con el título, la imagen y la descripción de la página
    // (que ya están bien definidos en cada artículo). Para que el titular
    // y el resumen SÍ puedan formar parte del propio texto que escribe
    // la persona, los copiamos al portapapeles antes de abrir LinkedIn.
    contenedor.querySelectorAll('[data-compartir="linkedin"]').forEach((enlace) => {
      enlace.addEventListener("click", (evento) => {
        evento.preventDefault();
        const { url, titulo, resumen } = obtenerDatos();
        const textoCompleto = [titulo, resumen, url].filter(Boolean).join("\n\n");
        const urlCompartirLinkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        window.open(urlCompartirLinkedin, "_blank", "noopener,noreferrer");
        copiarAlPortapapeles(textoCompleto).then((ok) => {
          if (ok) obtenerNotasCompartir().then((n) => mostrarNota(contenedor, n.notaLinkedin));
        });
      });
    });

    // Instagram no ofrece ninguna forma pública de compartir un enlace ni
    // un texto directamente en una publicación o historia desde la web (a
    // diferencia de LinkedIn o WhatsApp). Lo más parecido a "compartir
    // directamente" es: copiar el titular, el resumen y el enlace del
    // artículo, y abrir Instagram al instante para que la persona solo
    // tenga que pegarlos.
    contenedor.querySelectorAll('[data-compartir="instagram"]').forEach((boton) => {
      boton.addEventListener("click", async () => {
        const { url, titulo, resumen } = obtenerDatos();
        const textoCompleto = [titulo, resumen, url].filter(Boolean).join("\n\n");

        // Abrimos Instagram ya, dentro del propio gesto de clic (para que
        // los navegadores no bloqueen la ventana emergente).
        const ventanaInstagram = window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");

        const copiado = await copiarAlPortapapeles(textoCompleto);

        if (ventanaInstagram) {
          try {
            ventanaInstagram.focus();
          } catch {}
        }

        if (copiado) {
          const notas = await obtenerNotasCompartir();
          mostrarNota(contenedor, notas.notaInstagram);
        }
      });
    });
  }

  // Compartir de un recurso/publicación concreta dentro de una página con
  // varias (las tarjetas de noticias.html, blog.html y recursos.html).
  document.querySelectorAll("[data-compartir-recurso]").forEach((contenedor) => {
    const tarjeta = contenedor.closest("article") || contenedor.parentElement;

    // El enlace "Seguir leyendo / Leer artículo / Ver ficha" de la propia
    // tarjeta ya apunta exactamente al artículo correcto (con una ruta
    // relativa). Lo reutilizamos como fuente principal de la URL a
    // compartir en vez de la URL absoluta grabada a mano en el HTML, para
    // no arriesgarnos a que apunte a un dominio distinto de aquel en el
    // que la web esté realmente alojada.
    const enlaceTarjeta = tarjeta ? tarjeta.querySelector(".tarjeta-articulo__pie .tarjeta-articulo__enlace[href]") : null;
    const rutaRespaldo = contenedor.getAttribute("data-compartir-recurso-url");

    // El título y el resumen los leemos del propio titular (h2) y del
    // párrafo (p) de la tarjeta, que sí se traducen con el selector de
    // idioma (llevan "data-i18n"). Los atributos data-compartir-recurso-*
    // quedan solo como respaldo por si la tarjeta no tuviera esa estructura.
    const elementoTitulo = tarjeta ? tarjeta.querySelector(":scope > h2, :scope > h3") : null;
    const elementoResumen = tarjeta ? tarjeta.querySelector(":scope > p") : null;

    configurarCompartir(contenedor, () => ({
      url: urlAbsolutaDesde(
        (enlaceTarjeta && enlaceTarjeta.getAttribute("href")) || rutaRespaldo || window.location.href
      ),
      titulo:
        (elementoTitulo && elementoTitulo.textContent.trim()) ||
        contenedor.getAttribute("data-compartir-recurso-titulo") ||
        document.title,
      resumen:
        (elementoResumen && elementoResumen.textContent.trim()) ||
        contenedor.getAttribute("data-compartir-recurso-resumen") ||
        "",
    }));
  });

  // Compartir de una página propia (artículo individual)
  document.querySelectorAll("[data-compartir-pagina]").forEach((contenedor) => {
    configurarCompartir(contenedor, () => ({
      // Dominio y ruta ACTUALES (donde la página se está sirviendo de
      // verdad en ese momento), en vez de la URL canónica grabada a mano,
      // para que el enlace compartido lleve siempre exactamente a la
      // página que la persona tiene delante.
      url: window.location.origin + window.location.pathname,
      titulo: document.querySelector("h1")?.textContent.trim() || document.title,
      resumen: document.querySelector('meta[name="description"]')?.getAttribute("content") || "",
    }));
  });

  // --- Vídeo institucional (miniatura clicable / facade de YouTube) ---
  // No cargamos el iframe de YouTube (ni sus scripts) hasta que la persona
  // pulsa el botón de play: así la miniatura pesa lo mismo que una imagen
  // normal y no se descarga nada de YouTube por adelantado.
  document.querySelectorAll(".video-facade").forEach((facade) => {
    const boton = facade.querySelector(".video-facade__boton");
    const idVideo = facade.getAttribute("data-video-id");
    if (!boton || !idVideo) return;

    // Si la miniatura en máxima resolución no existe (no todos los vídeos
    // de YouTube tienen "maxresdefault"), vamos probando resoluciones más
    // pequeñas hasta encontrar una que sí exista, en vez de dejar el hueco
    // de imagen rota.
    const miniatura = facade.querySelector(".video-facade__miniatura");
    if (miniatura) {
      const resoluciones = ["maxresdefault", "sddefault", "hqdefault", "mqdefault", "default"];
      let intento = resoluciones.indexOf("maxresdefault");
      miniatura.addEventListener("error", () => {
        intento += 1;
        if (intento < resoluciones.length) {
          miniatura.src = `https://img.youtube.com/vi/${idVideo}/${resoluciones[intento]}.jpg`;
        }
      });
    }
    boton.addEventListener("click", () => {
      const titulo = facade.getAttribute("data-video-titulo") || "Vídeo";
      const iframe = document.createElement("iframe");
      iframe.className = "video-facade__iframe";
      iframe.src = `https://www.youtube-nocookie.com/embed/${idVideo}?autoplay=1&rel=0`;
      iframe.title = titulo;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      facade.innerHTML = "";
      facade.appendChild(iframe);
    });
  });

  // --- Ventanita de ayuda: cómo activar los subtítulos del vídeo ---
  // Un panel flotante (no un modal a pantalla completa) que se abre en
  // una esquina de la pantalla: así la persona puede consultar la guía
  // sin que el vídeo quede tapado en ningún momento.
  (function () {
    const panel = document.querySelector("[data-guia-subtitulos]");
    const boton = document.querySelector("[data-guia-subtitulos-abrir]");
    const cerrar = document.querySelector("[data-guia-subtitulos-cerrar]");
    if (!panel || !boton) return;

    function abrir() {
      panel.classList.add("guia-subtitulos--abierta");
      boton.setAttribute("aria-expanded", "true");
    }
    function cerrarPanel() {
      panel.classList.remove("guia-subtitulos--abierta");
      boton.setAttribute("aria-expanded", "false");
    }
    boton.addEventListener("click", () => {
      if (panel.classList.contains("guia-subtitulos--abierta")) cerrarPanel();
      else abrir();
    });
    if (cerrar) cerrar.addEventListener("click", cerrarPanel);
    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape") cerrarPanel();
    });
    // Clic fuera del panel (incluido el propio vídeo) lo cierra, pero
    // sin bloquear esa interacción con una capa oscura de fondo.
    document.addEventListener("click", (evento) => {
      if (!panel.classList.contains("guia-subtitulos--abierta")) return;
      if (panel.contains(evento.target) || boton.contains(evento.target)) return;
      cerrarPanel();
    });
  })();

  // --- Banner de cookies ---
  (function () {
    const CLAVE = "ubuntu-canarias-cookies";

    function obtenerPreferencia() {
      try {
        return localStorage.getItem(CLAVE);
      } catch {
        return null;
      }
    }

    function guardarPreferencia(valor) {
      try {
        localStorage.setItem(CLAVE, valor);
      } catch {}
    }

    const TEXTOS_POR_DEFECTO = {
      texto:
        'Usamos cookies propias y de terceros necesarias para el funcionamiento de la web ' +
        '(como el formulario de contacto o el boletín). Puedes aceptarlas todas o rechazar ' +
        'las que no sean imprescindibles. Más información en nuestra ' +
        '<a href="cookies.html">política de cookies</a>.',
      rechazar: "Rechazar",
      aceptar: "Aceptar todas",
      preferencias: "Preferencias de cookies",
      avisoAria: "Aviso de cookies",
    };

    async function obtenerTextos() {
      const idioma = (document.documentElement.getAttribute("lang") || localStorage.getItem("ubuntu-canarias-idioma") || "es");
      if (idioma === "es") return TEXTOS_POR_DEFECTO;
      try {
        const res = await fetch(`/js/i18n/${idioma}.json`);
        if (!res.ok) throw new Error("No se pudo cargar el idioma");
        const datos = await res.json();
        return { ...TEXTOS_POR_DEFECTO, ...(datos.bannerCookies || {}) };
      } catch {
        return TEXTOS_POR_DEFECTO;
      }
    }

    async function crearBanner() {
      const t = await obtenerTextos();
      const banner = document.createElement("div");
      banner.className = "banner-cookies";
      banner.setAttribute("role", "region");
      banner.setAttribute("aria-label", t.avisoAria);
      banner.innerHTML = `
        <p class="banner-cookies__texto">${t.texto}</p>
        <div class="banner-cookies__botones">
          <button type="button" class="boton boton-secundario" data-accion-cookies="rechazar">${t.rechazar}</button>
          <button type="button" class="boton boton-amarillo" data-accion-cookies="aceptar">${t.aceptar}</button>
        </div>
      `;
      document.body.appendChild(banner);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => banner.classList.add("banner-cookies--visible"));
      });
      banner.querySelectorAll("[data-accion-cookies]").forEach((boton) => {
        boton.addEventListener("click", () => {
          guardarPreferencia(boton.getAttribute("data-accion-cookies"));
          banner.classList.remove("banner-cookies--visible");
          banner.addEventListener("transitionend", () => banner.remove(), { once: true });
          crearBotonPreferencias();
        });
      });
      return banner;
    }

    async function crearBotonPreferencias() {
      if (document.querySelector(".boton-preferencias-cookies")) return;
      const t = await obtenerTextos();
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "boton-preferencias-cookies";
      boton.setAttribute("aria-label", t.preferencias);
      boton.title = t.preferencias;
      boton.textContent = "🍪";
      boton.addEventListener("click", () => {
        boton.remove();
        crearBanner();
      });
      document.body.appendChild(boton);
    }

    obtenerPreferencia() ? crearBotonPreferencias() : crearBanner();
  })();
});
