# CMS.wa

A Church Management System built with [Astro](https://astro.build) and [Cloudflare Pages](https://pages.cloudflare.com/), backed by [Cloudflare D1](https://developers.cloudflare.com/d1/) and seeded from 2025–2026 Excel records.

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

- Astro 4 with server-side rendering
- `@astrojs/cloudflare` adapter
- Cloudflare D1 (SQLite at the edge)
- Wrangler for local preview and deploy
- `xlsx` for workbook ingestion
- TypeScript

## Development

```bash
npm install
npm run build    # build into dist/
npm run preview  # wrangler pages dev ./dist
```

> Note: `npm run dev` currently fails in this Windows environment because the bundled Workers runtime (miniflare/workerd) raises an access-violation. Use `npm run build` and `npx serve dist` for local static checks; D1 features can only run inside Wrangler/Cloudflare.

## Deploy

### 1. Create the D1 database

```bash
npx wrangler d1 create cmswa-db
```

Copy the `database_id` into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "cmswa-db"
database_id = "<your-database-id>"
```

Apply the schema and seed records:

```bash
npx wrangler d1 migrations apply cmswa-db --remote
npm run db:seed   # seeds D1 from src/data/records.json in batches
```

### 2. Set admin password

In the Cloudflare Pages dashboard, add a secret environment variable:

- `ADMIN_PASSWORD` — used to log in to `/admin`

Also bind the D1 database in the same project settings.

### 3. Build and deploy

#### Option A: GitHub Actions (recommended)

1. In the Cloudflare dashboard create a **Pages** project named `cmswa` and connect it.
2. Create a [Cloudflare API token](https://dash.cloudflare.com/profile/api-tokens) with permission `Cloudflare Pages:Edit`.
3. Add these GitHub repository secrets:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - (Optional) `CLOUDFLARE_PAGES_PROJECT` — defaults to `cmswa`.
4. Push to `main`; the workflow in `.github/workflows/deploy.yml` builds and deploys automatically.

#### Option B: Wrangler from this machine

```bash
npm run build
npx wrangler pages deploy ./dist --project-name=cmswa
```

## Custom domain

1. In the Cloudflare Pages dashboard, go to **Custom domains**.
2. Click **Set up a custom domain** and enter the domain you own.
3. If the domain is in the same Cloudflare account, Cloudflare will add the required DNS record automatically.
4. Otherwise, create a `CNAME` record pointing to `cmswa.pages.dev`.

## Admin / editing

- Log in at `/login` with the `ADMIN_PASSWORD`.
- `/admin` lists modules.
- Inside a module you can add new sheets, edit existing rows, or delete a sheet.
- All dashboard and module pages read from D1 and fall back to `src/data/records.json` when the database is not bound (e.g. local static builds).

## Ingest new Excel files

```bash
npm run ingest   # regenerates src/data/records.json
```

Then regenerate the seed SQL if you want D1 to match:

```bash
node scripts/generate-seed-sql.mjs
```
