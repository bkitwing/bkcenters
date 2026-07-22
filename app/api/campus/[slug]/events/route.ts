import { NextResponse } from 'next/server';
import { getCampus } from '@/lib/campuses/registry';
import {
  EVENTS_INITIAL_PAGE_SIZE,
  fetchSsEventsPage,
} from '@/campuses/shantisarovar/ss-media-data';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const campus = getCampus(params.slug);
    if (!campus) {
      return NextResponse.json({ error: 'Unknown campus' }, { status: 404 });
    }

    // Only Shanti Sarovar events are wired today; extend per campus as needed.
    if (params.slug !== 'shantisarovar') {
      return NextResponse.json({ error: 'Events API not configured' }, { status: 404 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(
      url.searchParams.get('pageSize') || String(EVENTS_INITIAL_PAGE_SIZE),
      10
    );

    const safePage = Math.max(1, page);
    const safePageSize = Math.min(Math.max(1, pageSize), 50);

    const batch = await fetchSsEventsPage(safePage, safePageSize);

    return new NextResponse(JSON.stringify(batch), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Campus events API failed:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
