import { NextResponse } from "next/server";
import { Center } from "@/lib/types";
import { loadCentersForNearby } from "@/lib/strapiClient";

export const dynamic = "force-dynamic";

/**
 * Server-side nearby center search.
 * Computes distances on the server and returns only the nearest centers.
 * This avoids sending all 5600+ centers to the client.
 *
 * Query params:
 *   lat, lng — user coordinates (required)
 *   maxDistance — max radius in km (default 150)
 *   limit — max results (default 50)
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lat = parseFloat(url.searchParams.get("lat") || "");
    const lng = parseFloat(url.searchParams.get("lng") || "");
    const maxDistance = parseInt(url.searchParams.get("maxDistance") || "150", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json(
        { error: "lat and lng query params are required" },
        { status: 400 }
      );
    }

    // Server-side: uses Next.js ISR cache (revalidate 86400)
    // Medium-weight fetch: CenterCard fields only, ~3 API pages instead of 12
    const allCenters = await loadCentersForNearby();

    // Calculate distance for each center and filter/sort
    const centersWithDistance: { center: Center; distance: number }[] = allCenters
      .map((center: Center) => {
        const dist = haversine(lat, lng, center.coords);
        return { center, distance: dist };
      })
      .filter((item): item is { center: Center; distance: number } =>
        item.distance !== null && item.distance <= maxDistance
      )
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);

    const data = centersWithDistance.map(({ center, distance }: { center: Center; distance: number }) => ({
      ...optimizeForNearby(center),
      distance: Math.round(distance! * 10) / 10, // 1 decimal place km
    }));

    return new NextResponse(JSON.stringify({ data, total: data.length }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=300", // 5 min cache (location-specific)
      },
    });
  } catch (error) {
    console.error("Error in nearby API:", error);
    return NextResponse.json(
      { error: "Failed to find nearby centers" },
      { status: 500 }
    );
  }
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

  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
