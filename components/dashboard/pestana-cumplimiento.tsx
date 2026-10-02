"use client";

import { AlertTriangleIcon } from "lucide-react";

import { Anillo } from "@/components/dashboard/anillo-cumplimiento";
import { Insignia } from "@/components/ui/insignia";
import {
  calcularCumplimiento,
  dentroDeVentana,
  REGLA_CUMPLIMIENTO,
  UMBRALES,
} from "@/lib/cumplimiento";
import { formatearNumero, tiempoRelativo } from "@/lib/format";
import { useCatalogoTiendas, usePanel } from "@/store/use-panel";
import type { Tienda } from "@/types";

/**
 * Pestaña de cumplimiento.
 *
 * El puntaje no se guarda en ninguna parte: se recalcula a partir de los
 * reportes de la base de datos cada vez que cambian. Marcar una denuncia
 * como resuelta desde la pestaña de quejas mueve el anillo sin ningún paso de
 * sincronización.
 */
export function PestanaCumplimiento({ tienda }: { tienda: Tienda }) {
  const reportes = usePanel((estado) => estado.reportes);
  const catalogo = useCatalogoTiendas();

  const resultado = calcularCumplimiento(reportes, tienda.id);

  const recientes = reportes
    .filter((r) => r.tiendaId === tienda.id)
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));

  const comparativa = catalogo.map((otra) => ({
    tienda: otra,
    resultado: calcularCumplimiento(reportes, otra.id),
  }));
  const ranking = [...comparativa].sort(
    (a, b) => a.resultado.puntaje - b.resultado.puntaje,
  );
  const criticas = ranking.filter(({ resultado: r }) => r.rango === "revision");

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(15rem,0.8fr)_minmax(0,1.6fr)] 2xl:gap-6">
      <section
        aria-labelledby="cumplimiento-actual"
        className="flex min-w-0 flex-col items-center gap-4 rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-5 shadow-[var(--sombra-tenue)] sm:p-6"
      >
        <div className="w-full">
          <p className="font-mono text-[0.6875rem] font-medium uppercase text-[var(--tinta-tenue)]">
            Cumplimiento actual
          </p>
          <h2
            id="cumplimiento-actual"
            className="mt-1 font-serif text-lg font-semibold text-[var(--tinta)]"
          >
            {tienda.nombre}
          </h2>
        </div>

        <Anillo
          valor={resultado.puntaje}
          color={resultado.color}
          tamano={176}
          grosor={12}
        >
          <div className="flex flex-col items-center">
            <span className="font-serif text-5xl leading-none font-semibold text-[var(--tinta)]">
              {resultado.puntaje}
            </span>
            <span className="mt-1 font-mono text-xs text-[var(--tinta-tenue)]">
              de 100
            </span>
          </div>
        </Anillo>

        <Insignia
          tono="neutro"
          style={{
            backgroundColor: resultado.fondo,
            borderColor: resultado.color,
            color: resultado.color,
          }}
        >
          <span
            className="size-1.5 rounded-full"
            style={{ backgroundColor: resultado.color }}
            aria-hidden
          />
          {resultado.etiqueta}
        </Insignia>

        <p className="max-w-64 border-t border-[var(--borde)] pt-3 text-center text-xs leading-relaxed text-[var(--tinta-tenue)]">
          {REGLA_CUMPLIMIENTO}
        </p>
      </section>

      <div className="min-w-0 space-y-5">
        <section
          aria-labelledby="cumplimiento-conteo"
          className="min-w-0 rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2
              id="cumplimiento-conteo"
              className="font-serif text-lg font-semibold text-[var(--tinta)]"
            >
              Actividad de reportes
            </h2>
            <span className="font-mono text-xs text-[var(--tinta-tenue)]">
              Últimos 30 días
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            {[
              ["Activos", resultado.activos, "var(--terracota-tinta)"],
              ["Resueltos", resultado.resueltos, "var(--verde-tinta)"],
              [
                "Total histórico",
                recientes.length,
                "var(--tinta-suave)",
              ],
            ].map(([rotulo, valor, color]) => (
              <div key={rotulo as string} className="min-w-0 border-t border-[var(--borde)] pt-3">
                <dt className="truncate font-mono text-xs text-[var(--tinta-tenue)]">
                  {rotulo}
                </dt>
                <dd
                  className="mt-1 font-serif text-3xl font-semibold"
                  style={{ color: color as string }}
                >
                  {formatearNumero(valor as number)}
                </dd>
              </div>
            ))}
          </dl>

          <ul className="mt-4 border-t border-[var(--borde)]">
            {recientes.length > 0 ? (
              recientes.slice(0, 4).map((reporte) => {
                const activo = reporte.estado === "activo";

                return (
                  <li
                    key={reporte.id}
                    className="min-w-0 border-b border-[var(--borde)] py-3 last:border-b-0 last:pb-0"
                  >
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="font-mono text-xs font-semibold text-[var(--tinta)]">
                          {formatearNumero(reporte.folio)}
                        </span>
                        <span
                          className="rounded-full border px-2 py-0.5 text-[0.6875rem] font-medium"
                          style={{
                            color: activo
                              ? "var(--semaforo-rojo)"
                              : "var(--semaforo-verde)",
                            backgroundColor: activo
                              ? "var(--semaforo-rojo-fondo)"
                              : "var(--semaforo-verde-fondo)",
                            borderColor: activo
                              ? "var(--semaforo-rojo)"
                              : "var(--semaforo-verde)",
                          }}
                        >
                          {activo ? "Activo" : "Resuelto"}
                        </span>
                      </div>
                      <time className="shrink-0 font-mono text-[0.6875rem] text-[var(--tinta-tenue)]">
                        {dentroDeVentana(reporte.creadoEn)
                          ? tiempoRelativo(reporte.creadoEn)
                          : "Fuera de ventana"}
                      </time>
                    </div>
                    <p className="mt-1.5 break-words text-sm leading-relaxed text-[var(--tinta-suave)]">
                      {reporte.descripcion}
                    </p>
                  </li>
                );
              })
            ) : (
              <li className="py-4 text-sm text-[var(--tinta-tenue)]">
                Sin reportes registrados para este comercio.
              </li>
            )}
          </ul>
        </section>

        <section
          aria-labelledby="cumplimiento-ambas"
          className="min-w-0 rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2
              id="cumplimiento-ambas"
              className="font-serif text-lg font-semibold text-[var(--tinta)]"
            >
              Supervisión por comercio
            </h2>
            <span className="font-mono text-xs text-[var(--tinta-tenue)]">
              {ranking.length} en seguimiento
            </span>
          </div>

          {criticas.length > 0 ? (
            <div
              role="status"
              aria-live="polite"
              className="mt-4 flex min-w-0 items-start gap-3 rounded-md border border-[var(--semaforo-rojo)] bg-[var(--semaforo-rojo-fondo)] p-3.5 text-sm text-[var(--semaforo-rojo)]"
            >
              <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
              <div className="min-w-0">
                <p className="font-semibold">Aviso para la Junta Directiva</p>
                <p className="mt-1">
                  Incumplimiento crítico: revisar y aplicar el reglamento.
                </p>
                <ul className="mt-2 space-y-1">
                  {criticas.map(({ tienda: otra, resultado: r }) => (
                    <li key={otra.id} className="break-words">
                      {otra.nombre} · {r.puntaje} puntos
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}

          <ul className="mt-4 divide-y divide-[var(--borde)]">
            {ranking.map(({ tienda: otra, resultado: r }, indice) => (
              <li key={otra.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--tinta)]">
                      <span className="mr-2 font-mono text-xs text-[var(--tinta-tenue)]">
                        {String(indice + 1).padStart(2, "0")}
                      </span>
                      {otra.nombre}
                    </p>
                    <p
                      className="mt-1 text-xs font-medium"
                      style={{ color: r.color }}
                    >
                      {r.etiqueta}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-sm font-semibold text-[var(--tinta)]">
                      {r.puntaje}
                      <span className="font-normal text-[var(--tinta-tenue)]"> / 100</span>
                    </p>
                    <p className="mt-1 font-mono text-[0.6875rem] text-[var(--tinta-tenue)]">
                      {r.activos === 0
                        ? "Sin reportes activos"
                        : `${r.activos} activo${r.activos === 1 ? "" : "s"}`}
                    </p>
                  </div>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--hundido)]"
                  role="img"
                  aria-label={`${otra.nombre}: ${r.puntaje} de 100`}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{
                      width: `${r.puntaje}%`,
                      backgroundColor: r.color,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--borde)] pt-3">
            {UMBRALES.map((umbral) => (
              <li
                key={umbral.rango}
                className="flex items-center gap-1.5 font-mono text-xs text-[var(--tinta-tenue)]"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: umbral.color }}
                  aria-hidden
                />
                {umbral.etiqueta} · {umbral.desde}–{umbral.hasta}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
