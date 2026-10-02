import { cuerpo, error, leerTienda } from "@/lib/api";
import { crearTienda } from "@/lib/repositorio";

/**
 * Alta de un comercio.
 *
 * Recibe el borrador tal como lo armó el formulario, lo vuelve a validar en
 * el servidor y escribe una fila en la tabla de tiendas.
 */
export async function POST(request: Request) {
  const lectura = leerTienda(await cuerpo(request));

  if (!lectura.ok) {
    // El primer campo con error manda: es el que el formulario muestra.
    const [campo] = Object.entries(lectura.errores)[0] ?? [];
    return error(
      campo ? `${lectura.errores[campo as keyof typeof lectura.errores]}` : "Revisa los campos marcados.",
    );
  }

  try {
    const tienda = await crearTienda(lectura.valor);
    return Response.json({ tienda }, { status: 201 });
  } catch (fallo) {
    return error(
      fallo instanceof Error
        ? fallo.message
        : "No se pudo registrar la tienda.",
      500,
    );
  }
}
