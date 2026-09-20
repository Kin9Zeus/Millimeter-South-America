import fs from 'node:fs';
import path from 'node:path';

/**
 * ¿Existe ya este archivo en /public?
 *
 * El material visual se genera aparte (Nano Banana Pro / Veo 3.1) y se va
 * soltando en `public/media/`. Mientras un archivo no exista, el componente
 * pinta un marcador procedural que se ve intencionado en vez de un hueco roto.
 * En cuanto el archivo aparece, la siguiente build lo usa sin tocar código.
 *
 * Solo se evalúa en build (todas las páginas son prerenderizadas).
 */
const PUBLIC_DIR = path.join(process.cwd(), 'public');

export function hasMedia(publicPath: string): boolean {
  const clean = publicPath.replace(/^\//, '');
  try {
    return fs.existsSync(path.join(PUBLIC_DIR, clean));
  } catch {
    return false;
  }
}

/** Devuelve la ruta si el archivo existe; si no, null. */
export function media(publicPath: string): string | null {
  return hasMedia(publicPath) ? publicPath : null;
}

export interface FrameSet {
  /** Carpeta pública con `0001.webp`, `0002.webp`… (termina en `/`). */
  dir: string;
  count: number;
  width: number;
  height: number;
}

/**
 * Secuencia de fotogramas generada por `npm run media` a partir de un video del hero.
 * `basePath` es el del video sin extensión: `/media/hero/canto` -> `/media/hero/canto-frames/`.
 * El pipeline deja un `listo.json` cuando termina, así que una secuencia a medias no cuenta.
 */
export function frameSet(basePath: string): FrameSet | null {
  const dir = `${basePath}-frames/`;
  try {
    const raw = fs.readFileSync(path.join(PUBLIC_DIR, dir.replace(/^\//, ''), 'listo.json'), 'utf8');
    const m = JSON.parse(raw) as { frames: number; width: number; height: number };
    return m.frames > 0 ? { dir, count: m.frames, width: m.width, height: m.height } : null;
  } catch {
    return null;
  }
}

/**
 * Fuente de video con webm primero y mp4 de reserva, solo con los que existan.
 */
export function videoSources(basePath: string): { src: string; type: string }[] {
  const out: { src: string; type: string }[] = [];
  if (hasMedia(`${basePath}.webm`)) out.push({ src: `${basePath}.webm`, type: 'video/webm' });
  if (hasMedia(`${basePath}.mp4`)) out.push({ src: `${basePath}.mp4`, type: 'video/mp4' });
  return out;
}
