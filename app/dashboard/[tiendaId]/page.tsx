import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Tablero } from "@/components/dashboard/tablero";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { tieneSesionAdmin } from "@/lib/autenticacion-admin";
import { obtenerTienda } from "@/lib/repositorio";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/dashboard/[tiendaId]">,
): Promise<Metadata> {
  const { tiendaId } = await props.params;
  const tienda = await obtenerTienda(tiendaId);

  return { title: tienda ? `${tienda.nombre} · Gestión` : "Comercio no encontrado" };
}

export default async function PaginaGestionTienda(
  props: PageProps<"/dashboard/[tiendaId]">,
) {
  const { tiendaId } = await props.params;
  const tienda = await obtenerTienda(tiendaId);
  const administrador = await tieneSesionAdmin();

  if (!tienda) notFound();

  return (
    <>
      <SiteHeader seccion="directorio" />
      <main id="contenido" className="flex-1">
        <Tablero tiendaId={tienda.id} administrador={administrador} />
      </main>
      <SiteFooter />
    </>
  );
}