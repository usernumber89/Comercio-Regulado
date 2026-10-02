import { VENTANA_CUMPLIMIENTO_DIAS } from "@/data/tiendas";
import type { Reporte } from "@/types";

const DIA_MS = 86_400_000;

export type RangoCumplimiento = "optimo" | "observacion" | "revision";

export interface ResultadoCumplimiento {
  /** 0 a 100. Es lo que se muestra dentro del anillo. */
  puntaje: number;
  /** Incidentes abiertos en la ventana de 30 días: denuncias y reseñas de 1★. */
  activos: number;
  /** Denuncias resueltas, para contexto. */
  resueltos: number;
  rango: RangoCumplimiento;
  etiqueta: string;
  /** Variable CSS del trazo del anillo. Variante de texto, siempre AA. */
  color: string;
  /** Variable CSS del fondo lavado que acompaña al color. */
  fondo: string;
}

const RANGOS: Record<
  RangoCumplimiento,
  { etiqueta: string; color: string; fondo: string }
> = {
  optimo: {
    etiqueta: "En rango",
    color: "var(--semaforo-verde)",
    fondo: "var(--semaforo-verde-fondo)",
  },
  observacion: {
    etiqueta: "En observacion",
    color: "var(--semaforo-amarillo)",
    fondo: "var(--semaforo-amarillo-fondo)",
  },
  revision: {
    etiqueta: "En revision",
    color: "var(--semaforo-rojo)",
    fondo: "var(--semaforo-rojo-fondo)",
  },
};

/** Etiquetas con tilde ya resueltas, para mostrar en pantalla. */
const ETIQUETAS: Record<RangoCumplimiento, string> = {
  optimo: "Comercio ejemplar",
  observacion: "Advertencia preventiva",
  revision: "Incumplimiento crítico",
};

export function rangoDePuntaje(puntaje: number): RangoCumplimiento {
  if (puntaje >= 80) return "optimo";
  if (puntaje >= 40) return "observacion";
  return "revision";
}

/** ¿Está el hecho dentro de la ventana de 30 días? */
export function dentroDeVentana(creadoEn: string, ahora = Date.now()): boolean {
  return ahora - new Date(creadoEn).getTime() <= VENTANA_CUMPLIMIENTO_DIAS * DIA_MS;
}

/** Denuncias activas que cuentan para el puntaje. */
export function reportesActivosDe(
  reportes: Reporte[],
  tiendaId: string,
  ahora = Date.now(),
): Reporte[] {
  return reportes.filter(
    (r) =>
      r.tiendaId === tiendaId &&
      r.estado === "activo" &&
      dentroDeVentana(r.creadoEn, ahora),
  );
}

/** Denuncias resueltas de una tienda, sin filtrar por ventana. */
export function reportesResueltosDe(
  reportes: Reporte[],
  tiendaId: string,
): Reporte[] {
  return reportes.filter((r) => r.tiendaId === tiendaId && r.estado === "resuelto");
}

/** Cuántos incidentes tiene abiertos una tienda dentro de la ventana. */
export function incidentesDe(
  reportes: Reporte[],
  tiendaId: string,
  ahora = Date.now(),
): number {
  return reportesActivosDe(reportes, tiendaId, ahora).length;
}

/**
 * Puntaje de cumplimiento de una tienda.
 *
 * La regla: 100 menos veinte puntos por cada incidente abierto dentro de los
 * últimos treinta días, con tope inferior en cero.
 *
 *   0 incidentes -> 100
 *   1 incidente  -> 80   (verde)
 *   2 incidentes -> 60   (ámbar)
 *   3 incidentes -> 40   (ámbar)
 *   4 incidentes -> 20   (rojo)
 *
 * Un incidente es una denuncia activa. Una reseña de una sola estrella cuenta
 * como denuncia porque `registrarResena()` abre el reporte al guardarla, así
 * que llega en esta misma lista y no se suma dos veces. Las reseñas de dos a
 * cinco estrellas no restan nada —para eso están las estrellas, no el
 * puntaje—.
 */
export function calcularCumplimiento(
  reportes: Reporte[],
  tiendaId: string,
  ahora = Date.now(),
): ResultadoCumplimiento {
  const activos = incidentesDe(reportes, tiendaId, ahora);
  const resueltos = reportesResueltosDe(reportes, tiendaId).length;
  const puntaje = Math.max(0, 100 - 20 * activos);
  const rango = rangoDePuntaje(puntaje);

  return {
    puntaje,
    activos,
    resueltos,
    rango,
    etiqueta: ETIQUETAS[rango],
    color: RANGOS[rango].color,
    fondo: RANGOS[rango].fondo,
  };
}

/** Descripción de la regla, para mostrar junto al puntaje. */
export const REGLA_CUMPLIMIENTO =
  "Puntaje = 100 − 20 por cada incidente abierto en los últimos 30 días. Una reseña de una sola estrella abre una denuncia y cuenta igual.";

/** Umbrales que definen cada rango, para la leyenda del tab. */
export const UMBRALES = [
  {
    rango: "optimo" as const,
    desde: 80,
    hasta: 100,
    etiqueta: ETIQUETAS.optimo,
    color: RANGOS.optimo.color,
  },
  {
    rango: "observacion" as const,
    desde: 40,
    hasta: 79,
    etiqueta: ETIQUETAS.observacion,
    color: RANGOS.observacion.color,
  },
  {
    rango: "revision" as const,
    desde: 0,
    hasta: 39,
    etiqueta: ETIQUETAS.revision,
    color: RANGOS.revision.color,
  },
];
