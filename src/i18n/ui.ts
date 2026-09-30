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
    'nav.contactShort': 'Contacto',
    'nav.main': 'Navegación principal',
    'nav.mobile': 'Navegación móvil',
    'nav.homeLabel': 'MILLIMETER by Casanova — inicio',
    'nav.langLabel': 'Idioma',
    'nav.newTab': '(abre en una pestaña nueva)',

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
    'nav.contactShort': 'Contact',
    'nav.main': 'Main navigation',
    'nav.mobile': 'Mobile navigation',
    'nav.homeLabel': 'MILLIMETER by Casanova — home',
    'nav.langLabel': 'Language',
    'nav.newTab': '(opens in a new tab)',

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
  fr: {
    'skip.content': 'Aller au contenu',
    'nav.menu': 'Menu',
    'nav.close': 'Fermer',
    'nav.contact': 'Parlons de votre projet',
    'nav.contactShort': 'Contact',
    'nav.main': 'Navigation principale',
    'nav.mobile': 'Navigation mobile',
    'nav.homeLabel': 'MILLIMETER by Casanova — accueil',
    'nav.langLabel': 'Langue',
    'nav.newTab': '(s’ouvre dans un nouvel onglet)',

    'cta.primary': 'Parlons de votre projet',
    'cta.secondary': 'Voir les matériaux',
    'cta.projects': 'Voir les projets',
    'cta.tech': 'Comment ça marche',
    'cta.back': 'Retour à l’accueil',

    'form.title': 'Dites-nous ce que vous concevez',
    'form.name': 'Nom',
    'form.email': 'E-mail',
    'form.company': 'Cabinet ou entreprise',
    'form.role': 'Profil',
    'form.role.architect': 'Architecte / designer',
    'form.role.contractor': 'Constructeur / entrepreneur',
    'form.role.client': 'Client particulier',
    'form.role.distributor': 'Distributeur',
    'form.country': 'Pays',
    'form.message': 'Votre projet',
    'form.messagePlaceholder': 'Type de chantier, surface approximative, délais et matériau envisagé.',
    'form.submit': 'Envoyer la demande',
    'form.sending': 'Envoi…',
    'form.required': 'Obligatoire',
    'form.optional': 'Facultatif',
    'form.consent': 'J’ai lu et j’accepte la',
    'form.consentLink': 'politique de confidentialité',
    'form.error': 'Nous n’avons pas pu envoyer votre message. Écrivez-nous directement à',
    'form.errorField': 'Vérifiez ce champ',
    'form.responseTime': 'Nous répondons sous un jour ouvré.',

    'footer.tagline': 'Pierre naturelle de 1 à 5 millimètres.',
    'footer.nav': 'Navigation',
    'footer.contact': 'Contact',
    'footer.legal': 'Légal',
    'footer.privacy': 'Politique de confidentialité',
    'footer.cookies': 'Cookies',
    'footer.rights': 'Tous droits réservés.',
    'footer.representative': 'Représentation pour l’Amérique du Sud',
    'footer.motion': 'Animations',
    'footer.motion.on': 'activées',
    'footer.motion.off': 'désactivées',
    'footer.motion.hint': 'Modifier les animations de la page',

    'cookies.title': 'Ce site utilise des cookies',
    'cookies.body':
      'Nous n’utilisons que des cookies techniques, nécessaires au fonctionnement du site. Aucun suivi publicitaire, aucun profilage.',
    'cookies.accept': 'Compris',
    'cookies.more': 'En savoir plus',

    '404.eyebrow': 'Erreur 404',
    '404.title': 'Cette page n’existe pas',
    '404.body': 'Le lien est rompu ou la page a été déplacée. Voici les rubriques qui existent.',
  },
  ar: {
    'skip.content': 'انتقل إلى المحتوى',
    'nav.menu': 'القائمة',
    'nav.close': 'إغلاق',
    'nav.contact': 'لنتحدث عن مشروعك',
    'nav.contactShort': 'اتصل بنا',
    'nav.main': 'التنقل الرئيسي',
    'nav.mobile': 'التنقل على الجوّال',
    'nav.homeLabel': 'MILLIMETER by Casanova — الصفحة الرئيسية',
    'nav.langLabel': 'اللغة',
    'nav.newTab': '(يُفتح في علامة تبويب جديدة)',

    'cta.primary': 'لنتحدث عن مشروعك',
    'cta.secondary': 'استعرض المواد',
    'cta.projects': 'استعرض المشاريع',
    'cta.tech': 'كيف تعمل',
    'cta.back': 'العودة إلى الصفحة الرئيسية',

    'form.title': 'أخبرنا بما تصمّمه',
    'form.name': 'الاسم',
    'form.email': 'البريد الإلكتروني',
    'form.company': 'المكتب أو الشركة',
    'form.role': 'صفتك',
    'form.role.architect': 'مهندس معماري / مصمم',
    'form.role.contractor': 'مقاول / منفّذ',
    'form.role.client': 'عميل فرد',
    'form.role.distributor': 'موزّع',
    'form.country': 'الدولة',
    'form.message': 'مشروعك',
    'form.messagePlaceholder': 'نوع العمل، والمساحة التقريبية، والمدة الزمنية، والمادة التي تفكر فيها.',
    'form.submit': 'إرسال الطلب',
    'form.sending': 'جارٍ الإرسال…',
    'form.required': 'إلزامي',
    'form.optional': 'اختياري',
    'form.consent': 'لقد قرأتُ وأوافق على',
    'form.consentLink': 'سياسة الخصوصية',
    'form.error': 'تعذّر إرسال رسالتك. راسلنا مباشرة على',
    'form.errorField': 'راجع هذا الحقل',
    'form.responseTime': 'نردّ خلال يوم عمل واحد.',

    'footer.tagline': 'حجر طبيعي بسماكة من 1 إلى 5 ملّيمترات.',
    'footer.nav': 'التنقل',
    'footer.contact': 'اتصل بنا',
    'footer.legal': 'قانوني',
    'footer.privacy': 'سياسة الخصوصية',
    'footer.cookies': 'ملفات تعريف الارتباط',
    'footer.rights': 'جميع الحقوق محفوظة.',
    'footer.representative': 'التمثيل في أمريكا الجنوبية',
    'footer.motion': 'الحركة',
    'footer.motion.on': 'مفعّلة',
    'footer.motion.off': 'معطّلة',
    'footer.motion.hint': 'تغيير حركة الصفحة',

    'cookies.title': 'يستخدم هذا الموقع ملفات تعريف الارتباط',
    'cookies.body':
      'نستخدم ملفات تعريف الارتباط التقنية فقط، وهي لازمة لعمل الموقع. لا تتبّع إعلاني ولا تحليل لسلوكك.',
    'cookies.accept': 'فهمت',
    'cookies.more': 'مزيد من المعلومات',

    '404.eyebrow': 'الخطأ 404',
    '404.title': 'هذه الصفحة غير موجودة',
    '404.body': 'الرابط معطّل أو نُقلت الصفحة. هذه هي الأقسام الموجودة.',
  },
} as const;

export type UIKey = keyof (typeof ui)['es'];

/** Devuelve el traductor para un idioma. */
export function useTranslations(lang: Locale) {
  return function t(key: UIKey): string {
    return (ui[lang] as Record<string, string>)[key] ?? (ui[DEFAULT_LOCALE] as Record<string, string>)[key] ?? key;
  };
}

/** Deduce el idioma a partir de la URL: `/en/...` inglés, `/fr/...` francés, `/ar/...` árabe; todo lo demás, español. */
export function getLocale(url: URL): Locale {
  return localeOfPath(url.pathname);
}

function localeOfPath(pathname: string): Locale {
  const clean = pathname.replace(/\/$/, '') || '/';
  if (clean === '/en' || clean.startsWith('/en/')) return 'en';
  if (clean === '/fr' || clean.startsWith('/fr/')) return 'fr';
  if (clean === '/ar' || clean.startsWith('/ar/')) return 'ar';
  return 'es';
}

/** Ruta equivalente en otro idioma, para el selector y los hreflang. */
export function alternatePath(pathname: string, target: Locale): string {
  const clean = pathname.replace(/\/$/, '') || '/';
  const source = localeOfPath(clean);
  if (source === target) return clean;
  for (const route of Object.values(ROUTES)) {
    if (route[source] === clean) return route[target];
  }
  // Sin equivalente conocido: a la portada del otro idioma, nunca a un 404.
  return ROUTES.home[target];
}

/** Nombres de cada idioma en su propio idioma, para el selector. */
export const LANGUAGE_NAMES: Record<Locale, string> = { es: 'Español', en: 'English', fr: 'Français', ar: 'العربية' };

/** Unidades en árabe: "5 mm" → "5 مم", "2 cm" → "2 سم". Las cifras se quedan en dígitos latinos. */
export const arUnits = (s: string) => s.replace(/\bmm\b/g, 'مم').replace(/\bcm\b/g, 'سم');

/** Nombre de la familia de piedra (clave de MATERIALS.family) en cada idioma. */
export const FAMILY_NAMES: Record<Locale, Record<string, string>> = {
  es: { marmol: 'Mármol', cuarcita: 'Cuarcita', travertino: 'Travertino' },
  en: { marmol: 'Marble', cuarcita: 'Quartzite', travertino: 'Travertine' },
  fr: { marmol: 'Marbre', cuarcita: 'Quartzite', travertino: 'Travertin' },
  ar: { marmol: 'رخام', cuarcita: 'كوارتزيت', travertino: 'ترافرتين' },
};

/**
 * Dirección con la que pintar una medida corta ("80–90%", "< 0.5%", "20 مم") en una página RTL.
 * Sin letras árabes es una cifra latina: se aísla en LTR para que el algoritmo bidireccional no la
 * desordene ("%90–80"). Con letras árabes se deja fluir en RTL. En páginas LTR devuelve `undefined`.
 */
export function measureDir(measure: string, lang: Locale): 'ltr' | 'rtl' | undefined {
  if (lang !== 'ar') return undefined;
  return /[\u0600-\u06FF]/.test(measure) ? 'rtl' : 'ltr';
}
