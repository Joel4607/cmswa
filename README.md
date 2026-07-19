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

1. Bind a Cloudflare D1 database in `wrangler.toml` whenever you move from static JSON to SQL.
2. Run `npm run deploy` to push `dist/` to Cloudflare Pages.
