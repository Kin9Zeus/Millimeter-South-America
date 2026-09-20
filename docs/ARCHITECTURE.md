# Architecture & engineering notes

The decisions behind the site, with the trade-offs each one carries. Nothing here is
aspirational: every claim was checked against the running code.

**Contents** · [Rendering & server](#1-rendering--server) · [Internationalisation](#2-internationalisation) ·
[Design system](#3-design-system) · [Motion](#4-motion) · [Media pipeline](#5-media-pipeline) ·
[Contact form](#6-contact-form) · [Secrets](#7-secrets-two-bugs-found-before-launch) ·
[SEO & GEO](#8-seo--geo) · [Limitations & roadmap](#9-known-limitations--roadmap)

---

## 1. Rendering & server

**Decision.** Astro in `output: 'static'` with the Node adapter in **`middleware` mode**, behind a
small hand-written Express server ([`server.mjs`](../server.mjs)).

- Every page is prerendered to HTML. The only dynamic route is `POST /api/contacto`.
- `middleware` mode (instead of `standalone`) is what allows a custom server in front, and the
  custom server is what makes the security posture possible:
  - **CSP** `default-src 'none'` with everything else limited to `'self'`. This is only viable
    because the site loads **no third-party resource at all**: fonts are self-hosted, there is
    no analytics, no embeds.
  - HSTS with `preload`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` and
    cross-origin isolation headers.
  - Correct caching per asset type: hashed assets are `immutable` for a year; HTML is always
    revalidated so a deploy is visible immediately.
  - **One URL per page**: `/tecnologia/` 301-redirects to `/tecnologia`. Duplicate URLs split
    ranking signals.
  - Localised 404 pages in both languages.

**Trade-off.** More moving parts than a plain static host, in exchange for headers and redirects
that a static host cannot express.

## 2. Internationalisation

Spanish is the default locale and lives at the root; English lives under `/en` with **English
route names** (`/en/technology`, not `/en/tecnologia`) because that is what that audience
searches for.

- A single `ROUTES` map ([`src/consts.ts`](../src/consts.ts)) feeds both the `hreflang`
  alternates and the language switcher. The switcher goes to the **same page** in the other
  language, never to the home page — the most common i18n mistake.
- UI strings live in a dictionary ([`src/i18n/ui.ts`](../src/i18n/ui.ts)); persuasive copy is
  written per language instead of translated word for word.

## 3. Design system

The concept: *the brand name is a unit of measure*. The product is stone 1–5 mm thick, and the
visual language is a technical drawing: a **dimension line** ("cota") appears in section margins
and drives the hero.

- Tokens live in Tailwind 4's `@theme`: obsidian / basalt for dark surfaces, travertine and bone
  for light ones, and a single copper accent.
- Three self-hosted fonts: Bodoni Moda (display), Instrument Sans (body) and IBM Plex Mono
  (data and labels).
- Light sections **invert the theme** (`.surface-light` redefines the accent to a darker variant so
  copper text keeps its contrast). The fixed header samples what is *behind* it with an
  `IntersectionObserver` band the exact height of the bar, so its colour is always legible while
  crossing sections.

## 4. Motion

### Loading strategy

- GSAP + ScrollTrigger are a **dynamic `import()`** that only happens when motion is enabled.
- Lenis (smooth scroll) loads only for fine pointers; touch devices keep native scrolling.
- Interface state that is not animation (header background, colour switching, the motion toggle)
  lives in [`chrome.ts`](../src/scripts/chrome.ts), which needs no GSAP.
- **The HTML ships readable.** Hidden initial states hang off a `.js-motion` class on `<html>`
  that is removed after 2.5 s if the motion bundle has not started (blocked JS, dead network).

### The scroll-driven hero: canvas frames, not `<video>`

The first version scrubbed a `<video>` by setting `currentTime`. It worked in desktop Chrome
(random seeks took a median of 15–18 ms) but seeking depends on each device's decoder: it is
notoriously rough on Safari/iOS and expensive on phones. It was replaced with the technique used
by scroll-cinematic sites that hold up everywhere:

| | |
|---|---|
| **Source** | A generated 8 s macro shot per orientation (16:9 and 9:16) |
| **Delivery** | 72 WebP frames per orientation — desktop 1280×720 ≈ 1.6 MB, mobile 720×1280 ≈ 0.4 MB |
| **Rendering** | Frames drawn on a `<canvas>` with `drawImage`, "cover" fit, DPR capped at 1.5 |
| **Smoothness** | Two neighbouring frames are alpha-blended, so the step between frames is invisible |
| **Loading** | Coarse-to-fine (frame 0, 16, 32… then the gaps) 6 at a time, so the very first scroll already has a nearby image |
| **Layout** | The hero is taller than the viewport and its content is `position: sticky` — not a GSAP pin, which fights smooth scroll and the mobile URL bar |
| **Orientation** | Portrait viewports use the vertical sequence; rotating the phone swaps sets |

### Two versions of the hero, decided before first paint

[`public/motion-mode.js`](../public/motion-mode.js) sets `data-motion-mode="on|off"` on `<html>`
before the first paint and CSS picks the background: the frame sequence (`on`) or a still image
designed for that slot (`off`, no frames downloaded). Priority: `?forcemotion` → the visitor's
choice (footer toggle, stored in `localStorage`) → data-saver / 2G → **on**.

- It is an external file, not an inline script, because the CSP is `script-src 'self'`.
- Motion is **on by default on every device**, including when the OS asks for reduced motion.
  That was a deliberate product decision (many Windows machines report the preference only
  because animation effects are switched off for performance), and it has an accessibility cost:
  a visitor who is sensitive to motion has to find the footer toggle. The cheap mitigation, if
  ever needed, is moving the toggle into the header or reinstating the OS check (one line).

## 5. Media pipeline

[`scripts/optimizar-media.mjs`](../scripts/optimizar-media.mjs) turns raw generated media into
what the site serves.

- Images → **AVIF + WebP + JPEG** per folder profile, served through `<picture>`; only sources
  that exist on disk are emitted, so there is never a `<source>` pointing at a missing file.
- **Aspect-ratio guard.** Every profile starts from a ratio the image generator offers
  (16:9, 4:3, 1:1, 3:4, 9:16). Output always has the profile's exact ratio (`fit: cover` crops but
  never distorts), the script warns when a source loses more than 8 % to cropping, and it never
  upscales.
- Output counts as up to date only if **all** its files exist; a run that dies halfway can't be
  mistaken for a finished one.
- Videos in `hero/` → the WebP frame sequence above, plus a poster from the first frame. Each
  sequence has a size budget (2.6 MB desktop, 1.6 MB mobile) and the encoder steps the WebP quality
  down (68 → 42) until it fits: floating dust or a smooth sky weighs far more than a plain
  background.
- Until a file exists, components render a procedural placeholder, so there are never broken
  boxes. Raw originals are not part of this repository.

### One hero component, six pages

`HeroFrame.astro` owns everything about the background (still image, poster, canvas, scrims and the
sticky layout); the home `Hero` and the interior `PageHero` only supply their content. The home
page scrolls through 170 % of the viewport, the section pages through 110 % (90 % on phones) because
there the reader wants to reach the content. `motion.ts` drives every `[data-hero]` on the page
independently.

## 6. Contact form

`POST /api/contacto` validates and sends an email through Resend's HTTP API. **Nothing is stored**:
the message lives in the destination inbox, so there is no database to leak.

| Defence | Against |
|---|---|
| Astro `checkOrigin` with `security.allowedDomains` | Cross-site form posts (CSRF) |
| Honeypot field, silent `200` | Bots (they are not told they were detected) |
| Minimum fill time (3 s), silent `200` | Scripted submissions |
| 5 requests / 15 min per IP, `429` | Flooding |
| Control characters stripped from every field | Email header injection |
| HTML-escaped body | Injection into the received email |
| `reply_to` = the visitor | Replying answers the sender directly |
| `503` when not configured | Never pretends to have sent a message |

## 7. Bugs that only exist in production

Audits before launch found failure modes that look fine in development and only break in
production. Each now has a guard.

1. **`import.meta.env` is inlined at build time.** In an SSR build Astro rewrites *any*
   `import.meta.env` in server code (even `.DEV`) into `Object.assign({…}, {every environment
   variable present at build time})`. On a host where service variables exist during the build,
   an API key would be written into `dist/` — and rotating it in the host's dashboard would have
   no effect until a rebuild, because the inlined value wins. Verified by building with a fake
   key and searching `dist/`. Server code now reads `process.env` at runtime
   (`runtimeEnv()` in [`contacto.ts`](../src/pages/api/contacto.ts)), and **CI fails** if a canary
   secret ever appears in the build output.
2. **Inline scripts are blocked by the CSP in production but not in `astro dev`.** A feature that
   depends on one appears to work locally and silently doesn't ship. Anything that must run before
   first paint is a synchronous external file in `public/`.

3. **The origin check rejected every real visitor behind the proxy.** The form posts multipart
   data, which Astro validates against the request URL. Behind Railway, TLS terminates at the
   proxy: the server sees `http://` while browsers send `Origin: https://…`, so each legitimate
   submission got a `403`. Invisible locally (no proxy). Fixed with `security.allowedDomains`
   (apex, `www`, `*.up.railway.app`, https only) and verified by replaying requests with proxy
   headers: real origins pass; a foreign origin or an `http://` downgrade still gets `403`.
4. **`npm ci` inside Railway's build command fails with `EBUSY`.** Nixpacks already installs and mounts
   `node_modules/.cache`; a second `npm ci` tries to delete it. The build command is only
   `npm run build`.

Also: a **pre-commit guard** ([`.githooks/`](../.githooks)) blocks commits that contain
secret-looking strings or a `.env`, tested against the real tree with no false positives.

## 8. SEO & GEO

- Unique `<title>` and description on every page, absolute canonicals, reciprocal
  `hreflang` (es / en / x-default), one `h1` per page, descriptive `alt` text.
- **JSON-LD**: `Organization`, `WebSite`, `Product` (thickness, weight and silica as
  `PropertyValue`), `FAQPage`, `BreadcrumbList`, `Person`, `ContactPage`.
- **Share cards**: one 1200×630 image per page and language (`npm run og`), composed with the
  real fonts and the section photo, under 300 kB each so WhatsApp accepts them. `Head.astro` picks
  the card from the route; `og:image:alt`, `twitter:image:alt`, type and `secure_url` are set, and
  `/og/` is served with a cross-origin resource policy so other origins can load it.
- Sitemap with i18n, generated `robots.txt`, and `noindex` on legal and service pages.
- **GEO** (generative-engine optimisation): `/llms.txt` generated from the same constants as the
  site so it cannot drift, figures kept as real text rather than inside images, and AI crawlers
  are allowed on purpose.
- No `LocalBusiness` schema yet: it would need a real address and phone, and structured data
  with invented values is worse than none.

## 9. Known limitations & roadmap

Honest list of what is *not* done:

- [ ] **No automated test suite.** Behaviour was verified with scripted headless-Chrome runs
      (motion on/off, mobile, forms, production server with the CSP). Next step: Playwright in CI.
- [ ] `style-src` still allows `'unsafe-inline'` (Astro injects component styles). Move to
      hashes with Astro's `security.csp`.
- [ ] The rate limiter is in memory. Fine for one instance; use Redis if the service scales out.
- [ ] One page per material and per application (each stone name has its own search volume).
- [ ] `LocalBusiness` schema once a real address exists.
- [ ] Analytics is absent on purpose. Adding any means reopening the CSP and rewriting the
      privacy pages.
