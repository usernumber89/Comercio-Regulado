"use client";

import { KeyRoundIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/form-controls";

export function AccesoConfiguracion({
  configurado,
}: {
  configurado: boolean;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  if (!configurado) {
    return (
      <section
        role="status"
        className="max-w-lg border-t border-[var(--borde)] pt-5"
      >
        <h2 className="text-sm font-semibold text-[var(--tinta)]">
          Falta configurar el acceso
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--tinta-suave)]">
          Define ADMIN_PASSWORD (12 caracteres o más) y ADMIN_SESSION_SECRET
          (32 bytes o más) en el entorno del servidor. No guardes estos valores
          en el repositorio.
        </p>
      </section>
    );
  }

  async function ingresar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    setGuardando(true);

    try {
      const respuesta = await fetch("/api/admin/sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const datos = (await respuesta.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!respuesta.ok) {
        setError(datos.error ?? "No se pudo iniciar la sesión.");
        return;
      }

      setPassword("");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="max-w-lg border-t border-[var(--borde)] pt-5">
      <div className="flex items-center gap-2 text-[var(--tinta)]">
        <KeyRoundIcon className="size-4" aria-hidden />
        <h2 className="text-sm font-semibold">Acceso de administración</h2>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-[var(--tinta-suave)]">
        Esta sección está protegida. Las quejas y reseñas públicas no requieren
        iniciar sesión.
      </p>
      <form onSubmit={ingresar} className="mt-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="password-admin">Contraseña</Label>
          <Input
            id="password-admin"
            type="password"
            autoComplete="current-password"
            minLength={12}
            required
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "password-admin-error" : undefined}
          />
          {error ? (
            <p
              id="password-admin-error"
              role="alert"
              className="text-sm text-[var(--terracota-tinta)]"
            >
              {error}
            </p>
          ) : null}
        </div>
        <Button type="submit" disabled={guardando}>
          <KeyRoundIcon aria-hidden />
          {guardando ? "Verificando…" : "Entrar"}
        </Button>
      </form>
    </section>
  );
}

export function CerrarSesionConfiguracion() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  async function salir() {
    setGuardando(true);
    try {
      await fetch("/api/admin/sesion", { method: "DELETE" });
      router.refresh();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Button
      type="button"
      variant="contorno"
      size="sm"
      onClick={() => void salir()}
      disabled={guardando}
    >
      <LogOutIcon aria-hidden />
      {guardando ? "Saliendo…" : "Cerrar sesión"}
    </Button>
  );
}