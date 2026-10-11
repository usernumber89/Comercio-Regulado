import { error } from "@/lib/api";
import { crearInvitacionComerciante } from "@/lib/autenticacion-comerciante";
import { tieneSesionAdmin } from "@/lib/autenticacion-admin";
import { obtenerTienda } from "@/lib/repositorio";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/admin/comerciantes/[tiendaId]/invitacion">,
) {
  if (!(await tieneSesionAdmin())) {
    return error("Inicia sesión para invitar a un comerciante.", 401);
  }

  const { tiendaId } = await context.params;
  if (!(await obtenerTienda(tiendaId))) return error("Ese comercio no existe.", 404);

  try {
    const invitacion = await crearInvitacionComerciante(tiendaId);
    return Response.json(
      {
        codigo: invitacion.codigo,
        expiraEn: invitacion.expiraEn.toISOString(),
      },
      { status: 201 },
    );
  } catch (fallo) {
    return error(
      fallo instanceof Error ? fallo.message : "No se pudo generar la invitación.",
      500,
    );
  }
}
