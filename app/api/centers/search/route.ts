import { NextResponse } from "next/server";
import { searchCentersByName } from "@/lib/strapiClient";
import { getIndexedCenters } from "@/lib/nearbyIndex";
import { searchCentersByText } from "@/lib/centerSearch";

export const dynamic = "force-dynamic";

/**
 * Center name / pincode search for the search box suggestions.
 *
 *   GET /api/centers/search?q=sampangirama&limit=6
 *   → { data: [{ name, branch_code, url, area, strong }] }
 *
 * Uses the in-memory center index (lib/nearbyIndex.ts); right after a restart,
 * while that loads, falls back to a Strapi "name contains" query.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") || "").trim().slice(0, 80);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "6", 10) || 6, 1), 20);

    if (query.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const centers = getIndexedCenters() ?? (await searchCentersByName(query, 30));

    const data = searchCentersByText(centers, query, limit);

    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=300" } }
    );
  } catch (error) {
    console.error("Error in center search API:", error);
    return NextResponse.json({ error: "Center search failed" }, { status: 500 });
  }
}
