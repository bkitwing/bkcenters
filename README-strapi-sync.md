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

### When you get new data from the external API:

1. **Paste** the new JSON response into `Centers_Raw.json` (overwrite the file)
2. **Run sync**:
   ```bash
   npm run strapi-sync
   npm run strapi-sync:dry
   ```
3. The script will automatically:
   - Detect **new** centers → create them in Strapi
   - Detect **changed** centers → update them in Strapi
   - Detect **removed** centers → delete them from Strapi
   - Create any new regions/states/districts if needed

### That's it! One command does everything.

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
| `npm run strapi-sync` | **Main command** — Syncs Centers_Raw.json → Strapi (handles add/update/delete) |
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
- **Capitalization**: Names, addresses, countries etc. are automatically title-cased during sync.
- **Coordinates**: Stored as `latitude` (Decimal) and `longitude` (Decimal) — converted from the string array `coords` in raw data.
- **Retreat centers**: Identified by `branch_code` in the hardcoded list (`90001`, `90007`, `90006`). The `is_retreat` boolean flag is set automatically.
- **Relations**: Each center is linked to its district, which is linked to its state, which is linked to its region. This chain enables efficient queries like "get all centers in Madhya Pradesh" without loading all 5612 centers.
