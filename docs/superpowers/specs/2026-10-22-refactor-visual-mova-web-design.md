# Refactor visual de Mova_Web — documento de diseño

**Fecha:** 2026-10-22
**Dirección elegida:** A · *Panel* (validada con mockups el 2026-10-22)
**Alcance acordado:** toda la página — las siete secciones, más nav y footer.

---

## 1. Intención y por qué

Mova_Web es la landing de Mova, una app de gestión de gimnasios (Flutter + Firebase, repo
privado `gym_library_v2`). Su único trabajo es convencer al dueño de un gimnasio de empezar
los 15 días de prueba e instalar la app.

El sitio no tiene un problema de prolijidad. `styles.css` ya es un sistema de tokens de tres
tiers, con `light-dark()`, escala tipográfica fluida y capas en cascada. El problema es de
**identidad**: la página se lee como una landing generada, y el dueño del proyecto la
describe como "plana, repetitiva y genérica".

Tres causas concretas, verificadas en el código:

1. **Un solo color.** La web usa el verde `#00BD89` sobre neutros cálidos (`#FAFAF9`,
   `#09090B`). La app real tiene tres colores con significado — verde, rosa `#FF4276`,
   ámbar `#FFC23D` — y hasta sus blancos están teñidos de verde (`#F7FAF9`, `#F1F5F3`).
   La web se armó con un tercio de la paleta disponible, y encima con neutros que no son
   los de la app.
2. **Un módulo repetido seis veces.** Las seis secciones arrancan igual: `.eyebrow` en
   mayúsculas → `h2` → `p` → grilla de tarjetas con ícono de contorno. El ojo ve el mismo
   bloque una y otra vez, así que percibe la página como más corta y más barata de lo que es.
3. **Los tells de landing generada**, todos en el hero: badge con puntito, una palabra del
   `h1` en degradado (`.grad`), blob de glow radial detrás (`.hero__glow`), y un fondo
   casi-negro neutro con un verde brillante — la combinación más repetida de la web en 2026.
   A eso se suma el `fade-and-slide-up` de `.reveal` en cada sección al scrollear.

El refactor ataca las tres causas. No es un rediseño de producto ni un cambio de mensaje:
el contenido, los precios y los argumentos quedan como están.

---

## 2. Objetivos, no-objetivos, anti-objetivos

### Objetivos
- Que la página se vea hecha **para Mova** y no para cualquier SaaS: paleta completa de la
  app, tipografía con voz propia, y secciones con forma propia.
- Que los tres colores entren **por significado**, no como decoración.
- Que ninguna sección repita la estructura de la anterior.
- Mantener (o mejorar) la claridad del camino a la conversión: prueba de 15 días e instalación.

### No-objetivos
- Reescribir el mensaje, los precios o la calculadora. El copy se ajusta solo donde el
  nuevo layout lo pide (titulares del hero y encabezados de sección).
- Agregar un framework, un bundler o un paso de build.
- Tocar la app (`gym_library_v2`). La paleta viaja de la app a la web, nunca al revés.
- Reemplazar las capturas reales `.webp` por ilustraciones.

### Anti-objetivos (el refactor fracasa si pasa esto, aunque funcione)
- Que el resultado siga siendo reconocible como "landing de IA": si al terminar sigue
  habiendo eyebrow en mayúsculas sobre cada título, glow decorativo o una palabra del
  titular en degradado, falló.
- Que el color se vuelva decorativo: tres colores repartidos por simetría visual es peor
  que un solo color honesto.
- Que se pierda accesibilidad: el ámbar y el rosa son colores de bajo contraste sobre claro
  y es fácil romper la legibilidad al usarlos como texto.
- Que el sitio se vuelva más lento o salte el layout (CLS) por cambiar fuentes o imágenes.

---

## 3. Restricciones

- **Sitio estático sin build.** HTML + CSS + JS vanilla, publicado por GitHub Pages desde
  el repo **público** `Mova_Web`. Nada de npm, nada de compilación. Tres archivos:
  `index.html`, `styles.css`, `script.js`.
- **Se conserva la arquitectura CSS**: `@layer reset, tokens, base, components, utilities`
  y los tres tiers de tokens. El refactor cambia **valores y componentes**, no la arquitectura.
- **Claro y oscuro siguen existiendo**, con el conmutador del nav, `light-dark()` y el
  script inline anti-destello del `<head>` (que no se toca).
- **Las capturas `.webp` se conservan** con sus `width`/`height` actuales: son la prueba
  de que el producto existe, y sus dimensiones evitan CLS.
- **El recorrido (`#showcase`) y la calculadora de precios se conservan** como funcionalidad.
  Son lo más útil de la página; se reestilizan, no se rehacen.
- **Datos estructurados**: las respuestas del JSON-LD deben seguir coincidiendo con el FAQ
  visible. Si cambia una, cambia la otra.
- **Las fuentes se cargan desde Google Fonts** con `preconnect` y `display=swap`, igual que
  hoy. El cambio de familia no debe sumar peticiones ni empeorar el LCP.
- `privacidad.html`, `terminos.html` y `legal.css` están en `.gitignore` como borradores:
  quedan fuera de este trabajo.

---

## 4. La dirección visual

### 4.1 Color: tres colores, cada uno con un trabajo

Los tres colores de la app pasan a la web con el **mismo significado que tienen adentro
de la app**. Esta es la regla que gobierna todo el resto:

| Token | Valor | Significa | Dónde puede aparecer |
|---|---|---|---|
| verde | `#00BD89` | plata que entra · acción · estado activo · confirmado | CTA, totales, ingresos, módulo activado, check |
| rosa | `#FF4276` | plata que sale · lo que falta | egresos, cuotas vencidas, bajas |
| ámbar | `#FFC23D` | lo que está por pasar o por vencer | clase próxima, cupo al límite, módulo opcional |

**Regla dura:** un relleno de color solo puede aparecer donde el color significa su cosa.
Está prohibido usarlos para "dar variedad". Si una sección no tiene nada que signifique
rosa, esa sección no lleva rosa.

El relleno verde sigue reservado para el CTA, los estados activos y los datos; el verde
como texto o hairline puede repetirse sin competir. Esa regla ya está escrita en el
`styles.css` actual y se mantiene, extendida a los otros dos colores.

### 4.2 Neutros: se alinean con los de la app

Hoy la web usa neutros cálidos y un casi-negro neutro. Pasan a los de la app, teñidos de verde:

- **Claro:** fondo `#F1F5F3`, superficie `#F7FAF9`, superficie elevada `#FFFFFF`.
  (Son `background` y `surface` del `theme.dart` de la app.)
- **Oscuro:** fondo `#071F18`, superficie `#0D2A22`, texto `#F1F5F3`.

Nota de honestidad sobre el oscuro: en la app, `#071F18` es el *color de la tinta sobre los
botones verdes*, no un fondo. Usarlo como fondo de página es una extrapolación mía, tomada
del extremo oscuro del propio verde de marca. La justifico así: el casi-negro neutro actual
(`#09090B`) + verde brillante es exactamente el par genérico que hay que romper, y teñir el
oscuro hacia el verde de marca es el cambio más barato que lo rompe. Quedó validado en el
mockup de la dirección A. Si se prefiere fidelidad literal a la app, la alternativa es
`#181818` / `#1D1D1D` (`containerBG` / `textFieldBG`), que es neutra y nos devuelve al
problema.

**Alcance del tinte (decisión mía).** El tinte viaja por **todo** el sistema de neutros, no
solo por las tres superficies nombradas: `--line`, `--line-strong`, `--surface-2`,
`--surface-sunken`, `--fg-muted`, `--fg-subtle`, `--chip-bg`, `--ghost-bg`, `--nav-bg`, las
escaleras `--d-*` y `--l-*` y los colores de sombra se re-derivan contra la nueva base.
Incluida la tinta clara `#18181B`, que hoy es cálida. Un hairline gris cálido sobre una
superficie verdosa se lee como suciedad, así que dejar la mitad del sistema sin tocar da
peor resultado que no tocarlo. Esto es el grueso del diff de `styles.css`.

La familia fría `--info-soft` / `--info-line` **se conserva como idea y se re-deriva en
valores**: su trabajo (separar informar de vender) sigue siendo bueno, pero `#F1F5F8` y
`#171B20` están calculados contra neutros cálidos y un casi-negro neutro. Sobre la base
verdosa hay que recalcularlos para que sigan leyéndose como una segunda familia deliberada
y no como un desajuste — en particular el valor oscuro, que no puede ser un casi-negro
neutro al lado de `#071F18`.

`--phone-screen-bg` **sigue oscuro en ambos esquemas**: el teléfono es un objeto físico y
esa regla del sistema actual es correcta. No aplica al panel del hero, que no es un objeto
físico (ver §5.1).

**Contraste — restricciones no negociables:**
- Ámbar `#FFC23D` **nunca** como texto sobre claro (≈1.7:1). Solo relleno, punto o hairline.
- Rosa `#FF4276` sobre blanco da ≈3.6:1: sirve para texto grande o relleno, **no** para
  cuerpo. Hace falta un `--pink-ink` oscurecido para el modo claro, igual que ya existe
  `--accent-ink` para el verde. Debe verificarse con un medidor, no a ojo.
- Toda cifra o etiqueta de dato en color necesita además una señal no cromática (ícono,
  signo, posición): el color no puede ser el único portador de significado.

### 4.3 Tipografía

Se reemplazan **Inter + Instrument Sans** por **Archivo** y **Archivo Narrow**
(Omnibus-Type, Buenos Aires). Una sola familia en dos anchos.

- **Archivo Narrow 600/700** — titulares, cifras grandes, nombre de marca.
- **Archivo 400/500/600** — cuerpo, UI, etiquetas.
- Sin pesos 800/900.
- Se conserva la escala fluida en `rem` que ya existe; solo se ajusta el interlineado de
  los tramos grandes, porque un condensado tolera (y pide) líneas más juntas.

Por qué: Inter es la tipografía por defecto de la interfaz genérica, y el par
Inter + Instrument Sans es parte de por qué el sitio se lee de catálogo. Archivo es un
grotesco industrial de una fundidora porteña, con eje de ancho real; el condensado le da
a los titulares una voz afirmativa que encaja con un gimnasio y que no es la de todos.

**Tratamientos tipográficos prohibidos** (son los tells más visibles):
- Acentuar una sola palabra del titular en otro color, itálica o degradado.
- Etiquetas en mayúsculas sobre cada título (`.eyebrow` se elimina del sistema).
- `→` agregado al texto de botones y links.
- Cadenas de metadatos unidas con `·`.

### 4.4 Estructura: cada sección con la forma de su contenido

Esta es la parte que arregla "repetitiva". **Se elimina `.section__head` como módulo
universal.** Cada sección se encabeza como le corresponde y adopta la forma de lo que
explica, en vez de ser la enésima grilla de tarjetas.

### 4.5 Movimiento

Se **elimina el `.reveal` general** (el fade-and-slide-up en cada sección al scrollear, con
su escalonado por filas). Es la señal de generada más repetida y hoy está en casi todos los
bloques de `index.html`.

Queda **un solo momento orquestado**: al cargar, el balance del panel del hero cuenta una
vez hasta su cifra. Una vez, no en loop, y bajo `prefers-reduced-motion` aparece ya
completo. (El mockup animaba además unas barras de ingresos y egresos; esas barras
desaparecen por §5.1, así que el momento se reduce al contador.)

El movimiento que responde a una acción de la persona se conserva entero: el recorrido, el
lightbox, el conmutador de rol, los módulos de la calculadora, el FAQ, el menú.

---

## 5. Sección por sección

**Nav.** Cambio menor: marca en Archivo Narrow, se conserva el sticky con blur, el
conmutador de esquema y el CTA en píldora.

**1 · Hero — el panel.** Se reemplaza el teléfono flotante con glow por una composición a
dos columnas: a la izquierda el titular en tres líneas (sin badge, sin palabra en degradado)
más los dos CTA; a la derecha un **panel de datos en HTML**. Se eliminan `.badge`,
`.hero__glow` y `.grad`.

**Copy del hero (decisión del dueño del proyecto, no mía).** El titular cambia; el
subtítulo no.

- `h1`: **"Tu gimnasio entra en una pantalla."** — una sola voz, sin ninguna palabra
  acentuada en otro color ni en degradado. El peso lo lleva el condensado a tres líneas.
- `p`: **"Mova reúne rutinas, alumnos, finanzas, tienda y staff en un mismo lugar. Simple
  para el profe, potente para el dueño."** — queda tal cual está hoy. La segunda oración es
  lo único que nombra a los dos públicos de Mova y no tiene reemplazo en ninguna otra parte
  de la página.

Se conservan `.hero__meta` (los 15 días y la ausencia de permanencia) y `.hero__social` (el
link a Instagram): son prueba de confianza barata y no estorban a la nueva composición. El
badge "Nuevo · Clases y horarios" desaparece, pero la novedad no se pierde: la etiqueta
"Nuevo" sobre *Clases y horarios* ya existe en la sección de funciones.

Por qué HTML y no la captura: el panel es nítido en cualquier pantalla, respeta los dos
esquemas, y es lo que permite el único momento de movimiento. Las capturas reales no
desaparecen — son el corazón de la sección 4.

**Qué muestra el panel, exactamente.** Verificado contra
`gym_library_v2/lib/pages/home/home_screen.dart`: la pantalla de inicio del admin arma, en
este orden, `_ClassReminderCard` (las clases que se dictan hoy), `_AttentionPanel`
(renovaciones por vencer o vencidas y deudas — su ícono ya es rosa en la app),
`_FinanceSummaryCard` (ingresos, gastos y balance del mes con comparativa contra el mes
anterior, más los últimos movimientos) y `_StudentsSummaryCard` (alumnos). El panel del hero
toma esos cuatro bloques y nada más.

Dos correcciones respecto del mockup que validó la dirección:
- **No hay barras.** La app muestra ingresos, gastos y balance como tres cifras, no como
  barras de progreso. El panel usa tres cifras: balance en verde, ingresos en verde, gastos
  en rosa.
- **"Rutina enviada" no existe en esa pantalla.** El bloque real es
  `_TodayRoutineHighlight`, la rutina sugerida para hoy. La fila dice eso, o no está.

**Esquema claro (decisión mía).** El panel **invierte con el esquema**, no se queda oscuro
en los dos. El marco del teléfono sí se queda oscuro porque es un objeto físico; el panel no
lo es, y un rectángulo oscuro en medio de una página clara deja al modo claro con un agujero
justo en el bloque principal. Esto obliga al trabajo de contraste más difícil del refactor
—punto rosa y punto ámbar sobre superficie clara— que es exactamente lo que §4.2 exige
verificar con medidor. **Advertencia honesta: el mockup aprobado era solo oscuro, así que el
modo claro del hero no está validado visualmente todavía.** Conviene mirarlo apenas exista.

El glow radial verde del mockup **no sobrevive**: el documento gana sobre el mockup (§2,
anti-objetivos). El relieve del panel se consigue con superficie, filo y sombra, no con un
halo.

**Honestidad del dato:** las cifras del panel son un ejemplo, no datos de un gimnasio real.
Tienen que leerse como ejemplo: una leyenda discreta al pie del panel y un texto alternativo
que lo diga. No alcanza con que sea "obvio".

**2 · Franja de promesas.** Hoy son cuatro bloques idénticos de ícono de contorno + texto —
el kit SaaS en estado puro. Pasa a ser una banda compacta de cuatro afirmaciones
tipográficas separadas por hairline, sin íconos.

**3 · Funciones.** Hoy seis tarjetas iguales con ícono. Pasa a una lista editorial a dos
columnas, con un filete vertical de color a la izquierda de cada ítem que codifica
**información real**: verde si la función viene en el plan base, ámbar si es un módulo que
se suma aparte. Eso conecta esta sección con la de precios y le da al color un trabajo. El
mapeo sale de la sección de precios, sin margen de duda: **verde** para Gestión de alumnos,
Clases y horarios y Staff y roles; **ámbar** para Rutinas, Finanzas y Tienda, que son los
tres módulos pagos.

**4 · Recorrido (`#showcase`).** Se conserva la funcionalidad completa: conmutador de rol
admin/alumno, lista, teléfono, paginador, lightbox. Se reestiliza: el conmutador pasa a ser
un control segmentado de verdad, el marco del teléfono se aplana y se calla, y el epígrafe
se vuelve tipográfico. Es la sección que ya funciona; se la toca lo mínimo. La lista
`.checks--row` que cuelga debajo se conserva y pasa a hairlines, con el check en verde
(confirmado) — es el único color que le corresponde.

**5 · Actualizaciones.** Es una secuencia real (publicamos → llega sola → abrís), así que la
numeración 1-2-3 está justificada y se mantiene. Cambia la forma: deja de ser tres cajas con
flechas y pasa a una línea de tiempo horizontal con un hilo verde continuo. La tarjeta `.snack` ("Mova está al
día") no desaparece: es el resultado de esa secuencia, así que se coloca **al final de la
línea de tiempo**, como su desenlace, en vez de flotar al costado.

**6 · Precios.** La calculadora se conserva tal cual funciona. Cambia la jerarquía: el total
mensual pasa a ser el héroe tipográfico de la sección, en Archivo Narrow grande y en verde.
Los módulos usan ámbar cuando están disponibles y verde cuando están activados — que es
exactamente lo que significan esos dos colores. El plan base y los módulos comparten una
sola superficie en lugar de ser dos tarjetas enfrentadas. Las notas de cobro y el FAQ en
línea se conservan completos: son información de confianza, no relleno.

**7 · FAQ.** `details`/`summary` nativos, reestilizados con hairlines en vez de tarjetas. Se
conserva la superficie fría (`--info-soft`, con los valores re-derivados de §4.2) para la
respuesta abierta: separar "informar" de "vender" es una decisión buena que ya está en el
sistema.

Esta sección contiene además dos bloques que el inventario inicial se salteaba y que hay que
tratar, porque uno de ellos es justamente el módulo que el refactor viene a eliminar:

- **El trío `datos`** ("Dónde viven tus datos", "Copias de seguridad", "Quién puede verlos")
  son hoy tres tarjetas con ícono de contorno: el kit SaaS otra vez, y en la anteúltima
  sección. Dejarlo viola el anti-objetivo. Pasa a ser un bloque de tres entregas de
  confianza en prosa, separadas por hairline y sin íconos, con el mismo texto. Es contenido
  de confianza: **el copy no se toca**, solo la forma.
- **El bloque `contact`** ("¿Te quedó alguna duda?" + WhatsApp, email, Instagram) se conserva
  entero y cierra la sección. Los tres destinos siguen siendo los mismos.

**8 · Descarga.** Se elimina `.download__glow`. El héroe de la sección pasa a ser el **QR**
(`assets/qr-instalar.svg`, que ya existe y hoy solo aparece dentro de un modal): escanear
para instalar es el gesto más característico del producto y es lo que un dueño de gimnasio
va a hacer de verdad. Los dos botones y los dos `details` de instrucciones por dispositivo
se conservan enteros. El modal de instalación sigue funcionando igual.

**En celular el héroe es otro (decisión mía).** Nadie escanea el QR de su propia pantalla, y
`script.js` ya oculta el QR en mobile por ese motivo. Así que el QR es el héroe **solo en
desktop**, donde su trabajo real es pasar la app al celular, y el bloque lo dice con esas
palabras. En celular el héroe es el botón **Instalar Mova** con los pasos del dispositivo
justo debajo, y el QR no aparece. La mayoría de las visitas van a ser desde el celular: esa
variante no es el caso borde, es el caso principal, y tiene que verse primero.

**Footer.** Cambio menor, acompaña a la nueva tipografía.

---

## 6. Piso de calidad

- Responsive hasta 320px sin scroll horizontal.
- Foco de teclado visible en todo lo interactivo; `prefers-reduced-motion` respetado.
- Contraste verificado con medidor para cada combinación nueva, en los dos esquemas.
- `theme-color` del `<head>` actualizado a los nuevos fondos (`#F1F5F3` / `#071F18`).
- Sin regresión de LCP: la imagen del hero deja de existir, pero las fuentes nuevas no
  deben sumar peticiones ni bloquear el pintado.
- El sitio tiene que seguir siendo usable sin JS (hoy lo es: `no-js` y links directos).

---

## 7. Lo que queda a criterio de quien lo construya

- La escala de espaciado y el ritmo vertical entre secciones (hoy es ad hoc; conviene
  sistematizarlo, pero el valor exacto es suyo).
- Los números concretos del panel del hero, mientras sean verosímiles y se lean como ejemplo.
- Cómo se apila el hero en mobile: si el panel va arriba o abajo del titular.
- Si los íconos de las funciones se eliminan del todo o sobreviven en un tamaño menor.
- El orden de implementación y el corte en commits.
- Si conviene dejar la grilla de funciones en dos o en tres columnas en desktop.

---

## 8. Decisiones que tomé yo y conviene revisar al leer

1. **Fondo oscuro `#071F18`** en vez del `#181818` literal de la app (§4.2).
2. **Archivo / Archivo Narrow** como familia única, reemplazando a Inter e Instrument Sans (§4.3).
3. **Eliminar `.reveal` por completo** en vez de suavizarlo (§4.5).
4. **El QR como héroe de la sección de descarga** (§5.8).
5. **El filete de color de las funciones codifica base vs. módulo** (§5.3) — es una decisión
   de contenido, no solo de estilo.
6. **El panel del hero invierte con el esquema** en vez de quedarse oscuro como el marco del
   teléfono (§5.1). El modo claro del hero todavía no está validado a ojo.
7. **El tinte verde llega a todos los neutros dependientes**, incluida la tinta clara, y la
   familia fría `--info-soft` se re-deriva en vez de quedar literal (§4.2).
8. **En celular el héroe de la descarga es el botón, no el QR** (§5.8).
9. **El trío `datos` del FAQ se reforma** (mismo copy, otra forma) en vez de quedar como
   tarjetas con ícono (§5.7).

Estas cinco salieron de una revisión externa del documento, hecha por alguien que no
participó de la conversación de diseño y que tuvo que señalar dónde habría tenido que
adivinar.

El copy del hero (§5.1) **no** está en esta lista: lo decidió el dueño del proyecto.
