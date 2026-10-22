# Refactor visual de Mova_Web — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la landing de Mova deje de leerse como una landing generada, adoptando la paleta completa de la app y dándole a cada sección la forma de su contenido.

**Architecture:** Se conservan los tres archivos (`index.html`, `styles.css`, `script.js`) y la arquitectura `@layer reset, tokens, base, components, utilities` con sus tres tiers de tokens. El refactor avanza de abajo hacia arriba: primero se reescribe la capa `tokens` (color y tipografía), después se quitan los recursos genéricos globales, y recién entonces se rehace sección por sección sobre tokens ya estables. Cada tarea deja la página en un estado publicable.

**Tech Stack:** HTML + CSS + JS vanilla. Sin build, sin dependencias, sin framework. `@layer`, `light-dark()`, `clamp()`, `IntersectionObserver`, `<dialog>` nativo. Fuentes por Google Fonts. Publicación por GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-22-refactor-visual-mova-web-design.md`

## Global Constraints

- Sin build, sin npm, sin framework. Solo `index.html`, `styles.css`, `script.js`.
- Se conserva `@layer reset, tokens, base, components, utilities` y los tres tiers de tokens. Cambian valores y componentes, no la arquitectura.
- Claro y oscuro siguen existiendo, con `light-dark()`, el conmutador del nav y el script inline anti-destello del `<head>`, que **no se toca**.
- Verde `#00BD89` = plata que entra, acción, estado activo, confirmado. Rosa `#FF4276` = plata que sale, lo que falta. Ámbar `#FFC23D` = lo que está por pasar o vencer. Un relleno de color solo aparece donde el color significa su cosa.
- Ámbar **nunca** como texto sobre claro. Rosa no sirve para texto de cuerpo sobre claro (≈3.6:1): usar `--neg-ink`.
- Todo dato en color lleva además una señal no cromática (ícono, signo, posición).
- Prohibido: acentuar una palabra del titular en otro color/itálica/degradado; etiquetas en mayúsculas sobre los títulos; `→` en texto de botones o links; metadatos unidos con `·`.
- Las capturas `.webp` conservan sus `width`/`height` actuales.
- Las respuestas del JSON-LD deben seguir coincidiendo con el FAQ visible.
- El sitio tiene que seguir siendo usable sin JS.
- Las fuentes se piden en **un solo** `<link>` a Google Fonts con `preconnect` y `display=swap`.

## Review Focus

Cinco cosas que la spec implica y que ninguna tarea probaría por sí sola. Cada una tiene su chequeo agregado a la tarea dueña del código:

1. **Sin JS** — el panel del hero, el conmutador de esquema y el recorrido tienen que degradar a algo usable, no a un hueco. (Tareas 3, 4, 7)
2. **`prefers-reduced-motion`** — el contador del balance aparece completo, sin animar. (Tarea 4)
3. **320px** — sin scroll horizontal en ninguna sección; el panel del hero y la lista de funciones son los dos riesgos. (Tareas 4, 6, 12)
4. **`localStorage` bloqueado** (navegación privada) — el conmutador de esquema no puede tirar y dejar la página a medio pintar. (Tarea 1)
5. **Zoom de texto al 200%** — la escala fluida está en `rem` y debe aguantarlo sin romper el nav ni la calculadora. (Tareas 2, 9)

---

## File Structure

| Archivo | Responsabilidad | Tareas que lo tocan |
|---|---|---|
| `styles.css` | Tokens, base y todos los componentes. Se mantiene como archivo único: partirlo sumaría peticiones y el sitio no tiene build. | 1–12 |
| `index.html` | Estructura y copy. Cambian el `<head>` (fuentes, `theme-color`) y el marcado de cada sección. | 1–12 |
| `script.js` | Comportamiento. Se le quita el observador de `.reveal` y se le suma el contador del balance. | 3, 4 |
| `.claude/launch.json` | Servidor estático local para poder verificar en el navegador. Es config local, ya ignorada por git. | 1 |

---

## Task 1: Tokens de color y neutros teñidos

**Files:**
- Modify: `styles.css` (capa `@layer tokens`, líneas ~10–178)
- Modify: `index.html:9-10` (las dos metas `theme-color`)
- Create: `.claude/launch.json`

**Interfaces:**
- Produce los tokens que consumen **todas** las tareas siguientes:
  - Tier 1 marca: `--green-200/300/500/600/700`, `--ink-on-green`, `--pink-300`, `--pink-500`, `--pink-700`, `--amber-500`, `--amber-700`
  - Tier 1 neutros claros: `--l-000` `#FFFFFF`, `--l-025` `#F7FAF9`, `--l-050` `#F1F5F3`, `--l-075`, `--l-100`, `--l-200`, `--l-600`, `--l-700`, `--l-900`
  - Tier 1 neutros oscuros: `--d-950` `#071F18`, `--d-900`, `--d-850` `#0D2A22`, `--d-800`, `--d-750`, `--d-700`, `--d-050` `#F1F5F3`, `--d-300`, `--d-400`
  - Tier 2 semánticos: los existentes (`--bg`, `--surface`, `--surface-2`, `--surface-sunken`, `--line`, `--line-strong`, `--fg`, `--fg-muted`, `--fg-subtle`, `--accent`, `--accent-fg`, `--accent-ink`, `--accent-soft`, `--accent-line`, `--accent-badge`) **más** `--neg`, `--neg-ink`, `--neg-soft`, `--neg-line`, `--warn`, `--warn-soft`, `--warn-line`
  - `--info-soft` / `--info-line` se conservan con valores re-derivados contra la base verdosa.
  - `--phone-screen-bg` se conserva oscuro en ambos esquemas.

- [ ] **Step 1: Crear `.claude/launch.json` para poder verificar**

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "mova-web", "runtimeExecutable": "python", "runtimeArgs": ["-m", "http.server", "5500"], "port": 5500 }
  ]
}
```

- [ ] **Step 2: Escribir el chequeo de contraste**

Snippet reutilizable por las tareas siguientes. Se ejecuta con `javascript_tool` sobre la página abierta; devuelve el ratio WCAG entre dos tokens resueltos.

```js
const ratio = (a, b) => {
  const lum = (c) => {
    const [r, g, bl] = c.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number)
      .map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
    return .2126 * r + .7152 * g + .0722 * bl;
  };
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + .05) / (l2 + .05);
};
const px = (t) => getComputedStyle(document.documentElement).getPropertyValue(t);
```

- [ ] **Step 3: Reescribir Tier 1 con los neutros teñidos y los tres colores**

En `@layer tokens`. Valores de partida — el paso 5 los confirma o los corrige:

```
--l-000:#FFFFFF  --l-025:#F7FAF9  --l-050:#F1F5F3  --l-075:#EAF0ED
--l-100:#DDE6E2  --l-200:#C7D4CE  --l-600:#5F6F69  --l-700:#47544F  --l-900:#0F1C18
--d-950:#071F18  --d-900:#0A241C  --d-850:#0D2A22  --d-800:#11332A
--d-750:#173F34  --d-700:#1E4C40  --d-050:#F1F5F3  --d-300:#A9BAB3  --d-400:#7E918A
--pink-500:#FF4276  --pink-300:#FF8FAE  --pink-700:#B3123F
--amber-500:#FFC23D  --amber-700:#7A5600
```

Los `--green-*` y `--ink-on-green` quedan como están. Se borran los `--l-*` y `--d-*` cálidos anteriores y el token suelto `--pink`.

- [ ] **Step 4: Reescribir Tier 2 y Tier 3 sobre los nuevos Tier 1**

Agregar la familia negativa y la de advertencia, con la misma estructura partida que ya usa `--accent` (relleno igual en ambos modos, tinta distinta):

```
--neg:       var(--pink-500);
--neg-ink:   light-dark(var(--pink-700), var(--pink-300));
--neg-soft:  light-dark(rgba(255,66,118,.10), rgba(255,66,118,.14));
--neg-line:  light-dark(rgba(179,18,63,.28), rgba(255,66,118,.24));
--warn:      var(--amber-500);
--warn-soft: light-dark(rgba(255,194,61,.16), rgba(255,194,61,.16));
--warn-line: light-dark(rgba(122,86,0,.28), rgba(255,194,61,.28));
```

Re-derivar `--info-soft` / `--info-line` contra la base verdosa: el claro sigue siendo más frío que `--surface`, y el oscuro deja de ser casi-negro neutro para quedar un paso más frío que `--d-850`. Re-derivar también los colores de sombra, `--edge-*` y `--glow-*`.

Borrar `--glow-hero*` y `--glow-download*`: la tarea 4 y la 11 eliminan los dos glows.

- [ ] **Step 5: Verificar contraste en los dos esquemas**

Abrir con `preview_start {name:"mova-web"}` y correr el snippet del paso 2 sobre cada par, una vez con `data-pin="light"` y otra con `data-pin="dark"`:

| Par | Mínimo |
|---|---|
| `--fg` / `--bg` | 7:1 |
| `--fg-muted` / `--bg` | 4.5:1 |
| `--fg-subtle` / `--surface` | 4.5:1 |
| `--accent-ink` / `--surface` | 4.5:1 |
| `--neg-ink` / `--surface` | 4.5:1 |
| `--ink-on-green` / `--accent` | 4.5:1 |
| `--line` / `--surface` | 1.3:1 (hairline visible) |

Cualquier valor que no llegue se corrige en Tier 1 y se vuelve a medir. Anotar los valores finales en un comentario del propio `styles.css`.

- [ ] **Step 6: Actualizar las dos metas `theme-color`**

`#F1F5F3` para claro y `#071F18` para oscuro, en `index.html:9-10`.

- [ ] **Step 7: Verificar que el conmutador sobrevive sin `localStorage`** *(Review Focus 4)*

En la consola de la página: redefinir `localStorage.setItem` para que tire, recargar y tocar el conmutador.
Expected: la página se pinta completa, el conmutador cambia el esquema en caliente y no hay excepciones en consola.

- [ ] **Step 8: Commit**

```bash
git add styles.css index.html .claude/launch.json
git commit -m "refactor(tokens): paleta completa de la app y neutros tenidos de verde"
```

---

## Task 2: Tipografía

**Files:**
- Modify: `index.html:54-59` (preconnect + `<link>` de fuentes)
- Modify: `styles.css` (`--font-body`, `--font-display`, tramos `--lh-*`)

**Interfaces:**
- Produce: `--font-body` (Archivo), `--font-display` (Archivo Narrow). Las tareas 4–12 usan `--font-display` en titulares y cifras.

- [ ] **Step 1: Cambiar el `<link>` de Google Fonts**

Una sola petición para las dos familias:
`https://fonts.googleapis.com/css2?family=Archivo:wght@400..700&family=Archivo+Narrow:wght@500..700&display=swap`
Se conservan los dos `preconnect`. Se borra el comentario que nombra a Inter e Instrument Sans y se escribe el nuevo.

- [ ] **Step 2: Apuntar los tokens a las nuevas familias**

`--font-body: 'Archivo', ...fallbacks del sistema`, `--font-display: 'Archivo Narrow', 'Archivo', ...`. Los fallbacks del sistema se conservan tal cual.

- [ ] **Step 3: Ajustar el interlineado de los tramos grandes**

Un condensado pide líneas más juntas: bajar `--lh-tight` y el interlineado de `--fs-3xl` / `--fs-4xl`. La escala de tamaños en `rem` no se toca.

- [ ] **Step 4: Verificar que carga una sola familia por petición**

Con la página abierta, `read_network_requests` filtrando `fonts.`
Expected: un pedido a `fonts.googleapis.com` y los `.woff2` de `fonts.gstatic.com`. Ningún pedido de Inter ni Instrument Sans.

- [ ] **Step 5: Verificar el zoom de texto al 200%** *(Review Focus 5)*

Poner `font-size: 32px` en `html` desde la consola y recorrer la página.
Expected: sin scroll horizontal, el nav no se encima y los números de la calculadora no se cortan.

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css
git commit -m "refactor(tipografia): Archivo y Archivo Narrow en lugar de Inter e Instrument Sans"
```

---

## Task 3: Quitar el movimiento genérico

**Files:**
- Modify: `script.js:84-115` (el bloque de `.reveal`)
- Modify: `index.html` (todas las apariciones de `class="... reveal"`)
- Modify: `styles.css` (las reglas `.reveal` y `.reveal.in`)

**Interfaces:**
- Produce: nada que consuman otras tareas. Deja `script.js` sin el `IntersectionObserver` de revelado; el de `scrollspy` (líneas ~117–137) **se conserva**.

- [ ] **Step 1: Borrar el observador de `.reveal` y el escalonado por filas de `script.js`**

Se borra el bloque entero, incluido el cálculo de `--i` por filas. No se toca el scrollspy ni el resto.

- [ ] **Step 2: Quitar la clase `reveal` de `index.html`**

Son ~20 apariciones. Ninguna otra clase del mismo elemento se toca.

- [ ] **Step 3: Borrar las reglas `.reveal` de `styles.css`**

- [ ] **Step 4: Verificar que no quedó ningún rastro**

```bash
grep -rn "reveal" index.html styles.css script.js
```
Expected: sin resultados.

- [ ] **Step 5: Verificar que la página sigue viva sin JS** *(Review Focus 1)*

Deshabilitar JS y recargar.
Expected: todas las secciones visibles (antes de esta tarea, sin JS `.reveal` quedaba en su estado final gracias a la rama `no-js`; ahora no depende de nada), los links funcionan y el `<details>` del FAQ abre.

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css script.js
git commit -m "refactor(movimiento): eliminar el revelado por scroll de todas las secciones"
```

---

## Task 4: Hero — panel, copy y el único momento de movimiento

**Files:**
- Modify: `index.html:163-207` (la sección `.hero` entera)
- Modify: `styles.css` (componentes `.hero`, `.badge`, `.grad`, `.phone` en el hero)
- Modify: `script.js` (agregar el contador del balance)

**Interfaces:**
- Consume: todos los tokens de la tarea 1 y `--font-display` de la tarea 2.
- Produce: `.panel` y sus hijos (`.panel__figure`, `.panel__row`, `.panel__dot`), reutilizables por ninguna otra tarea pero nombrados para que el CSS quede legible. Produce en `script.js` la función `contarHasta(el, valor)`, que la tarea 9 **no** reutiliza.

- [ ] **Step 1: Reescribir el marcado del hero**

Dos columnas. Izquierda: `h1` con **"Tu gimnasio entra en una pantalla."** en tres líneas, el `p` de hoy sin cambios (*"Mova reúne rutinas, alumnos, finanzas, tienda y staff en un mismo lugar. Simple para el profe, potente para el dueño."*), los dos CTA actuales, `.hero__meta` y `.hero__social` tal como están. Se borran `.badge`, `.hero__glow`, el `<span class="grad">` y el `.phone` del hero.

Derecha: `.panel`, con los cuatro bloques que la app realmente muestra en el inicio del admin, en este orden:
1. clases de hoy — una fila, punto ámbar;
2. requiere tu atención — una fila, punto rosa;
3. resumen financiero del mes — balance grande en verde, ingresos en verde, gastos en rosa, **como tres cifras, no como barras**;
4. alumnos activos — una línea.

Más una fila de rutina sugerida para hoy (punto verde). Al pie, una leyenda discreta que diga que las cifras son un ejemplo.

- [ ] **Step 2: Dar al panel un texto alternativo honesto** *(honestidad del dato)*

El panel es HTML, así que la aclaración va en el texto visible de la leyenda **y** en un `aria-label` del contenedor que diga que es un ejemplo de la pantalla de inicio, no datos reales.

- [ ] **Step 3: Estilar el hero y el panel en los dos esquemas**

El panel **invierte** con el esquema: usa `--surface` / `--line` / `--fg`, no valores oscuros fijos. El relieve sale de `--shadow` y `--edge`, no de un halo. Verde, rosa y ámbar solo en las cifras y los puntos que les corresponden.

- [ ] **Step 4: Verificar el contraste del panel en claro** *(el caso que la spec marca como no validado)*

Con `data-pin="light"`, correr el snippet de la tarea 1 sobre: punto ámbar contra `--surface`, cifra de gastos (`--neg-ink`) contra `--surface`, balance (`--accent-ink`) contra `--surface`.
Expected: ≥3:1 para los puntos, ≥4.5:1 para las cifras. Después, screenshot en claro y en oscuro.

- [ ] **Step 5: Escribir el contador del balance en `script.js`**

`contarHasta(el, valor)` anima el número una sola vez al cargar, con `requestAnimationFrame`. Si `prefersReducedMotion.matches`, escribe el valor final y termina. El `matchMedia` ya existe en `script.js:2`.

- [ ] **Step 6: Verificar el movimiento** *(Review Focus 2)*

Recargar con movimiento normal: el balance cuenta una vez y se detiene. Emular `prefers-reduced-motion: reduce` y recargar.
Expected: el balance aparece ya en su cifra final, sin animación, y el resto de la página no se mueve en ninguno de los dos casos.

- [ ] **Step 7: Verificar sin JS y a 320px** *(Review Focus 1 y 3)*

Sin JS: el balance tiene que estar escrito en el HTML con su valor final, no quedar en cero.
A 320px: el panel se apila bajo el titular y no hay scroll horizontal.

- [ ] **Step 8: Commit**

```bash
git add index.html styles.css script.js
git commit -m "feat(hero): panel de inicio como portada, con el balance como unico movimiento"
```

---

## Task 5: Franja de promesas

**Files:**
- Modify: `index.html:210-249`
- Modify: `styles.css` (`.strip`, `.promise`, `.promise__icon`)

- [ ] **Step 1: Convertir los cuatro bloques en una banda tipográfica**

Las cuatro afirmaciones con su texto actual, separadas por hairline (`--line`), sin los íconos de contorno. Se borran los cuatro `<svg>` y la regla `.promise__icon`.

- [ ] **Step 2: Verificar**

Screenshot en los dos esquemas y a 320px.
Expected: las cuatro afirmaciones legibles, sin íconos, sin scroll horizontal.

- [ ] **Step 3: Commit**

```bash
git add index.html styles.css
git commit -m "refactor(promesas): banda tipografica sin iconos de contorno"
```

---

## Task 6: Funciones — lista editorial con filete base/módulo

**Files:**
- Modify: `index.html:252-313`
- Modify: `styles.css` (`.grid`, `.feature`, `.feature__icon`, `.feature__tag`, `.section__head`, `.eyebrow`)

**Interfaces:**
- Produce: la convención de filete que la tarea 9 refleja en precios — verde = plan base, ámbar = módulo pago.

- [ ] **Step 1: Quitar el encabezado repetido**

Se borra el `.eyebrow` ("Funciones") de **esta** sección y el `h2` pasa a encabezar solo. El marcado de las otras cinco lo borra cada tarea dueña de su sección (7–11), y la **regla** `.eyebrow` de `styles.css` recién se borra en la tarea 12: si se borrara acá, las secciones todavía no tocadas quedarían con su etiqueta sin estilo durante cinco tareas.

- [ ] **Step 2: Convertir las seis tarjetas en lista editorial a dos columnas**

Cada ítem: filete vertical de color + `h3` + una línea. Verde para *Gestión de alumnos*, *Clases y horarios* y *Staff y roles*; ámbar para *Rutinas de entrenamiento*, *Finanzas y cobros* y *Tienda integrada*. La etiqueta "Nuevo" sobre *Clases y horarios* se conserva. El filete lleva además una palabra que diga qué significa ("incluido" / "módulo"), porque el color no puede ser el único portador.

- [ ] **Step 3: Verificar a 320px** *(Review Focus 3)*

Expected: una sola columna, filetes visibles, sin scroll horizontal.

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css
git commit -m "refactor(funciones): lista editorial con filete que marca base o modulo"
```

---

## Task 7: Recorrido

**Files:**
- Modify: `index.html:315-371`
- Modify: `styles.css` (`.tour*`, `.phone--tour`, `.checks`)

- [ ] **Step 1: Quitar el `.eyebrow` de la sección**

- [ ] **Step 2: Reestilar el conmutador de rol como control segmentado**

Un solo contenedor con fondo `--surface-2` y el botón activo en `--accent`. Se conservan los `aria-pressed` y todo el JS del recorrido.

- [ ] **Step 3: Aplanar el marco del teléfono y volver tipográfico el epígrafe**

`--phone-screen-bg` sigue oscuro en ambos esquemas.

- [ ] **Step 4: Pasar `.checks--row` a hairlines con el check en verde**

- [ ] **Step 5: Verificar que el recorrido sigue funcionando**

Cambiar de rol, pasar capturas con el paginador, abrir y cerrar el lightbox con Escape. Después, sin JS: la sección no puede quedar vacía.
Expected: todo responde; `read_console_messages` sin errores.

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css
git commit -m "refactor(recorrido): control segmentado y marco de telefono mas callado"
```

---

## Task 8: Actualizaciones

**Files:**
- Modify: `index.html:373-398`
- Modify: `styles.css` (`.updates*`, `.flowStep`, `.flowArrow`, `.snack`)

- [ ] **Step 1: Quitar el `.eyebrow` y convertir los tres pasos en línea de tiempo**

Hilo verde continuo en vez de tres cajas con flechas. La numeración 1-2-3 se conserva: es una secuencia real.

- [ ] **Step 2: Colocar `.snack` al final de la línea de tiempo**

Es el desenlace de la secuencia, no una tarjeta al costado.

- [ ] **Step 3: Verificar**

Screenshot en los dos esquemas y a 320px.
Expected: la línea se lee como una secuencia; en vertical a 320px el hilo sigue conectando los pasos.

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css
git commit -m "refactor(actualizaciones): linea de tiempo con el estado al dia como desenlace"
```

---

## Task 9: Precios

**Files:**
- Modify: `index.html:400-522`
- Modify: `styles.css` (`.pricing`, `.plan*`, `.modules*`, `.module*`, `.calc*`, `.faq--inline`)

**Interfaces:**
- Consume: la convención de color de la tarea 6 (verde = base, ámbar = módulo).
- Produce: nada. El JS de la calculadora **no se toca**.

- [ ] **Step 1: Quitar el `.eyebrow` y unificar plan base y módulos en una sola superficie**

- [ ] **Step 2: Hacer del total el héroe tipográfico de la sección**

La cifra de `.calc__amount` en `--font-display` grande y en `--accent-ink`. La línea en pesos queda apagada (`--fg-muted`).

- [ ] **Step 3: Dar a los módulos los dos estados cromáticos**

Disponible = ámbar (`--warn-soft` / `--warn-line`), activado = verde (`--accent-soft` / `--accent`), con el check actual como señal no cromática.

- [ ] **Step 4: Verificar la calculadora** *(y Review Focus 5)*

Tocar los tres módulos en todas las combinaciones.
Expected: el total pasa de US$20 a US$45 con los tres activos, la cifra en pesos acompaña, y al 200% de zoom la cifra no se corta.

- [ ] **Step 5: Verificar que las notas de cobro siguen completas**

Las cuatro líneas de `.calc__note` y las cuatro preguntas de `.faq--inline` siguen presentes y con el mismo texto.

- [ ] **Step 6: Commit**

```bash
git add index.html styles.css
git commit -m "refactor(precios): total como heroe tipografico y modulos con estado cromatico"
```

---

## Task 10: FAQ, datos y contacto

**Files:**
- Modify: `index.html:524-602`
- Modify: `styles.css` (`.faq*`, `.datos*`, `.contact*`)

- [ ] **Step 1: Quitar el `.eyebrow` y pasar el FAQ a hairlines**

`details`/`summary` nativos, sin tarjetas. La respuesta abierta conserva `--info-soft`, con los valores re-derivados de la tarea 1.

- [ ] **Step 2: Reformar el trío `datos` sin tocar el copy**

"Dónde viven tus datos", "Copias de seguridad" y "Quién puede verlos" pasan de tres tarjetas con ícono a tres entregas en prosa separadas por hairline. **El texto no cambia ni una palabra**: es contenido de confianza.

- [ ] **Step 3: Conservar el bloque `contact` y reestilarlo**

Los tres destinos (WhatsApp, email, Instagram) siguen siendo los mismos y cierran la sección.

- [ ] **Step 4: Verificar que el JSON-LD sigue coincidiendo**

Comparar cada respuesta del `<script type="application/ld+json">` con su `details` visible.
Expected: idénticas. Si una cambió, se corrige el JSON-LD.

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css
git commit -m "refactor(faq): hairlines y bloque de datos sin tarjetas con icono"
```

---

## Task 11: Descarga

**Files:**
- Modify: `index.html:604-657`
- Modify: `styles.css` (`.download*`, `.install*`)

- [ ] **Step 1: Borrar `.download__glow`**

- [ ] **Step 2: Poner el QR como héroe en desktop**

`assets/qr-instalar.svg` como elemento principal del bloque, con un texto que diga lo que realmente hace: pasar la app al celular. Los dos botones y los dos `details` de instrucciones se conservan enteros.

- [ ] **Step 3: Invertir la jerarquía en celular**

Por debajo del breakpoint, el QR no se muestra y el héroe es el botón **Instalar Mova** con los pasos del dispositivo debajo. Hacerlo con CSS, no con JS, para que valga también sin JS.

- [ ] **Step 4: Verificar las dos jerarquías**

A 1240px: el QR es lo primero que se ve del bloque. A 375px: el QR no aparece y el botón ocupa su lugar. En los dos casos, tocar **Instalar Mova** abre el modal.
Expected: el modal sigue funcionando y su QR interno mantiene el comportamiento actual de `script.js`.

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css
git commit -m "feat(descarga): QR como heroe en desktop y boton de instalar en celular"
```

---

## Task 12: Nav, footer y pasada final

**Files:**
- Modify: `index.html` (nav y footer)
- Modify: `styles.css` (`.nav*`, `.footer*`, capa `utilities`)

- [ ] **Step 1: Acompañar al nuevo sistema en nav y footer**

Marca en `--font-display`, `--nav-bg` re-derivado en la tarea 1, conmutador y CTA sin cambios de comportamiento.

- [ ] **Step 2: Borrar lo que quedó huérfano en `styles.css`**

```bash
for c in eyebrow badge grad hero__glow download__glow promise__icon feature__icon flowArrow; do
  echo "== $c"; grep -c "$c" index.html styles.css;
done
```
Expected: 0 en `index.html` para todos; en `styles.css` solo quedan los que algún marcado todavía usa.

- [ ] **Step 3: Eliminar las cadenas de metadatos unidas con `·`**

La spec las prohíbe (§4.3) y quedan dos: `.download__hint` ("Android · iPhone · Windows · Mac — se instala desde el navegador y se actualiza sola") y `.footer__copy` ("© 2026 Mova · Hecho con Flutter y Firebase"). Se reescriben como frases, conservando la misma información.

```bash
grep -n "·" index.html
```
Expected: sin resultados.

- [ ] **Step 4: Recorrer la página entera a 320px, 768px y 1440px, en claro y en oscuro**

Expected: sin scroll horizontal en ninguno de los seis casos.

- [ ] **Step 5: Verificar foco de teclado y movimiento reducido en toda la página**

Tabular de principio a fin.
Expected: foco visible en cada elemento interactivo, ninguno atrapado, y con `prefers-reduced-motion` nada se anima salvo lo que responde a un clic.

- [ ] **Step 6: Verificar la consola y la red**

Expected: `read_console_messages` sin errores; ningún 404 en `read_network_requests`.

- [ ] **Step 7: Commit**

```bash
git add index.html styles.css
git commit -m "refactor(nav, footer): cierre del refactor visual y limpieza de reglas huerfanas"
```
