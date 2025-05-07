// List of branch codes for retreat centers
export const RETREAT_CENTER_BRANCH_CODES = [
  "90001", // Center name
  "90007", // Center name
  "90006", // Center name
  "04543", // Center name
  "01758", // Center name
  "04195", // Center name
  "03793", // Center name
  "03724", // Center name
  "03180", // Center name
  "02755", // Center name
  "02417", // Center name
  "02284", // Center name
  "00858", // Center name
  "00510", // Center name
  "00386", // Center name
  "00346", // Center name
  "00182"  // Center name
];

// Function to check if a branch code is a retreat center
export function isRetreatCenter(branchCode: string): boolean {
  return RETREAT_CENTER_BRANCH_CODES.includes(branchCode);
} 