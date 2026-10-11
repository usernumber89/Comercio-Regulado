import { cookies } from "next/headers";

import { cuerpo, error } from "@/lib/api";
import {
  COOKIE_COMERCIANTE,
  crearTokenComerciante,
  DURACION_SESION_COMERCIANTE,
  validarCredencialesComerciante,
} from "@/lib/autenticacion-comerciante";

export async function POST(request: Request) {
  const datos = await cuerpo(request);
  const codigo = typeof datos.codigo === "string" ? datos.codigo.trim() : "";
  const password = typeof datos.password === "string" ? datos.password : "";
  if (!codigo || !password) return error("Ingresa el código del comercio y la contraseña.");

  const tiendaId = await validarCredencialesComerciante(codigo, password);
  if (!tiendaId) return error("El código o la contraseña no son correctos.", 401);

  const almacen = await cookies();
  almacen.set(COOKIE_COMERCIANTE, crearTokenComerciante(tiendaId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_COMERCIANTE,
  });

  return Response.json({ ok: true });
}

export async function DELETE() {
  const almacen = await cookies();
  almacen.delete(COOKIE_COMERCIANTE);
  return Response.json({ ok: true });
}
