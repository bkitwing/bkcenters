import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Route segment config
export const preferredRegion = 'auto';
export const dynamic = 'force-dynamic';

/**
 * Link-preview image (1200×630) for every page: WhatsApp, Facebook, X, etc.
 *
 * Params: title, type, eyebrow, subtitle, stats ("469:centers|31:districts").
 * Older links that only carry `description` still render (as the subtitle, or
 * as stats when it reads like "469 Centers in 31 Districts").
 */

// Site palette (app/globals.css: --bk-hero-ink, --uh-ink-gold-deep, …)
const INK = '#5C3340';
const INK_SOFT = '#7A4A56';
const GOLD = '#B8860B';
const GOLD_DEEP = '#8A6512';
const MAROON = '#6F2F38';

const DEFAULT_EYEBROW: Record<string, string> = {
  center: 'Rajyoga Meditation Center',
  district: 'Rajyoga meditation centers in',
  state: 'Rajyoga meditation centers in',
  region: 'Rajyoga meditation centers in',
  retreat: 'Brahma Kumaris',
  home: 'Rajyoga meditation center locator',
  search: 'Rajyoga meditation centers',
  'current-location': 'Rajyoga meditation centers',
};

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

type Stat = { value: string; label: string };

function parseStats(raw: string): Stat[] {
  return raw
    .split('|')
    .map((part) => {
      const [value, ...label] = part.split(':');
      return { value: value.trim(), label: label.join(':').trim() };
    })
    .filter((stat) => stat.value && stat.label)
    .slice(0, 3);
}

/** Old-style description "469 Centers in 31 Districts" → stats */
function statsFromDescription(description: string): Stat[] {
  const match = description.match(
    /(\d[\d,]*)\s*Centers?\s*in\s*(?:\(\s*)?(\d[\d,]*)\s*(Districts?|States?(?:\s*&\s*UTs?)?|Localities|Provinces|States-Uts)/i
  );
  if (!match) return [];
  return [
    { value: match[1], label: 'centers' },
    { value: match[2], label: match[3].toLowerCase() },
  ];
}

/**
 * Noto Sans (the site's font) at the given weight, only the glyphs needed.
 * Google Fonts returns a TTF for this request; on any failure the image falls
 * back to the bundled regular font rather than failing.
 */
async function loadFont(weight: number, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Noto+Sans:wght@${weight}&text=${encodeURIComponent(text)}`)
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const res = await fetch(url);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

/** Radiating lines like the Brahma Kumaris logo, drawn faintly on the right */
function Sunburst() {
  const size = 720;
  const c = size / 2;
  const rays = Array.from({ length: 48 }, (_, i) => {
    const angle = (i / 48) * Math.PI * 2;
    const inner = 96;
    const outer = i % 2 === 0 ? 340 : 270;
    return (
      <line
        key={i}
        x1={c + inner * Math.cos(angle)}
        y1={c + inner * Math.sin(angle)}
        x2={c + outer * Math.cos(angle)}
        y2={c + outer * Math.sin(angle)}
        stroke={GOLD}
        strokeWidth={i % 2 === 0 ? 5 : 3}
        strokeLinecap="round"
        strokeOpacity={i % 2 === 0 ? 0.2 : 0.12}
      />
    );
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute', left: 760, top: -45 }}>
      <circle cx={c} cy={c} r={70} fill={GOLD} fillOpacity={0.12} />
      <circle cx={c} cy={c} r={70} fill="none" stroke={GOLD} strokeOpacity={0.3} strokeWidth={3} />
      {rays}
    </svg>
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'center';
    const title = truncate(searchParams.get('title') || 'Brahma Kumaris Centers', 70);
    const eyebrow = (searchParams.get('eyebrow') || DEFAULT_EYEBROW[type] || DEFAULT_EYEBROW.center).toUpperCase();
    const description = searchParams.get('description') || '';

    let stats = parseStats(searchParams.get('stats') || '');
    if (stats.length === 0) stats = statsFromDescription(description);

    // Location line: explicit subtitle, else older params
    const subtitle = truncate(
      searchParams.get('subtitle') ||
        searchParams.get('location') ||
        [searchParams.get('district'), searchParams.get('state')].filter(Boolean).join(', ') ||
        (stats.length === 0 ? description.split('\n')[0] : ''),
      60
    );

    // Shorter titles get bigger type; a long title with stats under it gets
    // less, so both fit between the brand line and the footer
    // (bold Noto Sans averages ~0.58em per letter in an 800px column)
    const titleSize =
      title.length <= 12 ? 92 : title.length <= 17 ? 78 : stats.length > 0 ? 60 : title.length <= 40 ? 66 : 56;
    const footerText = 'Free classes · Everyone welcome';
    const urlText = 'brahmakumaris.com/centers';

    const glyphs = ['BRAHMA KUMARIS', title, eyebrow, subtitle, footerText, urlText, ...stats.flatMap((s) => [s.value, s.label])].join(' ');
    const [regular, bold] = await Promise.all([loadFont(400, glyphs), loadFont(700, glyphs)]);
    const fonts = [
      ...(regular ? [{ name: 'Noto Sans', data: regular, weight: 400 as const, style: 'normal' as const }] : []),
      ...(bold ? [{ name: 'Noto Sans', data: bold, weight: 700 as const, style: 'normal' as const }] : []),
    ];

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            position: 'relative',
            fontFamily: 'Noto Sans',
            backgroundColor: '#FFFBF4',
            backgroundImage: 'linear-gradient(135deg, #FFFCF7 0%, #FBF3E4 55%, #F3E3C6 100%)',
          }}
        >
          {/* Warm glow behind the sunburst */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              backgroundImage: 'radial-gradient(circle at 1120px 315px, rgba(232, 190, 100, 0.38) 0%, rgba(232, 190, 100, 0) 42%)',
            }}
          />
          <Sunburst />

          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: '52px 64px 48px' }}>
            {/* Brand (text, no logo image) */}
            <div style={{ display: 'flex', fontSize: 24, letterSpacing: 7, color: MAROON }}>BRAHMA KUMARIS</div>

            {/* Who / where */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', maxWidth: 800 }}>
              <div style={{ display: 'flex' }}>
                <div
                  style={{
                    display: 'flex',
                    padding: '8px 18px',
                    borderRadius: 999,
                    backgroundColor: 'rgba(184, 134, 11, 0.12)',
                    border: '1.5px solid rgba(168, 122, 42, 0.3)',
                    color: GOLD_DEEP,
                    fontSize: 21,
                    fontWeight: 700,
                    letterSpacing: 2.5,
                  }}
                >
                  {eyebrow}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  marginTop: 22,
                  fontSize: titleSize,
                  fontWeight: 700,
                  lineHeight: 1.08,
                  letterSpacing: -1.5,
                  color: INK,
                }}
              >
                {title}
              </div>

              {subtitle && (
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 18, fontSize: 30, color: INK_SOFT }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}>
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {subtitle}
                </div>
              )}

              {stats.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', marginTop: 26 }}>
                  {stats.map((stat, index) => (
                    <div key={stat.label} style={{ display: 'flex', alignItems: 'center' }}>
                      {index > 0 && (
                        <div style={{ display: 'flex', width: 2, height: 46, margin: '0 28px', backgroundColor: 'rgba(168, 122, 42, 0.35)' }} />
                      )}
                      {/* Bottom-aligned with a small lift so the label sits on the number's baseline */}
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: 58, fontWeight: 700, lineHeight: 1, color: GOLD_DEEP, letterSpacing: -1 }}>{stat.value}</span>
                        <span style={{ marginLeft: 10, marginBottom: 3, fontSize: 26, lineHeight: 1, color: INK_SOFT }}>{stat.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 22,
                borderTop: '2px solid rgba(168, 122, 42, 0.22)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 22px',
                  borderRadius: 999,
                  backgroundImage: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DEEP} 100%)`,
                  color: '#FFFFFF',
                  fontSize: 23,
                  fontWeight: 700,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#FFFFFF" style={{ marginRight: 10 }}>
                  <path d="M12 2.5l2.1 6.4a2 2 0 0 0 1.3 1.3l6.1 1.8-6.1 1.8a2 2 0 0 0-1.3 1.3L12 21.5l-2.1-6.4a2 2 0 0 0-1.3-1.3L2.5 12l6.1-1.8a2 2 0 0 0 1.3-1.3L12 2.5z" />
                </svg>
                {footerText}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: 24, fontWeight: 700, color: INK }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 10 }}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                  <path d="M2 12h20" />
                </svg>
                {urlText}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers,
        ...(fonts.length > 0 ? { fonts } : {}),
      }
    );
  } catch (e) {
    console.error('Error generating OG image:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
