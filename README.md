# CMS.wa

A Church Management System starter built with [Astro](https://astro.build) and the [Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/), seeded from 2025 and 2026 Excel records.

## Modules

- Tithers
- Leaders Tithe
- Income & Expenditure
- MoMo
- Fuel Records
- Building Expenses
- Bus Cell Meetings / ERF Data
- Data & Administration
- Members directory (deduped from records)

## Tech stack

- Astro 4 (hybrid rendering)
- @astrojs/cloudflare adapter
- Wrangler for Cloudflare Pages preview/deploy
- `xlsx` for workbook ingestion
- TypeScript (permissive mode)

## Development

```bash
npm install
npm run ingest   # regenerate src/data/records.json from attachments
npm run build    # static build into dist/
npm run preview  # wrangler pages dev ./dist
```

> Note: `npm run dev` currently fails in this Windows environment because the bundled Workers runtime (miniflare/workerd) raises an access-violation. The production build produces static HTML and can be served with any static file server.

## Deploy

### Option A: GitHub Actions (recommended)

1. In the Cloudflare dashboard create a **Pages** project named `cmswa` and connect it.
2. Create a [Cloudflare API token](https://dash.cloudflare.com/profile/api-tokens) with permission `Cloudflare Pages:Edit`.
3. Add these GitHub repository secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - (Optional) `CLOUDFLARE_PAGES_PROJECT` — defaults to `cmswa`.
4. Push to `main`; the workflow in `.github/workflows/deploy.yml` builds and deploys automatically.

### Option B: Wrangler from this machine

```bash
npm run build
npx wrangler pages deploy ./dist --project-name=cmswa
```

### D1 database

Uncomment the `[[d1_databases]]` block in `wrangler.toml` whenever you move from static JSON to a real SQL-backed API.
