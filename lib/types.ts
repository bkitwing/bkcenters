export interface CenterAddress {
  line1: string;
  line2: string;
  line3: string;
  city: string;
  pincode: string;
}

export interface Center {
  name: string;
  branch_code: string;
  address: CenterAddress;
  email: string;
  contact: string;
  country: string;
  district: string;
  state: string;
  zone: string;
  sub_zone: string;
  section: string;
  region: string;
  district_id: string;
  state_id: string;
  country_id: string;
  mobile: string;
  coords: [string, string]; // [latitude, longitude]
  
  // Additional fields for district view and enhanced display
  description?: string;
  summary?: string;
  district_total?: number;
  is_district_summary?: boolean;
  is_highlighted?: boolean;  // For highlighting a specific center on the map
  is_state_summary?: boolean; // For state-level summary markers on the main map
  distance?: number; // For distance calculations
}

export interface CentersData {
  total: number;
  zone: string;
  subzone: string;
  country: string;
  state: string;
  city: string;
  data: Center[];
}

// New mapping data structures for efficient access

// State data within a region
export interface RegionStateData {
  centerCount: number;
  districtCount: number;
}

// Region to state mapping
export interface RegionStateMapping {
  [region: string]: {
    states: {
      [state: string]: RegionStateData;
    };
    centerCount: number;
  };
}

// District data within a state
export interface StateDistrictData {
  centerCount: number;
}

// State to district mapping
export interface StateDistrictMapping {
  [state: string]: {
    region: string;
    districts: {
      [district: string]: StateDistrictData;
    };
    centerCount: number;
  };
}

// District to centers mapping (key format: "state:district")
export interface DistrictCentersMapping {
  [districtKey: string]: Center[];
} 