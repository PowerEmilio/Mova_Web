// Sticky nav background on scroll
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Mobile menu
const burger = document.getElementById('burger');
burger.addEventListener('click', () => nav.classList.toggle('open'));
nav.querySelectorAll('.nav__links a').forEach(a =>
  a.addEventListener('click', () => nav.classList.remove('open'))
);

// Reveal-on-scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 3) * 80}ms`;
  io.observe(el);
});

// Spotlight hover on feature cards
document.querySelectorAll('.feature').forEach((card) => {
  card.addEventListener('mousemove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// Current year
document.getElementById('year').textContent = new Date().getFullYear();

// APK download placeholder guard
const apkBtn = document.getElementById('apkBtn');
apkBtn.addEventListener('click', (e) => {
  if (apkBtn.getAttribute('href') === '#') {
    e.preventDefault();
    alert('Configurá el enlace de descarga:\n\nEn index.html, cambiá href="#" del botón "Descargar APK" por la URL real de tu APK (por ejemplo, un GitHub Release).');
  }
});

// Pricing calculator — plan base + módulos, total en USD y pesos
const PRICE_BASE = 20;      // core (US$)
const USD_TO_ARS = 1490;    // tipo de cambio
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
