import { cuerpo, error, leerSancion } from "@/lib/api";
import { tieneSesionAdmin } from "@/lib/autenticacion-admin";
import { registrarSancion } from "@/lib/repositorio";

export async function POST(
  request: Request,
  context: RouteContext<"/api/reportes/[id]/sanciones">,
) {
  if (!(await tieneSesionAdmin())) return error("Inicia sesión para registrar sanciones.", 401);

  const lectura = leerSancion(await cuerpo(request));
  if (!lectura.ok) return error(lectura.mensaje);
  const { id } = await context.params;

  try {
    const reporte = await registrarSancion(id, lectura.valor);
    if (!reporte) return error("Ese reporte no existe.", 404);
    return Response.json({ reporte }, { status: 201 });
  } catch (fallo) {
    if (fallo instanceof Error) return error(fallo.message, 409);
    throw fallo;
  }
}
