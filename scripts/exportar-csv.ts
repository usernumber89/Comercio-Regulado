import "dotenv/config";

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { obtenerPrisma } from "../lib/db";

/* ==========================================================================
   EXPORTAR A CSV
   --------------------------------------------------------------------------
   Para cuando alguien sin conocimientos técnicos necesita los datos: deja
   dos archivos que Excel y LibreOffice abren directamente, con los nombres de
   las columnas en español.

     npm run exportar

   Escribe junto al proyecto:
     datos/comercios.csv
     datos/reportes.csv

   Es de solo lectura: no modifica nada de la base.
   ========================================================================== */

const CARPETA = path.join(process.cwd(), "datos");

const COLUMNAS_COMERCIOS = [
  "comercio",
  "dueno",
  "rubro",
  "pasaje",
  "casa",
  "referencia",
  "horario",
  "autorizada_desde",
  "puede_vender",
  "no_puede_vender",
  "residentes",
  "ahorro_mensual_usd",
  "aporte_cuota_usd",
  "minutos_trayecto",
  "viajes_semanales",
  "nota",
  "origen",
];

const COLUMNAS_REPORTES = [
  "folio",
  "comercio",
  "tipo",
  "estado",
  "anonimo",
  "descripcion",
  "registrado_en",
];

/**
 * Una celda de CSV.
 *
 * Siempre entre comillas, porque los datos traen tildes, comas y saltos de
 * línea. Un valor que empieza con `=`, `+`, `-` o `@` lleva un apóstrofo
 * delante: sin eso, Excel lo ejecuta como fórmula al abrir el archivo.
 */
function celda(valor: unknown): string {
  if (valor === null || valor === undefined) return '""';

  const texto = String(valor);
  const seguro = /^[=+\-@]/.test(texto) ? `'${texto}` : texto;

  return `"${seguro.replace(/"/g, '""')}"`;
}

function escribir(
  columnas: string[],
  filas: Record<string, unknown>[],
  nombre: string,
): void {
  const lineas = [
    columnas.map(celda).join(","),
    ...filas.map((fila) => columnas.map((columna) => celda(fila[columna])).join(",")),
  ];

  // El BOM inicial es lo que hace que Excel reconozca el UTF-8 y muestre las
  // tildes y la ñ bien, en vez de mostrarlas como caracteres raros.
  writeFileSync(
    path.join(CARPETA, nombre),
    `﻿${lineas.join("\r\n")}\r\n`,
    "utf8",
  );

  console.log(`${nombre}: ${filas.length} fila${filas.length === 1 ? "" : "s"}`);
}

const db = obtenerPrisma();

/** Los productos son un `Json` en la base; en el CSV van como una lista. */
function productos(valor: unknown): string {
  return Array.isArray(valor) ? valor.map(String).join(" | ") : "";
}

async function main(): Promise<void> {
  const comercios = await db.tienda.findMany({
    orderBy: { nombre: "asc" },
    select: {
      nombre: true,
      dueno: true,
      categoria: true,
      pasaje: true,
      casa: true,
      referencia: true,
      horarioAutorizado: true,
      autorizadoDesde: true,
      productosPermitidos: true,
      productosRestringidos: true,
      residentesBeneficiados: true,
      ahorroMensual: true,
      ingresoCuota: true,
      minutosTrayecto: true,
      viajesSemanales: true,
      nota: true,
    },
  });

  const reportes = await db.reporte.findMany({
    orderBy: { folio: "desc" },
    select: {
      folio: true,
      tipo: true,
      estado: true,
      anonimo: true,
      descripcion: true,
      creadoEn: true,
      tienda: { select: { nombre: true } },
    },
  });

  mkdirSync(CARPETA, { recursive: true });

  escribir(
    COLUMNAS_COMERCIOS,
    comercios.map((t) => ({
      comercio: t.nombre,
      dueno: t.dueno,
      rubro: t.categoria,
      pasaje: t.pasaje,
      casa: t.casa,
      referencia: t.referencia,
      horario: t.horarioAutorizado,
      autorizada_desde: t.autorizadoDesde,
      puede_vender: productos(t.productosPermitidos),
      no_puede_vender: productos(t.productosRestringidos),
      residentes: t.residentesBeneficiados,
      ahorro_mensual_usd: t.ahorroMensual,
      aporte_cuota_usd: t.ingresoCuota,
      minutos_trayecto: t.minutosTrayecto,
      viajes_semanales: t.viajesSemanales,
      nota: t.nota,
      origen: "registrado en el sistema",
    })),
    "comercios.csv",
  );

  escribir(
    COLUMNAS_REPORTES,
    reportes.map((r) => ({
      folio: r.folio,
      comercio: r.tienda.nombre,
      tipo: r.tipo,
      estado: r.estado,
      anonimo: r.anonimo ? "sí" : "no",
      descripcion: r.descripcion,
      registrado_en: r.creadoEn.toISOString(),
    })),
    "reportes.csv",
  );

  console.log(`\nListo. Los archivos quedaron en ${CARPETA}`);
}

main().catch((fallo) => {
  console.error(fallo);
  process.exit(1);
});
