#!/usr/bin/env node
/**
 * Pipeline de medios.
 *
 *   npm run media
 *
 * Coge lo que haya en `media-fuente/` (lo que genera Nano Banana Pro y Veo 3.1,
 * sin tocar) y escribe en `public/media/` las versiones optimizadas que el
 * sitio consume. El original nunca se modifica ni se publica: pesa demasiado.
 *
 *   media-fuente/materiales/nero-marquina.png
 *     -> public/media/materiales/nero-marquina.avif   (y .webp, y .jpg)
 *
 *   media-fuente/hero/canto.mp4          (y canto-movil.mp4, vertical)
 *     -> public/media/hero/canto-frames/0001.webp ... (secuencia para el <canvas> del hero)
 *        public/media/hero/canto-poster.jpg           (primer fotograma)
 *   Los videos de otras carpetas siguen saliendo como .mp4 + .webm + poster.
 *
 * Los videos necesitan ffmpeg en el PATH. Si no esta, el script avisa y sigue
 * con las imagenes en vez de fallar.
 *
 * Avisa (no falla) cuando una imagen no encaja en su hueco: recorte superior al 8 %
 * o origen mas pequeno que el perfil. Los formatos validos del generador estan en
 * RATIOS_GENERADOR mas abajo.
 *
 * Ver 04-Web/Pipeline de medios.md en el vault.
 */

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';

const run = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'media-fuente');
const OUT = path.join(ROOT, 'public', 'media');

/**
 * Perfiles por carpeta. El ancho maximo sale del uso real en el layout:
 * generar mas pixeles de los que se van a pintar es peso tirado.
 */
const PERFILES = {
  // 3:4 — coincide con el formato nativo del generador: cero recorte.
  materiales: { width: 900, height: 1200, fit: 'cover', quality: 62 },
  // 4:3 — idem.
  aplicaciones: { width: 1600, height: 1200, fit: 'cover', quality: 60 },
  proyectos: { width: 1600, height: 1200, fit: 'cover', quality: 60 },
  // Foto real de estudio (2:3), no generada: el recorte a 4:5 es esperado y la
  // composicion la controla `object-position` en CSS. Sin aviso.
  equipo: { width: 1100, height: 1375, fit: 'cover', quality: 68, sinAviso: true },
  // 16:9 — idem.
  hero: { width: 2400, height: 1350, fit: 'cover', quality: 58 },
  // 9:16 — la imagen fija del hero para movil (archivo con sufijo `-movil`).
  'hero-movil': { width: 1080, height: 1920, fit: 'cover', quality: 58 },
  // 1200x630 (1,9:1) NO existe en el generador: se genera en 16:9 y se recorta
  // un ~6,7 % en vertical. Por debajo del umbral de aviso.
  og: { width: 1200, height: 630, fit: 'cover', quality: 86 },
  _default: { width: 1800, height: null, fit: 'inside', quality: 62 },
};

/**
 * Relaciones de aspecto que ofrece el generador de imagenes (Nano Banana Pro).
 * Son las UNICAS que se pueden pedir: cualquier perfil o prompt debe partir de
 * una de estas. Si necesitas otro formato, se genera en la mas cercana y se
 * recorta aqui (fit: 'cover' nunca deforma).
 */
const RATIOS_GENERADOR = { '16:9': 16 / 9, '4:3': 4 / 3, '1:1': 1, '3:4': 3 / 4, '9:16': 9 / 16 };

/** Por encima de este recorte se avisa: ya es visible en la composicion. */
const UMBRAL_RECORTE = 0.08;

/** Nombre legible de una proporcion: "4:3" si es una del generador, "1.9:1" si no. */
function nombreRatio(r) {
  for (const [nombre, valor] of Object.entries(RATIOS_GENERADOR)) {
    if (Math.abs(r - valor) / valor < 0.02) return nombre;
  }
  return `${r.toFixed(2)}:1`;
}

/** Fraccion de la imagen que se pierde al recortar de `origen` a `destino` (0-1). */
function fraccionRecortada(origen, destino) {
  return origen > destino ? 1 - destino / origen : 1 - origen / destino;
}

const IMG_EXT = /\.(png|jpe?g|webp|avif|tiff?)$/i;
const VID_EXT = /\.(mp4|mov|webm|mkv)$/i;

/*
 * Ancho de los videos. 1600 y no 1920: el video es un fondo oscuro y desenfocado
 * en gran parte, y a 1600 con CRF 28 no se distingue del original ni ampliado 3x,
 * pero pasa de 4,2 MB a 2,3 MB. Un video de 1920 con fotograma clave cada 12
 * cuadros rompe el presupuesto de 2,5 MB.
 */
const ANCHO_VIDEO = 1600;

async function tieneFfmpeg() {
  try {
    await run('ffmpeg', ['-version']);
    return true;
  } catch {
    return false;
  }
}

async function listar(dir, base = dir, out = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await listar(full, base, out);
    else if (e.isFile() && !e.name.startsWith('.')) out.push(path.relative(base, full));
  }
  return out;
}

/**
 * ¿TODAS las salidas son mas nuevas que el origen? Entonces no se rehace.
 *
 * Tiene que mirar todas, no solo la primera: si una ejecucion falla a medias
 * (p. ej. escribe el .avif y revienta al escribir el .jpg), el .avif suelto no
 * puede dar por buena una salida incompleta para siempre.
 */
async function estaAlDia(src, destinos) {
  try {
    const origen = (await fs.stat(src)).mtimeMs;
    const salidas = await Promise.all([].concat(destinos).map((d) => fs.stat(d)));
    return salidas.every((s) => s.mtimeMs >= origen);
  } catch {
    return false;
  }
}

async function procesarImagen(rel) {
  const src = path.join(SRC, rel);
  const carpeta = rel.split(path.sep)[0];
  // Un archivo con sufijo `-movil` usa el perfil vertical de su carpeta (`hero-movil`).
  const esMovil = /-movil\.[a-z0-9]+$/i.test(rel);
  const perfil = (esMovil && PERFILES[`${carpeta}-movil`]) || PERFILES[carpeta] || PERFILES._default;
  const destBase = path.join(OUT, rel.replace(IMG_EXT, ''));
  await fs.mkdir(path.dirname(destBase), { recursive: true });

  if (await estaAlDia(src, [`${destBase}.avif`, `${destBase}.webp`, `${destBase}.jpg`])) {
    console.log(`  --  ${rel} (al dia)`);
    return;
  }

  // Cuanto se va a recortar. `cover` nunca deforma, pero descarta en silencio lo
  // que sobra: una imagen 1:1 en un hueco 4:3 pierde el 25 %. Se dice ahora, al
  // procesar, en vez de descubrirlo viendo la web.
  let avisoRecorte = '';
  // Tamaño de salida. Por defecto, el del perfil; se reduce (nunca se amplia)
  // cuando el origen es mas pequeno, MANTENIENDO la proporcion del perfil.
  let salidaW = perfil.width;
  let salidaH = perfil.height ?? undefined;
  if (perfil.height) {
    const m = await sharp(src, { failOn: 'none' }).metadata();
    // EXIF 5-8 = rotada 90 grados: ancho y alto se intercambian.
    const [w, h] = (m.orientation ?? 1) >= 5 ? [m.height, m.width] : [m.width, m.height];

    // Con `withoutEnlargement`, un origen mas pequeno que el perfil en un solo
    // lado salia con OTRA proporcion (0,781 en vez de 0,750). Se calcula aqui el
    // tamaño mas grande con la proporcion exacta del perfil que cabe sin ampliar.
    const necesaria = Math.max(perfil.width / w, perfil.height / h);
    if (necesaria > 1) {
      salidaW = Math.round(perfil.width / necesaria);
      salidaH = Math.round(perfil.height / necesaria);
      // Nunca se amplia (ampliar solo inventa pixeles borrosos), pero se dice:
      // en una pantalla grande esa imagen se vera algo blanda.
      avisoRecorte +=
        `\n      aviso: el origen mide ${w}x${h} y el perfil pide ${perfil.width}x${perfil.height}: ` +
        `se publica a ${salidaW}x${salidaH}, sin ampliar. Genera a mayor resolucion si tu generador lo permite.`;
    }

    const origen = w / h;
    const destino = perfil.width / perfil.height;
    const perdida = fraccionRecortada(origen, destino);
    if (!perfil.sinAviso && perdida > UMBRAL_RECORTE) {
      const donde = origen > destino ? 'por los lados' : 'arriba y abajo';
      avisoRecorte +=
        `\n      aviso: es ${nombreRatio(origen)} y este perfil es ${nombreRatio(destino)}: ` +
        `se recorta un ${Math.round(perdida * 100)} % ${donde}. ` +
        `Genera en ${nombreRatio(destino)} para no perder composicion.`;
    }
  }

  const base = sharp(src, { failOn: 'none' })
    .rotate() // respeta la orientacion EXIF antes de recortar
    .resize({
      width: salidaW,
      height: salidaH,
      fit: perfil.fit,
      withoutEnlargement: true,
    });

  // AVIF primero (el mas pequeno), WebP como red de seguridad amplia y
  // JPEG como ultimo recurso para clientes viejos y previsualizaciones sociales.
  await Promise.all([
    base.clone().avif({ quality: perfil.quality, effort: 6 }).toFile(`${destBase}.avif`),
    // WebP y JPEG necesitan mas calidad nominal que AVIF para verse igual, pero
    // sharp rechaza cualquier valor > 100: el perfil `og` (86) reventaba con 104.
    base.clone().webp({ quality: Math.min(100, perfil.quality + 8), effort: 5 }).toFile(`${destBase}.webp`),
    base.clone().jpeg({ quality: Math.min(100, perfil.quality + 18), mozjpeg: true, progressive: true }).toFile(`${destBase}.jpg`),
  ]);

  const [a, w, j] = await Promise.all(
    ['.avif', '.webp', '.jpg'].map((ext) => fs.stat(`${destBase}${ext}`).then((s) => Math.round(s.size / 1024))),
  );
  console.log(`  ok  ${rel}  ->  avif ${a} kB · webp ${w} kB · jpg ${j} kB${avisoRecorte}`);
}

/*
 * Secuencia de fotogramas para el scroll del hero (WebP, uno por fotograma).
 *
 * Por que no un <video> con `currentTime`: saltar a un instante arbitrario depende del
 * decodificador de cada dispositivo (Safari e iOS van a tirones, y en movil el seek es
 * caro). Dibujar fotogramas ya decodificados en un <canvas> no depende de nada de eso y
 * funciona igual en escritorio y en telefono. Es la tecnica que usan las webs de scroll
 * cinematografico que si se ven bien en todos los equipos.
 *
 *   media-fuente/hero/canto.mp4        -> public/media/hero/canto-frames/0001.webp ... + listo.json
 *   media-fuente/hero/canto-movil.mp4  -> public/media/hero/canto-movil-frames/...
 *   (ambos)                            -> public/media/hero/<nombre>-poster.jpg  (primer fotograma)
 *
 * El video horizontal se saca a 1280 px de ancho y el vertical a 720: el fondo es
 * oscuro y desenfocado, y en un telefono se pinta a menos de 500 px CSS.
 */
const FOTOGRAMAS = 72; // como la referencia: suficiente para que el paso entre dos sea invisible
const CALIDAD_FOTOGRAMA = 68;
const PRESUPUESTO_SECUENCIA_KB = { horizontal: 2600, vertical: 1600 };

async function procesarSecuencia(rel) {
  const src = path.join(SRC, rel);
  const nombre = path.basename(rel).replace(VID_EXT, '');
  const dirSalida = path.join(OUT, path.dirname(rel), `${nombre}-frames`);
  const poster = path.join(OUT, path.dirname(rel), `${nombre}-poster.jpg`);
  const marca = path.join(dirSalida, 'listo.json');

  if (await estaAlDia(src, [poster, marca])) {
    console.log(`  --  ${rel} (al dia)`);
    return;
  }

  const { stdout } = await run('ffprobe', [
    '-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height:format=duration', '-of', 'json', src,
  ]);
  const info = JSON.parse(stdout);
  const { width, height } = info.streams[0];
  const duracion = Number(info.format.duration);
  const vertical = height > width;
  const anchoSalida = vertical ? 720 : 1280;

  // Limpia una secuencia anterior (puede tener otro numero de fotogramas).
  await fs.rm(dirSalida, { recursive: true, force: true });
  await fs.mkdir(dirSalida, { recursive: true });

  await run('ffmpeg', [
    '-y', '-i', src,
    '-an',
    '-vf', `fps=${(FOTOGRAMAS / duracion).toFixed(4)},scale=${anchoSalida}:-2:flags=lanczos`,
    '-frames:v', String(FOTOGRAMAS),
    '-c:v', 'libwebp', '-quality', String(CALIDAD_FOTOGRAMA), '-compression_level', '6',
    path.join(dirSalida, '%04d.webp'),
  ]);

  const nombres = (await fs.readdir(dirSalida)).filter((f) => f.endsWith('.webp')).sort();
  const pesos = await Promise.all(nombres.map((f) => fs.stat(path.join(dirSalida, f)).then((s) => s.size)));
  const totalKb = Math.round(pesos.reduce((a, b) => a + b, 0) / 1024);
  const meta = await sharp(path.join(dirSalida, nombres[0])).metadata();
  await fs.writeFile(
    marca,
    JSON.stringify({ frames: nombres.length, width: meta.width, height: meta.height, vertical }),
  );

  // Poster = primer fotograma, a mas resolucion que la secuencia (es lo primero que se ve).
  const posterTmp = `${poster}.tmp.png`;
  await run('ffmpeg', ['-y', '-i', src, '-vframes', '1', '-q:v', '2', posterTmp]);
  await sharp(posterTmp)
    .resize({ width: vertical ? 1080 : 1920, withoutEnlargement: true })
    .jpeg({ quality: 68, mozjpeg: true, progressive: true })
    .toFile(poster);
  await fs.unlink(posterTmp);

  const posterKb = Math.round((await fs.stat(poster)).size / 1024);
  console.log(
    `  ok  ${rel}  ->  ${nombres.length} fotogramas ${meta.width}x${meta.height} · ${totalKb} kB (media ${Math.round(totalKb / nombres.length)} kB) · poster ${posterKb} kB`,
  );
  const tope = PRESUPUESTO_SECUENCIA_KB[vertical ? 'vertical' : 'horizontal'];
  if (totalKb > tope) {
    console.warn(`      aviso: ${totalKb} kB supera el presupuesto de ${tope} kB. Baja CALIDAD_FOTOGRAMA o FOTOGRAMAS.`);
  }
}

async function procesarVideo(rel) {
  // Los videos del hero se sirven como secuencia de fotogramas, no como <video>.
  if (rel.split(path.sep)[0] === 'hero') return procesarSecuencia(rel);
  return procesarVideoClasico(rel);
}

async function procesarVideoClasico(rel) {
  const src = path.join(SRC, rel);
  const destBase = path.join(OUT, rel.replace(VID_EXT, ''));
  await fs.mkdir(path.dirname(destBase), { recursive: true });

  if (await estaAlDia(src, [`${destBase}.mp4`, `${destBase}.webm`, `${destBase}-poster.jpg`])) {
    console.log(`  --  ${rel} (al dia)`);
    return;
  }

  /*
   * Video para scrub por scroll.
   *
   * La clave es `-g 12`: un fotograma clave cada 12 cuadros. Un video normal
   * pone uno cada 250 y al saltar a un instante cualquiera el navegador tiene
   * que decodificar todo lo anterior — de ahi el tiron al hacer scroll. Pesa
   * mas, pero es la unica forma de que el scrub sea fluido.
   *
   * `-movflags +faststart` mueve el indice al principio: el video empieza a
   * poder reproducirse sin esperar a la descarga completa.
   * `-an` quita el audio: estos videos son decorativos y van en mute.
   */
  await run('ffmpeg', [
    '-y', '-i', src,
    '-an',
    '-vf', `scale=${ANCHO_VIDEO}:-2:flags=lanczos`,
    '-c:v', 'libx264',
    '-profile:v', 'high',
    '-crf', '28',
    '-preset', 'slow',
    '-g', '12',
    '-keyint_min', '12',
    '-sc_threshold', '0',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    `${destBase}.mp4`,
  ]);

  // VP9 para navegadores que lo prefieren. Con un fotograma clave cada 12 cuadros
  // (necesario para el scrub) VP9 comprime peor que H.264 en escenas con particulas
  // en suspension: con CRF 34 quedaba el doble de pesado que el MP4. CRF 40 los iguala.
  await run('ffmpeg', [
    '-y', '-i', src,
    '-an',
    '-vf', `scale=${ANCHO_VIDEO}:-2:flags=lanczos`,
    '-c:v', 'libvpx-vp9',
    '-crf', '40',
    '-b:v', '0',
    '-g', '12',
    '-row-mt', '1',
    '-deadline', 'good',
    '-cpu-used', '2',
    `${destBase}.webm`,
  ]);

  // Poster: el primer fotograma, que es lo que se ve antes de cargar el video
  // y lo unico que se ve en movil (donde no hay scrub).
  const posterTmp = `${destBase}-poster-tmp.png`;
  await run('ffmpeg', ['-y', '-i', src, '-vframes', '1', '-q:v', '2', posterTmp]);
  await sharp(posterTmp)
    .resize({ width: 1920, withoutEnlargement: true })
    .jpeg({ quality: 68, mozjpeg: true, progressive: true })
    .toFile(`${destBase}-poster.jpg`);
  await fs.unlink(posterTmp);

  const [m, w] = await Promise.all(
    ['.mp4', '.webm'].map((ext) => fs.stat(`${destBase}${ext}`).then((s) => Math.round(s.size / 1024))),
  );
  console.log(`  ok  ${rel}  ->  mp4 ${m} kB · webm ${w} kB · + poster`);

  if (m > 3500) {
    console.warn(
      `      aviso: ${m} kB es mucho para un video de fondo. Acorta la toma o baja la resolucion a 1440.`,
    );
  }
  if (w > m * 1.3) {
    console.warn(
      `      aviso: el webm (${w} kB) pesa mas que el mp4 (${m} kB) y el navegador lo elige primero. Sube su -crf.`,
    );
  }
}

/* ------------------------------------------------------------------ main */

if (!existsSync(SRC)) {
  await fs.mkdir(path.join(SRC, 'hero'), { recursive: true });
  for (const d of ['materiales', 'aplicaciones', 'proyectos', 'equipo', 'og']) {
    await fs.mkdir(path.join(SRC, d), { recursive: true });
  }
  console.log(`Creada la carpeta media-fuente/. Suelta ahi los originales y vuelve a ejecutar.`);
  process.exit(0);
}

const archivos = await listar(SRC);
const imagenes = archivos.filter((f) => IMG_EXT.test(f));
const videos = archivos.filter((f) => VID_EXT.test(f));

console.log(`\nmedia-fuente/: ${imagenes.length} imagen(es), ${videos.length} video(s)\n`);

for (const f of imagenes) {
  try {
    await procesarImagen(f);
  } catch (err) {
    console.error(`  ERROR  ${f}: ${err.message}`);
  }
}

if (videos.length) {
  if (await tieneFfmpeg()) {
    for (const f of videos) {
      try {
        await procesarVideo(f);
      } catch (err) {
        console.error(`  ERROR  ${f}: ${err.message}`);
      }
    }
  } else {
    console.warn(
      '\nffmpeg no esta en el PATH: los videos se han saltado.\n' +
        'Instalalo con  winget install Gyan.FFmpeg  y vuelve a ejecutar.\n',
    );
  }
}

console.log('\nListo. Las imagenes ya estan en public/media/ y el sitio las coge en la siguiente build.\n');
