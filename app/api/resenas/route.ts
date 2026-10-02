import { cuerpo, error, leerResena } from "@/lib/api";
import { obtenerTienda, registrarResena } from "@/lib/repositorio";

/**
 * Alta de una reseña.
 *
 * Es la única vía para opinar sobre una tienda y es pública: no hay cuenta ni
 * moderación, así que lo que se escribe queda escrito. Lo único que el servidor
 * decide es cuántas estrellas son y si hace falta explicarlas.
 *
 * Si la reseña es de una sola estrella, `registrarResena()` abre además una
 * denuncia con folio, y la respuesta la trae para que quien la escribió pueda
 * seguirla. Esa denuncia es la que cuenta al puntaje de cumplimiento.
 */
export async function POST(request: Request) {
  const lectura = leerResena(await cuerpo(request));
  if (!lectura.ok) return error(lectura.mensaje);

  if (!(await obtenerTienda(lectura.valor.tiendaId))) {
    return error("La tienda que se está reseñando no existe.", 404);
  }

  try {
    const guardada = await registrarResena(lectura.valor);
    return Response.json(guardada, { status: 201 });
  } catch (fallo) {
    return error(
      fallo instanceof Error ? fallo.message : "No se pudo guardar la reseña.",
      500,
    );
  }
}
