import { cuerpo, error, leerSeguimientoReporte } from "@/lib/api";
import { registrarSeguimientoReporte } from "@/lib/repositorio";

export async function POST(
  request: Request,
  context: RouteContext<"/api/reportes/[id]/seguimiento">,
) {
  const { id } = await context.params;
  const lectura = leerSeguimientoReporte(await cuerpo(request));
  if (!lectura.ok) return error(lectura.mensaje);

  try {
    const reporte = await registrarSeguimientoReporte(id, lectura.valor);
    if (!reporte) return error("Ese reporte no existe.", 404);
    return Response.json({ reporte }, { status: 201 });
  } catch (fallo) {
    const conflicto =
      fallo instanceof Error &&
      fallo.message === "Reabre el reporte antes de registrar más seguimiento.";
    return error(
      conflicto
        ? fallo.message
        : "No se pudo guardar el seguimiento.",
      conflicto ? 409 : 500,
    );
  }
}