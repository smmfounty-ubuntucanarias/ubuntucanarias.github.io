// Tablón de anuncios de Ubuntu Canarias.
// ANUNCIOS_CSV: enlace CSV de la pestaña «Publicados» de la hoja de Google (Archivo > Compartir > Publicar en la web).
// Si está vacío, solo se muestran los anuncios escritos a mano en ANUNCIOS.
const ANUNCIOS_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRmtct9JIQJpV1hHgBCGnOcyC9XBBeQU7btkul96mIP_T5VBEwtP-gXeVzyAkEC9jPhCISa1fx66Kr_/pub?gid=499017491&single=true&output=csv';
// Anuncios a mano (opcional): {tipo:'servicios'|'busco'|'regalo', titulo, descripcion, municipio, contacto, publicado:'AAAA-MM-DD', caduca:'AAAA-MM-DD'}
const ANUNCIOS = [];
