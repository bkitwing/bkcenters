/**
 * URL formatting utilities for the centers
 */

/**
 * Format parts of a center URL according to the new requirements:
 * - Region: Convert to lowercase
 * - State: Convert to lowercase and replace spaces with hyphens
 * - District: Convert to lowercase and replace spaces with hyphens
 * - Center: Use the center's name instead of branch_code, formatted as lowercase with hyphens
 * 
 * Handles empty values - will generate URLs up to the level of detail provided.
 */
export function formatCenterUrl(region: string, state: string = '', district: string = '', centerName: string = ''): string {
  // Start with base path
  let url = '/bkcenters';
  
  // Format and add region if provided
  if (region) {
    const formattedRegion = region.toLowerCase();
    url += `/${encodeURIComponent(formattedRegion)}`;
    
    // Format and add state if provided
    if (state) {
      const formattedState = state.toLowerCase().replace(/\s+/g, '-');
      url += `/${encodeURIComponent(formattedState)}`;
      
      // Format and add district if provided
      if (district) {
        const formattedDistrict = district.toLowerCase().replace(/\s+/g, '-');
        url += `/${encodeURIComponent(formattedDistrict)}`;
        
        // Format and add center name if provided
        if (centerName) {
          const formattedCenterName = centerName.toLowerCase().replace(/\s+/g, '-');
          url += `/${encodeURIComponent(formattedCenterName)}`;
        }
      }
    }
  }
  
  return url;
}

/**
 * Convert a slugified string back to a potential original format
 * This is used to match URL slugs back to database entries
 * 
 * @param slug The slugified string (e.g., "east-champaran")
 * @returns An array of possible original formats to try matching against the database
 */
export function deSlugify(slug: string): string[] {
  if (!slug) return [];
  
  // Create multiple possible formats to try matching against the database
  const possibleFormats = [];
  
  // 1. The slug as-is (for when the original data might be in this format)
  possibleFormats.push(slug);
  
  // 2. Convert hyphens to spaces
  const withSpaces = slug.replace(/-/g, ' ');
  possibleFormats.push(withSpaces);
  
  // 3. Title case version (capitalize first letter of each word)
  const titleCase = withSpaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  possibleFormats.push(titleCase);
  
  // 4. All uppercase (for some regions like "INDIA")
  possibleFormats.push(slug.toUpperCase());
  
  // 5. First letter uppercase only
  possibleFormats.push(withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1));
  
  return possibleFormats;
} 