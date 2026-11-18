# Strapi CMS Integration — Centers Data

## Overview

Centers data is now stored in Strapi CMS with 4 related collections:
- **region-centers** → **state-centers** → **district-centers** → **centers**

Strapi Base URL: `https://webapp.brahmakumaris.com/api`

---

## Current Flow (What you do today)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CURRENT FLOW                                │
│                                                                     │
│   External API                                                      │
│       │                                                             │
│       ▼                                                             │
│   Copy & Paste into Centers_Raw.json                                │
│       │                                                             │
│       ▼                                                             │
│   npm run strapi-sync          ◄── This is the NEW step             │
│       │                                                             │
│       ├── Compares raw file with Strapi DB                          │
│       ├── Creates NEW centers (+ region/state/district if needed)   │
│       ├── Updates CHANGED centers                                   │
│       └── Deletes REMOVED centers                                   │
│       │                                                             │
│       ▼                                                             │
│   Strapi CMS (Database)  ✓ Data is now synced                      │
│       │                                                             │
│       ▼                                                             │
│   npm run process-centers      ◄── Existing step (still works)     │
│       │                                                             │
│       ▼                                                             │
│   Center-Processed.json → Next.js Frontend                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Future Flow (When frontend reads from Strapi directly)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FUTURE FLOW                                 │
│                                                                     │
│   External API                                                      │
│       │                                                             │
│       ▼                                                             │
│   Auto-sync script (cron job / webhook)                             │
│       │                                                             │
│       ▼                                                             │
│   Strapi CMS (Database)                                             │
│       │                                                             │
│       ▼                                                             │
│   Next.js Frontend reads from Strapi REST API directly              │
│       │                                                             │
│       ├── GET /api/region-centers?populate=state_centers             │
│       ├── GET /api/state-centers?filters[region_center]=X           │
│       ├── GET /api/district-centers?filters[state_center]=X         │
│       ├── GET /api/centers?filters[district_center]=X               │
│       └── GET /api/centers?filters[is_retreat]=true                 │
│                                                                     │
│   No more JSON files needed!                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Quick Sync — two commands (recommended)

**PAD (Mount Abu HQ) is the master.** Strapi mirrors whatever PAD has, using the India/Nepal rules below.

```bash
npm run sync:check     # download India + Nepal from PAD, show NEW / UPDATED / DELETED — writes nothing
npm run sync:apply     # same check, asks once, applies India then Nepal, refreshes the website cache
```

That's it. `sync:apply` always shows the full plan first and changes nothing until you answer:
`[y]` apply all · `[s]` only new + updated (skip deletes) · `[n]` abort.

**One-time setup** — the PAD logins live in `.env` (git-ignored), not in this file:

```
PAD_INDIA_USER=...
PAD_INDIA_PASS=...
PAD_NEPAL_USER=...
PAD_NEPAL_PASS=...
```

**Useful options** (add after `--`):

| Command | What it does |
|---|---|
| `npm run sync:check -- --india` | Only India (or `--nepal`) |
| `npm run sync:check -- --no-fetch` | Re-check using the raw files already on disk |
| `npm run sync:apply -- --skip-deletes` | Apply only new + updated centers |
| `npm run sync:apply -- --yes` | No questions (cron/unattended). Refuses if India would delete more than 50 centers (`--max-deletes=N` to change) |
| `npm run sync:revalidate` | Refresh the live website cache again |
| `npm run sync:fetch` | Only download the PAD files (no Strapi access) |

**Safety built in:**

- A PAD download only replaces `Centers_Raw.json` / `Centers_Nepal_Raw.json` after validation — the response must be complete (`total` = rows), every row needs a `branch_code`, and it can't shrink more than 5% vs. the last download (`--force-fetch` if that's genuine). The previous file is backed up.
- The plan is always a dry run first. `--dry-run` never writes to Strapi (centers **and** orphan districts/states/regions are only listed).
- When run unattended (`--yes`), more than 50 India deletes stops the run. Run by hand, it warns and lets you decide.
- Every run is kept in `scripts/sync-history/<date>-check|apply/` (plan, applied report, full snapshot of every deleted center, raw-file backups).
- Always targets **webapp.brahmakumaris.com** (fast). Portal is the same database, so there's no separate portal sync.

After applying, commit `Centers_Raw.json` and `scripts/sync-report.json` to keep the data snapshot in git.

---

## How to Sync manually (Step by Step)

The two commands above do all of this for you. Kept for reference / debugging.

### Step 0a: Fetch latest **India** data from PAD API

```bash
npm run sync:fetch -- --india      # validated download into Centers_Raw.json
```

> India sync **excludes** region `NEPAL` (`EXCLUDED_REGIONS` in `scripts/strapi-sync.js`). Nepal is imported separately below.

### Step 0b: Fetch latest **Nepal** data (separate API)

```bash
npm run sync:fetch -- --nepal      # validated download into Centers_Nepal_Raw.json
```

### When you get new India data:

1. Fetch into `Centers_Raw.json` (Step 0a)
2. **Run sync**:
   ```bash
   npm run strapi-sync:dry
   npm run strapi-sync
   ```
3. The India sync will:
   - Detect **new** centers → create them in Strapi
   - Detect **changed** centers → update them in Strapi
   - Detect **removed** centers → delete them from Strapi
   - Create any new regions/states/districts if needed
   - Keep excluding Nepal rows that appear in the India API feed

### When you get new Nepal data:

1. Fetch into `Centers_Nepal_Raw.json` (Step 0b)
2. **Dry-run first** (never deletes; create/update only):
   ```bash
   npm run strapi-sync:nepal:dry
   ```
3. If the plan looks correct (~creates only, **0 deletes**):
   ```bash
   npm run strapi-sync:nepal
   ```

Nepal mode is **create/update only** — it never deletes India (or any) centers and skips orphan hierarchy cleanup.

India mode also **never deletes** centers with `country=Nepal`, and **ignores Nepal region/state/district entries during orphan cleanup**. Leftover PAD district/zone names (Kathmandu, Jhapa, Mechi, …) after the 7-province remap must not be offered for deletion on an India run.

**Nepal provinces:** PAD often stores districts/old zones as “state”. Nepal sync maps every center to one of the official 7 provinces (`Koshi`, `Madhesh`, `Bagmati`, `Gandaki`, `Lumbini`, `Karnali`, `Sudurpashchim`) via [`scripts/nepal-provinces.js`](scripts/nepal-provinces.js).

**Portal / webapp:** Both hostnames serve the same Strapi database (verified Nov 2026), so always sync via **webapp** — it's much faster. There's no need to sync or verify portal separately.

---

## Strapi Database Schema

### region-centers
| Field | Type |
|-------|------|
| name  | Text (Short) |
| → state_centers | Relation (has many state-centers) |

### state-centers
| Field | Type |
|-------|------|
| name  | Text (Short) |
| state_id | Text (Short) |
| → region_center | Relation (belongs to region-centers) |
| → district_centers | Relation (has many district-centers) |

### district-centers
| Field | Type |
|-------|------|
| name  | Text (Short) |
| district_id | Text (Short) |
| → state_center | Relation (belongs to state-centers) |
| → center_portal | Relation (has many centers) |

### centers
| Field | Type |
|-------|------|
| name | Text |
| branch_code | Text (Unique) |
| address_line1 | Text |
| address_line2 | Text |
| address_line3 | Text |
| city | Text |
| pincode | Text |
| email | Email |
| contact | Text |
| mobile | Text |
| country | Text |
| zone | Text |
| sub_zone | Text |
| section | Text |
| country_id | Text |
| latitude | Number (Decimal) |
| longitude | Number (Decimal) |
| is_retreat | Boolean |
| → district_center | Relation (belongs to district-centers) |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run sync:check` | **Start here** — download PAD India + Nepal and show the plan (read-only) |
| `npm run sync:apply` | Download, show plan, confirm once, apply India + Nepal, refresh website |
| `npm run strapi-sync` | **India** — Syncs Centers_Raw.json → Strapi (add/update/delete; excludes Nepal) |
| `npm run strapi-sync:dry` | India dry-run (no writes) |
| `npm run strapi-sync:nepal` | **Nepal** — Syncs Centers_Nepal_Raw.json → Strapi (create/update only; never deletes) |
| `npm run strapi-sync:nepal:dry` | Nepal dry-run (no writes) |
| `npm run strapi-migrate` | First-time bulk import (only use on empty Strapi) |
| `npm run strapi-cleanup` | Deletes ALL data from all 4 Strapi collections (use with caution!) |

---

## Data Counts (after initial migration)

| Collection | Count |
|-----------|-------|
| Regions | 3 |
| States | 37 |
| Districts | 657 |
| Centers | 5612 |
| Retreat Centers | 3 |

---

## Notes

- **Email field**: Strapi validates email format. If a center has multiple emails (comma/semicolon separated), only the first valid email is stored.
- **Capitalization**: Countries and region/state/district names are title-cased during sync. Center **titles**, **address lines**, and **city** are title-cased and then the letter after each `.` is uppercased (`I.S.R.O`, `J.P.Nagar`, `H.No`) so dotted initials from PAD stay intact.
- **Coordinates**: Stored as `latitude` (Decimal) and `longitude` (Decimal) — converted from the string array `coords` in raw data.
- **Retreat centers**: Identified by `branch_code` in the hardcoded list (`90001`, `90007`, `90006`). The `is_retreat` boolean flag is set automatically.
- **Madhuban sister concerns (HQ campuses)**: PAD lists Pandav Bhawan (`90001`), Gyan Sarovar (`90006`) and Shantivan (`90007`) under region `MADHUBAN SISTER CONCERNS`. The India sync maps that region to **India** automatically (`INDIA_REGION_ALIASES` in `scripts/strapi-sync.js`), so they stay under India → Rajasthan → Sirohi. This used to be a manual edit after every download — **no longer needed**. If PAD adds a new campus under that region, the sync prints a warning so you can add it to the retreat list.
- **Relations**: Each center is linked to its district, which is linked to its state, which is linked to its region. This chain enables efficient queries like "get all centers in Madhya Pradesh" without loading all 5612 centers.
