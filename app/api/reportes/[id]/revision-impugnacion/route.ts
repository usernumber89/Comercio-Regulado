import { cuerpo, error, leerRevisionImpugnacion } from "@/lib/api";
import { tieneSesionAdmin } from "@/lib/autenticacion-admin";
import { resolverImpugnacion } from "@/lib/repositorio";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/reportes/[id]/revision-impugnacion">,
) {
  if (!(await tieneSesionAdmin())) return error("Inicia sesión para resolver impugnaciones.", 401);

  const lectura = leerRevisionImpugnacion(await cuerpo(request));
  if (!lectura.ok) return error(lectura.mensaje);
  const { id } = await context.params;

  try {
    const reporte = await resolverImpugnacion(id, lectura.valor);
    if (!reporte) return error("Ese reporte no existe.", 404);
    return Response.json({ reporte });
  } catch (fallo) {
    if (fallo instanceof Error) return error(fallo.message, 409);
    throw fallo;
  }
}
