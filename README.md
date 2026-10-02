# Comercio Regulado

**Plataforma de gestión comercial.** Administra comercios autorizados, horarios,
incidencias, reseñas y cumplimiento desde un solo lugar.

## Rutas

| Ruta                    | Qué hace                                                                 | Acceso  |
| ----------------------- | ------------------------------------------------------------------------ | ------- |
| `/`                     | Resumen de la plataforma y su flujo de trabajo                            | Pública |
| `/tiendas`              | Directorio de todos los comercios, con buscador y filtro por rubro       | Pública |
| `/tiendas/[tiendaId]`   | Ficha pública: código, horario, semáforo, reseñas y reportes            | Pública |
| `/dashboard`            | Tablero de fichas: perfil, quejas, cumplimiento y beneficio             | Interna |
| `/dashboard/quejas`     | Canal de quejas con folio, para compartir por WhatsApp                  | Interna |
| `/verificar/[tiendaId]` | Redirección permanente a la ficha, para los QR ya impresos              | Pública |

El QR de cada ficha se arma con el origen real del sitio, así que el mismo
código funciona en `localhost`, en una IP de red local y en el despliegue.

## Requisitos

- Node.js 20 o superior
- npm 10 o superior
- Una base de datos en [Neon](https://neon.tech) (el plan gratis alcanza de
  sobra) o cualquier Postgres 15 o superior.

## Puesta en marcha

1. Crear el proyecto en Neon y copiar `.env.example` a `.env`, cambiando las
   dos URL por las del panel. Neon da dos conexiones y se necesitan las dos:
   `DATABASE_URL` (la del pooler, con `-pooler` en el host) y `DIRECT_URL` (la
   directa, que es la que puede crear tablas).

2. Instalar y crear las tablas:

```bash
npm install
npm run db:migrar      # crea las tablas
```

3. Arrancar:

```bash
npm run dev
```

Abrir <http://localhost:3000>.

Las migraciones también corren solas después de `npm install` en Vercel, pero
el paso explícito de `db:migrar` conviene ponerlo una vez a mano para saber si
falló.

## Scripts

```bash
npm run dev           # servidor de desarrollo
npm run build         # build de producción
npm run start         # servir el build
npm run lint          # ESLint
npm run db:migrar     # aplicar las migraciones (crear/actualizar tablas)
npm run db:studio     # abrir los datos en el navegador
npm run exportar      # dos CSV con los datos, en español
```

## Cómo editar los datos

Las opciones del formulario y los textos de la interfaz se mantienen separados
de la lógica:

- **`data/tiendas.ts`** — rubros y sugerencias de productos.
- **`data/sitio.ts`** — titulares, textos de la portada, metadatos SEO y origen
  público del sitio.

El puntaje de cumplimiento no se escribe en ningún lado: se deriva de los
reportes.

```
puntaje = 100 − 20 × (reportes activos en los últimos 30 días)
```

| Rango  | Estado       | Color      |
| ------ | ------------ | ---------- |
| 80–100 | En rango     | Verde      |
| 40–79  | En observación | Mostaza  |
| 0–39   | En revisión  | Terracota  |

Los registros comienzan vacíos. El puntaje se calcula a medida que se reciben
incidencias para cada comercio.

## Decisiones técnicas

**PostgreSQL en Neon con Prisma, no SQLite.** Antes el proyecto guardaba todo
en un archivo `localStorage` del navegador y luego pasó a un archivo SQLite en
el servidor. Los dos eran locales: solo servían si las personas usaban la misma
máquina, y con `localStorage` cada quien tenía su propia copia. Con Neon la
base es una sola y es la misma para todo el mundo, esté donde esté, con un
enlace normal de internet.

`lib/db.ts` arma un único cliente de Prisma sobre el driver de Neon, que habla
por HTTP con un pooler delante. Eso tiene dos consecuencias que el proyecto
tiene que respetar: cada consulta es un viaje de ida y vuelta, así que todo lo
que lee la base es `async`, y no hay transacciones interactivas, así que el
folio de los reportes lo pone una secuencia de PostgreSQL en vez de un
`MAX(folio) + 1` dentro de una transacción. Con la secuencia, dos personas que
reporten en el mismo segundo reciben números distintos sin coordinación de
ningún tipo.

**El store no guarda nada.** Zustand solo mantiene lo que es de esa pantalla
(tienda abierta, pestaña, meses del slider) y lo que llegó de la base. Las
acciones escriben por la API y reemplazan el estado por lo que el servidor
devolvió, de modo que lo que se ve es siempre lo que quedó guardado. Cada
página que lee la base es dinámica (`force-dynamic`): una tienda o una denuncia
nueva tiene que verse sin esperar un redespliegue.

**Tema e hidratación.** Lo único que se guarda en el navegador es la
preferencia de tema, y de eso se encarga `next-themes`: el `<html>` lleva
`suppressHydrationWarning` porque su `class` cambia en cuanto el cliente lee
`localStorage`. El resto son Server Components, así que no hay nada más que
pueda diferir entre el HTML del servidor y el del cliente. Donde la pantalla
necesita saber si ya está en el cliente, consulta `useHidratado()`.

**Formato como string, no como función.** `Contador` es un Client Component y
los Server Components no pueden pasarle callbacks por props: un `formato`
de tipo `(valor: number) => string` rompe el prerender. Por eso el
componente acepta `formato="numero" | "moneda" | "minutos" | "horas"`.

**`MotionConfig reducedMotion="user"`.** Envuelve el tablero para que
framer-motion respete la preferencia del sistema en todo el subárbol, en lugar
de desactivar animación a mano componente por componente.

**Origen real sin `useEffect`.** `useOrigen()` usa `useSyncExternalStore`: el
servidor devuelve `SITIO_URL` y el cliente `window.location.origin`. Es lo que
permite que el QR y el enlace de WhatsApp sean correctos en cualquier entorno.

## Accesibilidad

- Navegación completa por teclado: pestañas, selector de tienda, slider y
  diálogos siguen el patrón ARIA de sus componentes Radix.
- Etiquetas accesibles en todos los controles. El interruptor de tema describe
  la acción, no el estado, así que nunca miente.
- El anillo de cumplimiento expone `role="img"` con una etiqueta que repite el
  porcentaje, de modo que el canal audible y el visual dicen lo mismo.
- Las barras comparativas también llevan `role="img"` con su valor textual.
- Con `prefers-reduced-motion` el contador aparece fijo en su valor, el
  ticker se detiene y las transiciones se acortan a cero.
- Foco visible en todos los elementos interactivos, incluido el skip link.

## Despliegue en Vercel

1. Importar el repositorio en Vercel.
2. En **Settings → Environment Variables** agregar las dos de Neon:
   `DATABASE_URL` (la del pooler) y `DIRECT_URL` (la directa), para
   Production, Preview y Development.
3. Aceptar los valores detectados: framework **Next.js**, build
   `npm run build`, output por defecto.
4. Aplicar las migraciones una vez, desde la terminal, con la variable
   `DIRECT_URL` apuntando a la base de producción:

```bash
npm run db:migrar
```

Antes de publicar, actualizar `SITIO_URL` en `data/sitio.ts` con el dominio
real. Ese valor alimenta los metadatos, `sitemap.xml` y `robots.txt`; el QR y
los enlaces de compartición usan el origen en tiempo de ejecución, así que se
ajustan solos.

> **Pendiente: no hay autenticación.** Cualquiera con la URL puede entrar al
> tablero, dar de alta y borrar comercios, publicar reseñas y resolver
> denuncias. Antes de publicarlo en abierto hay que proteger `/dashboard` y las
> rutas de escritura con un login. El directorio y las fichas de `/tiendas` sí
> deben seguir siendo públicos: son los que lee el código QR.

## Reseñas

La valoración va de una a cinco estrellas y es pública de inmediato, sin
moderación. Una reseña de **una sola estrella es una denuncia**: al guardarla
además se abre un reporte con folio, y ese reporte es lo que descuenta veinte
puntos del cumplimiento. De dos a cinco estrellas son opinión y no mueven el
puntaje. Así una reseña mala nunca queda en el aire: siempre tiene folio para
que la Junta la resuelva.

## Estructura

```
app/
  layout.tsx              raíz: fuentes, tema y metadatos
  page.tsx                portada
  not-found.tsx           404
  robots.ts, sitemap.ts   SEO
  api/                    lectura y escritura en la base
  dashboard/              tablero y canal de quejas
  tiendas/                directorio y ficha pública de cada comercio
  verificar/[tiendaId]/   redirección a la ficha, para los QR ya impresos
components/
  landing/                portada y flujo de trabajo
  dashboard/              selector, pestañas y las cuatro vistas
  opinion/                formulario de reseña y su presentación
  tienda/                 directorio, tarjetas y botones de opinión
  theme/                  proveedor e interruptor de tema
  ui/                     primitivas reestilizadas sobre Radix
data/
  tiendas.ts              rubros y sugerencias para el formulario
  sitio.ts                textos y metadatos del sitio
lib/
  db.ts                   cliente de Prisma sobre Neon
  repositorio.ts          todas las consultas, con sus reglas de negocio
  cliente-api.ts          las mismas operaciones, desde el navegador
  cumplimiento.ts         fórmula de puntaje y umbrales
  format.ts               moneda, fechas y tiempo relativo
  use-origen.ts           origen real, seguro para SSR
  use-in-view.ts          IntersectionObserver
prisma/
  schema.prisma           las tablas y sus tipos
  migrations/             cambios de estructura, versionados
store/
  use-panel.ts            estado global de la pantalla
types/
  index.ts                tipos del dominio
```

## Alcance y límites

- **No hay autenticación.** `/dashboard` y las operaciones de alta y borrado
  son públicas. Antes de exponer el sitio hay que protegerlas con inicio de
  sesión y permisos.
- **No hay moderación.** Las reseñas se publican al instante y no hay flujo de
  revisión ni forma de ocultarlas.
- Las cifras económicas son estimaciones a partir de las compras declaradas por
  cada comercio, no mediciones auditadas.
