import { VENTANA_CUMPLIMIENTO_DIAS } from "@/data/tiendas";
import type {
  CategoriaConducta,
  GravedadInfraccion,
  Reporte,
  TipoIncidente,
} from "@/types";

const DIA_MS = 86_400_000;

export type RangoCumplimiento = "optimo" | "observacion" | "revision";

export interface ResultadoCumplimiento {
  puntaje: number;
  activos: number;
  resueltos: number;
  rango: RangoCumplimiento;
  etiqueta: string;
  color: string;
  fondo: string;
}

const RANGOS: Record<
  RangoCumplimiento,
  { etiqueta: string; color: string; fondo: string }
> = {
  optimo: {
    etiqueta: "Estado Verde",
    color: "var(--semaforo-verde)",
    fondo: "var(--semaforo-verde-fondo)",
  },
  observacion: {
    etiqueta: "Estado Amarillo",
    color: "var(--semaforo-amarillo)",
    fondo: "var(--semaforo-amarillo-fondo)",
  },
  revision: {
    etiqueta: "Estado Rojo",
    color: "var(--semaforo-rojo)",
    fondo: "var(--semaforo-rojo-fondo)",
  },
};

const PUNTOS: Record<GravedadInfraccion, number> = {
  leve: 10,
  grave: 20,
  muy_grave: 40,
};

const CATEGORIA_POR_TIPO: Record<TipoIncidente, CategoriaConducta> = {
  horario_menor: "horarios_proveedores",
  proveedores_fuera_horario: "horarios_proveedores",
  ruido: "convivencia_ruidos_circulacion",
  seguridad: "convivencia_ruidos_circulacion",
  estacionamiento: "convivencia_ruidos_circulacion",
  venta_visitantes: "convivencia_ruidos_circulacion",
  permisos_sanitarios: "sanitaria_productos",
  productos_no_autorizados: "sanitaria_productos",
  alcohol_tabaco_sustancias: "sanitaria_productos",
  basura: "sanitaria_productos",
  distintivo: "publicidad_fachadas",
  empaque_limpieza: "sanitaria_productos",
  alteracion_arquitectonica: "publicidad_fachadas",
  desacato: "convivencia_ruidos_circulacion",
  otro: "sanitaria_productos",
};

const GRAVEDAD_POR_TIPO: Record<TipoIncidente, GravedadInfraccion> = {
  horario_menor: "leve",
  distintivo: "leve",
  empaque_limpieza: "leve",
  ruido: "grave",
  seguridad: "grave",
  estacionamiento: "grave",
  venta_visitantes: "grave",
  proveedores_fuera_horario: "grave",
  permisos_sanitarios: "grave",
  productos_no_autorizados: "grave",
  alcohol_tabaco_sustancias: "muy_grave",
  alteracion_arquitectonica: "muy_grave",
  desacato: "muy_grave",
  basura: "leve",
  otro: "grave",
};

export function categoriaDeTipo(tipo: TipoIncidente): CategoriaConducta {
  return CATEGORIA_POR_TIPO[tipo];
}

export function gravedadBaseDeTipo(tipo: TipoIncidente): GravedadInfraccion {
  return GRAVEDAD_POR_TIPO[tipo];
}

function puntosEnFecha(reporte: Reporte, fecha: number): number {
  if (
    !reporte.validado ||
    !reporte.gravedad ||
    !reporte.validadoEn
  ) {
    return 0;
  }

  const validadoEn = new Date(reporte.validadoEn).getTime();
  if (
    fecha < validadoEn ||
    fecha >= validadoEn + VENTANA_CUMPLIMIENTO_DIAS * DIA_MS
  ) {
    return 0;
  }

  const impugnacionEn = reporte.impugnacionEn
    ? new Date(reporte.impugnacionEn).getTime()
    : Number.POSITIVE_INFINITY;
  const resueltaEn = reporte.resueltaImpugnacionEn
    ? new Date(reporte.resueltaImpugnacionEn).getTime()
    : Number.POSITIVE_INFINITY;
  if (
    fecha >= impugnacionEn &&
    (reporte.impugnacionEstado === "pendiente" ||
      reporte.impugnacionEstado === "revocada" ||
      (reporte.impugnacionEstado === "confirmada" && fecha < resueltaEn))
  ) {
    return 0;
  }

  const puntos = PUNTOS[reporte.gravedad];
  if (
    reporte.gravedad === "leve" &&
    reporte.subsanadoEn &&
    reporte.fechaSubsanacion &&
    fecha >= new Date(reporte.subsanadoEn).getTime() &&
    new Date(reporte.subsanadoEn).getTime() <=
      new Date(reporte.fechaSubsanacion).getTime()
  ) {
    return puntos / 2;
  }

  return puntos;
}

export function puntosDeReporte(reporte: Reporte, ahora = Date.now()): number {
  return puntosEnFecha(reporte, ahora);
}

export function rangoDePuntaje(puntaje: number): RangoCumplimiento {
  if (puntaje >= 80) return "optimo";
  if (puntaje >= 40) return "observacion";
  return "revision";
}

export function dentroDeVentana(creadoEn: string, ahora = Date.now()): boolean {
  const fecha = new Date(creadoEn).getTime();
  return fecha <= ahora && ahora - fecha < VENTANA_CUMPLIMIENTO_DIAS * DIA_MS;
}

export function reportesActivosDe(
  reportes: Reporte[],
  tiendaId: string,
  ahora = Date.now(),
): Reporte[] {
  return reportes.filter(
    (reporte) => reporte.tiendaId === tiendaId && puntosDeReporte(reporte, ahora) > 0,
  );
}

export function reportesResueltosDe(
  reportes: Reporte[],
  tiendaId: string,
): Reporte[] {
  return reportes.filter(
    (reporte) => reporte.tiendaId === tiendaId && reporte.estado === "resuelto",
  );
}

export function incidentesDe(
  reportes: Reporte[],
  tiendaId: string,
  ahora = Date.now(),
): number {
  return reportesActivosDe(reportes, tiendaId, ahora).length;
}

export function persisteEstadoAmarillo(
  reportes: Reporte[],
  tiendaId: string,
  ahora = Date.now(),
): boolean {
  const deLaTienda = reportes.filter((reporte) => reporte.tiendaId === tiendaId);
  const eventos = deLaTienda.flatMap((reporte) => {
    if (!reporte.validado || !reporte.gravedad || !reporte.validadoEn) return [];
    const validado = new Date(reporte.validadoEn).getTime();
    const vence = validado + VENTANA_CUMPLIMIENTO_DIAS * DIA_MS;
    return [
      validado,
      vence,
      ...(reporte.gravedad === "leve" &&
      reporte.subsanadoEn &&
      reporte.fechaSubsanacion &&
      new Date(reporte.subsanadoEn).getTime() <=
        new Date(reporte.fechaSubsanacion).getTime()
        ? [new Date(reporte.subsanadoEn).getTime()]
        : []),
      ...(reporte.impugnacionEn
        ? [new Date(reporte.impugnacionEn).getTime()]
        : []),
      ...(reporte.resueltaImpugnacionEn
        ? [new Date(reporte.resueltaImpugnacionEn).getTime()]
        : []),
    ];
  });
  if (eventos.length === 0) return false;

  const eventosOrdenados = [...new Set(eventos.filter((fecha) => fecha <= ahora))]
    .sort((a, b) => a - b);
  let amarilloDesde: number | null = null;

  for (const fecha of eventosOrdenados) {
    const puntaje = Math.max(
      0,
      100 - deLaTienda.reduce(
        (total, reporte) => total + puntosEnFecha(reporte, fecha),
        0,
      ),
    );
    const amarillo = puntaje >= 40 && puntaje <= 79;
    if (amarillo && amarilloDesde === null) amarilloDesde = fecha;
    if (!amarillo) amarilloDesde = null;
  }

  const puntajeActual = Math.max(
    0,
    100 - deLaTienda.reduce(
      (total, reporte) => total + puntosEnFecha(reporte, ahora),
      0,
    ),
  );
  return (
    amarilloDesde !== null &&
    puntajeActual >= 40 &&
    puntajeActual <= 79 &&
    ahora - amarilloDesde > 30 * DIA_MS
  );
}

export function calcularCumplimiento(
  reportes: Reporte[],
  tiendaId: string,
  ahora = Date.now(),
): ResultadoCumplimiento {
  const activos = reportesActivosDe(reportes, tiendaId, ahora);
  const resueltos = reportesResueltosDe(reportes, tiendaId).length;
  const puntaje = Math.max(
    0,
    100 - activos.reduce((total, reporte) => total + puntosDeReporte(reporte, ahora), 0),
  );
  const rango = rangoDePuntaje(puntaje);

  return {
    puntaje,
    activos: activos.length,
    resueltos,
    rango,
    etiqueta: RANGOS[rango].etiqueta,
    color: RANGOS[rango].color,
    fondo: RANGOS[rango].fondo,
  };
}

export function sumarDiasHabiles(fecha: Date, dias: number): Date {
  const resultado = new Date(fecha);
  let sumados = 0;

  while (sumados < dias) {
    resultado.setUTCDate(resultado.getUTCDate() + 1);
    if (resultado.getUTCDay() !== 0) sumados += 1;
  }

  return resultado;
}

export function dentroDeVentanaSeisMeses(
  fechaRecibida: string | Date,
  ahora = Date.now(),
): boolean {
  const fecha = typeof fechaRecibida === "string" ? new Date(fechaRecibida) : fechaRecibida;
  if (fecha.getTime() > ahora) return false;
  const limite = new Date(fecha);
  const dia = limite.getUTCDate();
  limite.setUTCDate(1);
  limite.setUTCMonth(limite.getUTCMonth() + 6);
  const ultimoDia = new Date(
    Date.UTC(limite.getUTCFullYear(), limite.getUTCMonth() + 1, 0),
  ).getUTCDate();
  limite.setUTCDate(Math.min(dia, ultimoDia));
  return limite.getTime() >= ahora;
}

export function limiteHistorialSeisMeses(ahora = new Date()): Date {
  const limite = new Date(ahora);
  const dia = limite.getUTCDate();
  limite.setUTCDate(1);
  limite.setUTCMonth(limite.getUTCMonth() - 6);
  const ultimoDia = new Date(
    Date.UTC(limite.getUTCFullYear(), limite.getUTCMonth() + 1, 0),
  ).getUTCDate();
  limite.setUTCDate(Math.min(dia, ultimoDia));
  return limite;
}

export function requiereGravePorReincidencia(
  historial: Reporte[],
  tiendaId: string,
  categoria: CategoriaConducta,
  ahora = Date.now(),
): boolean {
  return historial.some((reporte) => {
    if (
      reporte.tiendaId !== tiendaId ||
      !reporte.validado ||
      reporte.categoriaConducta !== categoria ||
      !reporte.validadoEn ||
      reporte.impugnacionEstado === "pendiente" ||
      reporte.gravedad !== "leve" ||
      !dentroDeVentanaSeisMeses(reporte.validadoEn, ahora)
    ) {
      return false;
    }

    return reporte.impugnacionEstado !== "revocada";
  });
}

export function reincidenciaValidada(
  historial: Reporte[],
  tiendaId: string,
  categoria: CategoriaConducta,
  gravedad: GravedadInfraccion,
  ahora = Date.now(),
): boolean {
  return historial.some(
    (reporte) =>
      reporte.tiendaId === tiendaId &&
      reporte.validado &&
      reporte.gravedad === gravedad &&
      reporte.categoriaConducta === categoria &&
      reporte.validadoEn !== null &&
      reporte.impugnacionEstado !== "pendiente" &&
      reporte.impugnacionEstado !== "revocada" &&
      dentroDeVentanaSeisMeses(reporte.validadoEn, ahora),
  );
}

export const REGLA_CUMPLIMIENTO =
  "Puntaje = 100 − puntos de infracciones validadas en los últimos 30 días. Leve: −10 (−5 si se subsana a tiempo); grave: −20; muy grave: −40. Reportes impugnados en trámite quedan suspendidos.";

export const UMBRALES = [
  { rango: "optimo" as const, desde: 80, hasta: 100, etiqueta: "Estado Verde", color: RANGOS.optimo.color },
  { rango: "observacion" as const, desde: 40, hasta: 79, etiqueta: "Estado Amarillo", color: RANGOS.observacion.color },
  { rango: "revision" as const, desde: 0, hasta: 39, etiqueta: "Estado Rojo", color: RANGOS.revision.color },
];
