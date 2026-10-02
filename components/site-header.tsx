import Link from "next/link";

import { InterruptorTema } from "@/components/theme/interruptor-tema";
import { METADATOS } from "@/data/sitio";
import { cn } from "@/lib/utils";

type Seccion = "inicio" | "directorio" | "tablero" | "quejas";

const ENLACES: { texto: string; href: string; seccion: Seccion }[] = [
  { texto: "Inicio", href: "/", seccion: "inicio" },
  { texto: "Comercios", href: "/tiendas", seccion: "directorio" },
  { texto: "Tablero", href: "/dashboard", seccion: "tablero" },
  { texto: "Reportar", href: "/dashboard/quejas", seccion: "quejas" },
];

/** Marca tipográfica del proyecto. Hereda `currentColor`. */
export function Marca({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn("size-6 shrink-0", className)}
      fill="none"
    >
      <rect
        x="1.6"
        y="1.6"
        width="20.8"
        height="20.8"
        rx="5.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M7 16.5V9.8l5 4.1 5-4.1v6.7"
        stroke="var(--mostaza)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SiteHeader({ seccion }: { seccion?: Seccion }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--borde)] bg-[var(--superficie)]">
      <div className="mx-auto grid min-h-16 w-full max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 px-4 py-2 md:flex md:h-16 md:gap-6 md:px-6 md:py-0 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[var(--tinta)]"
          aria-label={`${METADATOS.titulo}, ir al inicio`}
        >
          <Marca />
          <span className="font-serif text-base font-semibold tracking-tight whitespace-nowrap sm:text-lg">
            Comercio&nbsp;Regulado
          </span>
        </Link>

        <nav
          aria-label="Principal"
          className="col-span-full min-w-0 md:ml-auto md:col-span-1"
        >
          <ul className="flex items-center justify-between gap-0.5 md:justify-start">
            {ENLACES.map((enlace) => {
              const activo = seccion === enlace.seccion;
              return (
                <li key={enlace.href} className="min-w-0 md:flex-none">
                  <Link
                    href={enlace.href}
                    aria-current={activo ? "page" : undefined}
                    className={cn(
                      "block truncate rounded-md px-2 py-2 text-center text-xs font-medium transition-colors md:px-3 md:text-sm",
                      activo
                        ? "bg-[var(--bosque-lavado)] text-[var(--bosque-tinta)]"
                        : "text-[var(--tinta-suave)] hover:bg-[var(--hundido)] hover:text-[var(--tinta)]",
                    )}
                  >
                    {enlace.texto}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <InterruptorTema className="-mr-1 col-start-2 row-start-1 md:static" />
      </div>
    </header>
  );
}
