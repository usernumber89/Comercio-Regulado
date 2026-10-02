import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { Marca } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function NoEncontrado() {
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="flex-1">
        <div className="mx-auto flex w-full max-w-xl flex-col items-start px-4 py-20 sm:px-6 sm:py-28">
          <Marca className="size-9 text-[var(--bosque-tinta)]" />

          <p className="mt-6 font-mono text-xs text-[var(--tinta-tenue)]">
            Error 404
          </p>
          <h1 className="filete-bosque mt-2 w-full border-t-2 border-t-[var(--bosque)] pt-5 font-serif text-3xl font-semibold text-balance text-[var(--tinta)] sm:text-4xl">
            Esta ficha no existe
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--tinta-suave)] sm:text-base">
            El código QR de una tienda apunta a una dirección fija por tienda.
            Si llegaste desde un QR, es posible que el enlace esté incompleto o
            que la tienda haya cambiado de identificador.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard">Ir al tablero</Link>
            </Button>
            <Button asChild variant="contorno">
              <Link href="/">Volver al inicio</Link>
            </Button>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
