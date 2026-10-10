# Product Requirements Document (PRD)

## Survey Data Collector (working title)

| Field | Value |
|---|---|
| Version | 0.1 (Draft) |
| Date | 2026-10-09 |
| Status | Ready for development |
| Platforms | Mobile browsers (primary), desktop browsers (secondary), installable as PWA |

---

## 1. Overview

Survey Data Collector is a lightweight, offline-first web app that field surveyors use to record household survey entries quickly. Each entry stores a respondent's name, the number of people in their household, and the GPS location where the entry was captured. Data is stored on the device, works with no internet connection, and can be exported as a CSV file.

## 2. Problem Statement

Field surveys often happen in areas with weak or no connectivity. Paper forms are slow to digitise and error-prone, and cloud-only apps fail when the network drops. Surveyors need a simple tool that:

- Never loses data when offline.
- Records where each entry was taken without extra effort.
- Produces a file that can go straight into Excel, Google Sheets or analysis tools.

## 3. Goals and Non-Goals

### Goals
- Fast data entry: a record can be saved in under 10 seconds.
- Fully functional offline after the first load.
- Automatic location capture on every record.
- Responsive, clean UI on phones and desktop browsers.
- One-tap CSV export of all stored data.

### Non-Goals (v1)
- User accounts or login.
- Cloud sync or a backend server.
- Multi-survey or custom form builder.
- Maps, charts or analytics dashboards.
- Photo or file attachments.

## 4. Target Users

| Persona | Description | Needs |
|---|---|---|
| Field surveyor | Collects data door to door on a mobile phone, often with poor network | Fast, simple, never loses data |
| Survey coordinator | Collects exported files from surveyors, reviews on a laptop | Clean CSV, usable in browser |

## 5. User Stories

1. As a surveyor, I can enter a respondent's name and household count so that I record each survey visit.
2. As a surveyor, I can leave household count untouched and it defaults to 1, so entry is faster for single-person households.
3. As a surveyor, my phone's location is captured automatically when I save, so I do not type addresses or coordinates.
4. As a surveyor, I can keep using the app with no internet so that I can work in remote areas.
5. As a surveyor, I can see the list of records I have saved so that I can confirm my work.
6. As a coordinator, I can export all records as a CSV file so that I can analyse them in a spreadsheet.
7. As a user, I can use the app comfortably on both my phone and a desktop browser.
8. As a surveyor, I can tap a copy button beside a name so that I can paste it elsewhere (a message, another app or a spreadsheet) without retyping.

## 6. Functional Requirements

### FR-1: Data Entry Form

| Field | Type | Required | Default | Validation |
|---|---|---|---|---|
| Name | Text | Yes | empty | Trimmed, 1 to 100 characters |
| Number of households | Integer | Yes | 1 | Whole number, minimum 1, maximum 999 |

- The "Save" button is disabled until the form is valid.
- Inline error messages appear beside invalid fields.
- After a successful save the form resets (name cleared, household count back to 1) and a short confirmation is shown.
- The household field uses a numeric keypad on mobile (`inputmode="numeric"`) and offers +/- stepper buttons.

### FR-2: Automatic Location Capture

- The app requests location permission on first use, with a short explanation of why it is needed.
- Location is fetched automatically when the form opens and refreshed when the user taps Save, so each record gets the freshest fix available.
- Each record stores: latitude, longitude, accuracy (metres) and location timestamp.
- A visible status indicator shows the state: "Getting location", "Location ready (±12 m)", "Location unavailable".
- If permission is denied or no fix can be obtained, the user can still save. The record is flagged with an empty location and a `location_status` value (for example `denied`, `unavailable`, `timeout`).
- The user is shown how to re-enable permission if it was denied.

### FR-3: Offline Storage (Cache)

- All records are stored locally on the device in IndexedDB, so they survive page reloads, browser restarts and loss of connectivity.
- The app shell (HTML, CSS, JS, icons) is cached by a service worker so the app opens with no network after the first visit.
- The app is installable as a PWA ("Add to Home Screen").
- The app never requires a network connection to create, view or export records.
- The UI shows an online/offline badge for reassurance only; it does not block any action.

### FR-4: Record List

- Shows saved records newest first: name, household count, time saved, and a location indicator.
- Shows a total record count.
- Each record has a **Copy** icon button right beside the name. Tapping it copies that name to the device clipboard.
  - After copying, the icon briefly changes to a checkmark (about 1.5 s) and a short "Name copied" toast appears.
  - The copied text is exactly the stored name, with no extra characters or formatting.
  - Works offline (clipboard access is local to the device).
  - If the clipboard is unavailable or blocked, a fallback copy method is tried first; if that fails, an error toast says "Couldn't copy. Please select the text manually."
  - The button is at least 44x44 px on mobile, has an accessible label ("Copy name"), and is keyboard operable.
- Supports deleting a single record, with a confirmation prompt. (Editing is out of scope for v1.)
- An empty state is shown when there are no records.

### FR-5: CSV Export

- An "Export CSV" button downloads all records as a `.csv` file.
- File name format: `survey-export-YYYY-MM-DD-HHmm.csv`.
- Columns: `id, name, households, latitude, longitude, accuracy_m, location_status, captured_at`.
- Encoding is UTF-8 with BOM so Excel opens non-English names correctly.
- Values are correctly escaped (commas, quotes, line breaks). Cells starting with `=`, `+`, `-` or `@` are prefixed with a single quote to prevent spreadsheet formula injection.
- Timestamps use ISO 8601 format.
- Export works fully offline.
- If there are no records, the button is disabled or shows a "Nothing to export" message.

### FR-5b: Data Safety

- A "Clear all data" action exists, protected by a confirmation that recommends exporting first.
- The app requests persistent storage (`navigator.storage.persist()`) so the browser is less likely to evict data.

## 7. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Responsiveness | Works from 320 px wide phones to large desktop screens. Mobile-first layout. |
| Usability | Touch targets at least 44x44 px. Single-handed use on a phone. |
| Performance | First load under 3 s on a 3G connection. Subsequent loads near-instant from cache. Save completes in under 200 ms (excluding GPS wait). |
| Reliability | No data loss on app close, crash or offline use. Writes are atomic. |
| Capacity | Handles at least 10,000 records without noticeable slowdown. |
| Accessibility | Labelled inputs, sufficient colour contrast (WCAG AA), keyboard operable. |
| Privacy | All data stays on the device. No analytics or third-party calls. |
| Compatibility | Latest two versions of Chrome, Safari (iOS 15+), Firefox and Edge. |
| Security | Served over HTTPS (required for geolocation and service workers). |

## 8. UX Guidelines

- Clean, modern look with a single accent colour, rounded cards and generous spacing.
- Two main screens: **New Entry** and **Records**, switched by a bottom tab bar on mobile and a top navigation on desktop.
- On desktop, content is centred in a max-width container (about 640 px) or split view with the form on the left and the list on the right.
- Light and dark mode following the system setting.
- Clear feedback: toast messages for saved, exported and error states.

## 9. Data Model

```
Record
  id               string (UUID v4)
  name             string
  households       integer (>= 1, default 1)
  latitude         number | null
  longitude        number | null
  accuracy_m       number | null
  location_status  "ok" | "denied" | "unavailable" | "timeout"
  captured_at      string (ISO 8601, device time)
```

## 10. Edge Cases

| Case | Expected behaviour |
|---|---|
| Location permission denied | Save still works; record flagged `denied`; help text shown |
| GPS slow or indoors | Timeout after about 10 s, save with best available or flagged `timeout` |
| Browser storage full | Clear error message and a prompt to export immediately |
| Duplicate names | Allowed (different households can share a name) |
| Clipboard blocked or unsupported | Fallback copy method is attempted; otherwise an error toast is shown and the app keeps working |
| Very long names or emoji | Accepted up to the limit, exported correctly |
| User clears browser data | Local data is lost; the app warns about this and encourages regular export |
| App opened while offline for the first time ever | Cannot load; the first visit needs a connection to install the cache |

## 11. Success Metrics

- 100% of saved records persist after going offline and reloading.
- At least 95% of records captured outdoors have location data.
- Median time to save an entry is under 10 seconds.
- CSV opens correctly in Excel and Google Sheets with no manual fixing.

## 12. Assumptions and Risks

| Item | Notes | Mitigation |
|---|---|---|
| Data is stored only in the browser | Clearing site data or losing the phone loses records | Prominent export reminders; optional backup reminder after N records |
| iOS Safari can evict storage after a period of inactivity | Possible data loss on iPhones | Request persistent storage, encourage PWA install, export regularly |
| Location accuracy varies | Poor fixes indoors | Store accuracy value so poor fixes can be filtered later |
| HTTPS hosting required | Geolocation is blocked on plain HTTP | Host on any static HTTPS host (Netlify, Vercel, GitHub Pages) |

## 13. Future Enhancements (Post v1)

- Optional cloud sync when a connection is available.
- Additional survey fields and configurable forms.
- Edit records, search and filter.
- Map view of captured points.
- Export as JSON / XLSX and share via the native share sheet.
- Multi-surveyor identification.

## 14. Release Criteria (v1)

- All functional requirements FR-1 to FR-5b implemented.
- Manual test pass on an Android phone, an iPhone and a desktop browser, including airplane-mode testing.
- Lighthouse PWA and accessibility scores of 90 or above.
