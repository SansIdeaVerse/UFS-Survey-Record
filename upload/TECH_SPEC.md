# Technical Specification

Companion to `PRD.md`. Describes how to build the Survey Data Collector.

## 1. Recommended Stack

| Layer | Choice | Reason |
|---|---|---|
| App type | Progressive Web App (PWA) | One codebase for mobile and desktop, installable, works offline |
| Framework | Vanilla JS + Vite, or React + Vite | Small bundle, fast load. Pick whichever the team knows |
| Styling | Plain CSS with CSS variables (or Tailwind) | Responsive, dark mode support, no heavy dependency |
| Local database | IndexedDB via `Dexie` (or `idb`) | Reliable, large capacity, works offline |
| Offline shell | Service worker via `vite-plugin-pwa` (Workbox) | Precaches app assets |
| Location | Browser Geolocation API | No native code needed |
| CSV | Hand-written exporter (about 30 lines) | No dependency needed |
| Hosting | Any static HTTPS host | Geolocation and service workers need HTTPS |

No backend is required in v1.

## 2. Architecture

```
┌────────────────────────── Browser / Installed PWA ──────────────────────────┐
│                                                                             │
│  UI (Entry screen, Records screen)                                          │
│     │                                                                       │
│     ├── Location service  ──► navigator.geolocation                         │
│     ├── Storage service   ──► IndexedDB (Dexie)                             │
│     ├── Export service    ──► Blob + download link (CSV)                    │
│     └── Network badge     ──► navigator.onLine events                       │
│                                                                             │
│  Service Worker ──► Precache of HTML/CSS/JS/icons (offline app shell)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 3. Suggested Project Structure

```
survey-app/
├── index.html
├── vite.config.js
├── public/
│   ├── manifest.webmanifest
│   └── icons/ (192.png, 512.png, maskable.png)
├── src/
│   ├── main.js
│   ├── styles.css
│   ├── db.js              # Dexie schema and CRUD
│   ├── location.js        # Geolocation wrapper
│   ├── csv.js             # CSV builder and download
│   ├── clipboard.js       # Copy-to-clipboard helper
│   ├── ui/
│   │   ├── entryForm.js
│   │   ├── recordList.js
│   │   └── toast.js
│   └── utils.js
├── PRD.md
├── TECH_SPEC.md
└── TASKS.md
```

## 4. Data Layer (IndexedDB)

```js
// db.js
import Dexie from 'dexie';

export const db = new Dexie('survey-db');
db.version(1).stores({
  records: 'id, captured_at' // id = primary key, captured_at indexed for sorting
});

export async function addRecord(r) { return db.records.add(r); }
export async function listRecords() { return db.records.orderBy('captured_at').reverse().toArray(); }
export async function deleteRecord(id) { return db.records.delete(id); }
export async function clearAll() { return db.records.clear(); }
```

Record shape:

```json
{
  "id": "uuid-v4",
  "name": "string",
  "households": 1,
  "latitude": 22.5958,
  "longitude": 88.2636,
  "accuracy_m": 14,
  "location_status": "ok",
  "captured_at": "2026-10-09T18:30:00.000Z"
}
```

Use `crypto.randomUUID()` for ids.

On startup call `navigator.storage?.persist?.()` to request persistent storage.

## 5. Location Service

```js
// location.js
export function getLocation({ timeout = 10000 } = {}) {
  return new Promise(resolve => {
    if (!('geolocation' in navigator)) {
      return resolve({ status: 'unavailable' });
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({
        status: 'ok',
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy_m: Math.round(pos.coords.accuracy)
      }),
      err => resolve({
        status: err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable'
      }),
      { enableHighAccuracy: true, timeout, maximumAge: 30000 }
    );
  });
}
```

Behaviour:
- Call once when the entry screen mounts to warm up the GPS and show status.
- Call again on Save. If it returns no fix, fall back to the earlier fix if it is under 2 minutes old, otherwise save with the failure status.
- Never block saving on location failure.
- Use the Permissions API (`navigator.permissions.query({name:'geolocation'})`) where supported to show a friendly message when denied.

## 6. CSV Export

```js
// csv.js
const COLUMNS = ['id','name','households','latitude','longitude','accuracy_m','location_status','captured_at'];

function cell(v) {
  if (v === null || v === undefined) return '';
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;          // formula-injection guard
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function buildCsv(rows) {
  const lines = [COLUMNS.join(',')];
  for (const r of rows) lines.push(COLUMNS.map(c => cell(r[c])).join(','));
  return '\uFEFF' + lines.join('\r\n');              // BOM for Excel
}

export function downloadCsv(rows) {
  const blob = new Blob([buildCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  a.href = url;
  a.download = `survey-export-${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.csv`;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
```

Note: the formula guard must not apply to the numeric latitude/longitude columns (negative numbers start with `-`). Apply it only to text columns (`name`) or skip it for values whose type is `number`.

## 6b. Copy Name to Clipboard

Each row in the records list shows the name with an icon button beside it.

```js
// clipboard.js
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);   // needs HTTPS (secure context)
      return true;
    }
  } catch (_) { /* fall through to legacy method */ }

  // Fallback for older browsers or restricted contexts
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);          // iOS Safari
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (_) {
    return false;
  }
}
```

Usage in the record row:

```html
<div class="record-name">
  <span class="name-text">Asha Devi</span>
  <button type="button" class="icon-btn copy-btn" aria-label="Copy name" title="Copy name">
    <!-- copy icon (swapped for a check icon for about 1.5 s after success) -->
  </button>
</div>
```

```js
copyBtn.addEventListener('click', async () => {
  const ok = await copyText(record.name);          // copy the raw stored name
  if (ok) { showCheckIcon(copyBtn, 1500); toast('Name copied'); }
  else    { toast("Couldn't copy. Please select the text manually.", 'error'); }
});
```

Notes:
- Copy the raw stored `name`, not the CSV-escaped value.
- The click handler must run directly from a user gesture; do not copy from async timers.
- Buttons are at least 44x44 px, have `aria-label="Copy name"`, and show a visible focus ring.
- The name text should truncate with an ellipsis on narrow screens so the button never wraps off-screen.
- Optionally announce success to screen readers with an `aria-live="polite"` region (the toast can serve this role).

## 7. Offline and PWA Setup

- `vite-plugin-pwa` with `registerType: 'autoUpdate'` and Workbox precache of all built assets.
- `manifest.webmanifest`: name, short_name, `display: "standalone"`, `start_url: "/"`, theme and background colours, 192/512/maskable icons.
- Show a small "Update available" toast when a new service worker is waiting.
- Verify by loading the app once online, switching to airplane mode, and reloading.

## 8. UI and Responsive Design

- Mobile-first CSS; breakpoints at 640 px and 1024 px.
- Mobile: bottom tab bar (New Entry, Records), sticky Save button reachable by thumb.
- Desktop: centred container (max-width about 960 px); optional two-column layout (form left, list right).
- CSS variables for colours with `@media (prefers-color-scheme: dark)`.
- Inputs at least 16 px font size to avoid iOS zoom-on-focus; buttons at least 44 px tall.
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` and safe-area padding for notched phones.
- Household stepper: `-` and `+` buttons around a numeric input, min 1, max 999, default 1.

## 9. Validation Rules

| Field | Rule |
|---|---|
| name | `trim()`, length 1 to 100 |
| households | integer, 1 to 999; empty input is treated as invalid (not silently reset) |

## 10. Error Handling

| Failure | Handling |
|---|---|
| IndexedDB write fails (quota or private mode) | Toast with error, keep form data, suggest exporting and freeing space |
| Geolocation denied | Save with `denied`, show a one-time help banner |
| Geolocation timeout | Save with `timeout` or the recent cached fix |
| Download blocked | Fall back to opening the CSV in a new tab |
| Clipboard API unavailable or rejected | Use the textarea and `execCommand('copy')` fallback; if that fails show an error toast |

## 11. Testing Plan

**Unit tests (Vitest)**
- CSV builder: commas, quotes, newlines, unicode, formula-prefixed text, negative coordinates.
- Validation helpers.
- Location wrapper with a mocked `navigator.geolocation`.

**Manual and device tests**
- Android Chrome and iOS Safari: install to home screen, airplane-mode reload, add records offline, export.
- Location: allow, deny, and revoke permission cases.
- Desktop Chrome, Firefox, Edge: layout at several widths.
- Large dataset: seed 10,000 records and check list and export performance (consider list virtualisation or pagination if slow).
- Copy button: copy a name, paste elsewhere and confirm it matches exactly (including unicode, emoji and long names); test on Android Chrome, iOS Safari and desktop; test while offline.

**Quality gates**
- Lighthouse PWA, performance and accessibility scores of 90 or above.

## 12. Deployment

1. `npm run build` produces a static `dist/` folder.
2. Deploy to Netlify, Vercel, Cloudflare Pages or GitHub Pages (all provide HTTPS).
3. Surveyors open the URL once while online, then use Add to Home Screen.

## 13. Security and Privacy Notes

- No data leaves the device; no analytics or third-party scripts.
- Location is collected only to attach to a saved record and only after the user grants permission.
- Add a short in-app privacy note explaining what is stored and that it can be deleted at any time.
- Surveyors should obtain consent from respondents per the survey's ethics requirements.
