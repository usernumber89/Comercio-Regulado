import { error } from "@/lib/api";
import { tieneSesionAdmin } from "@/lib/autenticacion-admin";
import { registrarSubsanacion } from "@/lib/repositorio";

export async function PATCH(
  _request: Request,
  context: RouteContext<"/api/reportes/[id]/subsanacion">,
) {
  if (!(await tieneSesionAdmin())) return error("Inicia sesión para registrar la subsanación.", 401);
  const { id } = await context.params;

  try {
    const reporte = await registrarSubsanacion(id);
    if (!reporte) return error("Ese reporte no existe.", 404);
    return Response.json({ reporte });
  } catch (fallo) {
    if (fallo instanceof Error) return error(fallo.message, 409);
    throw fallo;
  }
}
