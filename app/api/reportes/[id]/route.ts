import { error } from "@/lib/api";
import { tieneSesionAdmin } from "@/lib/autenticacion-admin";
import { alternarEstadoReporte } from "@/lib/repositorio";

/**
 * Resolver o reabrir una denuncia.
 *
 * Alterna el estado entre `activo` y `resuelto`. El puntaje de cumplimiento
 * se deriva de ahí, así que no hay nada más que sincronizar.
 */
export async function PATCH(
  _request: Request,
  context: RouteContext<"/api/reportes/[id]">,
) {
  if (!(await tieneSesionAdmin())) {
    return error("Inicia sesión para resolver o reabrir reportes.", 401);
  }

  const { id } = await context.params;

  const reporte = await alternarEstadoReporte(id);
  if (!reporte) return error("Ese reporte no existe.", 404);

  return Response.json({ reporte });
}
