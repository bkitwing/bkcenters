import { NextResponse } from "next/server";
import { CentersData, Center } from "@/lib/types";
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import lodash from 'lodash'
import path from 'path';
import fs from 'fs';

// Add this export to tell Next.js that this route is dynamic and should be server-rendered
export const dynamic = "force-dynamic";

class LowWithLodash<T> extends Low<T> {
  chain: lodash.ExpChain<this['data']> = lodash.chain(this).get('data')
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const state = url.searchParams.get("state");
    const district = url.searchParams.get("district");
    const lightweight = url.searchParams.get("lightweight") === "true";

    // Try multiple locations for the data file
    const publicFilePath = path.join(process.cwd(), 'public', 'Center-Processed.json');
    const rootFilePath = path.join(process.cwd(), 'Center-Processed.json');
    
    // Check which file exists and use that one
    let filePath;
    if (fs.existsSync(publicFilePath)) {
      filePath = publicFilePath;
    } else if (fs.existsSync(rootFilePath)) {
      filePath = rootFilePath;
    } else {
      throw new Error('Centers data file not found in any location');
    }
    
    const adapter = new JSONFile<CentersData>(filePath);
    

    // @ts-expect-error
    const db = new LowWithLodash(adapter,{})
    await db.read();

    let query = db.chain.get('data');
   
    if(query){
      query = query.filter(state ? (district ? { state,district  } : { state }) : {})
    }
    const filteredData = await query.value();

    // Prepare response
    const responseData = {
      total: filteredData.length,
      state: state || undefined,
      district: district || undefined,
      data: filteredData.map(center => optimizeCenter(center, lightweight)),
    };

    return createResponse(responseData);
  
    
  } catch (error) {
    console.error("Error in API route:", error);
    return new NextResponse(
      JSON.stringify({
        error: "Failed to load centers data",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
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
      "Cache-Control": "no-store, max-age=0",
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

// Load centers data from file system
// async function loadCentersData(): Promise<CentersData> {
//   console.log(process.cwd());
//   // Load only from the main data file
//   const mainFilePath = path.join(process.cwd(), "Center-Processed.json");
//   if (fs.existsSync(mainFilePath)) {
//     try {
//       const fileContents = fs.readFileSync(mainFilePath, "utf8");
//       return JSON.parse(fileContents) as CentersData;
//     } catch (error) {
//       console.error("Error reading centers data:", error);
//       throw new Error("Failed to load centers data");
//     }
//   } else {
//     console.error("Centers data file not found at:", mainFilePath);
//     throw new Error("Centers data file not found");
//   }
// }


