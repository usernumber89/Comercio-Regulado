import type { CategoriaTienda } from "@/types";

/* ==========================================================================
  CONFIGURACIÓN DE COMERCIOS
   --------------------------------------------------------------------------
  Este archivo define rubros y sugerencias usadas al registrar comercios.
   ========================================================================== */

export interface CategoriaInfo {
  id: CategoriaTienda;
  etiqueta: string;
  /** Descripción corta, se muestra bajo el selector. */
  resumen: string;
  productosSugeridos: string[];
}

export const CATEGORIAS: CategoriaInfo[] = [
  {
    id: "abarrotes",
    etiqueta: "Abarrotes",
    resumen: "Despensa de consumo diario y limpieza del hogar.",
    productosSugeridos: [
      "Arroz, azúcar y aceite",
      "Leche y derivados",
      "Artículos de aseo personal",
      "Botanas y confitería",
    ],
  },
  {
    id: "panaderia",
    etiqueta: "Panadería",
    resumen: "Pan caliente y panadería de la mañana.",
    productosSugeridos: [
      "Pan y panadería",
      "Leche y derivados",
      "Fruta y verdura de temporada",
      "Botanas y confitería",
    ],
  },
  {
    id: "carniceria",
    etiqueta: "Carnicería",
    resumen: "Carnes frescas y embutidos con refrigeración.",
    productosSugeridos: [
      "Carnes y embutidos refrigerados",
      "Verdura y fruta",
      "Aseo del hogar",
      "Bebidas no alcohólicas",
    ],
  },
  {
    id: "fruteria",
    etiqueta: "Frutería",
    resumen: "Fruta y verdura de temporada.",
    productosSugeridos: [
      "Fruta y verdura de temporada",
      "Jugos naturales",
      "Artículos de higiene personal",
    ],
  },
  {
    id: "lacteos",
    etiqueta: "Lácteos",
    resumen: "Leche, quesos y derivados con refrigeración.",
    productosSugeridos: [
      "Leche y derivados",
      "Quesos y yogures",
      "Huevos",
      "Aseo del hogar",
    ],
  },
  {
    id: "ferreteria",
    etiqueta: "Ferretería",
    resumen: "Herramienta menuda y Insumos del hogar.",
    productosSugeridos: [
      "Herramienta menor",
      "Bombillas y material eléctrico",
      "Artículos de limpieza",
    ],
  },
  {
    id: "farmacia",
    etiqueta: "Farmacia",
    resumen: "Medicamentos de venta libre y productos de higiene.",
    productosSugeridos: [
      "Medicamentos sin receta de venta libre",
      "Artículos de higiene personal",
      "Botiquín básico",
    ],
  },
  {
    id: "salon",
    etiqueta: "Salón o Barbería",
    resumen: "Servicio de atención personal por turnos.",
    productosSugeridos: [
      "Productos de higiene personal",
      "Accesorios de aseo",
    ],
  },
  {
    id: "otro",
    etiqueta: "Otro",
    resumen: "Rubro no contemplado en esta lista.",
    productosSugeridos: [
      "Artículos de consumo diario",
      "Aseo del hogar",
    ],
  },
];

/** Rubros que la Junta no autoriza dentro de la residencial. */
export const PRODUCTOS_RESTRINGIDOS_GLOBALES: string[] = [
  "Bebidas alcohólicas",
  "Tabaco",
  "Productos de uso exclusivo de menores",
  "Medicamentos con receta",
];

/** Rango horario que la Junta concede por defecto a un rubro nuevo. */
export const HORARIO_POR_DEFECTO = "06:00 – 18:00";

/** Busca el catálogo de un rubro. Devuelve `otro` si no está en la lista. */
export function obtenerCategoria(id: string): CategoriaInfo {
  return (
    CATEGORIAS.find((c) => c.id === id) ??
    (CATEGORIAS.find((c) => c.id === "otro") as CategoriaInfo)
  );
}

/** Días que cuentan para el puntaje de cumplimiento. */
export const VENTANA_CUMPLIMIENTO_DIAS = 30;
