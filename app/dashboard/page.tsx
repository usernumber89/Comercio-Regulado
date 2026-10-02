import type { Metadata } from "next";

import { Tablero } from "@/components/dashboard/tablero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Tablero de fichas",
  description:
    "Perfil autorizado, canal de quejas, cumplimiento y beneficio económico de cada comercio de la residencial.",
};

export default function PaginaTablero() {
  return (
    <>
      <SiteHeader seccion="tablero" />
      <main id="contenido" className="flex-1">
        <Tablero />
      </main>
      <SiteFooter />
    </>
  );
}
