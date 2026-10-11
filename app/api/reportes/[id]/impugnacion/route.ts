import { cuerpo, error, leerImpugnacion } from "@/lib/api";
import { tiendaSesionComerciante } from "@/lib/autenticacion-comerciante";
import { impugnarReporte } from "@/lib/repositorio";

export async function POST(
  request: Request,
  context: RouteContext<"/api/reportes/[id]/impugnacion">,
) {
  const tiendaId = await tiendaSesionComerciante();
  if (!tiendaId) return error("Inicia sesión como comerciante para impugnar reportes.", 401);

  const lectura = leerImpugnacion(await cuerpo(request));
  if (!lectura.ok) return error(lectura.mensaje);
  const { id } = await context.params;

  try {
    const reporte = await impugnarReporte(id, tiendaId, lectura.motivo);
    if (!reporte) return error("Ese reporte no pertenece a tu comercio.", 404);
    return Response.json({ reporte }, { status: 201 });
  } catch (fallo) {
    if (fallo instanceof Error) return error(fallo.message, 409);
    throw fallo;
  }
}
