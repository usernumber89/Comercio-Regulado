import type { Metadata } from "next";
import Link from "next/link";

import { DirectorioTiendas } from "@/components/tienda/directorio-tiendas";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { METADATOS, SITIO_URL } from "@/data/sitio";
import { listarTiendas } from "@/lib/repositorio";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Comercios",
    description: `Selecciona un comercio de ${METADATOS.titulo} para gestionar su perfil, quejas, cumplimiento y beneficios.`,
    alternates: { canonical: "/tiendas" },
  };
}

export default async function PaginaTiendas() {
  const tiendas = await listarTiendas();

  return (
    <>
      <SiteHeader seccion="directorio" />
      <main id="contenido" className="flex-1 bg-[var(--papel)]">
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="filete-bosque border-t-2 border-t-[var(--bosque)] pt-5">
          <p className="font-mono text-xs text-[var(--tinta-tenue)]">
            Comercio Regulado · Comercios
          </p>
          <h1 className="mt-2 font-serif text-3xl font-semibold text-balance text-[var(--tinta)] sm:text-4xl">
            Selecciona un comercio
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--tinta-suave)] sm:text-base">
            Abre la gestión individual para revisar perfil, quejas, cumplimiento
            y beneficios. La ficha pública de cada comercio sigue disponible
            por separado para residentes y visitantes.
          </p>
          <p className="mt-3 font-mono text-xs text-[var(--tinta-tenue)]">
            {tiendas.length} comercio{tiendas.length === 1 ? "" : "s"} ·{" "}
            <Link href={SITIO_URL} className="underline underline-offset-4">
              {SITIO_URL.replace(/^https?:\/\//, "")}
            </Link>
          </p>
        </header>

        <DirectorioTiendas tiendas={tiendas} />
      </div>
      </main>
      <SiteFooter />
    </>
  );
}
