import type { MetadataRoute } from "next";

import { SITIO_URL } from "@/data/sitio";
import { listarTiendas } from "@/lib/repositorio";

/**
 * sitemap.xml
 *
 * Se listan solo las páginas públicas. La gestión individual es interna y no
 * tiene nada que ofrecerle a un índice de búsqueda.
 *
 * El directorio y las fichas se leen de la base de datos, así que un comercio
 * dado de alta aparece en el mapa del sitio sin tocar nada. La ruta antigua
 * `/verificar/[id]` no se lista: es una redirección permanente.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ahora = new Date();
  const tiendas = await listarTiendas();

  return [
    {
      url: SITIO_URL,
      lastModified: ahora,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${SITIO_URL}/tiendas`,
      lastModified: ahora,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...tiendas.map((tienda) => ({
      url: `${SITIO_URL}/tiendas/${tienda.id}`,
      lastModified: ahora,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
