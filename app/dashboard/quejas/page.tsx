import type { Metadata } from "next";

import { VistaQuejas } from "@/components/dashboard/vista-quejas";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Reportar un incidente",
  description:
    "Registra ruido, basura o estacionamiento en el pasaje. Cada reporte recibe un folio verificable.",
};

export default async function PaginaQuejas(props: PageProps<"/dashboard/quejas">) {
  // En Next.js 16 `searchParams` es una promesa y hay que esperarla.
  const { folio } = await props.searchParams;

  const numero = Array.isArray(folio) ? folio[0] : folio;
  const compartido =
    typeof numero === "string" && /^\d+$/.test(numero) ? Number(numero) : null;

  return (
    <>
      <SiteHeader seccion="quejas" />
      <main id="contenido" className="flex-1">
        <VistaQuejas folio={compartido} />
      </main>
      <SiteFooter />
    </>
  );
}
