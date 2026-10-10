# Build Task List

Check items off as you go. Phases are ordered so the app is usable after Phase 3.

## Phase 0: Setup
- [ ] Create the project with Vite (vanilla JS or React)
- [ ] Add dependencies: `dexie`, `vite-plugin-pwa`, `vitest` (dev)
- [ ] Set up base HTML, viewport meta tag, global CSS variables and dark mode
- [ ] Create app icons (192, 512, maskable) and `manifest.webmanifest`

## Phase 1: Data and Core Services
- [ ] `db.js`: Dexie schema, add / list / delete / clear functions
- [ ] Request persistent storage on startup
- [ ] `location.js`: Geolocation wrapper with status codes and timeout
- [ ] `csv.js`: CSV builder with escaping, BOM and download
- [ ] `clipboard.js`: copy helper with Clipboard API and textarea fallback
- [ ] Unit tests for CSV and validation

## Phase 2: UI
- [ ] App layout: bottom tabs on mobile, top nav on desktop
- [ ] Entry form: name input, household stepper (default 1), validation messages
- [ ] Location status indicator on the entry screen
- [ ] Save flow: validate, fetch location, write record, reset form, show toast
- [ ] Records screen: list newest first, count, empty state
- [ ] Delete single record with confirmation
- [ ] Copy icon button beside each name (checkmark feedback, "Name copied" toast, error toast on failure)
- [ ] Export CSV button and "Clear all data" with confirmation
- [ ] Online / offline badge

## Phase 3: Offline and PWA
- [ ] Configure service worker precaching
- [ ] Verify the app loads and works in airplane mode
- [ ] Verify install to home screen on Android and iOS
- [ ] "Update available" toast

## Phase 4: Polish and QA
- [ ] Accessibility pass (labels, focus order, contrast)
- [ ] Responsive checks at 320, 375, 768, 1024, 1440 px
- [ ] Test location allowed, denied and timeout cases
- [ ] Test copy button on Android, iOS and desktop, online and offline
- [ ] Performance test with 10,000 seeded records
- [ ] Open exported CSV in Excel and Google Sheets
- [ ] Lighthouse audit (target 90 or above)

## Phase 5: Release
- [ ] Production build and deploy to an HTTPS static host
- [ ] Write a one-page surveyor guide: install, allow location, export regularly
- [ ] Pilot with a small group, collect feedback, fix issues
