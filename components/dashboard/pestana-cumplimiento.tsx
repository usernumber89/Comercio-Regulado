"use client";

import Link from "next/link";
import { AlertTriangleIcon } from "lucide-react";

import { Anillo } from "@/components/dashboard/anillo-cumplimiento";
import { Insignia } from "@/components/ui/insignia";
import {
  calcularCumplimiento,
  dentroDeVentana,
  persisteEstadoAmarillo,
  puntosDeReporte,
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
  const evaluacionPrioritaria = reportes.some(
    (reporte) =>
      reporte.tiendaId === tienda.id &&
      reporte.gravedad === "muy_grave" &&
      puntosDeReporte(reporte) > 0,
  );
  const amarilloPersistente = persisteEstadoAmarillo(reportes, tienda.id);

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
        {evaluacionPrioritaria ? (
          <p role="alert" className="rounded-md border border-[var(--semaforo-rojo)] bg-[var(--semaforo-rojo-fondo)] p-3 text-center text-xs font-medium text-[var(--semaforo-rojo)]">
            Infracción muy grave: evaluación prioritaria de Junta, aunque el puntaje esté en Amarillo.
          </p>
        ) : null}
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
                const puntos = puntosDeReporte(reporte);
                const suspendido = reporte.impugnacionEstado === "pendiente";
                const etiqueta = !reporte.validado
                  ? "Pendiente de validación"
                  : suspendido
                    ? "Impugnación · suspendido"
                    : reporte.impugnacionEstado === "revocada"
                      ? "Revocado"
                      : reporte.gravedad
                        ? `${reporte.gravedad.replace("_", " ")} · ${puntos} pts`
                        : "Validado";
                const activo = reporte.validado && puntos > 0 && !suspendido;

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
                          {etiqueta}
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
                    {reporte.fechaSubsanacion && !reporte.subsanadoEn ? (
                      <p className="mt-1 text-xs text-[var(--mostaza-tinta)]">
                        Plazo de subsanación: {new Intl.DateTimeFormat("es-SV", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(reporte.fechaSubsanacion))}
                      </p>
                    ) : null}
                  </li>
                );
              })
            ) : (
              <li className="py-4 text-sm text-[var(--tinta-tenue)]">
                Sin reportes registrados para este comercio.
              </li>
            )}
          </ul>

          {resultado.rango === "observacion" ? (
            <p role="status" className="mt-4 rounded-md border border-[var(--semaforo-amarillo)] bg-[var(--semaforo-amarillo-fondo)] p-3 text-sm leading-relaxed text-[var(--tinta-suave)]">
              Estado Amarillo: notificar formalmente al comerciante e instruir mayor supervisión durante las rondas ordinarias de Seguridad.
              {amarilloPersistente
                ? " La permanencia supera 30 días consecutivos; procede tramitar amonestación escrita ante la Junta."
                : ""}
            </p>
          ) : null}
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

        <details className="rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-5 sm:p-6">
          <summary className="cursor-pointer font-serif text-lg font-semibold text-[var(--tinta)]">
            Reglamento operativo y procedimiento sancionatorio
          </summary>
          <div className="mt-4 space-y-5 text-sm leading-relaxed text-[var(--tinta-suave)]">
            <section aria-labelledby="reglamento-gravedades">
              <h3 id="reglamento-gravedades" className="font-semibold text-[var(--tinta)]">Infracciones y consecuencias primarias</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li><strong>Leve · −10 puntos</strong>: exceso de horario menor a 15 minutos, omisión temporal del distintivo oficial o inconveniente menor de empaque/limpieza. Notificación preventiva con cinco días hábiles para subsanar; si se verifica en plazo, el descuento queda en −5.</li>
                <li><strong>Grave · −20 puntos</strong>: reincidencia leve de la misma categoría, venta a visitantes que entran solo a comprar, ruidos/aglomeraciones, falta de permisos sanitarios o recepción de proveedores fuera de horario. Amonestación escrita.</li>
                <li><strong>Muy grave · −40 puntos</strong>: venta de alcohol, tabaco o sustancias prohibidas; alteración arquitectónica estructural; desacato. La primera infracción activa evaluación y audiencia prioritaria de Junta dentro de cinco días hábiles, aun en Estado Amarillo.</li>
              </ul>
            </section>
            <section aria-labelledby="reglamento-categorias">
              <h3 id="reglamento-categorias" className="font-semibold text-[var(--tinta)]">Categorías para reincidencia (seis meses)</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>Horarios y Proveedores.</li>
                <li>Convivencia, Ruidos y Circulación.</li>
                <li>Sanitaria y Productos Autorizados.</li>
                <li>Publicidad y Fachadas.</li>
              </ul>
              <p className="mt-2">Solo se considera reincidencia una infracción validada en la misma categoría dentro de seis meses o la omisión de subsanar una leve dentro de cinco días hábiles.</p>
            </section>
            <section aria-labelledby="reglamento-conceptos">
              <h3 id="reglamento-conceptos" className="font-semibold text-[var(--tinta)]">Conceptos protegidos</h3>
              <p className="mt-2">Desacato comprende agresión directa, acoso, amenazas o negativa activa e injustificada a inspección autorizada. Excluye discrepancias respetuosas, consultas, peticiones, recursos y denuncias formales contra Administración o Seguridad.</p>
              <p className="mt-2">Alteración arquitectónica requiere modificación estructural permanente, demolición o alteración de fachada/elementos portantes exteriores. Intervenciones menores, no estructurales o temporales solo se verifican visualmente.</p>
            </section>
            <section aria-labelledby="reglamento-semaforo">
              <h3 id="reglamento-semaforo" className="font-semibold text-[var(--tinta)]">Semáforo y sanciones progresivas</h3>
              <p className="mt-2">Puntos = 100 − puntos de infracciones validadas activas en 30 días: Verde 80–100; Amarillo 40–79; Rojo 0–39. Amarillo persistente tras 30 días o leve no subsanada permite amonestación. Reincidencia grave o Rojo permite suspensión por 15 días. Primera muy grave: audiencia y suspensión de 15–30 días o medida correctiva. Revocación se reserva a reincidencia muy grave de la misma categoría o incumplimiento de suspensión. Toda sanción requiere audiencia previa y resolución motivada de Junta.</p>
            </section>
            <section aria-labelledby="reglamento-impugnacion">
              <h3 id="reglamento-impugnacion" className="font-semibold text-[var(--tinta)]">Impugnación protegida</h3>
              <p className="mt-2">El titular accede a <Link href="/comerciante" className="font-medium text-[var(--bosque-tinta)] underline">Mi comercio</Link> con la cuenta activada por invitación y dispone de cinco días hábiles desde la notificación. En esta configuración los plazos cuentan todos los días excepto los domingos. El acuse es inmediato; la revisión debe resolverse dentro de diez días hábiles por Administración o Comisión Árbitro imparcial. Reporte impugnado queda suspendido para puntaje y sanciones formales hasta la resolución; caben medidas preventivas temporales por riesgo a la salud o seguridad. El historial sancionatorio aplica durante seis meses.</p>
            </section>
          </div>
        </details>
      </div>
    </div>
  );
}
