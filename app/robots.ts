import type { MetadataRoute } from "next";

import { SITIO_URL } from "@/data/sitio";

/**
 * robots.txt
 *
 * El tablero es una herramienta interna, así que se pide que los buscadores no
 * lo indexen. El directorio y las fichas públicas sí se dejan: son la parte
 * que debe poder encontrarse por búsqueda o compartirse.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/tiendas/"],
        disallow: ["/dashboard", "/dashboard/quejas"],
      },
    ],
    sitemap: `${SITIO_URL}/sitemap.xml`,
    host: SITIO_URL,
  };
}
