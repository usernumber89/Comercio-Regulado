import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

/**
 * Ruta antigua de la ficha pública.
 *
 * Era `/verificar/[id]` y ahora la ficha vive en `/tiendas/[id]`, junto al
 * directorio. Se deja esta ruta redirigiendo en vez de borrarla: los códigos QR
 * ya impresos y pegados en los locales apuntan aquí, y un 404 en un papel
 * pegado en una góndola no se arregla con un redespliegue.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Ficha del comercio",
    // Una redirección permanente no necesita indexarse: la canónica es la de
    // `/tiendas/[id]`.
    robots: { index: false, follow: true },
  };
}

export default async function PaginaVerificar(
  props: PageProps<"/verificar/[tiendaId]">,
) {
  const { tiendaId } = await props.params;
  permanentRedirect(`/tiendas/${tiendaId}`);
}
