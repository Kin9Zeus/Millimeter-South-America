/**
 * Orquestación de movimiento — GSAP + ScrollTrigger.
 *
 * Principios (ver 04-Web/Animaciones de la web.md):
 *  1. El HTML se entrega legible. La animación mejora, nunca habilita.
 *  2. Este módulo solo se carga con `data-motion-mode="on"` (lo decide
 *     public/motion-mode.js: ajuste del sistema, elección del visitante, ahorro de datos).
 *  3. Si algo falla al cargar, el contenido aparece igual (failsafe en motion-mode.js).
 *  4. El scroll suave (Lenis) solo en puntero fino: en móvil el scroll nativo es mejor.
 *     La secuencia del hero, en cambio, funciona también en táctil.
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduced = document.documentElement.dataset.motionMode !== 'on';
const finePointer = window.matchMedia('(pointer: fine)').matches;
const EASE = 'power3.out';

/** Marca el DOM como listo para animar y desactiva el failsafe del layout. */
function ready() {
  document.documentElement.dataset.motion = 'ready';
}

/* ------------------------------------------------------------------ scroll */

async function initSmoothScroll() {
  if (reduced || !finePointer) return;
  const { default: Lenis } = await import('lenis');

  const lenis = new Lenis({
    duration: 1.05,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    // El scroll táctil se deja nativo: es más rápido y no rompe el gesto del SO.
    smoothWheel: true,
    touchMultiplier: 1,
  });

  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // Los anclas internos pasan por Lenis para que el desplazamiento sea coherente.
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -80 });
    });
  });
}

/* ------------------------------------------------------- revelados básicos */

function initReveals() {
  // Un solo ScrollTrigger por lote en vez de uno por elemento.
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: EASE,
        stagger: 0.08,
        overwrite: true,
      }),
  });

  ScrollTrigger.batch('.reveal-line', {
    start: 'top 92%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { scaleX: 1, scaleY: 1, duration: 1, ease: 'power2.inOut', stagger: 0.06, overwrite: true }),
  });

  // Titulares que suben por líneas dentro de su máscara.
  document.querySelectorAll<HTMLElement>('[data-split-lines]').forEach((el) => {
    const lines = el.querySelectorAll<HTMLElement>('.line-mask > span');
    if (!lines.length) return;
    gsap.set(lines, { yPercent: 110 });
    gsap.to(lines, {
      yPercent: 0,
      duration: 1.1,
      ease: EASE,
      stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    });
  });
}

/* ------------------------------------------------------------------- cotas */

function initDimensions() {
  document.querySelectorAll<HTMLElement>('.dim[data-dim-animate]').forEach((dim) => {
    const track = dim.querySelector('.dim__track');
    const value = dim.querySelector('.dim__value');
    if (!track) return;
    gsap
      .timeline({ scrollTrigger: { trigger: dim, start: 'top 88%', once: true } })
      .to(track, { scaleX: 1, duration: 1.15, ease: 'power3.inOut' })
      .to(value, { opacity: 1, duration: 0.4 }, '-=0.4');
  });
}

/** Contadores numéricos: el dato se construye delante del lector. */
function initCounters() {
  document.querySelectorAll<HTMLElement>('[data-count-to]').forEach((el) => {
    const to = Number(el.dataset.countTo);
    const decimals = Number(el.dataset.countDecimals ?? 0);
    if (Number.isNaN(to)) return;
    const obj = { v: Number(el.dataset.countFrom ?? 0) };
    gsap.to(obj, {
      v: to,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => {
        el.textContent = obj.v.toLocaleString('es-CO', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
      },
    });
  });
}

/* ------------------------------------------------------------------- hero */

/**
 * Cada hero (la portada y las páginas interiores con fondo, ver HeroFrame.astro) se conduce por
 * separado. La portada además cierra los dos filetes de la cota; las demás solo llevan la
 * secuencia y el retiro del texto.
 *
 * El hero de la portada es la tesis: dos filetes que se cierran uno contra otro mientras la
 * medida baja de 20 mm a 1 mm, y el canto de la placa avanza con el scroll.
 * El producto se demuestra, no se describe.
 *
 * El hero es más alto que la pantalla y su contenido queda fijo (`sticky`, ver
 * Hero.astro): `end: 'bottom bottom'` es el final de ese recorrido.
 */
function initHero() {
  document.querySelectorAll<HTMLElement>('[data-hero]').forEach(initHeroEl);
}

function initHeroEl(hero: HTMLElement) {

  const top = hero.querySelector('[data-hero-rule="top"]');
  const bottom = hero.querySelector('[data-hero-rule="bottom"]');
  const readout = hero.querySelector<HTMLElement>('[data-hero-readout]');
  const conSecuencia = hero.querySelector('[data-hero-canvas]') !== null;

  if (top && bottom && readout) {
    const state = { mm: 20 };
    gsap
      .timeline({
        scrollTrigger: { trigger: hero, start: 'top top', end: '+=55%', scrub: 0.6 },
      })
      .to(top, { yPercent: 46, ease: 'none' }, 0)
      .to(bottom, { yPercent: -46, ease: 'none' }, 0)
      .to(
        state,
        {
          mm: 1,
          ease: 'none',
          onUpdate: () => {
            readout.textContent = `${state.mm.toFixed(state.mm < 10 ? 1 : 0)} mm`;
          },
        },
        0,
      );
  }

  if (conSecuencia) {
    // La cota cierra primero; después el texto se retira y la imagen se queda sola. Los
    // tiempos son fracciones del recorrido del hero (0-1), no píxeles: valen en móvil y en
    // escritorio aunque el recorrido mida distinto.
    const contenido = hero.querySelector('[data-hero-content]');
    const lateral = hero.querySelector('[data-hero-scrim-side]');
    gsap
      .timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: true } })
      .to({}, { duration: 1 }, 0)
      .to(contenido, { autoAlpha: 0, y: -40, ease: 'power1.in', duration: 0.24 }, 0.38)
      .to(lateral, { autoAlpha: 0, ease: 'none', duration: 0.4 }, 0.3);
    return;
  }

  // Sin secuencia (solo imagen fija): desplazamiento suave del fondo, profundidad sin parallax exagerado.
  const media = hero.querySelector('[data-hero-media]');
  if (media) {
    gsap.to(media, {
      yPercent: 12,
      scale: 1.06,
      ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
    });
  }
}

/* ------------------------------------------------- secuencia de fotogramas */

/** Orden de carga de gruesa a fina: 0, 8, 16… y después los intermedios. */
function ordenGruesoAFino(n: number): number[] {
  const visto = new Set<number>();
  const orden: number[] = [];
  for (let paso = 16; paso >= 1; paso = Math.floor(paso / 2)) {
    for (let i = 0; i < n; i += paso) {
      if (!visto.has(i)) {
        visto.add(i);
        orden.push(i);
      }
    }
    // El último fotograma pronto: es el otro extremo del recorrido.
    if (paso === 16 && !visto.has(n - 1)) {
      visto.add(n - 1);
      orden.push(n - 1);
    }
  }
  return orden;
}

/**
 * Fondo del hero: secuencia de fotogramas WebP dibujada en un <canvas> y conducida por el
 * scroll. No es un <video> con `currentTime`: saltar a un instante arbitrario depende del
 * decodificador de cada equipo (Safari e iOS van a tirones y en móvil es caro), mientras
 * que dibujar un fotograma ya decodificado funciona igual en todas partes, también en táctil.
 *
 *  - Se carga de gruesa a fina, así que desde el primer scroll hay una imagen cercana
 *    aunque no haya llegado todo.
 *  - Entre dos fotogramas se mezclan (alpha) para que el paso no se note.
 *  - Fotogramas verticales (9:16) en pantalla vertical; horizontales (16:9) en el resto.
 */
function initHeroSequence() {
  document.querySelectorAll<HTMLCanvasElement>('[data-hero-canvas]').forEach(iniciarSecuencia);
}

function iniciarSecuencia(canvas: HTMLCanvasElement) {
  const hero = canvas.closest<HTMLElement>('[data-hero]');
  const ctx = canvas.getContext('2d');
  if (!hero || !ctx) return;

  type Secuencia = { dir: string; count: number };
  const horizontal: Secuencia | null = canvas.dataset.hDir
    ? { dir: canvas.dataset.hDir, count: Number(canvas.dataset.hCount) }
    : null;
  const vertical: Secuencia | null = canvas.dataset.vDir
    ? { dir: canvas.dataset.vDir, count: Number(canvas.dataset.vCount) }
    : null;
  const enVertical = window.matchMedia('(orientation: portrait)');
  const elegir = () => (enVertical.matches ? (vertical ?? horizontal) : (horizontal ?? vertical)) as Secuencia;

  let seq = elegir();
  let imagenes: (HTMLImageElement | undefined)[] = [];
  let generacion = 0;
  let progreso = 0;
  let ultimo = '';

  /** El fotograma cargado más cercano a `i` (o -1 si aún no hay ninguno). */
  const cercano = (i: number) => {
    const t = Math.max(0, Math.min(seq.count - 1, i));
    if (imagenes[t]) return t;
    for (let d = 1; d < seq.count; d++) {
      if (t - d >= 0 && imagenes[t - d]) return t - d;
      if (t + d < seq.count && imagenes[t + d]) return t + d;
    }
    return -1;
  };

  const ajustar = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      ultimo = '';
    }
  };

  /** Dibuja `img` cubriendo el canvas (como `object-fit: cover`). */
  const pintar = (img: HTMLImageElement, alfa: number) => {
    const s = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    ctx.globalAlpha = alfa;
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  };

  const render = () => {
    ajustar();
    if (!canvas.width || !canvas.height) return;
    const f = progreso * (seq.count - 1);
    const i0 = Math.floor(f);
    const a = cercano(i0);
    if (a < 0) return;
    const b = cercano(i0 + 1);
    const frac = f - i0;
    // Cuantizada a pasos de 0,05: evita repintar por diferencias imperceptibles.
    const mezcla = b !== a && frac > 0.04 ? Math.round(frac * 20) / 20 : 0;
    const clave = `${seq.dir}|${a}|${b}|${mezcla}|${canvas.width}x${canvas.height}`;
    if (clave === ultimo) return;
    ultimo = clave;
    pintar(imagenes[a]!, 1);
    if (mezcla) pintar(imagenes[b]!, mezcla);
    ctx.globalAlpha = 1;
  };

  const cargar = () => {
    const mia = ++generacion;
    imagenes = new Array(seq.count).fill(undefined);
    ultimo = '';
    const orden = ordenGruesoAFino(seq.count);
    let siguiente = 0;
    let activas = 0;
    const bombear = () => {
      // 6 a la vez: lo que admite HTTP/1.1 por origen sin bloquear otras peticiones de la página.
      while (activas < 6 && siguiente < orden.length) {
        const i = orden[siguiente++];
        activas++;
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          if (mia !== generacion) return;
          imagenes[i] = img;
          activas--;
          render();
          bombear();
        };
        img.onerror = () => {
          if (mia !== generacion) return;
          activas--;
          bombear();
        };
        img.src = `${seq.dir}${String(i + 1).padStart(4, '0')}.webp`;
      }
    };
    bombear();
  };

  const estado = { p: 0 };
  gsap.to(estado, {
    p: 1,
    ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom bottom', scrub: 0.4 },
    onUpdate: () => {
      progreso = estado.p;
      render();
    },
  });

  new ResizeObserver(() => {
    ultimo = '';
    render();
  }).observe(canvas);

  // Girar el teléfono cambia de secuencia (vertical <-> horizontal).
  enVertical.addEventListener('change', () => {
    const nueva = elegir();
    if (nueva.dir === seq.dir) return;
    seq = nueva;
    cargar();
  });

  cargar();
}

/* ------------------------------------------------------ barras de peso */

/**
 * Las barras crecen en cascada, no a la vez: el lector ve primero lo que ocupa
 * la piedra tradicional y después lo poco que ocupa MILLIMETER. La secuencia
 * es el argumento.
 */
function initWeights() {
  document.querySelectorAll<HTMLElement>('.weights').forEach((block) => {
    gsap.to(block.querySelectorAll('[data-weight-bar]'), {
      scaleX: 1,
      duration: 1.4,
      ease: 'power3.inOut',
      stagger: 0.22,
      scrollTrigger: { trigger: block, start: 'top 78%', once: true },
    });
  });
}

/* ------------------------------------------------------------------ init */

function init() {
  // El módulo solo se importa cuando el movimiento está permitido, pero la
  // preferencia puede cambiar entre la importación y la ejecución.
  if (reduced) {
    document.documentElement.classList.remove('js-motion');
    ready();
    return;
  }

  initSmoothScroll();
  initHero();
  initHeroSequence();
  initReveals();
  initDimensions();
  initCounters();
  initWeights();
  ready();

  // Las posiciones dependen de la métrica tipográfica: recalcular al cargar fuentes.
  if ('fonts' in document) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
