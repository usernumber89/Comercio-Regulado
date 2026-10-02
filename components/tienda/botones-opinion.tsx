"use client";

import { AlertTriangleIcon, MessageSquareIcon, ThumbsUpIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormularioOpinion } from "@/components/opinion/formulario-opinion";
import { Button } from "@/components/ui/button";
import { registrarResena } from "@/lib/cliente-api";
import type { Tienda } from "@/types";

/**
 * Acciones públicas de opinión sobre un comercio.
 *
 * Tres caminos distintos porque desde el teléfono hay tres intenciones
 * distintas: llamar para decir que todo bien, comentar con una valoración, o
 * denunciar. La valoración de una sola estrella ya abre una denuncia con folio,
 * así que "Opinar" y "Denunciar" terminan en el mismo registro y por eso
 * comparten formulario.
 *
 * Tras guardar se recarga la ruta del servidor en vez de parchear el estado
 * local: el promedio, el reparto y el puntaje se derivan de lo guardado, y
 * `router.refresh()` muestra exactamente eso sin duplicar el cálculo aquí.
 */
export function BotonesOpinion({ tienda }: { tienda: Tienda }) {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  async function guardar(estrellas: number, comentario = "", autor = "", anonimo = true) {
    setGuardando(true);
    try {
      await registrarResena({ tiendaId: tienda.id, estrellas, comentario, autor, anonimo });
      router.refresh();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="contorno"
        size="sm"
        disabled={guardando}
        onClick={() => void guardar(5, "Atención buena.")}
      >
        <ThumbsUpIcon aria-hidden />
        Me atendieron bien
      </Button>

      <FormularioOpinion
        tiendaId={tienda.id}
        guardando={guardando}
        onGuardar={async (datos) => {
          await guardar(datos.estrellas, datos.comentario, datos.autor, datos.anonimo);
        }}
      >
        <MessageSquareIcon aria-hidden />
        Opinar
      </FormularioOpinion>

      <FormularioOpinion
        tiendaId={tienda.id}
        guardando={guardando}
        estrellasIniciales={1}
        onGuardar={async (datos) => {
          await guardar(datos.estrellas, datos.comentario, datos.autor, datos.anonimo);
        }}
      >
        <AlertTriangleIcon aria-hidden />
        Reportar
      </FormularioOpinion>
    </div>
  );
}
