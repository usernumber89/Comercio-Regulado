"use client";

import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { Button } from "@/components/ui/button";
import { useHidratado } from "@/lib/use-hidratado";
import { useOrigen } from "@/lib/use-origen";
import type { Tienda } from "@/types";

/** Colores del QR por tema. Un código necesita contraste alto para leerse. */
const COLORES = {
  light: { fondo: "#fbf8f0", tinta: "#234b3b" },
  dark: { fondo: "#1a2016", tinta: "#a6c6ae" },
};

const LADO = 148;

/**
 * Código QR de verificación.
 *
 * Apunta a `/tiendas/[tienda-id]`, la página pública que cualquiera puede
 * abrir desde el teléfono para comprobar la autorización sin entrar al
 * tablero. La URL se arma con el origen real del sitio para que el código
 * funcione igual en localhost, en una IP de red y en el despliegue.
 */
export function CodigoQR({ tienda }: { tienda: Tienda }) {
  const { resolvedTheme } = useTheme();
  const hidratado = useHidratado();
  const origen = useOrigen();
  const url = `${origen}/tiendas/${tienda.id}`;
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!copiado) return;
    const tiempo = setTimeout(() => setCopiado(false), 2200);
    return () => clearTimeout(tiempo);
  }, [copiado]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
    } catch {
      // Si el portapapeles está bloqueado, el enlace sigue visible para
      // copiarlo a mano. No merece la pena interrumpir al usuario con un error.
    }
  }

  const paleta = hidratado && resolvedTheme === "dark" ? COLORES.dark : COLORES.light;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <div
        className="shrink-0 rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-2.5"
        style={{ width: LADO + 20, height: LADO + 20 }}
      >
        {/* El tema oscuro se aplica tras hidratar para mantener el SVG estable. */}
        <QRCodeSVG
          value={url}
          size={LADO}
          level="M"
          marginSize={1}
          bgColor={paleta.fondo}
          fgColor={paleta.tinta}
          title={`Código de verificación de ${tienda.nombre}`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-serif text-lg font-semibold text-[var(--tinta)]">
          Ficha pública
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--tinta-suave)]">
          Cualquier vecino puede escanear este código y ver la autorización
          vigente, el horario, los productos permitidos y las reseñas, sin
          necesitar una cuenta.
        </p>

        <p className="mt-3 truncate rounded-md bg-[var(--hundido)] px-2.5 py-1.5 font-mono text-xs text-[var(--tinta-suave)]">
          {url}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secundario"
            size="sm"
            onClick={copiar}
          >
            {copiado ? (
              <CheckIcon aria-hidden />
            ) : (
              <CopyIcon aria-hidden />
            )}
            {copiado ? "Enlace copiado" : "Copiar enlace"}
          </Button>

          <Button asChild variant="contorno" size="sm">
            <Link href={`/tiendas/${tienda.id}`} target="_blank">
              Abrir ficha pública
              <ExternalLinkIcon aria-hidden />
              <span className="sr-only">(se abre en una pestaña nueva)</span>
            </Link>
          </Button>
        </div>

        <p className="mt-3 text-xs text-[var(--tinta-tenue)]">
          Autorizada desde el {tienda.autorizadoDesde}.
        </p>
      </div>
    </div>
  );
}
