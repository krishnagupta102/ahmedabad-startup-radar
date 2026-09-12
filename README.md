# 📡 Ahmedabad Startup Radar

A live, interactive map of startup & tech job openings across Ahmedabad — search jobs, filter by experience/remote/date, and see every listing plotted on the city's real tech hubs (SG Highway, Sindhu Bhavan Road, Prahlad Nagar, Vastrapur, Navrangpura, GIFT City).

## Stack

- **React + Vite** — fast dev server, no server-side rendering needed
- **Tailwind CSS** — dark, glassmorphic "radar" theme
- **react-leaflet + Leaflet.markercluster** — the interactive map, with pin clustering
- **lucide-react** — icons
- **[Remotive](https://remotive.com/api/remote-jobs) + [Jobicy](https://jobicy.com/api/v2/remote-jobs)** — two free, public, **keyless** job board APIs, combined for a bigger live pool. No signup, no API key, no credit card for either.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:5173 — that's it. There is nothing to sign up for and no `.env` to fill in.

### Why Remotive + Jobicy instead of LinkedIn/Indeed/Naukri or a paid API

The original design called for JSearch (RapidAPI), which aggregates LinkedIn/Indeed/Google Jobs but requires an account signup. To keep this app truly zero-setup, live data instead comes from two public APIs that need no credentials at all: Remotive and Jobicy. Scraping LinkedIn, Indeed, or Naukri directly isn't a substitute for that — they don't offer a free public API, actively block scraping, and doing it anyway would violate their terms of service and get blocked by CORS from a browser regardless. (A third free option, Himalayas' API, has ~98k jobs but sends no CORS header at all, so browsers reject it outright — it would need a server-side proxy, which is out of scope for this no-backend app.)

The trade-off with Remotive/Jobicy: both are **remote-jobs** boards rather than an Ahmedabad-specific scraper, and each is a fairly small live pool on its own. [`src/api/jobs.js`](src/api/jobs.js) fetches both in parallel, keeps only postings whose location field is open to India/APAC/Worldwide applicants — i.e. roles an Ahmedabad-based developer could actually apply to — merges them, and hands the result to the same geo-mapping pipeline described below. Per both APIs' usage terms, the app fetches once per session (not per keystroke) and credits each source with a visible attribution link whenever Live Mode is active.

If both sources are ever unreachable, rate-limited, or return nothing eligible, the app automatically drops into **Demo Mode** with a curated dataset of real Ahmedabad companies (Quicko, Saleshandy, Crest Data Systems, Matter Motor, Simform, and more) — no crashes, no blank screens. You can also force Demo Mode any time via the **Live / Demo** toggle in the sidebar, and pull a fresh live batch with the refresh button next to it.

## How location mapping works

Job postings rarely include exact addresses, so [`src/utils/geoMapper.js`](src/utils/geoMapper.js) resolves a lat/lng in three steps:

1. **Curated company lookup** — well-known Ahmedabad startups are mapped directly to their known hub (e.g. Quicko → SG Highway).
2. **Keyword matching** — if the job's city field or description mentions a hub by name ("Prahlad Nagar", "SG Highway", "GIFT City", …), it's placed there.
3. **Deterministic scatter** — everything else is spread across Ahmedabad's bounding box using a seeded hash of the job ID, so the same job always lands on the same pixel instead of jumping around on every refresh.

A small jitter is always applied so multiple companies at the same hub render as distinct pins instead of stacking.

## Project structure

```
src/
  api/jobs.js               Remotive fetch + eligibility filter + fallback logic
  utils/geoMapper.js         company/city → lat-lng resolution
  utils/skills.js            keyword-based skill extraction from descriptions
  utils/html.js               strips/normalizes HTML job descriptions to plain text
  utils/time.js               relative time + salary formatting
  utils/storage.js            localStorage application tracker
  data/fallbackJobs.js       curated Demo Mode dataset
  components/
    MapCanvas.jsx             Leaflet map, clustering, custom pins, popups
    JobSidebar.jsx            search, filters, status banner, job list
    JobCard.jsx                individual job card
    FilterBar.jsx              search input + filter pills
    StatusBanner.jsx           live/demo connection status
    JobDetailDrawer.jsx        slide-out full job detail + apply + tracker
  App.jsx                     top-level state & layout
```

## Notes

- The "Save to tracker" feature stores applied jobs in `localStorage` only — nothing is sent to a server.
- The map's tile layer uses CARTO's free dark basemap; no API key required for tiles.
- Company logos are fetched from Clearbit's logo API and gracefully fall back to a generated initials badge if unavailable.
