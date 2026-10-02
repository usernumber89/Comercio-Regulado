import { cuerpo, error, leerTienda } from "@/lib/api";
import { tieneSesionAdmin } from "@/lib/autenticacion-admin";
import { actualizarTienda, eliminarTienda } from "@/lib/repositorio";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/tiendas/[id]">,
) {
  if (!(await tieneSesionAdmin())) {
    return error("Inicia sesión para administrar los comercios.", 401);
  }

  const { id } = await context.params;
  const lectura = leerTienda(await cuerpo(request));
  if (!lectura.ok) {
    return error(
      Object.values(lectura.errores)[0] ?? "Revisa los datos del comercio.",
    );
  }

  try {
    const tienda = await actualizarTienda(id, lectura.valor);
    if (!tienda) return error("Ese comercio no existe.", 404);
    return Response.json({ tienda });
  } catch (fallo) {
    return error(
      fallo instanceof Error ? fallo.message : "No se pudo actualizar el comercio.",
      500,
    );
  }
}

/**
 * Baja de un comercio registrado desde la interfaz.
 * Los reportes de esa tienda se borran con ella.
 */
export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/tiendas/[id]">,
) {
  if (!(await tieneSesionAdmin())) {
    return error("Inicia sesión para administrar los comercios.", 401);
  }

  const { id } = await context.params;

  if (!(await eliminarTienda(id))) {
    return error("Ese comercio no existe.", 404);
  }

  return Response.json({ ok: true });
}
