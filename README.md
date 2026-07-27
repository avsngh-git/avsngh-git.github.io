# Avinash Singh’s portfolio

A React and TypeScript portfolio built with Vite and published at
<https://avsngh-git.github.io/>.

The visual foundation is adapted from Yuji Sato’s
[React Portfolio Template](https://github.com/yujisatojr/react-portfolio-template)
at upstream commit `77536ad1d28c2a5bae79e68910eeb35866131451`. The application
is maintained independently; third-party provenance is recorded in
[`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md).

## Site structure

- `/` — template-style portfolio with About, Expertise, Career History, Projects,
  and Contact sections.
- `/projects/transformer-variants/` — the complete five-part Transformer Variants
  research case study on one long-form route.
- Former Jekyll routes remain as static redirects to the equivalent homepage or
  case-study anchor.

Legacy route definitions live in `redirects.json`; `npm run build` regenerates the
small static redirect pages before Vite assembles the production site.

The case-study prose lives under `src/content/transformer-variants/`. Frozen data,
attention payloads, the local Plotly runtime, figures, and the résumé live under
`public/assets/`. The heavy interactive runtime loads only on the case-study route.

## Local development

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

The development server prints its local URL.

## Verification

```sh
npm run lint
npm test
npm run build
npm run test:e2e
```

`npm run test:e2e` requires a Playwright Chromium installation:

```sh
npx playwright install chromium
```

Unit and component tests cover portfolio content, route contracts, theme behavior,
and the frozen-data transforms used by the browser runtime. Playwright checks the
production homepage, mobile navigation, lazy asset boundary, every case-study control,
and legacy redirects.

## Deployment

Pushes to `main` run the complete check, build, and browser-test pipeline in GitHub
Actions. The workflow uploads `dist/` as the GitHub Pages artifact and deploys it to
the `github-pages` environment. Compiled output is not committed.

In repository **Settings → Pages**, the publishing source must be set to
**GitHub Actions** before the first React deployment.
