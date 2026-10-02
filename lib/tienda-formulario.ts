import {
  CATEGORIAS,
  HORARIO_POR_DEFECTO,
  obtenerCategoria,
  PRODUCTOS_RESTRINGIDOS_GLOBALES,
} from "@/data/tiendas";
import type { CategoriaTienda, DiaSemana, TiendaSinCodigo } from "@/types";
import type { Tienda } from "@/types";

/**
 * Validación y construcción de tiendas.
 *
 * Vive aparte del componente de formulario por dos razones: el HTML no valida
 * reglas de negocio (que el identificador sea único, que el rubro exista, que
 * los rangos horaires no se crucen) y porque así el mismo chequeo sirve si
 * más adelante el alta viene de un importador o de una API.
 */

export interface BorradorTienda {
  nombre: string;
  dueno: string;
  categoria: string;
  pasaje: string;
  casa: string;
  referencia: string;
  lat: string;
  lng: string;
  horarioSemanal: Record<DiaSemana, { activo: boolean; rango: string }>;
  productosPermitidos: string[];
  productosRestringidos: string[];
  autorizadosDesde: string;
  nota: string;
  residentesBeneficiados: string;
  ahorroMensualEstimado: string;
  ingresoProyectadoCuota: string;
  minutosTrayectoEvitado: string;
  viajesSemanalesEvitados: string;
}

export type ErroresTienda = Partial<Record<keyof BorradorTienda, string>>;

/** Estado inicial del formulario: horarios de lunes a viernes, cerrado el domingo. */
export function borradorVacio(): BorradorTienda {
  const semana: BorradorTienda["horarioSemanal"] = {
    lun: { activo: true, rango: HORARIO_POR_DEFECTO },
    mar: { activo: true, rango: HORARIO_POR_DEFECTO },
    mie: { activo: true, rango: HORARIO_POR_DEFECTO },
    jue: { activo: true, rango: HORARIO_POR_DEFECTO },
    vie: { activo: true, rango: HORARIO_POR_DEFECTO },
    sab: { activo: true, rango: "06:00 – 13:00" },
    dom: { activo: false, rango: "Cerrado" },
  };

  return {
    nombre: "",
    dueno: "",
    categoria: "abarrotes",
    pasaje: "",
    casa: "",
    referencia: "",
    lat: "",
    lng: "",
    horarioSemanal: semana,
    productosPermitidos: obtenerCategoria("abarrotes").productosSugeridos,
    productosRestringidos: [...PRODUCTOS_RESTRINGIDOS_GLOBALES],
    autorizadosDesde: "",
    nota: "",
    residentesBeneficiados: "",
    ahorroMensualEstimado: "",
    ingresoProyectadoCuota: "",
    minutosTrayectoEvitado: "",
    viajesSemanalesEvitados: "",
  };
}

const RE_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;

function numero(borrador: string, etiqueta: string, maximo: number): number {
  const limpio = borrador.trim();
  if (limpio === "") return 0;
  const valor = Number(limpio);
  if (!Number.isFinite(valor) || valor < 0) {
    throw new Error(`Ingresa un número válido para ${etiqueta}.`);
  }
  if (valor > maximo) {
    throw new Error(`${etiqueta} no puede superar ${maximo}.`);
  }
  return valor;
}

/** Valida el borrador y devuelve los errores por campo. Objeto vacío = válido. */
export function validarTienda(borrador: BorradorTienda): ErroresTienda {
  const errores: ErroresTienda = {};

  if (borrador.nombre.trim().length < 3) {
    errores.nombre = "Escribe el nombre de la tienda (mínimo 3 caracteres).";
  }
  if (borrador.dueno.trim().length < 3) {
    errores.dueno = "Escribe el nombre de quien es dueño o encargado.";
  }
  if (!CATEGORIAS.some((c) => c.id === borrador.categoria)) {
    errores.categoria = "Elige un rubro de la lista.";
  }
  if (borrador.pasaje.trim().length < 2) {
    errores.pasaje = "Indica el pasaje.";
  }
  if (borrador.casa.trim().length < 1) {
    errores.casa = "Indica la casa o el puesto.";
  }

  for (const coordenada of ["lat", "lng"] as const) {
    const bruto = borrador[coordenada].trim();
    if (bruto === "") continue;
    const valor = Number(bruto);
    if (!Number.isFinite(valor)) {
      errores[coordenada] = "Coordenada numérica inválida.";
      continue;
    }
    if (coordenada === "lat" && (valor < -90 || valor > 90)) {
      errores.lat = "La latitud va entre -90 y 90.";
    }
    if (coordenada === "lng" && (valor < -180 || valor > 180)) {
      errores.lng = "La longitud va entre -180 y 180.";
    }
  }

  // Al menos un día abierto: una tienda sin horario no se puede auditar.
  const abiertos = Object.values(borrador.horarioSemanal).filter((d) => d.activo);
  if (abiertos.length === 0) {
    errores.horarioSemanal = "Activa al menos un día de atención.";
  }

  for (const dia of abiertos) {
    const partes = dia.rango.split("–").map((p) => p.trim());
    if (partes.length !== 2 || !partes.every((p) => RE_HORA.test(p))) {
      errores.horarioSemanal = "Los horarios usan el formato 06:00 – 18:00.";
      break;
    }
    if (partes[0] >= partes[1]) {
      errores.horarioSemanal = "La hora de cierre debe ser posterior a la de apertura.";
      break;
    }
  }

  if (borrador.productosPermitidos.length === 0) {
    errores.productosPermitidos = "Indica al menos un producto que pueda vender.";
  }

  return errores;
}

/** Convierte el nombre en un identificador legible y único. */
export function generarId(nombre: string, existentes: string[]): string {
  const base =
    nombre
      .toLowerCase()
      .normalize("NFD")
      // Quita los diacríticos combinantes: "Panadería" -> "panaderia".
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "tienda";

  let id = base;
  let intento = 2;
  while (existentes.includes(id)) {
    id = `${base}-${intento}`;
    intento += 1;
  }
  return id;
}
function inicialesDe(nombre: string): string {
  const palabras = nombre
    .replace(/[^\p{L}\s]/gu, "")
    .split(/\s+/)
    .filter(Boolean);

  if (palabras.length === 0) return "??";
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase();
  return (palabras[0][0] + palabras[1][0]).toUpperCase();
}

/** Franja resumen a partir de los días activos. */
function resumirHorario(horario: BorradorTienda["horarioSemanal"]): string {
  const activos = Object.values(horario).filter((d) => d.activo);
  if (activos.length === 0) return "Sin horario";

  const aperturas = activos.map((d) => d.rango.split("–")[0].trim());
  const cierres = activos.map((d) => d.rango.split("–")[1].trim());

  const apertura = aperturas.sort()[0];
  const cierre = cierres.sort()[cierres.length - 1];

  return aperturas.every((a) => a === apertura) && cierres.every((c) => c === cierre)
    ? `${apertura} – ${cierre}`
    : "Horario variable";
}

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

/** Fecha legible en el formato que usa la ficha: "12 de marzo de 2026". */
function formatearFechaLarga(iso: string): string {
  const fecha = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return "Fecha sin registrar";
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`;
}

/**
 * Construye la tienda final a partir de un borrador ya validado.
 *
 * `id` se recibe como argumento en vez de generarse aquí: el generador necesita
 * conocer los identificadores ya en uso, y esa lista la tiene el store.
 */
export function construirTienda(
  borrador: BorradorTienda,
  id: string,
): TiendaSinCodigo {
  const categoria = obtenerCategoria(borrador.categoria);
  const lat = Number(borrador.lat.trim());
  const lng = Number(borrador.lng.trim());
  const hayCoordenadas =
    borrador.lat.trim() !== "" &&
    borrador.lng.trim() !== "" &&
    Number.isFinite(lat) &&
    Number.isFinite(lng);

  return {
    id,
    nombre: borrador.nombre.trim(),
    dueno: borrador.dueno.trim(),
    rol: "Comerciante autorizado",
    iniciales: inicialesDe(borrador.nombre),
    categoria: categoria.id as CategoriaTienda,
    ubicacion: {
      pasaje: borrador.pasaje.trim(),
      casa: borrador.casa.trim(),
      referencia: borrador.referencia.trim(),
      ...(hayCoordenadas ? { coordenadas: { lat, lng } } : {}),
    },
    horarioAutorizado: resumirHorario(borrador.horarioSemanal),
    autorizadoDesde: borrador.autorizadosDesde
      ? formatearFechaLarga(borrador.autorizadosDesde)
      : "Fecha sin registrar",
    horarioSemanal: Object.fromEntries(
      Object.entries(borrador.horarioSemanal).map(([dia, dato]) => [
        dia,
        dato.activo
          ? { activo: true, rango: dato.rango.trim() }
          : { activo: false, rango: "Cerrado" },
      ]),
    ) as TiendaSinCodigo["horarioSemanal"],
    productosPermitidos: borrador.productosPermitidos,
    productosRestringidos: borrador.productosRestringidos,
    metricas: {
      ahorroMensualEstimado: numero(
        borrador.ahorroMensualEstimado,
        "el ahorro mensual",
        1000,
      ),
      residentesBeneficiados: Math.round(
        numero(borrador.residentesBeneficiados, "los residentes beneficiados", 2000),
      ),
      ingresoProyectadoCuota: numero(
        borrador.ingresoProyectadoCuota,
        "el ingreso proyectado",
        1000,
      ),
      minutosTrayectoEvitado: Math.round(
        numero(borrador.minutosTrayectoEvitado, "los minutos de trayecto", 600),
      ),
      viajesSemanalesEvitados: Math.round(
        numero(borrador.viajesSemanalesEvitados, "los viajes semanales", 100),
      ),
    },
    nota:
      borrador.nota.trim() ||
      `Tienda registrada desde el tablero, categoría ${categoria.etiqueta.toLowerCase()}.`,
  };
}

/** Convierte los datos guardados al formato editable del formulario. */
export function borradorDeTienda(tienda: Tienda): BorradorTienda {
  const meses = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  const fecha = tienda.autorizadoDesde.match(/^([0-9]{1,2}) de ([a-z]+) de ([0-9]{4})$/i);
  const mes = fecha ? meses.indexOf(fecha[2].toLowerCase()) + 1 : 0;

  return {
    nombre: tienda.nombre,
    dueno: tienda.dueno,
    categoria: tienda.categoria,
    pasaje: tienda.ubicacion.pasaje,
    casa: tienda.ubicacion.casa,
    referencia: tienda.ubicacion.referencia,
    lat: tienda.ubicacion.coordenadas ? String(tienda.ubicacion.coordenadas.lat) : "",
    lng: tienda.ubicacion.coordenadas ? String(tienda.ubicacion.coordenadas.lng) : "",
    horarioSemanal: tienda.horarioSemanal,
    productosPermitidos: [...tienda.productosPermitidos],
    productosRestringidos: [...tienda.productosRestringidos],
    autorizadosDesde:
      fecha && mes > 0
        ? `${fecha[3]}-${String(mes).padStart(2, "0")}-${fecha[1].padStart(2, "0")}`
        : "",
    nota: tienda.nota,
    residentesBeneficiados: String(tienda.metricas.residentesBeneficiados),
    ahorroMensualEstimado: String(tienda.metricas.ahorroMensualEstimado),
    ingresoProyectadoCuota: String(tienda.metricas.ingresoProyectadoCuota),
    minutosTrayectoEvitado: String(tienda.metricas.minutosTrayectoEvitado),
    viajesSemanalesEvitados: String(tienda.metricas.viajesSemanalesEvitados),
  };
}
