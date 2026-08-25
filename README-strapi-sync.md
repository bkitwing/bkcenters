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

## How to Sync (Step by Step)

### Step 0a: Fetch latest **India** data from PAD API

```bash
curl -s -u "bkpad_bkc:merababa" \
  "https://padds.bkivv.app/pad-data-services/locations/c/India" \
  -o Centers_Raw.json
```

> India sync **excludes** region `NEPAL` (`EXCLUDED_REGIONS` in `scripts/strapi-sync.js`). Nepal is imported separately below.

### Step 0b: Fetch latest **Nepal** data (separate API)

Use env vars so credentials are not committed:

```bash
# Optional: put these in .env.local (never commit)
# PAD_NEPAL_USER=bkpadbkc_nepal
# PAD_NEPAL_PASS=...

curl -s -u "${PAD_NEPAL_USER}:${PAD_NEPAL_PASS}" \
  "https://padds.bkivv.app/pad-data-services/locations/c/Nepal" \
  -o Centers_Nepal_Raw.json
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

India mode also **never deletes** centers with `country=Nepal`, so a later India sync cannot wipe Nepal imports.

**Nepal state spelling aliases** (conservative only): `Dhanusa→Dhanusha`, `MECHI→Mechi`, `Makawanpur→Makwanpur`. Trailing spaces are trimmed. No fuzzy merges.

**Portal / webapp:** After importing to webapp, verify portal with:

```bash
STRAPI_BASE_URL=https://portal.brahmakumaris.com/api npm run strapi-sync:nepal:dry
```

If create count is already `0`, portal already has Nepal (shared or mirrored data) — no second write needed. Only run `strapi-sync:nepal --yes` against portal when dry-run shows creates.

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
- **Relations**: Each center is linked to its district, which is linked to its state, which is linked to its region. This chain enables efficient queries like "get all centers in Madhya Pradesh" without loading all 5612 centers.
