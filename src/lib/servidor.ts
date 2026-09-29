/**
 * Utilidades de las rutas de servidor (`/api/*`). Compartidas por el formulario de contacto y el de
 * empleo. Solo se importan desde rutas con `prerender = false`.
 */

/** Cualquier caracter de control (salto de linea, NUL…) se sustituye por un espacio. */
const CONTROL = /[\u0000-\u001f\u007f]/g;

/**
 * Texto de un campo de formulario, seguro para meter en un correo: sin caracteres de control
 * (que permitirian inyectar cabeceras), recortado y con longitud maxima.
 */
export function limpiar(value: FormDataEntryValue | null, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(CONTROL, ' ').trim().slice(0, max);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

/**
 * Limitacion de tasa en memoria, por IP y por ventana deslizante. Suficiente para un sitio de una
 * sola instancia; si Railway escala a varias replicas hay que moverlo a Redis (anotado en
 * 04-Web/Seguridad de la web.md). Cada formulario crea el suyo: los limites no se comparten.
 */
export function crearLimitador(ventanaMs: number, max: number) {
  const hits = new Map<string, number[]>();
  return (ip: string): boolean => {
    const ahora = Date.now();
    const recientes = (hits.get(ip) ?? []).filter((t) => ahora - t < ventanaMs);
    recientes.push(ahora);
    hits.set(ip, recientes);
    // Poda perezosa para que el mapa no crezca indefinidamente.
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (!v.some((t) => ahora - t < ventanaMs)) hits.delete(k);
    }
    return recientes.length > max;
  };
}

/**
 * Lee una variable de entorno SOLO en tiempo de ejecucion, de `process.env`.
 *
 * PROHIBIDO escribir `import.meta.env` en una ruta de servidor: ni `.RESEND_API_KEY` ni `.DEV`.
 * En un build SSR, Astro reescribe CUALQUIER aparicion como
 * `Object.assign({...publicas}, {...todas las variables del entorno al compilar})`.
 * En Railway las variables del servicio existen durante el build, asi que la clave (y el resto)
 * quedaria escrita dentro de `dist/`, y rotarla en el panel no tendria efecto hasta recompilar,
 * porque el valor incrustado gana. Comprobado el 2026-09-20 compilando con una clave falsa y
 * buscandola en `dist/`. La CI lo vigila (paso "Secrets must not be inlined").
 *
 * En desarrollo (`astro dev`) Vite no vuelca `.env` en `process.env`, asi que se carga una vez
 * con `process.loadEnvFile`. No pisa variables ya definidas, y en Railway no existe ese archivo
 * (esta en .gitignore): alli es un no-op.
 */
let envFileTried = false;
export function runtimeEnv(name: string): string | undefined {
  if (!envFileTried) {
    envFileTried = true;
    try {
      (process as unknown as { loadEnvFile: (p: string) => void }).loadEnvFile('.env');
    } catch {
      /* no hay .env: es lo normal en produccion y en una maquina sin configurar */
    }
  }
  return process.env[name];
}

/**
 * Lee el cuerpo de la peticion con un tope DURO de bytes, sin fiarse solo de `Content-Length`.
 * Devuelve `null` si el cuerpo no declara longitud, la declara mayor que el tope, o al leerlo se
 * pasa de ese tope (se corta la lectura en el acto: no se acumula en memoria).
 */
export async function leerCuerpo(request: Request, maxBytes: number): Promise<Uint8Array | null> {
  const declarado = Number(request.headers.get('content-length'));
  if (!Number.isFinite(declarado) || declarado <= 0 || declarado > maxBytes) return null;
  const lector = request.body?.getReader();
  if (!lector) return null;

  const trozos: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lector.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await lector.cancel();
      return null;
    }
    trozos.push(value);
  }
  const cuerpo = new Uint8Array(total);
  let pos = 0;
  for (const t of trozos) {
    cuerpo.set(t, pos);
    pos += t.byteLength;
  }
  return cuerpo;
}
