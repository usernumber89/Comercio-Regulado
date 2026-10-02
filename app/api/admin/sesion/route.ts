import { cookies } from "next/headers";

import { cuerpo, error } from "@/lib/api";
import {
  autenticacionAdminConfigurada,
  COOKIE_ADMIN,
  crearTokenAdmin,
  coincidePasswordAdmin,
  DURACION_SESION_ADMIN,
} from "@/lib/autenticacion-admin";

export async function POST(request: Request) {
  if (!autenticacionAdminConfigurada()) {
    return error(
      "Configura ADMIN_PASSWORD y ADMIN_SESSION_SECRET en el entorno del servidor.",
      503,
    );
  }

  const datos = await cuerpo(request);
  const password = typeof datos.password === "string" ? datos.password : "";
  if (!coincidePasswordAdmin(password)) {
    return error("La contraseña no es correcta.", 401);
  }

  const almacen = await cookies();
  almacen.set(COOKIE_ADMIN, crearTokenAdmin(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_SESION_ADMIN,
  });

  return Response.json({ ok: true });
}

export async function DELETE() {
  const almacen = await cookies();
  almacen.delete(COOKIE_ADMIN);
  return Response.json({ ok: true });
}