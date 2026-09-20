/*
 * MODO DE MOVIMIENTO. Se carga sincrono desde el <head> (Base.astro), antes del primer
 * pintado, y pone `data-motion-mode="on|off"` en <html>. El CSS elige con eso entre la
 * version con animacion y la version de imagen fija (ver components/Hero.astro).
 *
 * Es un archivo propio y no un <script> inline porque la CSP del servidor es
 * `script-src 'self'`: un inline no se ejecutaria en produccion.
 *
 * Las animaciones estan ACTIVAS POR DEFECTO en todos los dispositivos, tambien cuando el
 * sistema pide reducir el movimiento (decision del cliente, ver ADR-0007). Es una decision de
 * producto consciente: en Windows, quien tiene los "efectos de animacion" apagados suele
 * haberlo hecho por rendimiento o por usar escritorio remoto, no por sensibilidad. La salida
 * para quien si la necesita es el interruptor "Animaciones" del pie.
 *
 * Orden de prioridad:
 *   1. `?forcemotion` en la URL           -> on   (para probar; no se guarda)
 *   2. eleccion del visitante (pie)       -> on / off  (localStorage `mm-motion`)
 *   3. ahorro de datos o conexion 2G      -> off  (la secuencia pesa 0,4-1,6 MB)
 *   4. en cualquier otro caso             -> on   (`prefers-reduced-motion` NO se consulta)
 *
 * Failsafe: `js-motion` esconde lo que va a animarse. Si el bundle de movimiento no arranca
 * (JS bloqueado, error de red) el contenido tiene que aparecer igual y el hero vuelve a la
 * version de imagen fija.
 */
(function () {
  var root = document.documentElement;
  var pref = null;
  try {
    pref = localStorage.getItem('mm-motion');
  } catch (e) {}
  var conn = navigator.connection || {};
  var lento = conn.saveData === true || /(^|-)2g$/.test(conn.effectiveType || '');
  var on;
  if (/[?&]forcemotion\b/.test(location.search)) on = true;
  else if (pref === 'on') on = true;
  else if (pref === 'off') on = false;
  else on = !lento;

  root.dataset.motionMode = on ? 'on' : 'off';
  if (!on) {
    root.classList.remove('js-motion');
    return;
  }
  setTimeout(function () {
    if (root.dataset.motion !== 'ready') {
      root.classList.remove('js-motion');
      root.dataset.motionMode = 'off';
    }
  }, 2500);
})();
