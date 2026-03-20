import { NextResponse } from 'next/server';
import { fetchEventsByEmailPaginated } from '@/lib/strapiClient';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get('email');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '20', 10);

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email parameter is required' },
        { status: 400 }
      );
    }

    // Cap pageSize to prevent abuse
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(Math.max(1, pageSize), 50);

    const { events, total } = await fetchEventsByEmailPaginated(email, safePage, safePageSize);

    return new NextResponse(JSON.stringify({ events, total, page: safePage, pageSize: safePageSize }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
