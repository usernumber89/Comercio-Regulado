import { cuerpo, error, leerReporte } from "@/lib/api";
import { obtenerTienda, registrarReporte } from "@/lib/repositorio";

/**
 * Alta de una denuncia.
 *
 * Escribe una fila en `reportes` y devuelve el reporte ya guardado, con su
 * folio. El folio lo asigna el servidor —en realidad, la secuencia de la
 * base— nunca el cliente: por eso dos personas que reporten al mismo tiempo no
 * pueden sacar el mismo número.
 */
export async function POST(request: Request) {
  const lectura = leerReporte(await cuerpo(request));
  if (!lectura.ok) return error(lectura.mensaje);

  if (!(await obtenerTienda(lectura.valor.tiendaId))) {
    return error("La tienda que se está reportando no existe.", 404);
  }

  try {
    const reporte = await registrarReporte(lectura.valor);
    return Response.json({ reporte }, { status: 201 });
  } catch (fallo) {
    return error(
      fallo instanceof Error ? fallo.message : "No se pudo registrar la denuncia.",
      500,
    );
  }
}
