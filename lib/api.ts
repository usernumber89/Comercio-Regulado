import type { BorradorTienda, ErroresTienda } from "@/lib/tienda-formulario";
import { validarTienda } from "@/lib/tienda-formulario";
import type {
  CategoriaConducta,
  GravedadInfraccion,
  TipoIncidente,
  TipoSeguimientoReporte,
  TipoSancion,
} from "@/types";

/* ==========================================================================
   UTILIDADES DE LOS ROUTE HANDLERS
   --------------------------------------------------------------------------
   Lo mínimo que los tres o cuatro `route.ts` necesitan: una respuesta de
   error con el mismo formato, y la normalización de lo que llega por JSON.
   ========================================================================== */

const TIPOS: TipoIncidente[] = [
  "ruido",
  "basura",
  "estacionamiento",
  "seguridad",
  "otro",
  "horario_menor",
  "distintivo",
  "empaque_limpieza",
  "venta_visitantes",
  "proveedores_fuera_horario",
  "permisos_sanitarios",
  "productos_no_autorizados",
  "alcohol_tabaco_sustancias",
  "alteracion_arquitectonica",
  "desacato",
];

export const DESCRIPCION_MINIMA = 12;

/** Error con el texto que ya sabe mostrar el formulario. */
export function error(mensaje: string, estado = 400): Response {
  return Response.json({ error: mensaje }, { status: estado });
}

/** Lee el cuerpo de la petición sin romper si no viene JSON válido. */
export async function cuerpo(request: Request): Promise<Record<string, unknown>> {
  try {
    const datos = await request.json();
    return datos && typeof datos === "object" ? (datos as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function texto(valor: unknown): string {
  return typeof valor === "string" ? valor : "";
}

/* --------------------------------------------------------------------------
   Denuncias
   -------------------------------------------------------------------------- */

export interface DatosReporteRecibidos {
  tiendaId: string;
  tipo: TipoIncidente;
  descripcion: string;
  anonimo: boolean;
}

/** Normaliza y valida el cuerpo de un reporte. Devuelve el motivo si falla. */
export function leerReporte(
  datos: Record<string, unknown>,
): { ok: true; valor: DatosReporteRecibidos } | { ok: false; mensaje: string } {
  const tiendaId = texto(datos.tiendaId);
  const tipo = texto(datos.tipo) as TipoIncidente;
  const descripcion = texto(datos.descripcion).trim();

  if (!tiendaId) return { ok: false, mensaje: "Falta indicar la tienda." };
  if (!TIPOS.includes(tipo)) return { ok: false, mensaje: "El tipo de incidente no es válido." };
  if (descripcion.length < DESCRIPCION_MINIMA) {
    return {
      ok: false,
      mensaje: `Describe el incidente con al menos ${DESCRIPCION_MINIMA} caracteres para que la Junta pueda gestionarlo.`,
    };
  }

  return {
    ok: true,
    valor: { tiendaId, tipo, descripcion, anonimo: datos.anonimo === true },
  };
}

export interface DatosSeguimientoRecibidos {
  tipo: Exclude<TipoSeguimientoReporte, "reapertura">;
  detalle: string;
  responsable: string | null;
  fechaLimite: string | null;
  evidenciaUrl: string | null;
  peligroSaludSeguridad: boolean;
  vigenteHasta: string | null;
}

const TIPOS_SEGUIMIENTO: DatosSeguimientoRecibidos["tipo"][] = [
  "accion",
  "ronda",
  "evidencia",
  "resolucion",
  "medida_preventiva",
];

export function leerSeguimientoReporte(
  datos: Record<string, unknown>,
): { ok: true; valor: DatosSeguimientoRecibidos } | { ok: false; mensaje: string } {
  const tipo = texto(datos.tipo) as DatosSeguimientoRecibidos["tipo"];
  const detalle = texto(datos.detalle).trim();
  const responsable = texto(datos.responsable).trim();
  const fechaLimite = texto(datos.fechaLimite).trim();
  const evidenciaUrl = texto(datos.evidenciaUrl).trim();
  const vigenteHasta = texto(datos.vigenteHasta).trim();

  if (!TIPOS_SEGUIMIENTO.includes(tipo)) {
    return { ok: false, mensaje: "El tipo de seguimiento no es válido." };
  }
  const minimoDetalle = tipo === "medida_preventiva" ? 20 : 8;
  if (detalle.length < minimoDetalle || detalle.length > 800) {
    return { ok: false, mensaje: `El detalle debe tener entre ${minimoDetalle} y 800 caracteres.` };
  }
  if (responsable.length > 100) {
    return { ok: false, mensaje: "El responsable no puede superar 100 caracteres." };
  }
  if ((tipo === "accion" || tipo === "ronda" || tipo === "resolucion") && !responsable) {
    return { ok: false, mensaje: "Indica quién queda a cargo." };
  }
  if (tipo === "medida_preventiva") {
    if (datos.peligroSaludSeguridad !== true) {
      return { ok: false, mensaje: "Confirma que existe un peligro para la salud o la seguridad." };
    }
    if (!responsable) {
      return { ok: false, mensaje: "Indica quién queda a cargo de la medida preventiva." };
    }
    const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(vigenteHasta);
    const fecha = fechaValida ? new Date(`${vigenteHasta}T23:59:59.999Z`) : null;
    if (
      !fecha ||
      Number.isNaN(fecha.getTime()) ||
      fecha.toISOString().slice(0, 10) !== vigenteHasta ||
      fecha.getTime() <= Date.now()
    ) {
      return { ok: false, mensaje: "Indica una fecha futura válida para el vencimiento de la medida temporal." };
    }
  }

  if (tipo === "accion") {
    const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fechaLimite);
    const fecha = fechaValida ? new Date(`${fechaLimite}T00:00:00.000Z`) : null;
    if (!fecha || Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== fechaLimite) {
      return { ok: false, mensaje: "Indica una fecha límite válida." };
    }
  }

  if ((tipo === "evidencia" || tipo === "resolucion") && !evidenciaUrl) {
    return {
      ok: false,
      mensaje: "Añade un enlace a la evidencia para registrar o cerrar el caso.",
    };
  }

  let urlNormalizada: string | null = null;
  if (evidenciaUrl) {
    try {
      const url = new URL(evidenciaUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
      if (evidenciaUrl.length > 1000) throw new Error();
      urlNormalizada = url.toString();
    } catch {
      return { ok: false, mensaje: "La evidencia debe ser un enlace HTTP o HTTPS válido." };
    }
  }

  return {
    ok: true,
    valor: {
      tipo,
      detalle,
      responsable: responsable || null,
      fechaLimite: tipo === "accion" ? fechaLimite : null,
      evidenciaUrl: urlNormalizada,
      peligroSaludSeguridad: tipo === "medida_preventiva",
      vigenteHasta: tipo === "medida_preventiva" ? vigenteHasta : null,
    },
  };
}

export function leerImpugnacion(
  datos: Record<string, unknown>,
): { ok: true; motivo: string } | { ok: false; mensaje: string } {
  const motivo = texto(datos.motivo).trim();
  if (motivo.length < 20 || motivo.length > 1500) {
    return { ok: false, mensaje: "Explica los motivos de la impugnación en 20 a 1,500 caracteres." };
  }
  return { ok: true, motivo };
}

export function leerValidacion(
  datos: Record<string, unknown>,
): { ok: true; valor: {
  categoria: CategoriaConducta | null;
  gravedad: GravedadInfraccion | null;
} } | { ok: false; mensaje: string } {
  const categorias: CategoriaConducta[] = [
    "horarios_proveedores",
    "convivencia_ruidos_circulacion",
    "sanitaria_productos",
    "publicidad_fachadas",
  ];
  const gravedades: GravedadInfraccion[] = ["leve", "grave", "muy_grave"];
  const categoria = datos.categoria;
  const gravedad = datos.gravedad;

  if (datos.confirmadaClasificacion !== true) {
    return {
      ok: false,
      mensaje: "Confirma que verificaste los hechos y que la clasificación corresponde a la conducta comprobada.",
    };
  }
  if (categoria !== undefined && !categorias.includes(categoria as CategoriaConducta)) {
    return { ok: false, mensaje: "La categoría de conducta no es válida." };
  }
  if (gravedad !== undefined && !gravedades.includes(gravedad as GravedadInfraccion)) {
    return { ok: false, mensaje: "La gravedad no es válida." };
  }
  if ((categoria === undefined) !== (gravedad === undefined)) {
    return { ok: false, mensaje: "Selecciona categoría y gravedad conjuntamente." };
  }

  return {
    ok: true,
    valor: {
      categoria: (categoria as CategoriaConducta | undefined) ?? null,
      gravedad: (gravedad as GravedadInfraccion | undefined) ?? null,
    },
  };
}

export function leerRevisionImpugnacion(
  datos: Record<string, unknown>,
): { ok: true; valor: {
  confirmar: boolean;
  revisor: string;
  rol: "administrador" | "comision_arbitro";
  resolucion: string;
} } | {
  ok: false;
  mensaje: string;
} {
  const revisor = texto(datos.revisor).trim();
  const resolucion = texto(datos.resolucion).trim();
  const rol = datos.rol;
  if (typeof datos.confirmar !== "boolean") {
    return { ok: false, mensaje: "Indica si el reporte se confirma o se revoca." };
  }
  if (revisor.length < 3 || revisor.length > 100) {
    return { ok: false, mensaje: "Indica el nombre del revisor imparcial." };
  }
  if (resolucion.length < 20 || resolucion.length > 1500) {
    return { ok: false, mensaje: "La resolución de impugnación debe tener entre 20 y 1,500 caracteres." };
  }
  if (rol !== "administrador" && rol !== "comision_arbitro") {
    return { ok: false, mensaje: "Selecciona el órgano imparcial que revisa el caso." };
  }
  if (datos.declaracionImparcialidad !== true) {
    return {
      ok: false,
      mensaje: "Confirma que el revisor no es reportante ni reside en una vivienda colindante al establecimiento.",
    };
  }

  return { ok: true, valor: { confirmar: datos.confirmar, revisor, rol, resolucion } };
}

export function leerSancion(
  datos: Record<string, unknown>,
): { ok: true; valor: {
  tipo: TipoSancion;
  motivo: string;
  resolucion: string;
  audienciaEn: string;
  diasSuspension: number | null;
} } | { ok: false; mensaje: string } {
  const tipos: TipoSancion[] = [
    "amonestacion_escrita",
    "suspension",
    "revocacion",
    "medida_correctiva",
  ];
  const tipo = texto(datos.tipo) as TipoSancion;
  const motivo = texto(datos.motivo).trim();
  const resolucion = texto(datos.resolucion).trim();
  const audienciaEn = texto(datos.audienciaEn);
  const diasSuspension =
    datos.diasSuspension === null || datos.diasSuspension === undefined
      ? null
      : Number(datos.diasSuspension);

  if (!tipos.includes(tipo)) return { ok: false, mensaje: "El tipo de sanción no es válido." };
  if (motivo.length < 12 || motivo.length > 1000) {
    return { ok: false, mensaje: "El motivo debe tener entre 12 y 1,000 caracteres." };
  }
  if (resolucion.length < 12 || resolucion.length > 1500) {
    return { ok: false, mensaje: "La resolución motivada debe tener entre 12 y 1,500 caracteres." };
  }
  const fechaAudiencia = /^\d{4}-\d{2}-\d{2}$/.test(audienciaEn)
    ? new Date(`${audienciaEn}T00:00:00.000Z`)
    : null;
  if (
    !fechaAudiencia ||
    Number.isNaN(fechaAudiencia.getTime()) ||
    fechaAudiencia.toISOString().slice(0, 10) !== audienciaEn
  ) {
    return { ok: false, mensaje: "Indica la fecha válida de la audiencia previa." };
  }
  if (tipo === "suspension" && !Number.isInteger(diasSuspension)) {
    return { ok: false, mensaje: "Indica la duración de la suspensión en días." };
  }
  if (tipo !== "suspension" && diasSuspension !== null) {
    return { ok: false, mensaje: "Solo las suspensiones tienen una duración en días." };
  }

  return {
    ok: true,
    valor: { tipo, motivo, resolucion, audienciaEn, diasSuspension },
  };
}

/* --------------------------------------------------------------------------
   Reseñas
   -------------------------------------------------------------------------- */

export interface DatosResenaRecibidos {
  tiendaId: string;
  estrellas: number;
  comentario: string;
  autor: string;
  anonimo: boolean;
}

/**
 * Normaliza y valida el cuerpo de una reseña.
 *
 * Lo único que cambia según la estrella es si hace falta escribir: una reseña
 * de una sola estrella es una denuncia, así que exige el mismo mínimo de
 * caracteres que un reporte. De dos a cinco se puede opinar solo con la
 * estrella, porque ahí lo que se está expresando es una aprobación.
 */
export function leerResena(
  datos: Record<string, unknown>,
): { ok: true; valor: DatosResenaRecibidos } | { ok: false; mensaje: string } {
  const tiendaId = texto(datos.tiendaId);
  const estrellas = Math.round(Number(datos.estrellas));
  const comentario = texto(datos.comentario).trim();
  const anonimo = datos.anonimo === true;
  const autor = texto(datos.autor).trim();

  if (!tiendaId) return { ok: false, mensaje: "Falta indicar la tienda." };
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    return { ok: false, mensaje: "La valoración debe ir de una a cinco estrellas." };
  }

  if (estrellas === 1 && comentario.length < DESCRIPCION_MINIMA) {
    return {
      ok: false,
      mensaje: `Una valoración de una estrella es una denuncia: cuéntanos qué pasó con al menos ${DESCRIPCION_MINIMA} caracteres para que la Junta pueda gestionarlo.`,
    };
  }

  if (!anonimo && !autor) {
    return { ok: false, mensaje: "Escribe tu nombre o deja la reseña en anónimo." };
  }

  return {
    ok: true,
    valor: {
      tiendaId,
      estrellas,
      comentario: comentario.slice(0, 600),
      autor: autor.slice(0, 60),
      anonimo,
    },
  };
}

/* --------------------------------------------------------------------------
   Comercios
   -------------------------------------------------------------------------- */

/**
 * Normaliza el borrador de tienda y lo devuelve con sus errores por campo.
 *
 * El formulario ya valida antes de enviar, pero el servidor vuelve a
 * validar: es el único que decide qué se guarda, y el API se puede llamar
 * desde otro lado.
 */
export function leerTienda(
  datos: Record<string, unknown>,
): { ok: true; valor: BorradorTienda; errores: ErroresTienda } | {
  ok: false;
  errores: ErroresTienda;
} {
  const horarios = (datos.horarioSemanal ?? {}) as Record<
    string,
    { activo?: unknown; rango?: unknown }
  >;

  const borrador: BorradorTienda = {
    nombre: texto(datos.nombre),
    dueno: texto(datos.dueno),
    categoria: texto(datos.categoria),
    pasaje: texto(datos.pasaje),
    casa: texto(datos.casa),
    referencia: texto(datos.referencia),
    lat: texto(datos.lat),
    lng: texto(datos.lng),
    horarioSemanal: {
      lun: horario(horarios.lun),
      mar: horario(horarios.mar),
      mie: horario(horarios.mie),
      jue: horario(horarios.jue),
      vie: horario(horarios.vie),
      sab: horario(horarios.sab),
      dom: horario(horarios.dom),
    },
    productosPermitidos: Array.isArray(datos.productosPermitidos)
      ? datos.productosPermitidos.map(texto)
      : [],
    productosRestringidos: Array.isArray(datos.productosRestringidos)
      ? datos.productosRestringidos.map(texto)
      : [],
    autorizadosDesde: texto(datos.autorizadosDesde),
    nota: texto(datos.nota),
    residentesBeneficiados: texto(datos.residentesBeneficiados),
    ahorroMensualEstimado: texto(datos.ahorroMensualEstimado),
    ingresoProyectadoCuota: texto(datos.ingresoProyectadoCuota),
    minutosTrayectoEvitado: texto(datos.minutosTrayectoEvitado),
    viajesSemanalesEvitados: texto(datos.viajesSemanalesEvitados),
  };

  const errores = validarTienda(borrador);

  return Object.keys(errores).length > 0
    ? { ok: false, errores }
    : { ok: true, valor: borrador, errores };
}

function horario(valor: unknown): { activo: boolean; rango: string } {
  const dato = (valor ?? {}) as { activo?: unknown; rango?: unknown };
  return {
    activo: dato.activo === true,
    rango: texto(dato.rango),
  };
}