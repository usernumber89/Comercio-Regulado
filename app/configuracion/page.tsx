import type { Metadata } from "next";

import { PestanaTiendas } from "@/components/dashboard/pestana-tiendas";
import {
  AccesoConfiguracion,
  CerrarSesionConfiguracion,
} from "@/components/configuracion/acceso-configuracion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { autenticacionAdminConfigurada } from "@/lib/autenticacion-admin";
import { tieneSesionAdmin } from "@/lib/autenticacion-admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Configuración",
  description: "Registra y administra los comercios del sistema.",
};

export default async function PaginaConfiguracion() {
  const configurado = autenticacionAdminConfigurada();
  const autenticada = await tieneSesionAdmin();

  return (
    <>
      <SiteHeader seccion="configuracion" />
      <main id="contenido" className="flex-1 bg-[var(--papel)]">
        <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <header className="filete-bosque border-t-2 border-t-[var(--bosque)] pt-5">
            <p className="font-mono text-xs text-[var(--tinta-tenue)]">
              Comercio Regulado · Administración
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold text-[var(--tinta)]">
              Configuración
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--tinta-suave)]">
              Registra comercios y administra el catálogo de la residencial.
            </p>
          </header>

          {autenticada ? (
            <div className="mt-8 space-y-6">
              <div className="flex justify-end">
                <CerrarSesionConfiguracion />
              </div>
              <PestanaTiendas />
            </div>
          ) : (
            <div className="mt-8">
              <AccesoConfiguracion configurado={configurado} />
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}