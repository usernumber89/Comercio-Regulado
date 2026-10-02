import Link from "next/link";
import {
  ArrowRightIcon,
  ClipboardCheckIcon,
  Clock3Icon,
  StoreIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { HERO } from "@/data/sitio";

/**
 * Bloque principal de la portada.
 *
 * El contenido principal se renderiza en el servidor.
 */
export function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)] lg:gap-16 lg:px-8">
      <div>
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--mostaza-tinta)]">
          <span className="size-2 rounded-full bg-[var(--mostaza)]" aria-hidden />
          Plataforma de administración
        </p>

        <h1 className="mt-5 max-w-2xl text-4xl leading-tight font-semibold text-balance text-[var(--tinta)] sm:text-5xl">
          {HERO.titular}
        </h1>

        <p className="mt-5 max-w-xl text-base leading-7 text-pretty text-[var(--tinta-suave)] sm:text-lg">
          {HERO.bajada}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button asChild size="lg">
            <Link href="/dashboard">
              {HERO.ctaPrimario}
              <ArrowRightIcon aria-hidden />
            </Link>
          </Button>
          <Button asChild size="lg" variant="contorno">
            <Link href="/tiendas">{HERO.ctaSecundario}</Link>
          </Button>
        </div>

        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-[var(--borde)] pt-5 text-sm text-[var(--tinta-suave)]">
          <span>Autorizaciones</span>
          <span>Incidencias</span>
          <span>Cumplimiento</span>
        </div>
      </div>

      <aside className="rounded-lg border border-[var(--borde)] bg-[var(--superficie)] shadow-[var(--sombra-media)]">
        <div className="flex items-center justify-between gap-4 border-b border-[var(--borde)] px-5 py-4 sm:px-6">
          <div>
            <p className="text-sm font-semibold text-[var(--tinta)]">Centro de gestión</p>
            <p className="mt-0.5 text-xs text-[var(--tinta-tenue)]">Comercio Regulado</p>
          </div>
          <span className="rounded-full bg-[var(--bosque-lavado)] px-2.5 py-1 text-xs font-medium text-[var(--bosque-tinta)]">
            Panel operativo
          </span>
        </div>

        <ul className="divide-y divide-[var(--borde)] px-5 sm:px-6">
          <li className="flex items-center gap-4 py-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[var(--bosque-lavado)] text-[var(--bosque-tinta)]">
              <StoreIcon size={18} aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold text-[var(--tinta)]">Directorio de comercios</span>
              <span className="mt-1 block text-sm text-[var(--tinta-suave)]">Fichas, ubicaciones y autorizaciones</span>
            </span>
          </li>
          <li className="flex items-center gap-4 py-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[var(--mostaza-lavado)] text-[var(--mostaza-tinta)]">
              <ClipboardCheckIcon size={18} aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold text-[var(--tinta)]">Seguimiento de incidencias</span>
              <span className="mt-1 block text-sm text-[var(--tinta-suave)]">Registro, folios e historial de atención</span>
            </span>
          </li>
          <li className="flex items-center gap-4 py-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[var(--hundido)] text-[var(--tinta-suave)]">
              <Clock3Icon size={18} aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold text-[var(--tinta)]">Horarios y cumplimiento</span>
              <span className="mt-1 block text-sm text-[var(--tinta-suave)]">Información actualizada y verificable</span>
            </span>
          </li>
        </ul>

        <div className="border-t border-[var(--borde)] px-5 py-4 sm:px-6">
          <Link href="/dashboard" className="text-sm font-semibold text-[var(--mostaza-tinta)] hover:underline">
            Ir al panel de administración <span aria-hidden>→</span>
          </Link>
        </div>
      </aside>
    </section>
  );
}
