import type { CSSProperties } from "react";

/**
 * Cinta horizontal de eventos simulados.
 *
 * Es un componente de servidor: el desplazamiento es CSS puro, así que no
 * cuesta JavaScript ni necesita hidratación. La pista se duplica para que el
 * bucle no tenga costura visible, y la copia animada queda marcada como
 * decorativa para que un lector de pantalla no lea los eventos dos veces.
 *
 * Si el sistema pide menos movimiento, la regla de `globals.css` detiene la
 * animación; el contenido sigue siendo legible.
 */
export function Ticker({ eventos }: { eventos: readonly string[] }) {
  const pista = [...eventos, ...eventos];

  return (
    <div className="ticker-zona relative overflow-hidden border-y border-[var(--borde)]">
      <div
        className="ticker-pista"
        style={{ "--ticker-duracion": `${Math.max(eventos.length, 4) * 5}s` } as CSSProperties}
        aria-hidden="true"
      >
        {pista.map((evento, indice) => (
          <span
            key={`${evento}-${indice}`}
            className="flex items-center gap-3 px-6 font-mono text-xs whitespace-nowrap text-[var(--tinta-suave)]"
          >
            <span
              className="size-1.5 shrink-0 rounded-full bg-[var(--mostaza)]"
              aria-hidden
            />
            {evento}
          </span>
        ))}
      </div>

      <ul className="sr-only">
        {eventos.map((evento) => (
          <li key={evento}>{evento}</li>
        ))}
      </ul>
    </div>
  );
}
