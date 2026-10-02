/**
 * Tipos del dominio. El estado global y los datos de `data/` deben
 * cumplir estas formas; cambiar un tipo aquí obliga a revisar `data/tiendas.ts`.
 */

export type TiendaId = string;

export type DiaSemana = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";

export type TipoIncidente =
  | "ruido"
  | "basura"
  | "estacionamiento"
  | "seguridad"
  | "otro";

export type EstadoReporte = "activo" | "resuelto";

export type TipoSeguimientoReporte =
  | "accion"
  | "ronda"
  | "evidencia"
  | "resolucion"
  | "reapertura";

export type TabId =
  | "perfil"
  | "quejas"
  | "cumplimiento"
  | "beneficio";

/**
 * Rubros admitidos dentro de la residencial.
 *
 * Es una unión cerrada a propósito: el formulario de alta ofrece un `Select`
 * con estas opciones en vez de un texto libre, de modo que el mismo rubro nunca
 * queda escrito de dos formas distintas.
 */
export type CategoriaTienda =
  | "abarrotes"
  | "panaderia"
  | "carniceria"
  | "fruteria"
  | "lacteos"
  | "ferreteria"
  | "farmacia"
  | "salon"
  | "otro";

export interface HorarioDia {
  activo: boolean;
  /** Rango ya formateado para pantalla, p. ej. "06:00 – 09:00" */
  rango: string;
}

export interface MetricasTienda {
  /** Ahorro mensual estimado de los residentes que compran aquí, en USD. */
  ahorroMensualEstimado: number;
  /** Residentes de la residencial que compran en esta tienda. */
  residentesBeneficiados: number;
  /** Proyección de la cuota de condominio que financiaría esta tienda, USD/mes. */
  ingresoProyectadoCuota: number;
  /** Minutos de trayecto que se ahorran por viaje al mercado externo. */
  minutosTrayectoEvitado: number;
  /** Viajes al mercado externo evitados por semana, por resident. */
  viajesSemanalesEvitados: number;
}

/** Punto en la residencial. Coordenadas aproximadas, no un GPS de dirección. */
export interface UbicacionTienda {
  /** Pasaje de la residencial. */
  pasaje: string;
  /** Casa o puesto. */
  casa: string;
  /** Referencia legible para quien no conoce la residencial. */
  referencia: string;
  /** Coordenadas aproximadas en el plano de la residencial. Opcionales. */
  coordenadas?: { lat: number; lng: number };
}

export interface Tienda {
  id: TiendaId;
  /**
   * Código corto y único que se muestra en la ficha y en el local, como una
   * licencia: `EPS-0001`. Es la forma de referirse a una tienda sin ambigüedad
   * y de escanearla sin depender del nombre, que se puede repetir.
   */
  codigo: string;
  nombre: string;
  /** Nombre completo de la persona dueña. */
  dueno: string;
  /** Rol dentro del sistema, tal como se muestra en la ficha. */
  rol: string;
  /** Iniciales del avatar. Dos letras. */
  iniciales: string;
  /** Rubro admitido por la Junta. */
  categoria: CategoriaTienda;
  /**
   * Dónde está la tienda.
   *
   * Antes eran dos campos sueltos (`pasaje` y `casa`). Se agrupan aquí para
   * que "ubicación" sea una sola cosa en el formulario de alta y para poder
   * sumar la referencia y las coordenadas sin volver a dispersar el lugar.
   */
  ubicacion: UbicacionTienda;
  /** Franja horaria autorizada, resumida. */
  horarioAutorizado: string;
  autorizadoDesde: string;
  horarioSemanal: Record<DiaSemana, HorarioDia>;
  productosPermitidos: string[];
  productosRestringidos: string[];
  metricas: MetricasTienda;
  /** Frase corta de contexto, visible en la ficha. */
  nota: string;
}

/**
 * Tienda recién construida, todavía sin código.
 *
 * El código lo asigna la base con su secuencia cuando inserta la fila, así que
 * ni `data/tiendas.ts` ni el formulario de alta pueden inventarlo: es el mismo
 * trato que reciben los reportes con su folio. Lo que sale de la base siempre
 * trae el código puesto.
 */
export type TiendaSinCodigo = Omit<Tienda, "codigo">;

/**
 * Opinión pública de quien estuvo en la tienda.
 *
 * Se registra de una a cinco estrellas. Una reseña de una sola estrella es
 * además una denuncia: `denuncia` viene en `true` y hay un `Reporte` con folio
 * detrás, con lo que la Junta puede resolverla como cualquier otra. Las de dos
 * a cinco son opinión y no mueven el puntaje.
 */
export interface Resena {
  id: string;
  tiendaId: TiendaId;
  estrellas: number;
  comentario: string;
  /** Nombre de quien escribió, o vacío si dejó la reseña en anónimo. */
  autor: string;
  anonimo: boolean;
  /** `true` si esta reseña abrió una denuncia con folio. */
  denuncia: boolean;
  creadoEn: string;
}

/** Reporte declarado en el archivo de configuración, con fecha relativa. */
export interface Reporte {
  id: string;
  folio: number;
  tiendaId: TiendaId;
  tipo: TipoIncidente;
  descripcion: string;
  anonimo: boolean;
  estado: EstadoReporte;
  creadoEn: string;
  accionCorrectiva: string | null;
  responsable: string | null;
  fechaLimite: string | null;
  seguimientos: SeguimientoReporte[];
}

export interface SeguimientoReporte {
  id: string;
  tipo: TipoSeguimientoReporte;
  detalle: string;
  responsable: string | null;
  evidenciaUrl: string | null;
  creadoEn: string;
}

/**
 * Cómo se ve la opinión pública de una tienda.
 *
 * Es lo que necesita la ficha y el directorio: el promedio, cuántas reseñas hay
 * de cada estrella y las reseñas mismas para leerlas.
 */
export interface Opinion {
  /** Promedio de estrellas, de 0 a 5. `0` si todavía no hay reseñas. */
  promedio: number;
  /** Número de reseñas, sin contar los reportes que no vinieron de una reseña. */
  total: number;
  /** Cuántas hay de cada estrella, de cinco estrellas a una. */
  reparto: { estrellas: number; cantidad: number }[];
  resenas: Resena[];
}

/**
 * Estado completo del sistema: el catálogo de comercios, el historial de
 * denuncias y las reseñas públicas.
 *
 * Es lo que devuelve la base de datos y lo que recibe el tablero. Vive aquí,
 * en lugar de junto al código de SQL, porque lo consumen tanto el servidor
 * como el cliente y el cliente no puede importar el módulo de la base.
 */
export interface EstadoSistema {
  tiendas: Tienda[];
  reportes: Reporte[];
  resenas: Resena[];
}
