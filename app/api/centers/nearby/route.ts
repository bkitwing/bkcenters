import { NextResponse } from "next/server";
import { Center } from "@/lib/types";
import { loadCentersForNearby, loadCentersNearbyBBox } from "@/lib/strapiClient";
import { distanceKm, getNearbyIndex } from "@/lib/nearbyIndex";

export const dynamic = "force-dynamic";

/**
 * Server-side nearby center search.
 *
 * FAST PATH: in-memory index of all centers (lib/nearbyIndex.ts) — a few ms per
 * lookup, and an exact count of centers within the radius.
 *
 * COLD START: while the index is loading (first request after a restart), uses
 * the Strapi bounding-box query, then the full scan if that fails.
 *
 * Query params:
 *   lat, lng — user coordinates (required)
 *   radius   — max radius in km (alias: maxDistance; default 150)
 *   offset   — results to skip, for "show more" paging (default 0)
 *   limit    — max results per page (default 50, max 100)
 *
 * Response:
 *   data    — centers sorted by distance (km, 1 decimal) for this page
 *   total   — number of centers within the radius (all pages)
 *   nearest — closest center outside the radius when total is 0, else null
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lat = parseFloat(url.searchParams.get("lat") || "");
    const lng = parseFloat(url.searchParams.get("lng") || "");
    const radius = clamp(
      parseFloat(url.searchParams.get("radius") || url.searchParams.get("maxDistance") || "150"),
      1,
      500
    );
    const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10) || 0);
    const limit = clamp(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 1, 100);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "lat and lng query params are required" },
        { status: 400 }
      );
    }

    const index = getNearbyIndex();
    let candidates: { center: Center; distance: number }[];

    if (index) {
      candidates = index.map((entry) => ({
        center: entry.center,
        distance: distanceKm(lat, lng, entry.lat, entry.lng),
      }));
    } else {
      // Cold start: bbox pre-filter at the Strapi query level (searches at least
      // 150 km so we can still suggest the nearest center outside a small radius)
      let allCenters: Center[];
      try {
        allCenters = await loadCentersNearbyBBox(lat, lng, Math.max(radius, 150));
      } catch (bboxError) {
        console.warn("BBox query failed, falling back to full scan:", bboxError);
        allCenters = await loadCentersForNearby();
      }
      candidates = allCenters
        .map((center) => ({ center, distance: haversine(lat, lng, center.coords) }))
        .filter((item): item is { center: Center; distance: number } => item.distance !== null);
    }

    const withinRadius = candidates
      .filter((item) => item.distance <= radius)
      .sort((a, b) => a.distance - b.distance);

    let nearest: ReturnType<typeof toResult> | null = null;
    if (withinRadius.length === 0 && candidates.length > 0) {
      const closest = candidates.reduce((best, item) => (item.distance < best.distance ? item : best));
      nearest = toResult(closest);
    }

    const data = withinRadius.slice(offset, offset + limit).map(toResult);

    return new NextResponse(
      JSON.stringify({ data, total: withinRadius.length, offset, limit, radius, nearest }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300, s-maxage=300", // 5 min cache (location-specific)
        },
      }
    );
  } catch (error) {
    console.error("Error in nearby API:", error);
    return NextResponse.json(
      { error: "Failed to find nearby centers" },
      { status: 500 }
    );
  }
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function toResult({ center, distance }: { center: Center; distance: number }) {
  return {
    ...optimizeForNearby(center),
    distance: Math.round(distance * 10) / 10, // 1 decimal place km
  };
}

/** Haversine distance in km. Returns null if coords are invalid. */
function haversine(
  lat1: number,
  lng1: number,
  coords: [string, string] | undefined
): number | null {
  if (!coords || coords.length !== 2) return null;
  const lat2 = parseFloat(coords[0]);
  const lng2 = parseFloat(coords[1]);
  if (isNaN(lat2) || isNaN(lng2)) return null;
  return distanceKm(lat1, lng1, lat2, lng2);
}

/** Return only fields needed for CenterCard + map display */
function optimizeForNearby(center: Center) {
  return {
    name: center.name,
    slug: center.slug || "",
    branch_code: center.branch_code,
    district: center.district,
    state: center.state,
    region: center.region || "INDIA",
    country: center.country,
    coords: center.coords,
    address: {
      line1: center.address?.line1 || "",
      line2: center.address?.line2 || "",
      line3: center.address?.line3 || "",
      city: center.address?.city || "",
      pincode: center.address?.pincode || "",
    },
    email: center.email || "",
    contact: center.contact || "",
    mobile: center.mobile || "",
    zone: "",
    sub_zone: "",
    section: "",
    district_id: "",
    state_id: "",
    country_id: "",
  };
}
