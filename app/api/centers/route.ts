import { NextResponse } from "next/server";
import { CentersData, Center } from "@/lib/types";
import { logger } from '@/lib/logger';
import { loadCentersFromStrapi, fetchCentersByState, fetchCentersByDistrict } from '@/lib/strapiClient';

// Add this export to tell Next.js that this route is dynamic and should be server-rendered
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const state = url.searchParams.get("state");
    const district = url.searchParams.get("district");
    const lightweight = url.searchParams.get("lightweight") === "true";

    logger.debug(`API Request - state: ${state || 'none'}, district: ${district || 'none'}, lightweight: ${lightweight}`);

    // Targeted Strapi queries — only fetch what's needed
    let filteredData: Center[];
    if (state && district) {
      filteredData = await fetchCentersByDistrict(state, district);
    } else if (state) {
      filteredData = await fetchCentersByState(state);
    } else {
      filteredData = await loadCentersFromStrapi();
    }

    logger.debug(`Loaded ${filteredData.length} centers from Strapi`);

    if (filteredData.length === 0) {
      logger.debug(`No centers found for query - state: ${state || 'none'}, district: ${district || 'none'}`);
    } else {
      logger.debug(`Found ${filteredData.length} centers for query`);
    }

    // Prepare response
    const responseData = {
      total: filteredData.length,
      state: state || undefined,
      district: district || undefined,
      data: filteredData.map(center => optimizeCenter(center, lightweight)),
    };

    return createResponse(responseData);
    
  } catch (error) {
    logger.error("Error in API route:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to load centers data",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=60",
        },
      }
    );
  }
}

// Helper to create a response with appropriate headers
function createResponse(data: any) {
  return new NextResponse(JSON.stringify(data), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600, s-maxage=3600", // Cache for 1 hour (3600 seconds)
    },
  });
}

// Optimize center object size by removing unnecessary fields
function optimizeCenter(center: Center, lightweight: boolean): Center {
  if (lightweight) {
    // Return only essential fields for listing and maps
    return {
      name: center.name,
      branch_code: center.branch_code,
      district: center.district,
      state: center.state,
      coords: center.coords,
      // Include complete address
      address: {
        city: center.address.city || "",
        line1: center.address.line1 || "",
        line2: center.address.line2 || "",
        line3: center.address.line3 || "",
        pincode: center.address.pincode || "",
      },
      // Keep contact information for the cards
      email: center.email || "",
      contact: center.contact || "",
      mobile: center.mobile || "",
      country: center.country,
      // Preserve the region field for proper mapping
      region: center.region || "INDIA",
      // These fields can be empty but maintain type compatibility
      zone: "",
      sub_zone: "",
      section: "",
      district_id: "",
      state_id: "",
      country_id: "",
    };
  }

  // Return full center data
  return center;
}
