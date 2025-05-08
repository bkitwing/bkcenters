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
  if (process.env.NODE_ENV === 'production') {
    return 'https://www.brahmakumaris.com/centers';
  }
  return 'http://localhost:3000/centers';
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
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            backgroundColor: '#F8FAFC',
            backgroundImage: `
              radial-gradient(circle at 20px 20px, #E2E8F0 2px, transparent 2px),
              radial-gradient(circle at 60px 60px, #E2E8F0 2px, transparent 2px),
              radial-gradient(circle at 40px 40px, #EFF6FF 3px, transparent 3px),
              radial-gradient(circle at 80px 80px, #EFF6FF 3px, transparent 3px),
              linear-gradient(to right, rgba(99, 102, 241, 0.02), rgba(168, 85, 247, 0.02))
            `,
            backgroundSize: '80px 80px, 80px 80px, 80px 80px, 80px 80px, 100% 100%',
            backgroundPosition: '0 0, 40px 40px, 20px 20px, 60px 60px, 0 0',
            padding: '40px 0',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '32px',
              padding: '16px 32px',
              borderRadius: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            }}
          >
            <span
              style={{
                fontSize: '48px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)',
                backgroundClip: 'text',
                color: 'transparent',
                textAlign: 'center',
              }}
            >
              Brahma Kumaris
            </span>
          </div>

          {/* Main Content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '32px',
              borderRadius: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.97)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              margin: '0 48px',
              width: '90%',
              maxWidth: '1000px',
              position: 'relative',
              minHeight: '300px',
            }}
          >
            {/* Title */}
            <h1
              style={{
                fontSize: '48px',
                fontWeight: '900',
                color: '#1F2937',
                margin: '0 0 16px 0',
                lineHeight: '1.1',
                maxWidth: '900px',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                display: '-webkit-box',
                WebkitLineClamp: '2',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {truncatedTitle}
            </h1>

            {/* Description */}
            <p
              style={{
                fontSize: '28px',
                color: '#4B5563',
                margin: '0 0 20px 0',
                maxWidth: '800px',
                lineHeight: '1.3',
                display: '-webkit-box',
                WebkitLineClamp: '3',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {description}
            </p>

            {/* Location Info */}
            {locationText && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '24px',
                  color: '#6B7280',
                  marginTop: 'auto',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(249, 250, 251, 0.8)',
                  maxWidth: '95%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ flexShrink: 0 }}
                >
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                    fill="#6366F1"
                  />
                </svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {locationText}
                  {centerCount && ` • ${centerCount} Centers`}
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              position: 'absolute',
              bottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '0 20px',
            }}
          >
            <span
              style={{
                fontSize: '18px',
                color: '#6B7280',
                padding: '6px 20px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
              }}
            >
              www.brahmakumaris.com/centers
            </span>
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