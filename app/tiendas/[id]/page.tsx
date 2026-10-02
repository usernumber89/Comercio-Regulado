import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Anillo } from "@/components/dashboard/anillo-cumplimiento";
import { CodigoQR } from "@/components/dashboard/codigo-qr";
import { BotonesOpinion } from "@/components/tienda/botones-opinion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ListaResenas, ResumenOpinion } from "@/components/opinion/resenas";
import { Insignia } from "@/components/ui/insignia";
import { DIAS } from "@/lib/dias";
import { formatearNumero } from "@/lib/format";
import { calcularCumplimiento } from "@/lib/cumplimiento";
import { fichaDeTienda } from "@/lib/repositorio";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/tiendas/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const ficha = await fichaDeTienda(id);

  if (!ficha) return { title: "Comercio no encontrado" };

  const { tienda, opinion } = ficha;

  return {
    title: `${tienda.nombre} · ${tienda.codigo}`,
    description: `Comercio autorizado en ${tienda.ubicacion.pasaje}, ${tienda.ubicacion.casa}. Horario ${tienda.horarioAutorizado}. ${opinion.total} reseña${opinion.total === 1 ? "" : "s"} de la comunidad.`,
    alternates: { canonical: `/tiendas/${tienda.id}` },
  };
}

export default async function PaginaTienda(props: PageProps<"/tiendas/[id]">) {
  const { id } = await props.params;
  const ficha = await fichaDeTienda(id);

  if (!ficha) notFound();

  const { tienda, opinion, reportes } = ficha;
  const cumplimiento = calcularCumplimiento(reportes, tienda.id);

  const dias = DIAS.map((dia) => ({
    id: dia.id,
    nombre: dia.nombre,
    ...tienda.horarioSemanal[dia.id],
  }));

  // Todo lo que no sea una estrella de queja: son las opiniones favorables.
  const positivas =
    opinion.total -
    (opinion.reparto.find((r) => r.estrellas === 1)?.cantidad ?? 0);

  return (
    <>
      <SiteHeader seccion="directorio" />
      <main id="contenido" className="flex-1 bg-[var(--papel)]">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="font-mono text-xs text-[var(--tinta-tenue)]">
          Comercio Regulado · Ficha pública
        </p>

        <header className="mt-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-mono text-sm font-semibold text-[var(--bosque-tinta)]">
                {tienda.codigo}
              </p>
              <h1 className="mt-1 font-serif text-3xl font-semibold text-balance text-[var(--tinta)] sm:text-4xl">
                {tienda.nombre}
              </h1>
              <p className="mt-1.5 text-sm text-[var(--tinta-suave)]">
                {tienda.dueno} · {tienda.rol}
              </p>
              <p className="mt-1 text-sm text-[var(--tinta-suave)]">
                {tienda.ubicacion.pasaje}, {tienda.ubicacion.casa}
              </p>
              {tienda.ubicacion.referencia ? (
                <p className="mt-0.5 text-sm text-[var(--tinta-tenue)]">
                  {tienda.ubicacion.referencia}
                </p>
              ) : null}
            </div>

            <span
              className="grid size-16 shrink-0 place-items-center rounded-full border border-[var(--borde-fuerte)] bg-[var(--superficie)] font-serif text-xl font-semibold text-[var(--bosque-tinta)]"
              aria-hidden
            >
              {tienda.iniciales}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Insignia tono="bosque">
              <span
                className="size-1.5 rounded-full bg-[var(--verde)]"
                aria-hidden
              />
              Autorización vigente
            </Insignia>
            <Insignia tono="neutro">Desde {tienda.autorizadoDesde}</Insignia>
          </div>
        </header>

        <section
          aria-labelledby="ficha-puntaje"
          className="mt-8 flex flex-wrap items-center gap-8 border-t border-[var(--borde)] pt-6"
        >
          <Anillo
            valor={cumplimiento.puntaje}
            color={cumplimiento.color}
            tamano={148}
            grosor={12}
            className="mx-auto"
          >
            <div>
              <p className="font-serif text-3xl font-semibold text-[var(--tinta)]">
                {cumplimiento.puntaje}
              </p>
              <p className="font-mono text-[10px] tracking-wide text-[var(--tinta-tenue)]">
                DE 100
              </p>
            </div>
          </Anillo>

          <div className="min-w-[220px] flex-1">
            <h2
              id="ficha-puntaje"
              className="font-serif text-lg font-semibold text-[var(--tinta)]"
            >
              Cumplimiento
            </h2>
            <Insignia tono={toneInsignia(cumplimiento.rango)} className="mt-2">
              {cumplimiento.etiqueta}
            </Insignia>
            <p className="mt-2.5 text-sm leading-relaxed text-[var(--tinta-suave)]">
              {cumplimiento.activos === 0
                ? "Sin incidentes abiertos en los últimos 30 días."
                : `${formatearNumero(cumplimiento.activos)} incidente${
                    cumplimiento.activos === 1 ? "" : "s"
                  } abierto${cumplimiento.activos === 1 ? "" : "s"} en los últimos 30 días.`}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-[var(--tinta-tenue)]">
              Puntaje = 100 − 20 por cada incidente abierto. Una reseña de una
              estrella cuenta como incidente.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="ficha-opinion"
          className="mt-8 border-t border-[var(--borde)] pt-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2
                id="ficha-opinion"
                className="font-serif text-lg font-semibold text-[var(--tinta)]"
              >
                Opinión de la comunidad
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-[var(--tinta-suave)]">
                {opinion.total === 0
                  ? "Todavía nadie ha opinado sobre este comercio."
                  : `${formatearNumero(opinion.total)} reseña${
                      opinion.total === 1 ? "" : "s"
                    } · ${formatearNumero(positivas)} con más de una estrella.`}
              </p>
            </div>
            <BotonesOpinion tienda={tienda} />
          </div>

          <div className="mt-5">
            <ResumenOpinion opinion={opinion} />
          </div>

          {opinion.resenas.length > 0 ? (
            <div className="mt-6">
              <ListaResenas resenas={opinion.resenas} />
            </div>
          ) : null}
        </section>

        <section
          aria-labelledby="ficha-datos"
          className="mt-8 border-t border-[var(--borde)] pt-6"
        >
          <h2
            id="ficha-datos"
            className="font-serif text-lg font-semibold text-[var(--tinta)]"
          >
            Datos del comercio
          </h2>
          <dl className="mt-4 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <Dato termino="Horario autorizado">{tienda.horarioAutorizado}</Dato>
            <Dato termino="Residentes atendidos">
              {formatearNumero(tienda.metricas.residentesBeneficiados)} familias
            </Dato>
            <Dato termino="Ahorro mensual estimado">
              ${formatearNumero(tienda.metricas.ahorroMensualEstimado)} por familia
            </Dato>
            <Dato termino="Aporte proyectado a cuota">
              ${formatearNumero(tienda.metricas.ingresoProyectadoCuota)} al mes
            </Dato>
          </dl>
        </section>

        <section
          aria-labelledby="verificar-horario"
          className="mt-8 border-t border-[var(--borde)] pt-6"
        >
          <h2
            id="verificar-horario"
            className="font-serif text-lg font-semibold text-[var(--tinta)]"
          >
            Días y rangos
          </h2>
          <ul className="mt-3 divide-y divide-[var(--borde)] border-y border-[var(--borde)]">
            {dias.map((dia) => (
              <li
                key={dia.id}
                className="flex items-center justify-between gap-4 py-2.5 text-sm"
              >
                <span className="font-medium text-[var(--tinta)]">
                  {dia.nombre}
                </span>
                <span
                  className={cn(
                    "font-mono text-xs",
                    dia.activo
                      ? "text-[var(--tinta-suave)]"
                      : "text-[var(--tinta-tenue)]",
                  )}
                >
                  {dia.rango}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <section aria-labelledby="verificar-permitidos">
            <h2
              id="verificar-permitidos"
              className="text-sm font-semibold text-[var(--tinta)]"
            >
              Puede vender
            </h2>
            <ul className="mt-2.5 space-y-1.5">
              {tienda.productosPermitidos.map((producto) => (
                <li
                  key={producto}
                  className="flex items-start gap-2 text-sm text-[var(--tinta-suave)]"
                >
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--verde)]"
                    aria-hidden
                  />
                  {producto}
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="verificar-restringidos">
            <h2
              id="verificar-restringidos"
              className="text-sm font-semibold text-[var(--tinta)]"
            >
              No puede vender
            </h2>
            <ul className="mt-2.5 space-y-1.5">
              {tienda.productosRestringidos.map((producto) => (
                <li
                  key={producto}
                  className="flex items-start gap-2 text-sm text-[var(--tinta-tenue)]"
                >
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--terracota)]"
                    aria-hidden
                  />
                  {producto}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className="mt-8 rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-4 text-sm leading-relaxed text-[var(--tinta-suave)]">
          {tienda.nota}
        </p>

        <section
          aria-labelledby="verificar-escanea"
          className="mt-8 border-t border-[var(--borde)] pt-6"
        >
          <h2
            id="verificar-escanea"
            className="font-serif text-lg font-semibold text-[var(--tinta)]"
          >
            Compartir esta ficha
          </h2>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-[var(--tinta-suave)]">
            El código apunta a esta misma página. Si algo no cuadra con el
            horario o los productos autorizados, registra el incidente: cada
            reporte recibe un folio y descuenta puntos del cumplimiento.
          </p>
          <div className="mt-4">
            <CodigoQR tienda={tienda} />
          </div>
        </section>
      </div>
      </main>
      <SiteFooter />
    </>
  );
}

function toneInsignia(
  rango: "optimo" | "observacion" | "revision",
): "verde" | "mostaza" | "terracota" {
  if (rango === "optimo") return "verde";
  if (rango === "observacion") return "mostaza";
  return "terracota";
}

function Dato({ termino, children }: { termino: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-xs text-[var(--tinta-tenue)]">{termino}</dt>
      <dd className="mt-1 font-serif text-lg font-semibold text-[var(--tinta)]">
        {children}
      </dd>
    </div>
  );
}
