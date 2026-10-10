# Worklog — Survey Data Collector

---
Task ID: 1
Agent: main
Task: Build the Survey Data Collector PWA based on PRD.md / TASKS.md / TECH_SPEC.md, adapted to the existing Next.js 16 + TypeScript + Tailwind + shadcn/ui stack.

Work Log:
- Read PRD.md, TASKS.md, TECH_SPEC.md from /home/z/my-project/upload/.
- Installed `dexie` for client-side IndexedDB access.
- Created `src/lib/survey/` with: `types.ts`, `db.ts` (Dexie schema + CRUD + persist()), `location.ts` (Geolocation wrapper, never rejects, picks best fix), `csv.ts` (escaping, BOM, formula-injection guard for text only), `clipboard.ts` (Clipboard API + textarea fallback), `validation.ts`, `format.ts`.
- Created `src/components/survey/` with: `online-badge.tsx`, `theme-toggle.tsx`, `location-badge.tsx`, `entry-form.tsx`, `record-item.tsx` (with copy + delete + alert dialog), `record-list.tsx` (with export + clear + empty state), `app-shell.tsx` (responsive header + bottom tabs + two-column desktop layout).
- Created `src/components/theme-provider.tsx` (next-themes) and `src/hooks/use-online-status.ts`.
- Rewrote `src/app/layout.tsx` with ThemeProvider, Sonner toaster, PWA manifest link, theme-color, viewport-fit=cover.
- Rewrote `src/app/page.tsx` to render `<AppShell />`.
- Created `public/manifest.webmanifest` and SVG icons (192/512/maskable) in `public/icons/`.
- Ran `bun run lint` — clean.
- Verified end-to-end with agent-browser:
  - Desktop 1440px: page loads, both sections visible side-by-side, "Records 1" badge.
  - Mobile 390x844: bottom tab bar shown, single active tab, badge on Records tab.
  - Save flow: validated, GPS fetched, record written, form reset, toast "Saved - X • N households", auto switch to Records tab on mobile.
  - Copy name: toast "Name copied - <name>".
  - Export CSV: download triggered, toast "Exported - N records saved as CSV".
  - Delete: confirmation dialog → confirm → record removed, toast "Record deleted".
  - Empty state shown when list cleared.
  - Location denied banner shown when geolocation permission blocked (expected in headless test).
  - Household stepper +/- works.
  - Theme toggle works.
  - `dev.log` shows only 200 responses, no runtime errors.

Stage Summary:
- Single-route (`/`) Next.js 16 client-side PWA implementing all of FR-1 → FR-5b.
- Data stays on the device via IndexedDB (Dexie); no backend required.
- Files produced (key ones):
  - `src/lib/survey/{types,db,location,csv,clipboard,validation,format}.ts`
  - `src/components/survey/{online-badge,theme-toggle,location-badge,entry-form,record-item,record-list,app-shell}.tsx`
  - `src/components/theme-provider.tsx`
  - `src/hooks/use-online-status.ts`
  - `src/app/{layout,page}.tsx`
  - `public/manifest.webmanifest`, `public/icons/*.svg`
- Browser-verified: rendering, golden-path interactions (save/copy/export/delete), responsive (mobile bottom tabs vs desktop two-column), dark mode.

---
Task ID: 2
Agent: main
Task: Make the app deployable to GitHub Pages (static export + auto-deploy workflow).

Work Log:
- Read existing `next.config.ts` (was `output: "standalone"` for Docker/Caddy) and `Caddyfile` to preserve the local deployment path.
- Rewrote `next.config.ts` to be conditional: when `GITHUB_PAGES=true`, switch to `output: "export"`, apply `basePath` + `assetPrefix` from `NEXT_PUBLIC_BASE_PATH`, set `images.unoptimized: true`, and `trailingSlash: true`. Default (dev/local Docker) keeps `output: "standalone"`.
- Added `build:gh-pages` script in `package.json`: `GITHUB_PAGES=true next build`. Existing `build` (Docker) and `dev` scripts left untouched.
- Rewrote `public/manifest.webmanifest` with relative paths: `start_url: "./"`, `scope: "./"`, icon `src` values like `icons/icon-192.svg` so the manifest resolves correctly under any subpath (project pages and user/org pages).
- Added empty `public/.nojekyll` so GitHub Pages doesn't strip Next.js `_next/` asset directories.
- Created `.github/workflows/deploy.yml` — auto-deploys on push to main/master:
  - Checks out, sets up Bun, computes `NEXT_PUBLIC_BASE_PATH` (empty for `<owner>.github.io` repos, `/<repo>` for project repos).
  - Runs `bun install --frozen-lockfile` then `bun run build:gh-pages` with the env vars.
  - Touches `./out/.nojekyll`, uploads `./out` as the Pages artifact, then deploys via `actions/deploy-pages@v4`.
  - Permissions, environment, and concurrency block configured per GitHub's official pattern.
- Verified `bun run lint` still clean and dev server (port 3000) auto-restarted after the config change and continues to serve the app at HTTP 200.

Stage Summary:
- Same codebase now builds two ways:
  - Local/Docker: `bun run build` → standalone server (unchanged).
  - GitHub Pages: `bun run build:gh-pages` (or push to GitHub) → static export in `out/`.
- Files touched/added:
  - `next.config.ts` (conditional export + basePath)
  - `package.json` (new `build:gh-pages` script)
  - `public/manifest.webmanifest` (relative paths)
  - `public/.nojekyll` (new)
  - `.github/workflows/deploy.yml` (new)
- Browser-verified the dev server still serves the app correctly after the config change.
