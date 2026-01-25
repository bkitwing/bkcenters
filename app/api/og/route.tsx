import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Route segment config
export const preferredRegion = 'auto';
export const dynamic = 'force-dynamic';

// Function to truncate text with ellipsis if too long
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Function to format location breadcrumb
function formatLocationBreadcrumb(district?: string, state?: string, region?: string): string {
  const parts = [];
  if (district) parts.push(district);
  if (state) parts.push(state);
  if (region) parts.push(region);
  return parts.join(' > ');
}

// Function to get base URL
const getBaseUrl = () => {
  const isLocal = process.env.IS_LOCAL === "true";
  const isDev = process.env.NODE_ENV === "development";
  
  if (isLocal || isDev) {
    // For local development, use port 5400 with no base path
    return 'http://localhost:5400';
  }
  
  // For production, use the full production URL with base path
  return 'https://www.brahmakumaris.com/centers';
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Get dynamic params
    const title = searchParams.get('title') || 'Brahma Kumaris Centers';
    const description = searchParams.get('description') || 'Find meditation centers near you';
    const type = searchParams.get('type') || 'center';
    const location = searchParams.get('location') || '';
    const centerCount = searchParams.get('centerCount') || '';
    const district = searchParams.get('district') || '';
    const state = searchParams.get('state') || '';
    const region = searchParams.get('region') || '';

    // Format location breadcrumb
    const locationText = formatLocationBreadcrumb(district, state, region);
    
    // Truncate title if too long
    const truncatedTitle = truncateText(title, 50);
    
    // Add CORS headers
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    
    // Parse stats from description if available (e.g., "611 Centers in 31 Districts")
    const statsMatch = description.match(/(\d+)\s*Centers?\s*in\s*(\d+)\s*(Districts?|States?)/i);
    const centersNum = statsMatch ? statsMatch[1] : '';
    const locationsNum = statsMatch ? statsMatch[2] : '';
    const locationType = statsMatch ? statsMatch[3] : '';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            backgroundImage: `
              linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 40%, #EDE9FE 80%, #DDD6FE 100%)
            `,
            padding: '0',
            position: 'relative',
          }}
        >
          {/* Decorative gradient overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                radial-gradient(ellipse at top right, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse at bottom left, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(168, 85, 247, 0.08) 0%, transparent 30%)
              `,
              display: 'flex',
            }}
          />

          {/* Main Content Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              width: '100%',
              padding: '48px 60px',
              position: 'relative',
            }}
          >
            {/* Top Section - Brand */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 28px',
                  borderRadius: '50px',
                  backgroundColor: '#4F46E5',
                  border: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#FFFFFF',
                    letterSpacing: '-0.5px',
                  }}
                >
                  🙏 Brahma Kumaris
                </span>
              </div>
              
              {/* Location badge */}
              {(region || location) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginLeft: '20px',
                    padding: '12px 24px',
                    borderRadius: '50px',
                    backgroundColor: '#7C3AED',
                    border: 'none',
                  }}
                >
                  <span style={{ fontSize: '24px', color: '#FFFFFF' }}>
                    📍 {region || location}
                  </span>
                </div>
              )}
            </div>

            {/* Middle Section - Main Title */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                justifyContent: 'center',
              }}
            >
              <h1
                style={{
                  fontSize: type === 'home' ? '72px' : '80px',
                  fontWeight: '900',
                  color: '#1F2937',
                  margin: '0 0 20px 0',
                  lineHeight: '1.05',
                  letterSpacing: '-2px',
                  textShadow: 'none',
                  maxWidth: '1000px',
                }}
              >
                {truncatedTitle}
              </h1>

              {/* Stats Row - Large Numbers */}
              {centersNum && locationsNum && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '40px',
                    marginTop: '16px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '64px',
                        fontWeight: '900',
                        color: '#7C3AED',
                        letterSpacing: '-2px',
                      }}
                    >
                      {centersNum}
                    </span>
                    <span
                      style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: '#374151',
                      }}
                    >
                      Centers
                    </span>
                  </div>
                  
                  <div
                    style={{
                      width: '4px',
                      height: '50px',
                      backgroundColor: '#7C3AED',
                      borderRadius: '2px',
                      display: 'flex',
                    }}
                  />
                  
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: '12px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '64px',
                        fontWeight: '900',
                        color: '#7C3AED',
                        letterSpacing: '-2px',
                      }}
                    >
                      {locationsNum}
                    </span>
                    <span
                      style={{
                        fontSize: '32px',
                        fontWeight: '700',
                        color: '#374151',
                      }}
                    >
                      {locationType}
                    </span>
                  </div>
                </div>
              )}

              {/* Description for non-stats pages */}
              {!centersNum && description && (
                <p
                  style={{
                    fontSize: '36px',
                    fontWeight: '600',
                    color: '#374151',
                    margin: '16px 0 0 0',
                    lineHeight: '1.4',
                    maxWidth: '900px',
                  }}
                >
                  {description.length > 100 ? description.substring(0, 100) + '...' : description}
                </p>
              )}
            </div>

            {/* Bottom Section - CTA & URL */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 'auto',
              }}
            >
              {/* Free Classes Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 28px',
                  borderRadius: '16px',
                  backgroundColor: '#059669',
                  border: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: '#FFFFFF',
                  }}
                >
                  ✨ Free Meditation Classes
                </span>
              </div>

              {/* Website URL */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 28px',
                  borderRadius: '16px',
                  backgroundColor: '#4F46E5',
                  border: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: '600',
                    color: '#FFFFFF',
                  }}
                >
                  brahmakumaris.com/centers
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers,
      }
    );
  } catch (e) {
    console.error('Error generating OG image:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
} 