const nav = document.getElementById('nav');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

// Fondo del nav al scrollear
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Menú mobile
const burger = document.getElementById('burger');
const setMenu = (open) => {
  nav.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', String(open));
};
setMenu(false);
burger.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.querySelectorAll('.nav__links a').forEach((a) =>
  a.addEventListener('click', () => setMenu(false))
);
// Escape cierra el menú y devuelve el foco al botón
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('open')) {
    setMenu(false);
    burger.focus();
  }
});

// Reveal-on-scroll. Con movimiento reducido no se anima nada: se muestra todo.
const reveals = [...document.querySelectorAll('.reveal')];
if (prefersReducedMotion.matches) {
  reveals.forEach((el) => el.classList.add('in'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  // El escalonado se calcula por fila real, no por índice global: dos elementos
  // que entran juntos en pantalla se retrasan distinto solo si están lado a lado.
  const filas = new Map();
  reveals.forEach((el) => {
    const top = Math.round(el.getBoundingClientRect().top + window.scrollY);
    const fila = filas.get(top) || [];
    fila.push(el);
    filas.set(top, fila);
  });
  filas.forEach((fila) => {
    fila.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i, 3) * 80}ms`;
    });
  });
  reveals.forEach((el) => io.observe(el));
}

// Sección visible marcada en el nav
const navLinks = [...nav.querySelectorAll('.nav__links a[href^="#"]')];
const secciones = navLinks
  .map((a) => document.querySelector(a.getAttribute('href')))
  .filter(Boolean);
if (secciones.length) {
  const marcar = (id) =>
    navLinks.forEach((a) =>
      a.setAttribute('aria-current', String(a.getAttribute('href') === `#${id}`))
    );
  const spy = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) marcar(visible.target.id);
    },
    // La franja central evita que dos secciones compitan en los bordes.
    { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
  );
  secciones.forEach((s) => spy.observe(s));
}

// Spotlight que sigue al mouse. Se salta en dispositivos táctiles y con
// movimiento reducido: ahí solo genera trabajo de más.
const puedeHover = window.matchMedia('(hover: hover)').matches;
if (puedeHover && !prefersReducedMotion.matches) {
  document
    .querySelectorAll('.feature, .plan, .module, .calc, .snack, .download__card, .contact')
    .forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - r.left}px`);
        card.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
}

// Recorrido por rol: selector de rol + lista de pantallas + teléfono
const TOUR = {
  admin: [
    { archivo: 'admin/inicio.webp', w: 364, h: 777, nombre: 'Inicio',
      desc: 'Tu gimnasio de un vistazo: perfil, horarios y el balance del mes.' },
    { archivo: 'admin/rutinas.webp', w: 360, h: 773, nombre: 'Rutinas',
      desc: 'Creá entrenamientos y asignalos. Cada rutina guarda ejercicios, alumnos y objetivo.' },
    { archivo: 'admin/rutina_personalizacion.webp', w: 361, h: 789, nombre: 'Armar la rutina',
      desc: 'Elegí los días sugeridos y qué campos pide cada ejercicio: carga, descanso o indicaciones.' },
    { archivo: 'admin/finanzas.webp', w: 360, h: 774, nombre: 'Finanzas',
      desc: 'Ingresos, gastos y balance, con el detalle de cada movimiento.' },
    { archivo: 'admin/tienda.webp', w: 374, h: 773, nombre: 'Tienda',
      desc: 'Catálogo con stock y precios, y carrito para vender en el mostrador.' },
  ],
  alumno: [
    { archivo: 'alumno/inicio_alumno.webp', w: 360, h: 800, nombre: 'Inicio',
      desc: 'Su rutina sugerida del día y la próxima clase, apenas abre la app.' },
    { archivo: 'alumno/registro_rutina_alumno.webp', w: 359, h: 780, nombre: 'Registrar entrenamiento',
      desc: 'Anota repeticiones y carga serie por serie, con el objetivo a la vista.' },
  ],
};

const tourList = document.getElementById('tourList');
const tourScreen = document.getElementById('tourScreen');
const tourCaption = document.getElementById('tourCaption');

if (tourList && tourScreen) {
  const roles = [...document.querySelectorAll('.tour__role')];
  let rolActual = 'admin';

  // Una <img> por captura, apiladas: cambiar de pantalla es un fundido, no una
  // recarga, así que no parpadea al volver a una ya vista.
  const imagenes = new Map();
  Object.entries(TOUR).forEach(([rol, pantallas]) => {
    pantallas.forEach((p, i) => {
      const img = document.createElement('img');
      img.src = `assets/${p.archivo}`;
      img.alt = `Pantalla ${p.nombre} de Mova, vista de ${rol === 'admin' ? 'dueño y staff' : 'alumno'}`;
      img.className = 'shot__img tour__shot';
      img.width = p.w;
      img.height = p.h;
      img.decoding = 'async';
      // Solo la primera del rol por defecto se carga de entrada
      if (!(rol === 'admin' && i === 0)) img.loading = 'lazy';
      tourScreen.appendChild(img);
      imagenes.set(p.archivo, img);
    });
  });

  const mostrar = (rol, indice) => {
    const pantalla = TOUR[rol][indice];
    imagenes.forEach((img, archivo) =>
      img.classList.toggle('is-on', archivo === pantalla.archivo)
    );
    tourCaption.textContent = pantalla.desc;
    [...tourList.children].forEach((b, i) =>
      b.setAttribute('aria-pressed', String(i === indice))
    );
  };

  const pintarLista = (rol) => {
    tourList.innerHTML = '';
    TOUR[rol].forEach((p, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'screen';
      b.setAttribute('aria-pressed', String(i === 0));
      b.innerHTML = `<span class="screen__num">${i + 1}</span>
        <span class="screen__txt"><b>${p.nombre}</b><span>${p.desc}</span></span>`;
      b.addEventListener('click', () => mostrar(rol, i));
      tourList.appendChild(b);
    });
    mostrar(rol, 0);
  };

  roles.forEach((btn) => {
    btn.addEventListener('click', () => {
      rolActual = btn.dataset.role;
      roles.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      pintarLista(rolActual);
    });
  });

  pintarLista(rolActual);
}

// Año en el pie
document.getElementById('year').textContent = new Date().getFullYear();

// Calculadora de precios — plan base + módulos, total en USD y pesos
const PRICE_BASE = 20; // core (US$)
// Tipo de cambio de referencia. Se actualiza cada 3 meses, y cuando se toca
// hay que cambiarlo también en index.html: la nota de la calculadora dice el
// valor en texto ("US$1 = $1.490").
const USD_TO_ARS = 1490;
const usdEl = document.getElementById('calcUsd');
const arsEl = document.getElementById('calcArs');
if (usdEl && arsEl) {
  const arsFmt = new Intl.NumberFormat('es-AR');
  const inputs = document.querySelectorAll('.module__input');
  const recalc = () => {
    let usd = PRICE_BASE;
    inputs.forEach((input) => {
      const mod = input.closest('.module');
      mod.classList.toggle('module--on', input.checked);
      if (input.checked) usd += Number(mod.dataset.price) || 0;
    });
    usdEl.textContent = usd;
    arsEl.textContent = arsFmt.format(usd * USD_TO_ARS);
  };
  inputs.forEach((input) => input.addEventListener('change', recalc));
  recalc();
}
