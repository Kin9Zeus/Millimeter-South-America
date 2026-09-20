/**
 * Cadenas de interfaz (navegación, formularios, pie, avisos).
 * El copy largo de cada página vive en la propia página: traducir marketing
 * palabra por palabra produce textos muertos en los dos idiomas.
 */

import { DEFAULT_LOCALE, ROUTES, type Locale } from '../consts';

export const ui = {
  es: {
    'skip.content': 'Saltar al contenido',
    'nav.menu': 'Menú',
    'nav.close': 'Cerrar',
    'nav.contact': 'Hablemos de tu proyecto',
    'nav.lang': 'English',
    'nav.langLabel': 'Cambiar idioma a inglés',

    'cta.primary': 'Hablemos de tu proyecto',
    'cta.secondary': 'Ver materiales',
    'cta.projects': 'Ver proyectos',
    'cta.tech': 'Cómo funciona',
    'cta.back': 'Volver al inicio',

    'form.title': 'Cuéntanos qué estás proyectando',
    'form.name': 'Nombre',
    'form.email': 'Email',
    'form.company': 'Estudio o empresa',
    'form.role': 'Perfil',
    'form.role.architect': 'Arquitecto / diseñador',
    'form.role.contractor': 'Constructor / contratista',
    'form.role.client': 'Cliente particular',
    'form.role.distributor': 'Distribuidor',
    'form.country': 'País',
    'form.message': 'Tu proyecto',
    'form.messagePlaceholder': 'Tipo de obra, superficie aproximada, plazos y el material que tienes en mente.',
    'form.submit': 'Enviar consulta',
    'form.sending': 'Enviando…',
    'form.required': 'Obligatorio',
    'form.optional': 'Opcional',
    'form.consent': 'He leído y acepto la',
    'form.consentLink': 'política de privacidad',
    'form.error': 'No pudimos enviar tu mensaje. Escríbenos directamente a',
    'form.errorField': 'Revisa este campo',
    'form.responseTime': 'Respondemos en menos de 24 horas hábiles.',

    'footer.tagline': 'Piedra natural de 1 a 5 milímetros.',
    'footer.nav': 'Navegación',
    'footer.contact': 'Contacto',
    'footer.legal': 'Legal',
    'footer.privacy': 'Política de privacidad',
    'footer.cookies': 'Cookies',
    'footer.rights': 'Todos los derechos reservados.',
    'footer.representative': 'Representación para Sur América',
    'footer.motion': 'Animaciones',
    'footer.motion.on': 'activadas',
    'footer.motion.off': 'desactivadas',
    'footer.motion.hint': 'Cambiar las animaciones de la página',

    'cookies.title': 'Esta web usa cookies',
    'cookies.body':
      'Solo usamos cookies técnicas, necesarias para que el sitio funcione. No hay rastreo publicitario ni perfilado.',
    'cookies.accept': 'Entendido',
    'cookies.more': 'Más información',

    '404.eyebrow': 'Error 404',
    '404.title': 'Esta página no existe',
    '404.body':
      'El enlace está roto o la página se movió. Estas son las secciones que sí existen.',
  },

  en: {
    'skip.content': 'Skip to content',
    'nav.menu': 'Menu',
    'nav.close': 'Close',
    'nav.contact': "Let's talk about your project",
    'nav.lang': 'Español',
    'nav.langLabel': 'Switch language to Spanish',

    'cta.primary': "Let's talk about your project",
    'cta.secondary': 'See materials',
    'cta.projects': 'See projects',
    'cta.tech': 'How it works',
    'cta.back': 'Back to home',

    'form.title': 'Tell us what you are designing',
    'form.name': 'Name',
    'form.email': 'Email',
    'form.company': 'Studio or company',
    'form.role': 'Role',
    'form.role.architect': 'Architect / designer',
    'form.role.contractor': 'Builder / contractor',
    'form.role.client': 'Private client',
    'form.role.distributor': 'Distributor',
    'form.country': 'Country',
    'form.message': 'Your project',
    'form.messagePlaceholder': 'Type of work, approximate surface, timeline and the material you have in mind.',
    'form.submit': 'Send enquiry',
    'form.sending': 'Sending…',
    'form.required': 'Required',
    'form.optional': 'Optional',
    'form.consent': 'I have read and accept the',
    'form.consentLink': 'privacy policy',
    'form.error': 'We could not send your message. Write to us directly at',
    'form.errorField': 'Check this field',
    'form.responseTime': 'We reply within one business day.',

    'footer.tagline': 'Natural stone, 1 to 5 millimetres.',
    'footer.nav': 'Navigation',
    'footer.contact': 'Contact',
    'footer.legal': 'Legal',
    'footer.privacy': 'Privacy policy',
    'footer.cookies': 'Cookies',
    'footer.rights': 'All rights reserved.',
    'footer.representative': 'South America representation',
    'footer.motion': 'Animations',
    'footer.motion.on': 'on',
    'footer.motion.off': 'off',
    'footer.motion.hint': 'Change the page animations',

    'cookies.title': 'This site uses cookies',
    'cookies.body':
      'We only use technical cookies, required for the site to work. No advertising tracking, no profiling.',
    'cookies.accept': 'Got it',
    'cookies.more': 'Learn more',

    '404.eyebrow': 'Error 404',
    '404.title': 'This page does not exist',
    '404.body': 'The link is broken or the page moved. These are the sections that do exist.',
  },
} as const;

export type UIKey = keyof (typeof ui)['es'];

/** Devuelve el traductor para un idioma. */
export function useTranslations(lang: Locale) {
  return function t(key: UIKey): string {
    return (ui[lang] as Record<string, string>)[key] ?? (ui[DEFAULT_LOCALE] as Record<string, string>)[key] ?? key;
  };
}

/** Deduce el idioma a partir de la URL. `/en/...` es inglés; todo lo demás, español. */
export function getLocale(url: URL): Locale {
  return url.pathname === '/en' || url.pathname.startsWith('/en/') ? 'en' : 'es';
}

/** Ruta equivalente en el otro idioma, para el selector y los hreflang. */
export function alternatePath(pathname: string, target: Locale): string {
  const clean = pathname.replace(/\/$/, '') || '/';
  const source: Locale = clean === '/en' || clean.startsWith('/en/') ? 'en' : 'es';
  if (source === target) return clean;
  for (const route of Object.values(ROUTES)) {
    if (route[source] === clean) return route[target];
  }
  // Sin equivalente conocido: a la portada del otro idioma, nunca a un 404.
  return target === 'en' ? '/en' : '/';
}
