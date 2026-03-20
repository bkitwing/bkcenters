export interface CenterAddress {
  line1: string;
  line2: string;
  line3: string;
  city: string;
  pincode: string;
}

export interface Center {
  name: string;
  slug: string;
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

export interface NewsPostImage {
  url: string;
  alternativeText: string | null;
  formats: {
    thumbnail?: { url: string; width: number; height: number };
    Thumbnail?: { url: string; width: number; height: number };
    microHD?: { url: string; width: number; height: number };
    miniHD?: { url: string; width: number; height: number };
    HD?: { url: string; width: number; height: number };
    FullHD?: { url: string; width: number; height: number };
  } | null;
}

export interface NewsPost {
  id: number;
  title: string;
  slug: string;
  date: string;
  Featured: boolean;
  featuredImage: NewsPostImage | null;
}

export interface EventPost {
  id: number;
  title: string;
  slug: string;
  start_date: string;
  end_date: string;
  more_infor: string | null;
  registration_link: string | null;
  centeremail: string;
  featuredImage: NewsPostImage | null;
}

export interface CentersData {
  map(arg0: (center: any) => Center): unknown;
  length: any;
  filter(arg0: (center: any) => boolean): CentersData;
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