import { cuerpo, error, leerValidacion } from "@/lib/api";
import { tieneSesionAdmin } from "@/lib/autenticacion-admin";
import { validarReporte } from "@/lib/repositorio";

export async function PATCH(
  _request: Request,
  context: RouteContext<"/api/reportes/[id]/validacion">,
) {
  if (!(await tieneSesionAdmin())) return error("Inicia sesión para validar reportes.", 401);
  const lectura = leerValidacion(await cuerpo(_request));
  if (!lectura.ok) return error(lectura.mensaje);
  const { id } = await context.params;

  try {
    const reporte = await validarReporte(id, lectura.valor);
    if (!reporte) return error("Ese reporte no existe.", 404);
    return Response.json({ reporte });
  } catch (fallo) {
    if (fallo instanceof Error && fallo.message.includes("impugnación")) {
      return error(fallo.message, 409);
    }
    if (fallo instanceof Error && fallo.message.includes("ya fue validado")) {
      return error(fallo.message, 409);
    }
    throw fallo;
  }
}
