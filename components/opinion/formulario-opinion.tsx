"use client";

import { StarIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox, Label } from "@/components/ui/form-controls";
import { Input, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { DatosOpinion } from "@/store/use-panel";

const MIN_COMENTARIO_DENUNCIA = 12;

export function FormularioOpinion({
  tiendaId,
  onGuardar,
  guardando,
  estrellasIniciales = 5,
  children,
}: {
  tiendaId: string;
  onGuardar: (datos: DatosOpinion) => Promise<void>;
  guardando: boolean;
  /** Con qué valor arranca el selector. El botón "Reportar" entra en 1. */
  estrellasIniciales?: number;
  /** Contenido del botón que abre el diálogo. */
  children?: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const [estrellas, setEstrellas] = useState(estrellasIniciales);
  const [comentario, setComentario] = useState("");
  const [autor, setAutor] = useState("");
  const [anonimo, setAnonimo] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * El formulario se limpia al cerrar, no con un efecto al cambiar `abierto`:
   * resetearlo junto al evento que lo abre y cierra evita el segundo render que
   * provoca un `setState` dentro de un efecto.
   */
  function cambiarAbierto(siguiente: boolean) {
    setAbierto(siguiente);
    if (!siguiente) {
      setEstrellas(estrellasIniciales);
      setComentario("");
      setAutor("");
      setAnonimo(true);
      setError(null);
    }
  }

  const esDenuncia = estrellas === 1;
  const comentarioValido = !esDenuncia || comentario.trim().length >= MIN_COMENTARIO_DENUNCIA;
  const autorValido = anonimo || autor.trim().length >= 2;
  const valido = comentarioValido && autorValido;

  async function enviar() {
    if (!valido || guardando) return;

    try {
      setError(null);
      await onGuardar({
        tiendaId,
        estrellas,
        comentario,
        autor,
        anonimo,
      });
      cambiarAbierto(false);
    } catch (fallo) {
      setError(
        fallo instanceof Error ? fallo.message : "No se pudo guardar la opinión.",
      );
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={cambiarAbierto}>
      <DialogTrigger asChild>
        <Button variant="secundario" size="sm">
          {children ?? (
            <>
              <StarIcon aria-hidden />
              Opinar
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {esDenuncia ? "Registrar una denuncia" : "Escribir una reseña"}
          </DialogTitle>
          <DialogDescription>
            {esDenuncia
              ? "Una valoración de una sola estrella es una denuncia. Cuenta igual en el puntaje y la Junta podrá resolverla con un folio."
              : "Tu opinión es pública y ayuda a que la comunidad sepa cómo fue la atención. Puedes dejarla en anónimo."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-[var(--tinta)]">Valoración</p>
            <div
              className="flex items-center gap-1.5"
              role="radiogroup"
              aria-label="Valorar la atención, de una a cinco estrellas"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={estrellas === n}
                  className="group flex items-center justify-center rounded-sm p-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--bosque)]"
                  onClick={() => setEstrellas(n)}
                >
                  <StarIcon
                    className={cn(
                      "size-7",
                      n <= estrellas
                        ? "fill-[var(--mostaza)] stroke-[var(--mostaza)]"
                        : "fill-transparent stroke-[var(--borde-fuerte)] group-hover:stroke-[var(--bosque)]",
                    )}
                  />
                  <span className="sr-only">{n} estrella{n === 1 ? "" : "s"}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-[var(--tinta-tenue)]">
              {esDenuncia
                ? "1★ = Denuncia (abre un folio y cuenta en el puntaje)"
                : `${estrellas}★ — ${estrellas >= 4 ? "Buena" : estrellas === 3 ? "Regular" : "Mejorable"}`}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="comentario">Comentario</Label>
            <Textarea
              id="comentario"
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={3}
              placeholder={
                esDenuncia
                  ? "Cuéntanos qué pasó, cuándo y dónde, con el mayor detalle posible."
                  : "Cuéntanos cómo te atendieron (opcional)"
              }
            />
            {esDenuncia ? (
              <p
                className={cn(
                  "text-xs",
                  comentario.trim().length >= MIN_COMENTARIO_DENUNCIA
                    ? "text-[var(--tinta-tenue)]"
                    : "text-[var(--terracota-tinta)]",
                )}
              >
                Mínimo {MIN_COMENTARIO_DENUNCIA} caracteres ({comentario.trim().length}/
                {MIN_COMENTARIO_DENUNCIA})
              </p>
            ) : (
              <p className="text-xs text-[var(--tinta-tenue)]">
                {comentario.trim().length} caracteres — se puede dejar vacío.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <Checkbox
                id="anonimo"
                checked={anonimo}
                onCheckedChange={(v) => setAnonimo(!!v)}
              />
              <Label htmlFor="anonimo">Publicar en anónimo</Label>
            </div>

            {!anonimo ? (
              <div className="flex flex-col gap-2">
                <Label htmlFor="autor">Tu nombre</Label>
                <Input
                  id="autor"
                  value={autor}
                  onChange={(e) => setAutor(e.target.value)}
                  placeholder="Nombre y primer apellido"
                />
                <p className="text-xs text-[var(--tinta-tenue)]">
                  Al menos 2 caracteres para mostrar junto a tu reseña.
                </p>
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="rounded-md border border-[var(--terracota)] bg-[var(--terracota-lavado)] px-3 py-2 text-sm leading-relaxed text-[var(--terracota-tinta)]">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="contorno">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={enviar} disabled={!valido || guardando}>
            {guardando
              ? "Guardando…"
              : esDenuncia
                ? "Guardar denuncia"
                : "Guardar reseña"}
          </Button>
        </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
