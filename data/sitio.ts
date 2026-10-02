import type { TipoIncidente } from "@/types";

/* ==========================================================================
   TEXTOS DEL SITIO
   --------------------------------------------------------------------------
  Contenido editable: titulares, textos de la portada y metadatos SEO.
   ========================================================================== */

/** Origen público. Se usa en metadatos, sitemap y para armar URLs del QR. */
export const SITIO_URL = "https://comercio-regulado.vercel.app";

export const METADATOS = {
  titulo: "Comercio Regulado",
  tituloPagina: "Comercio Regulado — Gestión de comercios",
  descripcion:
    "Plataforma para administrar comercios autorizados, horarios, incidencias y cumplimiento desde un solo lugar.",
  palabrasClave: [
    "comercio informal",
    "regulación comercial",
    "residencial privada",
    "El Salvador",
    "ética empresarial",
  ],
};

/** Contenido del bloque principal de la portada. */
export const HERO = {
  titular: "Gestión clara para cada comercio autorizado.",
  bajada:
    "Administra autorizaciones, horarios, incidencias y cumplimiento en un solo espacio. Mantén la información organizada, trazable y disponible para la comunidad.",
  ctaPrimario: "Abrir el panel",
  ctaSecundario: "Ver directorio",
};

/** Pasos del proceso, mostrados como lista numerada y no como tarjetas. */
export const PASOS = [
  {
    numero: "01",
    titulo: "Autorizar en lugar de expulsar",
    detalle:
      "Registra cada comercio con sus datos, ubicación, horario y productos autorizados en una ficha centralizada.",
  },
  {
    numero: "02",
    titulo: "Dar un canal formal a la queja",
    detalle:
      "Recibe incidencias con folio y conserva su estado, fecha y seguimiento en un historial consultable.",
  },
  {
    numero: "03",
    titulo: "Medir el cumplimiento",
    detalle:
      "Consulta el historial de cada comercio y revisa los indicadores de cumplimiento con criterios consistentes.",
  },
  {
    numero: "04",
    titulo: "Cuantificar el beneficio",
    detalle:
      "Reúne información de actividad y beneficio para apoyar decisiones administrativas con datos.",
  },
] as const;

/** Tipos de incidente disponibles en el formulario de quejas. */
export const TIPOS_INCIDENTE: Record<
  TipoIncidente,
  { etiqueta: string; descripcion: string }
> = {
  ruido: {
    etiqueta: "Ruido",
    descripcion: "Volumen alto, música o generadores fuera del horario acordado.",
  },
  basura: {
    etiqueta: "Basura y residuos",
    descripcion: "Cartón, bolsas o residuos fuera del contenedor o de la verja.",
  },
  estacionamiento: {
    etiqueta: "Estacionamiento",
    descripcion: "Vehículos o motocicletas que bloquean el paso del pasaje.",
  },
  seguridad: {
    etiqueta: "Seguridad",
    descripcion: "Afluencia excesiva, obstrucción de la vía o riesgo para los niños.",
  },
  otro: {
    etiqueta: "Otro",
    descripcion: "Cualquier situación que no encaje en las categorías anteriores.",
  },
};

/** Texto del pie de página. */
export const PIE = {
  descripcion:
    "Plataforma para centralizar fichas comerciales, reportes y seguimiento de cumplimiento.",
  secciones: [
    {
      titulo: "Sistema",
      enlaces: [
        { texto: "Tablero de fichas", href: "/dashboard" },
        { texto: "Reportar un incidente", href: "/dashboard/quejas" },
        { texto: "Directorio de comercios", href: "/tiendas" },
      ],
    },
    {
      titulo: "Comercios",
      enlaces: [
        { texto: "Directorio público", href: "/tiendas" },
      ],
    },
  ],
} as const;
