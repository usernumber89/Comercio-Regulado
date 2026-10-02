"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type * as React from "react";

/**
 * Proveedor de tema.
 *
 * next-themes inyecta su propio script bloqueante en el `<head>`, así que
 * aplica la preferencia guardada antes del primer pintado y no hay destello.
 * Por eso `<html>` necesita `suppressHydrationWarning`: el atributo que el
 * navegador ya aplicó difiere del que el servidor renderizó, y eso es
 * intencional.
 *
 * Solo envuelve a los hijos, nunca a `<html>` ni a `<body>`: mantener el
 * proveedor lo más abajo posible deja que Next.js pueda prerenderizar el
 * resto de la página como servidor.
 */
export function ProveedorTema({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      {...props}
      scriptProps={{
        ...props.scriptProps,
        type: typeof window === "undefined" ? "text/javascript" : "text/plain",
      }}
    >
      {children}
    </NextThemesProvider>
  );
}
