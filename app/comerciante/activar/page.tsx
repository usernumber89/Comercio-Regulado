import type { Metadata } from "next";

import { AccesoComerciante } from "@/components/comerciante/acceso-comerciante";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Activar cuenta del comerciante",
  robots: { index: false, follow: false },
};

export default async function ActivarComerciante(
  props: PageProps<"/comerciante/activar">,
) {
  const { codigo } = await props.searchParams;
  return (
    <>
      <SiteHeader seccion="directorio" />
      <main id="contenido" className="flex-1 bg-[var(--papel)]">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
          <h1 className="font-serif text-3xl font-semibold text-[var(--tinta)]">
            Activación de cuenta
          </h1>
          <AccesoComerciante
            codigoInvitacion={Array.isArray(codigo) ? codigo[0] : codigo}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
