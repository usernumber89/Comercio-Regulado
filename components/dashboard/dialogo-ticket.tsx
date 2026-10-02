"use client";

import { MessageCircleIcon } from "lucide-react";

import { Comprobante } from "@/components/dashboard/comprobante";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOrigen } from "@/lib/use-origen";
import type { Reporte } from "@/types";

/**
 * Confirmación del registro de un reporte.
 *
 * El enlace de WhatsApp es deliberado: en una residencial privada el canal
 * real de circulación de información es ese, no el correo. Abre un mensaje
 * con el folio ya escrito, que es lo que el vecino necesita poder citar.
 */
export function DialogoTicket({
  reporte,
  nombreTienda,
  abierto,
  onCerrar,
}: {
  reporte: Reporte | null;
  nombreTienda: string;
  abierto: boolean;
  onCerrar: () => void;
}) {
  const origen = useOrigen();

  if (!reporte) return null;

  const urlCompartible = `${origen}/dashboard/quejas?folio=${reporte.folio}`;
  const mensaje = `Reporte ${reporte.folio} registrado en Comercio Regulado para ${nombreTienda}.`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(
    `${mensaje} ${urlCompartible}`,
  )}`;

  return (
    <Dialog open={abierto} onOpenChange={(estado) => !estado && onCerrar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reporte registrado</DialogTitle>
          <DialogDescription>
            El folio quedó asentado en el historial de la tienda y ya cuenta
            para el puntaje de cumplimiento mientras siga activo.
          </DialogDescription>
        </DialogHeader>

        <Comprobante reporte={reporte} nombreTienda={nombreTienda} />

        <DialogFooter>
          <Button variant="contorno" onClick={onCerrar}>
            Cerrar
          </Button>
          <Button asChild>
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircleIcon aria-hidden />
              Compartir por WhatsApp
              <span className="sr-only">(se abre en una pestaña nueva)</span>
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
