import type { Metadata } from "next";
import Link from "next/link";

import { AccesoComerciante } from "@/components/comerciante/acceso-comerciante";
import { ExpedienteComerciante } from "@/components/comerciante/expediente-comerciante";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { tiendaSesionComerciante } from "@/lib/autenticacion-comerciante";
import { calcularCumplimiento } from "@/lib/cumplimiento";
import { listarReportes, obtenerTienda } from "@/lib/repositorio";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portal del comerciante",
  description: "Consulta calificaciones, reportes e impugnaciones del comercio.",
};

export default async function PaginaComerciante() {
  const tiendaId = await tiendaSesionComerciante();
  const tienda = tiendaId ? await obtenerTienda(tiendaId) : undefined;
  const reportes = tiendaId
    ? (await listarReportes()).filter((reporte) => reporte.tiendaId === tiendaId)
    : [];
  const cumplimiento = tienda
    ? calcularCumplimiento(reportes, tienda.id)
    : null;

  return (
    <>
      <SiteHeader seccion="directorio" />
      <main id="contenido" className="flex-1 bg-[var(--papel)]">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <header className=" pt-5">
            <p className="font-mono text-xs text-[var(--tinta-tenue)]">
              Comercio Regulado · Portal del titular
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--tinta)]">
              Mi comercio
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--tinta-suave)]">
              Consulta tu expediente, el estado del semáforo y ejerce el derecho de impugnación.
            </p>
          </header>
          {tienda ? (
            <ExpedienteComerciante
              nombre={tienda.nombre}
              tiendaId={tienda.id}
              reportesIniciales={reportes}
              puntaje={cumplimiento?.puntaje ?? 100}
              estadoSemaforo={cumplimiento?.etiqueta ?? "Estado Verde"}
            />
          ) : (
            <>
              <AccesoComerciante />
              {tiendaId ? (
                <p role="alert" className="mx-auto mt-4 max-w-lg text-sm text-[var(--terracota-tinta)]">
                  La sesión corresponde a un comercio que ya no está registrado.{" "}
                  <Link href="/configuracion" className="underline">Contacta a Administración.</Link>
                </p>
              ) : null}
            </>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
