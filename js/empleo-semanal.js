(function () {
  "use strict";

  // Idioma actual, tal y como lo mantiene js/idiomas.js en <html lang="...">
  function idiomaActual() {
    const idioma = document.documentElement.getAttribute("lang") || "es";
    return ["es", "en", "fr", "ar"].includes(idioma) ? idioma : "es";
  }

  // Calcula la ruta a la raíz del sitio según la carpeta de idioma actual
  // (index.html / en/index.html / fr/index.html / ar/index.html), para que
  // la descarga del PDF funcione igual desde cualquier idioma.
  function prefijoRaiz() {
    const ruta = window.location.pathname;
    if (/\/(en|fr|ar)\//.test(ruta)) return "../";
    return "";
  }

  const TEXTOS = {
    es: {
      contador: (n) => n + " ofertas activas esta semana",
      verOferta: "Ver oferta",
      compartirWa: "Compartir por WhatsApp",
      copiarEnlace: "Copiar",
      copiado: "¡Copiado!",
      mensajeCompartir: (puesto, empresa, ubicacion, enlace) =>
        `🔎 ${puesto}\n🏢 ${empresa} · ${ubicacion}\n👉 Más información e inscripción: ${enlace}\n\nVía Ubuntu Canarias — más ofertas de empleo en Gran Canaria: https://ubuntucanarias.org/acceso-ofertas.html`,
      contrato: { Indefinido: "Indefinido", Temporal: "Temporal" },
      botonAcceso: "Ver ofertas (ya tienes acceso)",
      areas: {
        "tercer-sector": "Tercer Sector y Cuidados",
        "hosteleria": "Hostelería y Servicios",
        "almacen": "Comercio, Almacén y Reparto",
        "construccion": "Construcción y Mantenimiento",
        "formacion": "Formación y Docencia",
        "sociosanitario": "Sociosanitario",
      },
    },
    en: {
      contador: (n) => n + " active listings this week",
      verOferta: "View listing",
      compartirWa: "Share on WhatsApp",
      copiarEnlace: "Copy",
      copiado: "Copied!",
      mensajeCompartir: (puesto, empresa, ubicacion, enlace) =>
        `🔎 ${puesto}\n🏢 ${empresa} · ${ubicacion}\n👉 More info and how to apply: ${enlace}\n\nVia Ubuntu Canarias — more job listings in Gran Canaria: https://ubuntucanarias.org/en/acceso-ofertas.html`,
      contrato: { Indefinido: "Permanent", Temporal: "Temporary" },
      botonAcceso: "View listings (you already have access)",
      areas: {
        "tercer-sector": "Third Sector & Care",
        "hosteleria": "Hospitality & Services",
        "almacen": "Retail, Warehouse & Delivery",
        "construccion": "Construction & Maintenance",
        "formacion": "Training & Teaching",
        "sociosanitario": "Health & Social Care",
      },
    },
    fr: {
      contador: (n) => n + " offres actives cette semaine",
      verOferta: "Voir l'offre",
      compartirWa: "Partager sur WhatsApp",
      copiarEnlace: "Copier",
      copiado: "Copié !",
      mensajeCompartir: (puesto, empresa, ubicacion, enlace) =>
        `🔎 ${puesto}\n🏢 ${empresa} · ${ubicacion}\n👉 Plus d'infos et candidature : ${enlace}\n\nVia Ubuntu Canarias — plus d'offres d'emploi à Gran Canaria : https://ubuntucanarias.org/fr/acceso-ofertas.html`,
      contrato: { Indefinido: "CDI", Temporal: "CDD" },
      botonAcceso: "Voir les offres (vous avez déjà accès)",
      areas: {
        "tercer-sector": "Secteur associatif et aide à la personne",
        "hosteleria": "Hôtellerie et services",
        "almacen": "Commerce, entrepôt et livraison",
        "construccion": "Construction et maintenance",
        "formacion": "Formation et enseignement",
        "sociosanitario": "Socio-sanitaire",
      },
    },
    ar: {
      contador: (n) => n + " عرضاً نشطاً هذا الأسبوع",
      verOferta: "عرض الوظيفة",
      compartirWa: "مشاركة عبر واتساب",
      copiarEnlace: "نسخ",
      copiado: "تم النسخ!",
      mensajeCompartir: (puesto, empresa, ubicacion, enlace) =>
        `🔎 ${puesto}\n🏢 ${empresa} · ${ubicacion}\n👉 لمزيد من المعلومات والتقديم: ${enlace}\n\nعبر أوبونتو كناريا — المزيد من عروض العمل في غران كناريا: https://ubuntucanarias.org/ar/acceso-ofertas.html`,
      contrato: { Indefinido: "عقد دائم", Temporal: "عقد مؤقت" },
      botonAcceso: "شاهد العروض (لديك بالفعل صلاحية الوصول)",
      areas: {
        "tercer-sector": "القطاع الثالث والرعاية",
        "hosteleria": "الفندقة والخدمات",
        "almacen": "التجارة والمخازن والتوصيل",
        "construccion": "البناء والصيانة",
        "formacion": "التدريب والتعليم",
        "sociosanitario": "الرعاية الصحية والاجتماعية",
      },
    },
  };

  /* =========================================================
     RECONOCIMIENTO DE SUSCRIPTORES (persistente, mismo navegador)
     Cuando alguien se suscribe con éxito desde el modal de abajo,
     guardamos su email en localStorage. La próxima vez que entre en
     este mismo navegador/dispositivo, no le volvemos a pedir el
     formulario: pasa directo al listado de ofertas.
     Importante: esto reconoce el NAVEGADOR, no la persona en
     abstracto — si abre la web desde otro móvil u ordenador, o borra
     los datos de navegación, se le volverá a pedir el email (aunque
     ya esté en la base de datos de Brevo).
     ========================================================= */
  function suscriptorReconocido() {
    try {
      const guardado = localStorage.getItem("ubuntuEmpleoSuscrito");
      if (!guardado) return null;
      const datos = JSON.parse(guardado);
      return datos && datos.email ? datos : null;
    } catch (error) {
      return null;
    }
  }

  function recordarSuscriptor(nombre, email) {
    try {
      localStorage.setItem(
        "ubuntuEmpleoSuscrito",
        JSON.stringify({ nombre, email, fecha: new Date().toISOString() })
      );
    } catch (error) {
      // Si el navegador bloquea localStorage, seguimos sin recordar al
      // suscriptor, pero el envío a Brevo ya se ha hecho igualmente.
    }
  }

  /* =========================================================
     MODAL DE SUSCRIPCIÓN (solo existe en empleo-semanal.html)
     ========================================================= */
  const botonAbrir = document.getElementById("semanal-abrir-modal");
  if (botonAbrir) {
    const fondoModal = document.getElementById("semanal-modal-fondo");
    const botonCerrar = document.getElementById("semanal-cerrar-modal");
    const formulario = document.getElementById("semanal-formulario");
    const botonEnviar = document.getElementById("semanal-boton-enviar");
    const campoNombre = document.getElementById("semanal-campo-nombre");
    let ultimoElementoActivo = null;

    function abrirModal() {
      ultimoElementoActivo = document.activeElement;
      fondoModal.classList.add("semanal-modal-visible");
      document.body.style.overflow = "hidden";
      campoNombre.focus();
    }

    function cerrarModal() {
      fondoModal.classList.remove("semanal-modal-visible");
      document.body.style.overflow = "";
      if (ultimoElementoActivo) ultimoElementoActivo.focus();
    }

    // Si ya reconocemos a esta persona en este navegador, el botón
    // principal la lleva directa al listado, sin volver a pedirle nada.
    const reconocido = suscriptorReconocido();
    if (reconocido) {
      botonAbrir.addEventListener("click", function (evento) {
        evento.preventDefault();
        window.location.href = "acceso-ofertas.html";
      });
      botonAbrir.childNodes.forEach((nodo) => {
        if (nodo.nodeType === Node.TEXT_NODE && nodo.textContent.trim()) {
          nodo.textContent = " " + TEXTOS[idiomaActual()].botonAcceso + " ";
        }
      });
    } else {
      botonAbrir.addEventListener("click", abrirModal);
    }

    botonCerrar.addEventListener("click", cerrarModal);

    fondoModal.addEventListener("click", (evento) => {
      if (evento.target === fondoModal) cerrarModal();
    });

    document.addEventListener("keydown", (evento) => {
      if (evento.key === "Escape" && fondoModal.classList.contains("semanal-modal-visible")) {
        cerrarModal();
      }
    });

    // Envío del formulario: se envía de verdad al mismo formulario de
    // Brevo que usa el boletín (mismo action + iframe oculto que en
    // publicaciones.html), así que el email llega a la base de datos real
    // de newsletter. No hacemos preventDefault en el caso válido: dejamos
    // que el navegador haga el POST normal contra el iframe oculto
    // "semanal-marco-oculto" en segundo plano, mientras nosotros seguimos
    // con nuestra propia lógica (recordar al suscriptor y redirigir a la
    // página de ofertas) en paralelo.
    formulario.addEventListener("submit", function (evento) {
      if (!formulario.checkValidity()) {
        evento.preventDefault();
        formulario.reportValidity();
        return;
      }

      const nombre = document.getElementById("semanal-campo-nombre").value.trim();
      const email = document.getElementById("semanal-campo-email").value.trim();

      botonEnviar.classList.add("semanal-cargando");
      botonEnviar.disabled = true;

      try {
        sessionStorage.setItem("ubuntuEmpleoNombre", nombre);
        sessionStorage.setItem("ubuntuEmpleoEmail", email);
      } catch (error) {
        // Si el navegador bloquea sessionStorage, seguimos sin personalización
      }

      // Guarda el reconocimiento local: la próxima vez que esta persona
      // entre desde este mismo navegador, pasará directa sin suscribirse
      // otra vez (ver suscriptorReconocido() más arriba y el guard de
      // acceso-ofertas.html).
      recordarSuscriptor(nombre, email);

      // No se descarga ningún PDF aquí: tras enviar el formulario, la
      // persona es redirigida a acceso-ofertas.html, que ya incluye su
      // propio botón "Descargar todas en PDF" (#semanal-descargar-todo)
      // por si quiere descargarlo desde allí.

      // El formulario sigue su curso normal hacia el iframe oculto (POST a
      // Brevo) porque NO llamamos a evento.preventDefault() aquí. Damos un
      // pequeño margen antes de redirigir para que ese POST llegue a salir.
      setTimeout(function () {
        window.location.href = "acceso-ofertas.html";
      }, 700);
    });
  }

  /* =========================================================
     LISTADO DE OFERTAS (solo existe en acceso-ofertas.html)
     Usa los datos reales de js/ofertas-datos.js (misma fuente que el PDF).
     ========================================================= */
  const rejilla = document.getElementById("semanal-rejilla-ofertas");
  if (rejilla && typeof OFERTAS_SEMANA !== "undefined") {
    const idioma = idiomaActual();
    const t = TEXTOS[idioma];

    // Enlace de descarga del PDF completo (mismo idioma que la página)
    const botonDescargarTodo = document.getElementById("semanal-descargar-todo");
    if (botonDescargarTodo) {
      const idiomaPdf = idiomaActual();
      botonDescargarTodo.href = prefijoRaiz() + `recursos-descargables/ofertas-empleo-ubuntu-canarias-${idiomaPdf}.pdf`;
      botonDescargarTodo.setAttribute("download", `ofertas-empleo-ubuntu-canarias-${idiomaPdf}.pdf`);
    }

    function inicialesDe(nombreEmpresa) {
      const limpio = nombreEmpresa.replace(/\(.*?\)/g, "").trim();
      const palabras = limpio.split(/\s+/).filter(Boolean);
      return (palabras[0]?.[0] || "?").toUpperCase() + (palabras[1]?.[0] || "").toUpperCase();
    }

    // Cada oferta trae sus textos traducidos (es/en/fr/ar) en categoria,
    // puesto, jornada, fecha y requisitos. Empresa, ubicación y enlace no
    // se traducen (nombres propios y topónimos). Si por lo que sea faltara
    // la traducción a un idioma concreto, se cae de vuelta al español para
    // no dejar el hueco vacío.
    function campo(valor, idiomaActual) {
      if (valor && typeof valor === "object") {
        return valor[idiomaActual] || valor.es || "";
      }
      return valor || "";
    }

    // Escapa un texto para poder meterlo con seguridad dentro de un
    // atributo HTML (comillas dobles, &, <, >), evitando que un puesto o
    // empresa con esos caracteres rompa el marcado.
    function escapeAttr(texto) {
      return String(texto || "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    function crearTarjetaOferta(oferta) {
      const puesto = campo(oferta.puesto, idioma);
      const jornada = campo(oferta.jornada, idioma);
      const fecha = campo(oferta.fecha, idioma);
      const requisitos = campo(oferta.requisitos, idioma);
      const categoria = campo(oferta.categoria, idioma) || t.areas[oferta.area];
      return `
        <article class="semanal-oferta" data-area="${oferta.area}">
          <div class="semanal-oferta__cabecera">
            <div class="semanal-oferta__empresa">
              <span class="semanal-oferta__logo" aria-hidden="true">${inicialesDe(oferta.empresa)}</span>
              <span class="semanal-oferta__empresa-nombre">${oferta.empresa}</span>
            </div>
            <span class="semanal-etiqueta-contrato">${categoria}</span>
          </div>
          <h2>${puesto}</h2>
          <div class="semanal-oferta__meta">
            <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0Z"/><circle cx="12" cy="10" r="3"/></svg>${oferta.ubicacion}</span>
            <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg>${jornada}</span>
          </div>
          <p class="semanal-descripcion">${requisitos}</p>
          <div class="semanal-oferta__acciones">
            <button type="button" class="semanal-btn-compartir semanal-btn-compartir--wa"
              data-puesto="${escapeAttr(puesto)}" data-empresa="${escapeAttr(oferta.empresa)}"
              data-ubicacion="${escapeAttr(oferta.ubicacion)}" data-enlace="${escapeAttr(oferta.enlace)}"
              title="${t.compartirWa}" aria-label="${t.compartirWa}">
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.8 14.03c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.81-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.76-4.14-4.9-4.33-.14-.19-1.17-1.56-1.17-2.98 0-1.41.74-2.11 1-2.4.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.57.81 1.98.88 2.12.07.15.12.32.02.51-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.61-.07.16-.19.7-.81.89-1.09.19-.28.37-.23.63-.14.26.09 1.66.78 1.94.92.28.14.47.21.53.33.07.12.07.68-.17 1.36z"/></svg>
            </button>
            <button type="button" class="semanal-btn-compartir semanal-btn-compartir--copiar"
              data-puesto="${escapeAttr(puesto)}" data-empresa="${escapeAttr(oferta.empresa)}"
              data-ubicacion="${escapeAttr(oferta.ubicacion)}" data-enlace="${escapeAttr(oferta.enlace)}"
              title="${t.copiarEnlace}" aria-label="${t.copiarEnlace}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
          <div class="semanal-oferta__pie">
            <span class="semanal-oferta__fecha">${fecha}</span>
            <a class="semanal-oferta__enlace" href="${oferta.enlace}" target="_blank" rel="noopener noreferrer">
              ${t.verOferta}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </a>
          </div>
        </article>
      `;
    }

    // Compartir / copiar una oferta concreta. Un único listener en el
    // contenedor (delegación de eventos) porque las tarjetas se vuelven a
    // pintar cada vez que se filtra o se busca.
    rejilla.addEventListener("click", function (evento) {
      const botonWa = evento.target.closest(".semanal-btn-compartir--wa");
      const botonCopiar = evento.target.closest(".semanal-btn-compartir--copiar");
      const boton = botonWa || botonCopiar;
      if (!boton) return;

      const mensaje = t.mensajeCompartir(
        boton.dataset.puesto,
        boton.dataset.empresa,
        boton.dataset.ubicacion,
        boton.dataset.enlace
      );

      if (botonWa) {
        const urlWa = "https://wa.me/?text=" + encodeURIComponent(mensaje);
        window.open(urlWa, "_blank", "noopener,noreferrer");
        return;
      }

      // Copiar al portapapeles, con alternativa por si el navegador no
      // soporta la API moderna (por ejemplo, en http:// en vez de https://).
      const copiarConFallback = () => {
        const areaTemporal = document.createElement("textarea");
        areaTemporal.value = mensaje;
        areaTemporal.style.position = "fixed";
        areaTemporal.style.opacity = "0";
        document.body.appendChild(areaTemporal);
        areaTemporal.select();
        try { document.execCommand("copy"); } catch (error) { /* silencioso */ }
        document.body.removeChild(areaTemporal);
      };

      const mostrarConfirmacion = () => {
        const textoOriginal = boton.getAttribute("title");
        boton.classList.add("semanal-btn-compartir--copiado");
        boton.setAttribute("title", t.copiado);
        setTimeout(() => {
          boton.classList.remove("semanal-btn-compartir--copiado");
          boton.setAttribute("title", textoOriginal);
        }, 1800);
      };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(mensaje).then(mostrarConfirmacion).catch(() => {
          copiarConFallback();
          mostrarConfirmacion();
        });
      } else {
        copiarConFallback();
        mostrarConfirmacion();
      }
    });

    // Estado del buscador: término de texto + área seleccionada
    const campoBuscador = document.getElementById("semanal-buscador-input");
    const botonesFiltro = document.querySelectorAll(".semanal-filtro");
    const mensajeSinResultados = document.getElementById("semanal-sin-resultados");
    const contador = document.getElementById("semanal-contador-texto");
    let areaActiva = "todas";

    function normalizar(texto) {
      return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function fechaOrden(oferta) {
      // Extrae dd/mm/yyyy del campo fecha en español (formato interno
      // consistente, independientemente del idioma que se muestre) para
      // poder ordenar de más reciente a más antigua. Si no hay fecha
      // reconocible, se manda al final.
      const texto = (oferta.fecha && oferta.fecha.es) || "";
      const m = texto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (!m) return 0;
      const [, dd, mm, yyyy] = m;
      return Number(`${yyyy}${mm}${dd}`);
    }

    function aplicarFiltro() {
      const termino = normalizar(campoBuscador ? campoBuscador.value.trim() : "");

      const resultado = OFERTAS_SEMANA.filter((oferta) => {
        const coincideArea = areaActiva === "todas" || oferta.area === areaActiva;
        if (!coincideArea) return false;
        if (!termino) return true;
        const puesto = campo(oferta.puesto, idioma);
        const texto = normalizar(`${puesto} ${oferta.empresa} ${oferta.ubicacion}`);
        return texto.includes(termino);
      });

      // Más nuevas primero dentro de cada categoría/resultado.
      resultado.sort((a, b) => fechaOrden(b) - fechaOrden(a));

      rejilla.innerHTML = resultado.map(crearTarjetaOferta).join("");
      rejilla.hidden = resultado.length === 0;
      if (mensajeSinResultados) mensajeSinResultados.hidden = resultado.length > 0;
      if (contador) contador.textContent = t.contador(resultado.length);
    }

    if (campoBuscador) {
      campoBuscador.addEventListener("input", aplicarFiltro);
    }

    botonesFiltro.forEach((boton) => {
      boton.addEventListener("click", () => {
        areaActiva = boton.dataset.area;
        botonesFiltro.forEach((b) => b.setAttribute("aria-pressed", b === boton ? "true" : "false"));
        aplicarFiltro();
      });
    });

    aplicarFiltro();
  }
})();
