/**
 * Comportamiento de interfaz que NO es animación y por tanto tiene que
 * funcionar siempre: fondo del encabezado, color del encabezado según lo que
 * tiene detrás, y cambio de superficie cantera <-> travertino.
 *
 * Va sin GSAP a propósito (~1,5 kB con IntersectionObserver), porque el bundle
 * de movimiento solo se descarga cuando el usuario permite animaciones.
 */

const light = () => document.querySelectorAll<HTMLElement>('[data-surface="light"]');

/** Fondo sólido del encabezado en cuanto se abandona el borde superior. */
function header() {
  const el = document.querySelector<HTMLElement>('[data-header]');
  if (!el) return;

  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:80px;height:1px;width:1px;pointer-events:none';
  document.body.prepend(sentinel);

  new IntersectionObserver(
    ([entry]) => el.classList.toggle('is-stuck', !entry.isIntersecting),
    { threshold: 0 },
  ).observe(sentinel);
}

/**
 * Color del encabezado según lo que pasa POR DETRÁS de la barra.
 *
 * No sirve reutilizar el estado global de superficie: ese mira el centro del
 * viewport, y el encabezado está fijo arriba. Al salir de una sección clara,
 * el centro ya es oscuro mientras la barra sigue teniendo travertino detrás —
 * y el texto claro sobre travertino es ilegible.
 *
 * Se observa una banda de la altura exacta del encabezado, pegada arriba.
 */
function headerSurface() {
  const el = document.querySelector<HTMLElement>('[data-header]');
  const secciones = light();
  if (!el || !secciones.length) return;

  let io: IntersectionObserver | null = null;
  const visibles = new Set<Element>();

  const construir = () => {
    io?.disconnect();
    visibles.clear();

    const alto = el.offsetHeight || 72;
    // Se recorta el root por abajo hasta dejar solo la franja del encabezado.
    const recorte = Math.max(0, window.innerHeight - alto);

    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visibles.add(e.target);
          else visibles.delete(e.target);
        }
        el.classList.toggle('on-light', visibles.size > 0);
      },
      { rootMargin: `0px 0px -${recorte}px 0px`, threshold: 0 },
    );

    secciones.forEach((s) => io!.observe(s));
  };

  construir();

  let t: number | undefined;
  window.addEventListener('resize', () => {
    window.clearTimeout(t);
    t = window.setTimeout(construir, 150);
  });
}

/** Interpola el fondo del documento al entrar en una sección clara. */
function surface() {
  const secciones = light();
  if (!secciones.length) return;

  const visibles = new Set<Element>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) visibles.add(e.target);
        else visibles.delete(e.target);
      }
      document.documentElement.classList.toggle('is-light', visibles.size > 0);
    },
    // Solo cuenta cuando la sección clara ocupa de verdad el centro de la pantalla.
    { rootMargin: '-45% 0px -45% 0px' },
  );

  secciones.forEach((s) => io.observe(s));
}

/**
 * Interruptor "Animaciones" del pie. Es estado de interfaz, no animación: va aquí y no
 * en motion.ts, que no se descarga cuando el movimiento está apagado (justo el caso en
 * que hay que poder volver a encenderlo).
 *
 * Guarda la elección en localStorage (`mm-motion`, la lee public/motion-mode.js) y
 * recarga la página: la versión con animación y la de imagen fija son dos fondos
 * distintos, no se pueden intercambiar en caliente sin parpadeo.
 */
function motionToggle() {
  const btn = document.querySelector<HTMLButtonElement>('[data-motion-toggle]');
  const estado = btn?.querySelector<HTMLElement>('[data-motion-state]');
  if (!btn || !estado) return;

  // Sin localStorage (modo privado estricto) no se puede recordar la elección: no se ofrece.
  try {
    localStorage.setItem('mm-probe', '1');
    localStorage.removeItem('mm-probe');
  } catch {
    return;
  }

  const activo = document.documentElement.dataset.motionMode === 'on';
  estado.textContent = (activo ? btn.dataset.labelOn : btn.dataset.labelOff) ?? '';
  btn.hidden = false;

  btn.addEventListener('click', () => {
    try {
      localStorage.setItem('mm-motion', activo ? 'off' : 'on');
    } catch {
      return;
    }
    // `?forcemotion` mandaría más que la elección guardada: se quita para que el cambio se vea.
    const url = new URL(window.location.href);
    if (url.searchParams.has('forcemotion')) {
      url.searchParams.delete('forcemotion');
      window.location.replace(url.toString());
    } else {
      window.location.reload();
    }
  });
}

header();
headerSurface();
surface();
motionToggle();
