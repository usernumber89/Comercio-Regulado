import { cookies } from "next/headers";

import { cuerpo, error } from "@/lib/api";
import {
  activarCuentaComerciante,
  COOKIE_COMERCIANTE,
  crearTokenComerciante,
  DURACION_SESION_COMERCIANTE,
} from "@/lib/autenticacion-comerciante";
import { Prisma } from "@/prisma/generated/client";

export async function POST(request: Request) {
  const datos = await cuerpo(request);
  const codigo = typeof datos.codigo === "string" ? datos.codigo.trim() : "";
  const password = typeof datos.password === "string" ? datos.password : "";
  if (codigo.length < 20) return error("El código de invitación no es válido.");
  if (Buffer.byteLength(password, "utf8") < 12 || password.length > 200) {
    return error("La contraseña debe tener al menos 12 caracteres.");
  }

  try {
    const cuenta = await activarCuentaComerciante(codigo, password);
    if (!cuenta) return error("La invitación no existe, ya se usó o venció.", 410);
    const almacen = await cookies();
    almacen.set(COOKIE_COMERCIANTE, crearTokenComerciante(cuenta.tiendaId), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: DURACION_SESION_COMERCIANTE,
    });
    return Response.json({ ok: true });
  } catch (fallo) {
    if (
      fallo instanceof Prisma.PrismaClientKnownRequestError &&
      fallo.code === "P2002"
    ) {
      return error("La cuenta ya fue activada. Inicia sesión con tu código de comercio.", 409);
    }
    throw fallo;
  }
}
