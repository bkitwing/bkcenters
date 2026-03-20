import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';

const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || '';

function authenticate(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  return token === REVALIDATE_SECRET;
}

/**
 * On-demand revalidation endpoint.
 * Supports Bearer auth (header) and body secret (legacy).
 *
 * POST /api/revalidate
 * Body options:
 *   { "all": true }                    — revalidate entire site layout + all tags
 *   { "paths": ["/", "/retreat"] }     — revalidate specific paths
 *   { "tags": ["news-x@y.com"] }       — revalidate specific cache tags
 *   { "path": "/retreat" }             — revalidate single path (legacy)
 *   { "tag": "center-count" }          — revalidate single tag (legacy)
 */
export async function POST(request: NextRequest) {
  if (!REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Revalidation is not configured' }, { status: 503 });
  }

  try {
    const body = await request.json();

    // Support both auth methods: header Bearer token OR body secret
    const headerAuth = authenticate(request);
    const bodyAuth = body.secret === REVALIDATE_SECRET;
    if (!headerAuth && !bodyAuth) {
      return NextResponse.json({ error: 'Invalid authorization' }, { status: 401 });
    }

    const { paths, path, tags, tag, all } = body;
    const revalidatedPaths: string[] = [];
    const revalidatedTags: string[] = [];

    // Revalidate by tags (batch)
    if (tags && Array.isArray(tags)) {
      for (const t of tags) {
        if (typeof t === 'string' && t.trim()) {
          revalidateTag(t.trim());
          revalidatedTags.push(t.trim());
        }
      }
    }

    // Revalidate single tag (legacy)
    if (typeof tag === 'string' && tag.trim()) {
      revalidateTag(tag.trim());
      revalidatedTags.push(tag.trim());
    }

    if (all === true) {
      // Revalidate all — every cache tag used in strapiClient + layout
      const allTags = [
        'center-count', 'region-names', 'state-names', 'retreat-centers',
        'centers-nearby', 'centers-nearby-bbox',
      ];
      allTags.forEach((t) => revalidateTag(t));
      revalidatePath('/', 'layout');
      revalidatedPaths.push('/ (all)');
      revalidatedTags.push(...allTags);
    } else if (paths && Array.isArray(paths)) {
      // Batch paths
      for (const p of paths) {
        if (typeof p === 'string' && p.trim()) {
          revalidatePath(p.trim());
          revalidatedPaths.push(p.trim());
        }
      }
    } else if (typeof path === 'string' && path.trim()) {
      // Single path (legacy)
      revalidatePath(path.trim());
      revalidatedPaths.push(path.trim());
    } else if (revalidatedTags.length === 0) {
      return NextResponse.json(
        { error: "Either 'paths' array, 'tags' array, 'path', 'tag', or 'all: true' is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      revalidated: revalidatedPaths,
      revalidatedTags,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'BK Centers Revalidation endpoint',
    method: 'POST',
    headers: {
      Authorization: 'Bearer <REVALIDATE_SECRET>',
      'Content-Type': 'application/json',
    },
    examples: [
      { description: 'Revalidate all pages', body: { all: true } },
      { description: 'Revalidate specific paths', body: { paths: ['/', '/retreat', '/india/haryana/gurugram/delhi-om-shanti-retreat-centre'] } },
      { description: 'Revalidate cache tags', body: { tags: ['center-count', 'region-names', 'retreat-centers'] } },
      { description: 'Revalidate news for a center', body: { tags: ['news-orc.gurgaon@brahmakumaris.com'] } },
      { description: 'Revalidate events for a center', body: { tags: ['events-orc.gurgaon@brahmakumaris.com'] } },
    ],
  });
}
