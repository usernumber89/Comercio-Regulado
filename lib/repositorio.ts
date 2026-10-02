import { obtenerPrisma } from "@/lib/db";
import { construirTienda, generarId } from "@/lib/tienda-formulario";
import type { BorradorTienda } from "@/lib/tienda-formulario";
import { Prisma } from "@/prisma/generated/client";
import type {
  Resena as FilaResena,
  SeguimientoReporte as FilaSeguimientoReporte,
  Tienda as FilaTienda,
} from "@/prisma/generated/client";
import type {
  CategoriaTienda,
  DiaSemana,
  EstadoSistema,
  HorarioDia,
  Opinion,
  Reporte,
  Resena,
  SeguimientoReporte,
  Tienda,
  TiendaId,
  TiendaSinCodigo,
} from "@/types";

export type { EstadoSistema };

/* ==========================================================================
   LECTURA Y ESCRITURA
   --------------------------------------------------------------------------
   Todas las consultas viven aquí. Los Route Handlers en `app/api/` solo llaman
   a estas funciones, así que las reglas de negocio (qué se puede borrar, de
   dónde sale el folio, cuándo se siembra el catálogo) están en un solo lugar.

   Todas son `async`: la base está en Neon, al otro lado de la red, así que
   cada llamada espera un viaje de ida y vuelta. Quien llama tiene que esperar
   con `await`, y eso también se refleja en las páginas y rutas del proyecto.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Traducción entre la base y el dominio
   --------------------------------------------------------------------------
   Las filas que devuelve Prisma y los objetos de `types/index.ts` no son lo
   mismo: la base guarda las coordenadas en dos columnas planas, los horarios
   en un `Json` y las fechas como `Date`. Estas funciones son el único lugar
   donde se hace esa traducción, en las dos direcciones.
   -------------------------------------------------------------------------- */

/** Una lista de `Json` a `string[]`. Lo que no sea lista, se pierde. */
function lista(valor: Prisma.JsonValue): string[] {
  return Array.isArray(valor) ? valor.map(String) : [];
}

/**
 * El dominio sabe qué hay en cada columna `Json` (los horarios son siete
 * claves conocidas, los productos son texto) y Postgres solo sabe que es un
 * JSON cualquiera. Esta función es el puente: como la base solo recibe lo
 * que escribimos nosotros, la traducción se puede hacer de una vez.
 */
function comoJson(valor: object): Prisma.InputJsonObject {
  return valor as unknown as Prisma.InputJsonObject;
}

/** Un `Json` a los horarios de la semana. Lo que no sea objeto, se pierde. */
function objeto(valor: Prisma.JsonValue): Record<DiaSemana, HorarioDia> {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return {} as Record<DiaSemana, HorarioDia>;
  }

  return valor as unknown as Record<DiaSemana, HorarioDia>;
}

function aTienda(fila: FilaTienda): Tienda {
  return {
    id: fila.id,
    codigo: fila.codigo,
    nombre: fila.nombre,
    dueno: fila.dueno,
    rol: fila.rol,
    iniciales: fila.iniciales,
    categoria: fila.categoria as CategoriaTienda,
    ubicacion: {
      pasaje: fila.pasaje,
      casa: fila.casa,
      referencia: fila.referencia,
      ...(fila.lat !== null && fila.lng !== null
        ? { coordenadas: { lat: fila.lat, lng: fila.lng } }
        : {}),
    },
    horarioAutorizado: fila.horarioAutorizado,
    autorizadoDesde: fila.autorizadoDesde,
    horarioSemanal: objeto(fila.horarioSemanal),
    productosPermitidos: lista(fila.productosPermitidos),
    productosRestringidos: lista(fila.productosRestringidos),
    metricas: {
      ahorroMensualEstimado: fila.ahorroMensual,
      residentesBeneficiados: fila.residentesBeneficiados,
      ingresoProyectadoCuota: fila.ingresoCuota,
      minutosTrayectoEvitado: fila.minutosTrayecto,
      viajesSemanalesEvitados: fila.viajesSemanales,
    },
    nota: fila.nota,
  };
}

type FilaReporteConSeguimientos = Prisma.ReporteGetPayload<{
  include: { seguimientos: true };
}>;

function aSeguimiento(fila: FilaSeguimientoReporte): SeguimientoReporte {
  return {
    id: fila.id,
    tipo: fila.tipo,
    detalle: fila.detalle,
    responsable: fila.responsable,
    evidenciaUrl: fila.evidenciaUrl,
    creadoEn: fila.creadoEn.toISOString(),
  };
}

function aReporte(fila: FilaReporteConSeguimientos): Reporte {
  return {
    id: fila.id,
    folio: fila.folio,
    tiendaId: fila.tiendaId,
    tipo: fila.tipo,
    descripcion: fila.descripcion,
    anonimo: fila.anonimo,
    estado: fila.estado,
    creadoEn: fila.creadoEn.toISOString(),
    accionCorrectiva: fila.accionCorrectiva,
    responsable: fila.responsable,
    fechaLimite: fila.fechaLimite?.toISOString() ?? null,
    seguimientos: fila.seguimientos.map(aSeguimiento),
  };
}

function aResena(fila: FilaResena): Resena {
  return {
    id: fila.id,
    tiendaId: fila.tiendaId,
    estrellas: fila.estrellas,
    comentario: fila.comentario,
    autor: fila.autor,
    anonimo: fila.anonimo,
    denuncia: fila.denuncia,
    creadoEn: fila.creadoEn.toISOString(),
  };
}

/**
 * Siguiente código de tienda, del tipo `EPS-0004`.
 *
 * Sale de una secuencia de PostgreSQL en vez de contar las tiendas porque dos
 * altas simultáneas podrían sacar el mismo número. El `LPAD` pone los ceros a la
 * izquierda para que el código siempre tenga la misma largura y se pueda
 * ordenar y comparar como texto.
 */
async function siguienteCodigoTienda(
  db: ReturnType<typeof obtenerPrisma>,
): Promise<string> {
  const [fila] = await db.$queryRaw<{ numero: bigint }[]>`
    SELECT nextval('"codigo_tienda_seq"') AS numero
  `;

  return `EPS-${fila.numero.toString().padStart(4, "0")}`;
}

/**
 * Una tienda del dominio, lista para `INSERT`.
 *
 * Recibe el código aparte porque no viene en el objeto: lo decide la secuencia
 * de la base en el momento del alta, no quien construyó la tienda.
 */
function camposTienda(tienda: TiendaSinCodigo) {
  return {
    nombre: tienda.nombre,
    dueno: tienda.dueno,
    rol: tienda.rol,
    iniciales: tienda.iniciales,
    categoria: tienda.categoria,
    pasaje: tienda.ubicacion.pasaje,
    casa: tienda.ubicacion.casa,
    referencia: tienda.ubicacion.referencia,
    lat: tienda.ubicacion.coordenadas?.lat ?? null,
    lng: tienda.ubicacion.coordenadas?.lng ?? null,
    horarioAutorizado: tienda.horarioAutorizado,
    autorizadoDesde: tienda.autorizadoDesde,
    horarioSemanal: comoJson(tienda.horarioSemanal),
    productosPermitidos: tienda.productosPermitidos,
    productosRestringidos: tienda.productosRestringidos,
    ahorroMensual: tienda.metricas.ahorroMensualEstimado,
    residentesBeneficiados: tienda.metricas.residentesBeneficiados,
    ingresoCuota: tienda.metricas.ingresoProyectadoCuota,
    minutosTrayecto: tienda.metricas.minutosTrayectoEvitado,
    viajesSemanales: tienda.metricas.viajesSemanalesEvitados,
    nota: tienda.nota,
  };
}

function aFilaTienda(
  tienda: TiendaSinCodigo,
  base: boolean,
  creadaEn: Date,
  codigo: string,
): Prisma.TiendaUncheckedCreateInput {
  return {
    id: tienda.id,
    codigo,
    ...camposTienda(tienda),
    base,
    creadaEn,
  };
}

/** `true` si la base rechazó la escritura por una clave repetida. */
function esClaveDuplicada(fallo: unknown): boolean {
  return (
    fallo instanceof Prisma.PrismaClientKnownRequestError && fallo.code === "P2002"
  );
}

/* --------------------------------------------------------------------------
   Tiendas
   -------------------------------------------------------------------------- */

/** Comercios registrados, ordenados por fecha y nombre. */
export async function listarTiendas(): Promise<Tienda[]> {
  const filas = await obtenerPrisma().tienda.findMany({
    orderBy: [{ creadaEn: "asc" }, { nombre: "asc" }],
  });

  return filas.map(aTienda);
}

export async function obtenerTienda(id: string): Promise<Tienda | undefined> {
  const fila = await obtenerPrisma().tienda.findUnique({ where: { id } });

  return fila ? aTienda(fila) : undefined;
}

/** Comercio que se abre por defecto; cadena vacía cuando aún no hay registros. */
export async function tiendaPorDefecto(): Promise<TiendaId> {
  const primera = await obtenerPrisma().tienda.findFirst({
    orderBy: [{ creadaEn: "asc" }, { nombre: "asc" }],
    select: { id: true },
  });

  return primera?.id ?? "";
}

/**
 * Da de alta una tienda.
 *
 * El identificador sale del nombre, igual que antes. Si ya existe, se prueba
 * con el siguiente sufijo y se reintenta: se deja que sea la base la que
 * rechace el duplicado en vez de preguntarle antes qué ids hay, porque entre
 * la consulta y el `INSERT` otra persona puede dar de alta la misma tienda.
 */
export async function crearTienda(borrador: BorradorTienda): Promise<Tienda> {
  const db = obtenerPrisma();
  const base = generarId(borrador.nombre, []);

  for (let intento = 1; ; intento += 1) {
    const tienda = construirTienda(
      borrador,
      intento === 1 ? base : `${base}-${intento}`,
    );

    try {
      // Se inserta y se devuelve lo que quedó guardado, con el código que le
      // asignó la secuencia: eso y no el objeto construido, que no lo tiene.
      const fila = await db.tienda.create({
        data: aFilaTienda(
          tienda,
          false,
          new Date(),
          await siguienteCodigoTienda(db),
        ),
      });
      return aTienda(fila);
    } catch (fallo) {
      if (!esClaveDuplicada(fallo)) throw fallo;
    }
  }
}

/** Actualiza una tienda sin cambiar su código ni su historial asociado. */
export async function actualizarTienda(
  id: string,
  borrador: BorradorTienda,
): Promise<Tienda | undefined> {
  const db = obtenerPrisma();
  const existente = await db.tienda.findUnique({ where: { id }, select: { id: true } });
  if (!existente) return undefined;

  const tienda = construirTienda(borrador, id);
  const fila = await db.tienda.update({
    where: { id },
    data: camposTienda(tienda),
  });

  return aTienda(fila);
}

/**
 * Borra un comercio y sus reportes. Estos se eliminan por cascada en la base.
 */
export async function eliminarTienda(id: string): Promise<boolean> {
  const resultado = await obtenerPrisma().tienda.deleteMany({
    where: { id },
  });

  return resultado.count > 0;
}

/* --------------------------------------------------------------------------
   Reportes
   -------------------------------------------------------------------------- */

/** Historial completo, del más reciente al más antiguo. */
export async function listarReportes(): Promise<Reporte[]> {
  const filas = await obtenerPrisma().reporte.findMany({
    orderBy: [{ creadoEn: "desc" }, { folio: "desc" }],
    include: { seguimientos: { orderBy: [{ creadoEn: "desc" }, { id: "desc" }] } },
  });

  return filas.map(aReporte);
}

export async function obtenerReporte(id: string): Promise<Reporte | undefined> {
  const fila = await obtenerPrisma().reporte.findUnique({
    where: { id },
    include: { seguimientos: { orderBy: [{ creadoEn: "desc" }, { id: "desc" }] } },
  });

  return fila ? aReporte(fila) : undefined;
}

/**
 * Registra una denuncia y devuelve el reporte ya guardado.
 *
 * El folio lo asigna la secuencia de PostgreSQL: dos personas que reporten en
 * el mismo segundo reciben números distintos sin que nadie tenga que hacer
 * nada. El `INSERT` ni siquiera menciona la columna.
 */
export async function registrarReporte(datos: {
  tiendaId: TiendaId;
  tipo: Reporte["tipo"];
  descripcion: string;
  anonimo: boolean;
}): Promise<Reporte> {
  const fila = await obtenerPrisma().reporte.create({
    data: {
      tiendaId: datos.tiendaId,
      tipo: datos.tipo,
      descripcion: datos.descripcion.trim(),
      anonimo: datos.anonimo,
    },
    include: { seguimientos: true },
  });

  return aReporte(fila);
}

/** Alterna entre activo y resuelto. Devuelve el reporte ya actualizado. */
export async function alternarEstadoReporte(
  id: string,
): Promise<Reporte | undefined> {
  const db = obtenerPrisma();

  const actual = await db.reporte.findUnique({
    where: { id },
    select: { estado: true },
  });

  if (!actual) return undefined;

  const siguiente = actual.estado === "activo" ? "resuelto" : "activo";

  const fila = await db.reporte.update({
    where: { id },
    data: {
      estado: siguiente,
      seguimientos: {
        create: {
          tipo: siguiente === "resuelto" ? "resolucion" : "reapertura",
          detalle:
            siguiente === "resuelto"
              ? "Reporte marcado como resuelto."
              : "Reporte reabierto para continuar el seguimiento.",
        },
      },
    },
    include: { seguimientos: { orderBy: [{ creadoEn: "desc" }, { id: "desc" }] } },
  });

  return aReporte(fila);
}

export async function registrarSeguimientoReporte(
  id: string,
  datos: {
    tipo: "accion" | "ronda" | "evidencia" | "resolucion";
    detalle: string;
    responsable: string | null;
    fechaLimite: string | null;
    evidenciaUrl: string | null;
  },
): Promise<Reporte | undefined> {
  const db = obtenerPrisma();
  const actual = await db.reporte.findUnique({
    where: { id },
    select: { estado: true },
  });

  if (!actual) return undefined;
  if (actual.estado === "resuelto") {
    throw new Error("Reabre el reporte antes de registrar más seguimiento.");
  }

  const fila = await db.reporte.update({
    where: { id },
    data: {
      ...(datos.tipo === "accion"
        ? {
            accionCorrectiva: datos.detalle,
            responsable: datos.responsable,
            fechaLimite: new Date(`${datos.fechaLimite}T00:00:00.000Z`),
          }
        : {}),
      ...(datos.tipo === "resolucion" ? { estado: "resuelto" as const } : {}),
      seguimientos: {
        create: {
          tipo: datos.tipo,
          detalle: datos.detalle,
          responsable: datos.responsable,
          evidenciaUrl: datos.evidenciaUrl,
        },
      },
    },
    include: { seguimientos: { orderBy: [{ creadoEn: "desc" }, { id: "desc" }] } },
  });

  return aReporte(fila);
}

/* --------------------------------------------------------------------------
   Reseñas
   --------------------------------------------------------------------------
   Opinión pública, sin moderación: lo que se escribe se publica. La única regla
   que decide algo es la estrella: una de una sola estrella es una denuncia, y
   por eso se escribe también en `Reporte`, con folio, para que la Junta pueda
   resolverla y para que el puntaje la cuente sin trabajo extra.
   -------------------------------------------------------------------------- */

/** Reseñas del sistema, de la más reciente a la más antigua. */
export async function listarResenas(): Promise<Resena[]> {
  const filas = await obtenerPrisma().resena.findMany({
    orderBy: [{ creadoEn: "desc" }, { id: "desc" }],
  });

  return filas.map(aResena);
}

/** Reseñas de una tienda, y su resumen: promedio y reparto por estrellas. */
export async function opinionDe(tiendaId: TiendaId): Promise<Opinion> {
  const resenas = await obtenerPrisma().resena.findMany({
    where: { tiendaId },
    orderBy: [{ creadoEn: "desc" }, { id: "desc" }],
  });

  return resumirOpinion(resenas.map(aResena));
}

/** El promedio, el reparto y las reseñas de una tienda. */
export function resumirOpinion(resenas: Resena[]): Opinion {
  const reparto = [5, 4, 3, 2, 1].map((estrellas) => ({
    estrellas,
    cantidad: resenas.filter((r) => r.estrellas === estrellas).length,
  }));

  const total = resenas.reduce((suma, r) => suma + r.estrellas, 0);

  return {
    promedio: resenas.length === 0 ? 0 : Math.round((total / resenas.length) * 10) / 10,
    total: resenas.length,
    reparto,
    resenas,
  };
}

/**
 * Guarda una reseña.
 *
 * Con una sola estrella escribe además una denuncia: la opinión más negativa
 * posible es la que el sistema tiene que poder resolver y contar. Se insertan
 * las dos filas sin transacción —sobre Neon no hay transacciones
 * interactivas—, así que la reseña se guarda primero: si la denuncia fallara,
 * lo que queda es una reseña de una estrella sin folio detrás, que es un dato
 * inútil pero no una pérdida. Al revés no valdría.
 */
export async function registrarResena(datos: {
  tiendaId: TiendaId;
  estrellas: number;
  comentario: string;
  autor: string;
  anonimo: boolean;
}): Promise<{ resena: Resena; reporte: Reporte | null }> {
  const db = obtenerPrisma();
  const comentario = datos.comentario.trim();
  const esDenuncia = datos.estrellas === 1;

  const resena = aResena(
    await db.resena.create({
      data: {
        tiendaId: datos.tiendaId,
        estrellas: datos.estrellas,
        comentario,
        autor: datos.anonimo ? "" : datos.autor.trim(),
        anonimo: datos.anonimo,
        denuncia: esDenuncia,
      },
    }),
  );

  if (!esDenuncia) return { resena, reporte: null };

  const reporte = await registrarReporte({
    tiendaId: datos.tiendaId,
    tipo: "otro",
    descripcion: comentario,
    anonimo: datos.anonimo,
  });

  return { resena, reporte };
}

/* --------------------------------------------------------------------------
   Estado completo y carga inicial
   -------------------------------------------------------------------------- */

/** Las tres listas que necesita el tablero, en una sola llamada. */
export async function obtenerEstado(): Promise<EstadoSistema> {
  // Las tres lecturas van juntas: sobre la red, tres consultas en paralelo son
  // una sola espera.
  const [tiendas, reportes, resenas] = await Promise.all([
    listarTiendas(),
    listarReportes(),
    listarResenas(),
  ]);

  return { tiendas, reportes, resenas };
}

/**
 * Todo lo que necesita la ficha pública de una tienda, en una sola lectura.
 *
 * La página `/tiendas/[id]` es un Server Component: no puede usar el store del
 * navegador, así que lee la tienda, sus reseñas y sus denuncias del servidor.
 * Los puntajes los arma `calcularCumplimiento`.
 */
export async function fichaDeTienda(
  tiendaId: TiendaId,
): Promise<
  | {
      tienda: Tienda;
      opinion: Opinion;
      reportes: Reporte[];
    }
  | undefined
> {
  // Las tres lecturas en paralelo: una sola espera de ida y vuelta.
  const [tienda, opinion, reportes] = await Promise.all([
    obtenerTienda(tiendaId),
    opinionDe(tiendaId),
    obtenerPrisma()
      .reporte.findMany({
        where: { tiendaId },
        orderBy: [{ creadoEn: "desc" }, { folio: "desc" }],
        include: { seguimientos: { orderBy: [{ creadoEn: "desc" }, { id: "desc" }] } },
      })
      .then((filas) => filas.map(aReporte)),
  ]);

  if (!tienda) return undefined;

  return { tienda, opinion, reportes };
}

