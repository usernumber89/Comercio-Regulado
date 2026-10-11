# Comercio Regulado

**Plataforma de gestión comercial.** Administra comercios autorizados, horarios,
incidencias, reseñas y cumplimiento desde un solo lugar.

## Rutas

| Ruta                    | Qué hace                                                                 | Acceso  |
| ----------------------- | ------------------------------------------------------------------------ | ------- |
| `/`                     | Resumen de la plataforma y su flujo de trabajo                            | Pública |
| `/tiendas`              | Selección de comercios para abrir su gestión o ficha pública             | Pública |
| `/dashboard/[tiendaId]` | Gestión individual: perfil, quejas, cumplimiento y beneficio             | Interna |
| `/configuracion`        | Alta y administración del catálogo de comercios                          | Interna |
| `/tiendas/[tiendaId]`   | Ficha pública: código, horario, semáforo, reseñas y reportes            | Pública |
| `/dashboard/quejas`     | Canal de quejas con folio, para compartir por WhatsApp                  | Pública |
| `/comerciante`          | Expediente privado, semáforo e impugnaciones del titular                | Cuenta activada |
| `/comerciante/activar`  | Activación por invitación de un solo uso                                 | Invitación |
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

El puntaje no se escribe por separado: se deriva de reportes que Administración
haya validado. Un reporte en trámite o una impugnación pendiente no resta puntos.

```
puntaje = max(0, 100 − Σ(puntos de infracciones validadas en los últimos 30 días))
```

| Gravedad | Deducción | Consecuencia primaria |
| -------- | --------- | ---------------------- |
| Leve | 10 puntos (5 si se subsana dentro del plazo) | Notificación preventiva y cinco días hábiles para subsanar |
| Grave | 20 puntos | Amonestación escrita |
| Muy grave | 40 puntos | Evaluación prioritaria y audiencia de Junta en cinco días hábiles |

Cada validación mantiene puntos por 30 días calendario. Los estados son Verde
(80–100), Amarillo (40–79) y Rojo (0–39). La reincidencia se mide en seis meses
y únicamente dentro de la misma categoría de conducta. Las amonestaciones y
sanciones formales se exponen durante seis meses.

Los titulares entran a `/comerciante`. Administración genera una invitación
de un solo uso desde Configuración; el enlace vence a los siete días. El titular
activa la cuenta con una contraseña de al menos 12 caracteres y accede con el
código EPS de su comercio. Administración puede emitir otra invitación para
restablecer el acceso; al activarla se invalida la contraseña anterior. Las
contraseñas se almacenan derivadas con scrypt y
las sesiones usan cookies `HttpOnly`, `SameSite=Lax` firmadas con
`ADMIN_SESSION_SECRET`. Las impugnaciones tienen acuse inmediato, suspenden
puntaje y sanciones formales hasta que una persona imparcial las resuelva dentro
de diez días hábiles. Mientras se resuelve una impugnación, Administración
puede registrar una medida preventiva temporal únicamente si confirma un
peligro para la salud o la seguridad, justifica la medida y fija su vencimiento.
Los plazos del portal cuentan todos los días excepto los domingos.

Solo Administración puede validar reportes y registrar sanciones. Las
suspensiones y revocaciones se bloquean en servidor si el expediente no cumple
sus condiciones de procedencia o si no consta audiencia previa y resolución
motivada.

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

**`MotionConfig reducedMotion="user"`.** Envuelve la gestión de cada comercio para que
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
3. Agregar `ADMIN_PASSWORD` (12 caracteres o más) y
  `ADMIN_SESSION_SECRET` (secreto aleatorio de 32 bytes o más). No reutilices
  la contraseña de Neon ni subas estos valores al repositorio. Para generar
  el secreto localmente:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

4. Aceptar los valores detectados: framework **Next.js**, build
   `npm run build`, output por defecto.
5. Aplicar las migraciones una vez, desde la terminal, con la variable
   `DIRECT_URL` apuntando a la base de producción:

```bash
npm run db:migrar
```

Antes de publicar, actualizar `SITIO_URL` en `data/sitio.ts` con el dominio
real. Ese valor alimenta los metadatos, `sitemap.xml` y `robots.txt`; el QR y
los enlaces de compartición usan el origen en tiempo de ejecución, así que se
ajustan solos.

> **Alcance de autenticación:** el portal del comerciante protege la consulta
> del expediente e impugnaciones. El inicio de sesión de Administración protege
> Configuración y las decisiones de cumplimiento. Otras funciones públicas
> existentes (p. ej., publicar reseñas y registrar reportes) mantienen su
> acceso público; no las confundas con un reporte validado o una resolución de
> Junta.

## Reseñas

La valoración va de una a cinco estrellas y es pública de inmediato, sin
moderación. Una reseña de **una sola estrella abre un reporte** con folio. No
descuenta puntos automáticamente: el reporte se debe verificar y validar bajo
una categoría y gravedad del reglamento antes de afectar el semáforo. De dos a
cinco estrellas son opinión y no mueven el puntaje.

## Estructura

```
app/
  layout.tsx              raíz: fuentes, tema y metadatos
  page.tsx                portada
  not-found.tsx           404
  robots.ts, sitemap.ts   SEO
  api/                    lectura y escritura en la base
  dashboard/              gestión individual por comercio y canal de quejas
  configuracion/           alta y administración del catálogo
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

- **No hay autenticación.** La gestión individual, Configuración y las
  operaciones de escritura son públicas. Antes de exponer el sitio hay que
  proteger `/dashboard/[tiendaId]`, `/configuracion` y las APIs con permisos.
- **No hay moderación.** Las reseñas se publican al instante y no hay flujo de
  revisión ni forma de ocultarlas.
- Las cifras económicas son estimaciones a partir de las compras declaradas por
  cada comercio, no mediciones auditadas.
