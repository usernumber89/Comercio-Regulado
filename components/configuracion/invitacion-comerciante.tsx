"use client";

import { ClipboardCopyIcon, KeyRoundIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { crearInvitacionComerciante } from "@/lib/cliente-api";

export function InvitacionComerciante({
  tiendaId,
  nombre,
}: {
  tiendaId: string;
  nombre: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function generar() {
    setGuardando(true);
    setError(null);
    setUrl(null);
    try {
      const invitacion = await crearInvitacionComerciante(tiendaId);
      setUrl(
        `${window.location.origin}/comerciante/activar?codigo=${encodeURIComponent(invitacion.codigo)}`,
      );
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo generar la invitación.");
    } finally {
      setGuardando(false);
    }
  }

  async function copiar() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch (fallo) {
      setError(
        fallo instanceof Error
          ? "No se pudo copiar el enlace. Selecciónalo y cópialo manualmente."
          : "No se pudo copiar el enlace.",
      );
    }
  }

  return (
    <div className="min-w-0">
      <Button
        type="button"
        variant="contorno"
        size="sm"
        onClick={() => void generar()}
        disabled={guardando}
        aria-label={`Crear invitación de cuenta para ${nombre}`}
      >
        <KeyRoundIcon aria-hidden />
        {guardando ? "Generando…" : "        Invitar / restablecer acceso"}
      </Button>
      {error ? (
        <p role="alert" className="mt-2 max-w-sm text-xs text-[var(--terracota-tinta)]">
          {error}
        </p>
      ) : null}
      {url ? (
        <div className="mt-2 max-w-sm rounded-md border border-[var(--borde)] bg-[var(--hundido)] p-3">
          <p className="text-xs leading-relaxed text-[var(--tinta-suave)]">
            Comparte este enlace únicamente con el titular. Es de un solo uso
            y vence en siete días; al activarlo, reemplaza la contraseña anterior.
          </p>
          <a
            href={url}
            className="mt-2 block break-all text-xs font-medium text-[var(--bosque-tinta)] underline"
          >
            {url}
          </a>
          <Button type="button" variant="fantasma" size="sm" className="mt-1" onClick={() => void copiar()}>
            <ClipboardCopyIcon aria-hidden />
            Copiar enlace
          </Button>
        </div>
      ) : null}
    </div>
  );
}
