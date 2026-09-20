# Security policy

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Use GitHub's private reporting instead: **Security → Report a vulnerability** on this
repository. Include what you found, how to reproduce it, and the impact you think it has.
You can expect an acknowledgement within a few days.

## Scope

This is a static marketing site with a single server-side endpoint (`POST /api/contacto`,
the contact form). The most relevant areas are:

- The HTTP security headers and Content Security Policy set in [`server.mjs`](server.mjs).
- The contact form endpoint in [`src/pages/api/contacto.ts`](src/pages/api/contacto.ts):
  input validation, origin check, rate limiting and the outbound email.
- Anything that could expose a secret (environment variables, build output, git history).

## How secrets are handled

- No secret is stored in this repository. API keys live only in the hosting platform's
  environment variables and are read from `process.env` **at runtime**, never at build time.
- Environment files of any kind (`.env`, `.env.*`, `*.env`, `.envrc`) are git-ignored and the
  pre-commit guard refuses to commit one. The variables are documented in the README instead.
- A pre-commit guard ([`.githooks/`](.githooks)) blocks commits that contain secret-looking
  strings, and CI fails if a secret can end up inlined into the build output.

If you believe a secret has been exposed, please report it privately as described above so
it can be rotated.
