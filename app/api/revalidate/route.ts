import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

/**
 * On-demand revalidation endpoint.
 * Called by strapi-sync.js after data changes to purge Next.js cache immediately.
 * 
 * POST /api/revalidate
 * Body: { "secret": "...", "paths": ["/", "/retreat", ...] }
 * 
 * If no paths specified, revalidates all main routes.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { secret, paths } = body;

    // Verify secret
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
    }

    // Default: revalidate all key paths
    const pathsToRevalidate = paths && paths.length > 0
      ? paths
      : ['/', '/retreat'];

    // Revalidate each path
    const results: string[] = [];
    for (const p of pathsToRevalidate) {
      revalidatePath(p);
      results.push(p);
    }

    // Also revalidate the layout (catches all dynamic [region]/[state]/etc pages)
    revalidatePath('/', 'layout');
    results.push('/ (layout)');

    return NextResponse.json({
      revalidated: true,
      paths: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Revalidation failed' },
      { status: 500 }
    );
  }
}
