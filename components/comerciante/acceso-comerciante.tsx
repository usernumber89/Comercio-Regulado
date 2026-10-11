"use client";

import { KeyRoundIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/form-controls";
import { Input } from "@/components/ui/input";

export function AccesoComerciante({ codigoInvitacion }: { codigoInvitacion?: string }) {
  const router = useRouter();
  const [codigo, setCodigo] = useState(codigoInvitacion ?? "");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const activando = Boolean(codigoInvitacion);

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);
    if (activando && password !== confirmacion) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setGuardando(true);

    try {
      const respuesta = await fetch(
        activando ? "/api/comerciante/activar" : "/api/comerciante/sesion",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigo, password }),
        },
      );
      const datos = (await respuesta.json()) as { error?: string };
      if (!respuesta.ok) {
        setError(datos.error ?? "No se pudo completar el acceso.");
        return;
      }
      setPassword("");
      setConfirmacion("");
      router.replace("/comerciante");
      router.refresh();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : "No se pudo conectar con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="mx-auto mt-8 max-w-lg rounded-lg border border-[var(--borde)] bg-[var(--superficie)] p-5 shadow-[var(--sombra-tenue)] sm:p-6">
      <div className="flex items-center gap-2 text-[var(--tinta)]">
        <KeyRoundIcon className="size-4" aria-hidden />
        <h2 className="font-serif text-lg font-semibold">
          {activando ? "Activar cuenta del comercio" : "Acceso de comerciante"}
        </h2>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--tinta-suave)]">
        {activando
          ? "Usa el enlace de un solo uso entregado por Administración y define una contraseña de al menos 12 caracteres."
          : "Inicia sesión con el código de tu comercio y la contraseña que definiste al activar tu cuenta."}
      </p>
      <form onSubmit={enviar} className="mt-5 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="codigo-comerciante">
            {activando ? "Código de invitación" : "Código del comercio"}
          </Label>
          <Input
            id="codigo-comerciante"
            required
            readOnly={activando}
            autoComplete="off"
            value={codigo}
            onChange={(evento) => setCodigo(evento.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password-comerciante">Contraseña</Label>
          <Input
            id="password-comerciante"
            type="password"
            autoComplete={activando ? "new-password" : "current-password"}
            minLength={12}
            maxLength={200}
            required
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
          />
        </div>
        {activando ? (
          <div className="space-y-1.5">
            <Label htmlFor="confirmacion-comerciante">Confirmar contraseña</Label>
            <Input
              id="confirmacion-comerciante"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={200}
              required
              value={confirmacion}
              onChange={(evento) => setConfirmacion(evento.target.value)}
            />
          </div>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-[var(--terracota-tinta)]">
            {error}
          </p>
        ) : null}
        <Button type="submit" disabled={guardando}>
          <KeyRoundIcon aria-hidden />
          {guardando ? "Procesando…" : activando ? "Activar cuenta" : "Iniciar sesión"}
        </Button>
      </form>
    </section>
  );
}
