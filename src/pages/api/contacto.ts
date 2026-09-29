import type { APIRoute } from 'astro';
import { EMAIL_RE, crearLimitador, escapeHtml, limpiar as clean, runtimeEnv } from '../../lib/servidor';

/** Esta ruta se ejecuta en el servidor: no se prerenderiza. */
export const prerender = false;

const MAX = { name: 120, email: 160, company: 160, country: 80, message: 4000 } as const;
const ROLES = new Set(['architect', 'contractor', 'client', 'distributor', '']);

/** 5 envios por IP cada 15 minutos. Ver crearLimitador en lib/servidor.ts. */
const rateLimited = crearLimitador(15 * 60 * 1000, 5);

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
