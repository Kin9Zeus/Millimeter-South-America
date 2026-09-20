import type { APIRoute } from 'astro';

/** Esta ruta se ejecuta en el servidor: no se prerenderiza. */
export const prerender = false;

const MAX = { name: 120, email: 160, company: 160, country: 80, message: 4000 } as const;
const ROLES = new Set(['architect', 'contractor', 'client', 'distributor', '']);

/**
 * Limitación de tasa en memoria: 5 envíos por IP cada 15 minutos.
 * Suficiente para un formulario de contacto de un sitio de una sola instancia.
 * Si algún día Railway escala a varias réplicas hay que moverlo a Redis —
 * anotado en 04-Web/Seguridad de la web.md.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  // Poda perezosa para que el mapa no crezca indefinidamente.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  }
  return recent.length > MAX_PER_WINDOW;
}

function clean(value: FormDataEntryValue | null, max: number): string {
  if (typeof value !== 'string') return '';
  // Se eliminan caracteres de control para que no se puedan inyectar
  // cabeceras al construir el correo.
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/**
 * Lee una variable de entorno SOLO en tiempo de ejecución, de `process.env`.
 *
 * PROHIBIDO escribir `import.meta.env` en una ruta de servidor: ni `.RESEND_API_KEY` ni `.DEV`.
 * En un build SSR, Astro reescribe CUALQUIER aparición como
 * `Object.assign({...públicas}, {...todas las variables del entorno al compilar})`.
 * En Railway las variables del servicio existen durante el build, así que la clave (y el resto)
 * quedaría escrita dentro de `dist/`, y rotarla en el panel no tendría efecto hasta recompilar,
 * porque el valor incrustado gana. Comprobado el 2026-09-20 compilando con una clave falsa y
 * buscándola en `dist/`.
 *
 * En desarrollo (`astro dev`) Vite no vuelca `.env` en `process.env`, así que se carga una vez
 * con `process.loadEnvFile`. No pisa variables ya definidas, y en Railway no existe ese archivo
 * (está en .gitignore): allí es un no-op.
 */
let envFileTried = false;
function runtimeEnv(name: string): string | undefined {
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

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
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

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ ok: false, error: 'bad_request' }, 400);
  }

  // Trampa para bots: campo invisible que una persona nunca rellena.
  if (clean(form.get('website'), 200) !== '') {
    // Se responde 200 a propósito: no se le dice al bot que fue detectado.
    return json({ ok: true }, 200);
  }

  // Un formulario enviado en menos de 3 segundos no lo escribió una persona.
  const started = Number(form.get('started'));
  if (!Number.isFinite(started) || Date.now() - started < 3000) {
    return json({ ok: true }, 200);
  }

  const data = {
    name: clean(form.get('name'), MAX.name),
    email: clean(form.get('email'), MAX.email),
    company: clean(form.get('company'), MAX.company),
    country: clean(form.get('country'), MAX.country),
    role: clean(form.get('role'), 40),
    message: clean(form.get('message'), MAX.message),
    lang: clean(form.get('lang'), 2) === 'en' ? 'en' : 'es',
  };

  const errors: Record<string, string> = {};
  if (data.name.length < 2) errors.name = 'required';
  if (!EMAIL_RE.test(data.email)) errors.email = 'invalid';
  if (data.message.length < 10) errors.message = 'required';
  if (!ROLES.has(data.role)) errors.role = 'invalid';
  if (clean(form.get('consent'), 10) !== 'on') errors.consent = 'required';

  if (Object.keys(errors).length) return json({ ok: false, errors }, 422);

  const to = runtimeEnv('CONTACT_TO');
  const apiKey = runtimeEnv('RESEND_API_KEY');
  const from = runtimeEnv('CONTACT_FROM');

  if (!to || !apiKey || !from) {
    // Configuración incompleta. Se responde con un error explícito en vez de
    // fingir que se envió: la interfaz muestra el email directo como salida.
    console.error(
      '[contacto] Faltan variables de entorno (RESEND_API_KEY, CONTACT_TO, CONTACT_FROM). Mensaje NO enviado.',
    );
    return json({ ok: false, error: 'not_configured' }, 503);
  }

  const subject = `Consulta web · ${data.name}${data.company ? ` · ${data.company}` : ''}`;
  const rows: [string, string][] = [
    ['Nombre', data.name],
    ['Email', data.email],
    ['Estudio o empresa', data.company || '—'],
    ['País', data.country || '—'],
    ['Perfil', data.role || '—'],
    ['Idioma', data.lang],
  ];

  const html = `
    <h2 style="font-family:Georgia,serif">Nueva consulta desde la web</h2>
    <table style="font-family:system-ui,sans-serif;font-size:14px;border-collapse:collapse">
      ${rows.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#777">${k}</td><td style="padding:4px 0"><strong>${escapeHtml(v)}</strong></td></tr>`).join('')}
    </table>
    <h3 style="font-family:system-ui,sans-serif;font-size:14px;margin-top:24px">Proyecto</h3>
    <p style="font-family:system-ui,sans-serif;font-size:14px;white-space:pre-wrap;line-height:1.6">${escapeHtml(data.message)}</p>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        // Responder al correo contesta directamente a quien escribió.
        reply_to: data.email,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      console.error('[contacto] Resend respondió', res.status, await res.text());
      return json({ ok: false, error: 'send_failed' }, 502);
    }
  } catch (err) {
    console.error('[contacto] Error de red al enviar:', err);
    return json({ ok: false, error: 'send_failed' }, 502);
  }

  return json({ ok: true }, 200);
};

/** Cualquier método que no sea POST no tiene sentido aquí. */
export const ALL: APIRoute = () =>
  new Response(null, { status: 405, headers: { allow: 'POST' } });
