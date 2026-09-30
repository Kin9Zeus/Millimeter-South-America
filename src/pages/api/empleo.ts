import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';
import { examinarPdf } from '../../lib/pdf';
import { EMAIL_RE, crearLimitador, escapeHtml, leerCuerpo, limpiar, runtimeEnv } from '../../lib/servidor';

/**
 * Candidaturas de empleo: formulario + CV en PDF, enviado por correo. NADA se guarda: ni el archivo
 * ni los datos tocan el disco ni una base de datos; viven en memoria lo que dura la peticion y el
 * resultado es un correo al buzon de seleccion.
 *
 * Un archivo subido por un desconocido es la superficie de ataque mas peligrosa del sitio, asi que
 * las defensas son en capas (ver 04-Web/Seguridad de la web.md):
 *
 *   1. server.mjs: rechaza antes de llegar aqui cualquier POST sin longitud o por encima del tope.
 *   2. Astro `checkOrigin` (CSRF) y limitacion de tasa estricta (3 por hora y por IP).
 *   3. Tope DURO de bytes al leer el cuerpo (`leerCuerpo`): no se acumula un cuerpo mas grande.
 *   4. Solo PDF, y se comprueba el CONTENIDO, no lo que diga el navegador: el nombre y el tipo MIME
 *      los controla el cliente y no valen como prueba. Cabecera `%PDF-`, marca `%%EOF` al final y
 *      ausencia de contenido activo (JavaScript, lanzadores, adjuntos incrustados, formularios).
 *   5. El nombre del archivo NUNCA se usa: el adjunto se renombra con un nombre generado y ASCII.
 *   6. Trampa para bots, tiempo minimo y control de caracteres (inyeccion de cabeceras) como en
 *      el formulario de contacto; todo lo que llega al HTML del correo se escapa.
 *
 * Limite honesto: esto NO es un antivirus. Un PDF con contenido activo escondido dentro de flujos
 * comprimidos no se ve desde aqui. Por eso el archivo solo llega a un buzon de seleccion (no se
 * publica ni se sirve nunca desde la web) y conviene abrirlo con un visor actualizado.
 */
export const prerender = false;

const MAX_CV = 5 * 1024 * 1024; // 5 MB
/** El cuerpo trae el CV mas los campos de texto y el relleno multipart. */
const MAX_CUERPO = MAX_CV + 128 * 1024;

const MAX = { name: 120, email: 160, country: 80, message: 2000 } as const;
const AREAS = new Set(['', 'architecture', 'commercial', 'technical', 'operations', 'other']);
const AREA_NOMBRE: Record<string, string> = {
  architecture: 'Arquitectura y diseño',
  commercial: 'Comercial y proyectos',
  technical: 'Técnico y producción',
  operations: 'Logística y administración',
  other: 'Otra',
};

/** 3 candidaturas por IP cada hora: un candidato real envia una. */
const rateLimited = crearLimitador(60 * 60 * 1000, 3);

/** Nombre de adjunto generado: solo ASCII, sin nada que venga del cliente salvo el nombre limpio. */
function nombreAdjunto(nombre: string): string {
  const base = nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `CV-${base || 'candidato'}.pdf`;
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    });

  if (rateLimited(clientAddress ?? 'desconocida')) {
    return json({ ok: false, error: 'rate_limit' }, 429);
  }

  // Solo multipart/form-data: es lo que envia el formulario y lo unico que se sabe leer.
  const tipo = request.headers.get('content-type') ?? '';
  if (!/^multipart\/form-data;\s*boundary=/i.test(tipo)) return json({ ok: false, error: 'bad_request' }, 400);

  const cuerpo = await leerCuerpo(request, MAX_CUERPO);
  if (!cuerpo) return json({ ok: false, error: 'too_large' }, 413);

  let form: FormData;
  try {
    form = await new Response(cuerpo, { headers: { 'content-type': tipo } }).formData();
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // Trampa para bots: campo invisible que una persona nunca rellena.
  if (limpiar(form.get('website'), 200) !== '') return json({ ok: true }, 200);

  // Un formulario enviado en menos de 5 segundos no lo rellenó una persona (hay que adjuntar un archivo).
  const started = Number(form.get('started'));
  if (!Number.isFinite(started) || Date.now() - started < 5000) return json({ ok: true }, 200);

  const data = {
    name: limpiar(form.get('name'), MAX.name),
    email: limpiar(form.get('email'), MAX.email),
    country: limpiar(form.get('country'), MAX.country),
    area: limpiar(form.get('area'), 40),
    message: limpiar(form.get('message'), MAX.message),
    lang: ['en', 'fr'].includes(limpiar(form.get('lang'), 2)) ? limpiar(form.get('lang'), 2) : 'es',
  };

  const errors: Record<string, string> = {};
  if (data.name.length < 2) errors.name = 'required';
  if (!EMAIL_RE.test(data.email)) errors.email = 'invalid';
  if (!AREAS.has(data.area)) errors.area = 'invalid';
  if (limpiar(form.get('consent'), 10) !== 'on') errors.consent = 'required';

  // El archivo: se valida por CONTENIDO. Nombre y tipo MIME solo se miran como filtro barato.
  const archivo = form.get('cv');
  let pdf: Uint8Array | null = null;
  if (!(archivo instanceof File) || archivo.size === 0) {
    errors.cv = 'required';
  } else if (archivo.size > MAX_CV) {
    errors.cv = 'too_large';
  } else if (!/\.pdf$/i.test(archivo.name) || !['application/pdf', 'application/x-pdf', ''].includes(archivo.type)) {
    errors.cv = 'invalid';
  } else {
    pdf = new Uint8Array(await archivo.arrayBuffer());
    if (examinarPdf(pdf) !== 'ok') errors.cv = 'invalid';
  }

  if (Object.keys(errors).length || !pdf) return json({ ok: false, errors }, 422);

  const to = runtimeEnv('CAREERS_TO') || runtimeEnv('CONTACT_TO');
  const apiKey = runtimeEnv('RESEND_API_KEY');
  const from = runtimeEnv('CONTACT_FROM');

  if (!to || !apiKey || !from) {
    console.error('[empleo] Faltan variables de entorno (RESEND_API_KEY, CONTACT_FROM, CAREERS_TO o CONTACT_TO). Candidatura NO enviada.');
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  const huella = createHash('sha256').update(pdf).digest('hex');
  const rows: [string, string][] = [
    ['Nombre', data.name],
    ['Email', data.email],
    ['País', data.country || '—'],
    ['Área de interés', AREA_NOMBRE[data.area] ?? '—'],
    ['Idioma', data.lang],
    ['CV', `${Math.round(pdf.byteLength / 1024)} kB · SHA-256 ${huella.slice(0, 16)}…`],
  ];

  const html = `
    <h2 style="font-family:Georgia,serif">Nueva candidatura desde la web</h2>
    <table style="font-family:system-ui,sans-serif;font-size:14px;border-collapse:collapse">
      ${rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#777">${k}</td><td style="padding:4px 0"><strong>${escapeHtml(v)}</strong></td></tr>`).join('')}
    </table>
    ${data.message ? `<h3 style="font-family:system-ui,sans-serif;font-size:14px;margin-top:24px">Presentación</h3>
    <p style="font-family:system-ui,sans-serif;font-size:14px;white-space:pre-wrap;line-height:1.6">${escapeHtml(data.message)}</p>` : ''}
    <p style="font-family:system-ui,sans-serif;font-size:12px;color:#777;margin-top:24px">
      El CV va adjunto. La web no lo guarda: solo existe en este correo. Ábrelo con un visor de PDF
      actualizado y no lo reenvíes fuera de la selección. Si el candidato pide su eliminación,
      borra este correo.
    </p>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: data.email,
        subject: `Candidatura web · ${data.name}${AREA_NOMBRE[data.area] ? ` · ${AREA_NOMBRE[data.area]}` : ''}`,
        html,
        attachments: [{ filename: nombreAdjunto(data.name), content: Buffer.from(pdf).toString('base64') }],
      }),
    });

    if (!res.ok) {
      // Solo el estado: el cuerpo de la respuesta puede repetir datos personales.
      console.error('[empleo] Resend respondió', res.status);
      return json({ ok: false, error: 'send_failed' }, 502);
    }
  } catch (err) {
    console.error('[empleo] Error de red al enviar:', (err as Error).name);
    return json({ ok: false, error: 'send_failed' }, 502);
  }

  return json({ ok: true }, 200);
};

/** Cualquier método que no sea POST no tiene sentido aquí. */
export const ALL: APIRoute = () => new Response(null, { status: 405, headers: { allow: 'POST' } });
