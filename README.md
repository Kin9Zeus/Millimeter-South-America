<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/brand/logo-blanco.svg">
  <img src="public/brand/logo-negro.svg" alt="MILLIMETER by Casanova" width="340">
</picture>

<br><br>

### Natural stone, one millimetre thick — told through scroll.

Bilingual, motion-driven marketing site for the **South America** representation of
MILLIMETER by Casanova. Designed, built, secured and deployed end to end.

[**Español**](README.es.md) &nbsp;·&nbsp; [Architecture notes](docs/ARCHITECTURE.md) &nbsp;·&nbsp; [Security](SECURITY.md)

<br>

[![CI](https://github.com/Kin9Zeus/Millimeter-South-America/actions/workflows/ci.yml/badge.svg)](https://github.com/Kin9Zeus/Millimeter-South-America/actions/workflows/ci.yml)
![Astro](https://img.shields.io/badge/Astro-7-BC52EE?style=flat-square&logo=astro&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-ScrollTrigger-88CE02?style=flat-square&logo=greensock&logoColor=white)
![Node](https://img.shields.io/badge/Node-%E2%89%A522.12-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=flat-square&logo=express&logoColor=white)
![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?style=flat-square&logo=railway&logoColor=white)
![Vulnerabilities](https://img.shields.io/badge/npm_audit-0_vulnerabilities-2ea44f?style=flat-square)

<br>

<img src="docs/screenshots/hero.jpg" alt="Home page hero: the headline over a one-millimetre-thick marble sheet" width="100%">

</div>

<br>

## Overview

MILLIMETER makes natural stone — marble, quartzite, travertine — only **1 to 5 mm thick**. That
lets stone curve, hang on a ceiling or wrap a column, things stone has never been able to do.
This site introduces the product to architects, designers and contractors across South America.

The brief was to look like a luxury architecture studio, not a catalogue, and to *show* the
product's one claim — thinness — rather than describe it. Everything below follows from that.

## Highlights

<table>
<tr>
<td width="50%" valign="top">

**A hero that demonstrates the product**<br>
A dimension line closes from 20 mm to 1 mm as you scroll while a macro shot of the stone edge
plays through **72 frames on a `<canvas>`**, on desktop *and* phones. Two versions are chosen
before first paint: the animated one, or a still image designed for that slot. Visitors can
switch in the footer.

</td>
<td width="50%" valign="top">

**Design system with one idea**<br>
*The brand name is a unit of measure.* A technical-drawing motif — the dimension line — runs
through every section. Obsidian and travertine surfaces, one copper accent, three self-hosted
fonts. Light sections invert the theme and the header adapts to what is behind it.

</td>
</tr>
<tr>
<td valign="top">

**Bilingual, done properly**<br>
Spanish at the root, English under `/en` with **English route names**. One route map drives both
`hreflang` and the language switcher, which lands on the *equivalent* page, never the home page.

</td>
<td valign="top">

**SEO and GEO**<br>
JSON-LD for Organization, Product, FAQ, Breadcrumbs, Person and Contact; i18n sitemap; generated
`robots.txt`; and an **`/llms.txt`** built from the same constants as the site so generative
engines cite the real figures.

</td>
</tr>
<tr>
<td valign="top">

**Secure by default**<br>
Strict CSP (`default-src 'none'`), HSTS preload, cross-origin isolation, one canonical URL per
page. The contact form has origin checks, honeypot, timing, rate limiting and header-injection
protection — and **stores nothing**.

</td>
<td valign="top">

**Fast where it counts**<br>
Static HTML, no third-party requests, self-hosted fonts, AVIF/WebP/JPEG through `<picture>`,
immutable caching, and a motion bundle that loads asynchronously. See the numbers below.

</td>
</tr>
</table>

## Screenshots

<table>
<tr>
<td width="50%"><img src="docs/screenshots/hero-scroll.jpg" alt="Hero mid-scroll: the sheet approaching the camera"></td>
<td width="50%"><img src="docs/screenshots/hero-end.jpg" alt="Hero end of scroll: the stone edge fills the frame"></td>
</tr>
<tr>
<td colspan="2" align="center"><sub><b>The scroll sequence</b> — the headline and dimension line retire as the stone edge fills the frame.</sub></td>
</tr>
<tr>
<td width="50%"><img src="docs/screenshots/materials.jpg" alt="Materials gallery"></td>
<td width="50%"><img src="docs/screenshots/applications.jpg" alt="Applications page"></td>
</tr>
<tr>
<td colspan="2" align="center"><sub><b>Materials gallery</b> (12 stones, 3:4) and <b>applications</b> (8 uses, 4:3).</sub></td>
</tr>
</table>

<div align="center">
<img src="docs/screenshots/weights.jpg" alt="Weight comparison: 63–73 kg/m² for 2 cm stone versus under 5 kg/m² at 1 mm" width="78%">
<br><sub><b>The argument as a chart</b> — bars grow in sequence, traditional stone first.</sub>
<br><br>
<img src="docs/screenshots/mobile.jpg" alt="Mobile hero at three scroll positions" width="78%">
<br><sub><b>Mobile</b> — its own vertical shot, same scroll experience on a phone.</sub>
</div>

## By the numbers

Measured on this build, first load of the home page, gzip.

| | |
|---|---|
| **22** | static pages, in two languages |
| **12.5 kB** &nbsp;·&nbsp; **9.1 kB** &nbsp;·&nbsp; **3.7 kB** | HTML &nbsp;·&nbsp; CSS &nbsp;·&nbsp; JS on first load |
| **≈ 49 kB** | animation bundle (GSAP, ScrollTrigger, Lenis), loaded asynchronously |
| **55 kB** | three self-hosted fonts |
| **72 frames** | hero sequence — **1.6 MB** desktop, **0.4 MB** mobile, loaded coarse-to-fine |
| **0** | third-party requests (enforced by the CSP) · known vulnerabilities (`npm audit`) |

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro 7**, static output | Content site: HTML first, JavaScript only where it earns its place |
| Server | **Express 5** + `helmet`, via the Astro Node adapter in `middleware` mode | Headers, CSP and redirects that a static host can't express |
| Styling | **Tailwind CSS 4** (`@theme` tokens) + component CSS | Design tokens as the source of truth |
| Motion | **GSAP** + ScrollTrigger, **Lenis** on fine pointers | Scroll-linked animation with a controlled loading cost |
| Media | **sharp**, **ffmpeg** | AVIF/WebP/JPEG per profile; video → WebP frame sequences |
| Email | **Resend** HTTP API | Contact form without a database |
| Hosting | **Railway** (GitHub → Nixpacks) | `railway.json` defines build, start and health check |

## Getting started

Requires **Node ≥ 22.12**.

```bash
git clone https://github.com/Kin9Zeus/Millimeter-South-America.git
cd Millimeter-South-America
npm ci
npm run dev            # http://localhost:4321
```

```bash
npm run build          # production build
npm start              # production server (security headers, redirects, contact endpoint)
```

The site runs without any configuration. Without the variables below the contact form answers
`503` and the page shows the direct email instead — it never pretends a message was sent.

<details>
<summary><b>Environment variables</b></summary>

<br>

Copy [`.env.example`](.env.example) to `.env` for local development. In production they are set
in the host's dashboard, **never committed**.

| Variable | Purpose |
|---|---|
| `SITE_URL` | Public URL, no trailing slash. Feeds canonicals, `hreflang`, sitemap, `robots.txt`, Open Graph and `llms.txt` |
| `RESEND_API_KEY` | Resend API key (a *sending-only* key restricted to the sender domain is enough) |
| `CONTACT_FROM` | Sender on a domain verified in Resend, e.g. `Name <web@your-domain.com>` |
| `CONTACT_TO` | Inbox that receives the enquiries |
| `NODE_ENV` | `production` enables HSTS and `upgrade-insecure-requests` |

</details>

<details>
<summary><b>Scripts</b></summary>

<br>

| Script | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Static build + server bundle |
| `npm start` | Production server (`server.mjs`) |
| `npm run media` | Optimises `media-fuente/` → `public/media/` (*the raw sources are not in this repo*) |
| `npm run iconos` | Regenerates favicons and the fallback Open Graph image |
| `npm run fuentes` | Copies the self-hosted font files |
| `npm run logo` | Re-vectorises the logo (needs `potrace`, installed with `--no-save`) |

</details>

## Project structure

```text
.
├── server.mjs                 Express server: CSP, HSTS, redirects, caching, 404s
├── railway.json               Build / start / health check
├── public/
│   ├── media/                 Optimised images and hero frame sequences
│   └── motion-mode.js         Decides animated vs still hero before first paint
├── scripts/
│   └── optimizar-media.mjs    Media pipeline (AVIF/WebP/JPEG, frames, ratio guard)
├── src/
│   ├── pages/                 ES at the root, EN under /en, llms.txt, robots.txt, /api/contacto
│   ├── components/            Hero, DimensionLine, WeightCompare, StoneSwatch, ContactForm…
│   ├── layouts/Base.astro     Document shell
│   ├── scripts/               chrome.ts (UI state) and motion.ts (GSAP orchestration)
│   ├── i18n/ui.ts             Interface strings
│   ├── styles/global.css      Design tokens and global styles
│   └── consts.ts              Site data and the ES↔EN route map
├── docs/                      Architecture notes and screenshots
└── .githooks/                 Pre-commit guard against committing secrets
```

## Deployment

Built to deploy from GitHub to [Railway](https://railway.app) using [`railway.json`](railway.json)
(`npm ci && npm run build`, then `node server.mjs`, health check on `/`). Create the service from
this repository, set the variables above, and attach the custom domain.

## Engineering notes

The [architecture notes](docs/ARCHITECTURE.md) explain each decision and its trade-off. Two
things worth reading before launch-day bugs find you:

- **Astro inlines `import.meta.env` into the build.** In an SSR build it rewrites *any*
  occurrence in server code into a literal containing every environment variable present at
  build time — on a host that exposes service variables during the build, an API key ends up
  written inside `dist/`, and rotating it does nothing until a rebuild. Found by building with a
  fake key and searching the output. Secrets are now read from `process.env` at runtime, and CI
  fails if a canary secret ever appears in the build.
- **Inline scripts are blocked by the CSP in production but not in `astro dev`.** Anything that
  must run before first paint is a synchronous external file.

## Roadmap

- [ ] Automated tests (Playwright) in CI — behaviour is currently verified with scripted browser runs
- [ ] Hash-based `style-src` instead of `'unsafe-inline'`
- [ ] One page per material and per application
- [ ] Redis-backed rate limiter if the service ever scales beyond one instance

## License & brand notice

**All rights reserved** — the source is published for viewing and evaluation as a portfolio piece;
see [LICENSE](LICENSE). The MILLIMETER and Casanova names, logotypes, texts and imagery belong to
**MILLIMETER Global LLC** and are shown only to demonstrate the work; they may not be reused.

<br>

<div align="center">

Built by [**Kin9Zeus**](https://github.com/Kin9Zeus)

</div>
