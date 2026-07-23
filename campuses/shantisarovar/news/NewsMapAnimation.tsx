'use client';

import { useEffect, useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import type { FeatureCollection, Geometry } from 'geojson';

/**
 * Telangana-only map for the campus news hero.
 * Scale/center tuned from the GeoJSON bbox so the full state fits
 * inside the SVG (with padding) — no overflow clipping of the outline.
 */
const GEO_URL = '/centers/campuses/shantisarovar/telangana.json';
/** Geographic center of Telangana bbox */
const TG_CENTER: [number, number] = [79.28, 17.88];
/** Shanti Sarovar / Gachibowli */
const HYD: [number, number] = [78.35, 17.44];

/** SVG canvas — slightly taller so the southern tip + marker rings clear the edge */
const MAP_W = 200;
const MAP_H = 220;
/**
 * Mercator scale that fits ~4.07° lon/lat span into ~170px usable area
 * with padding (scale ≈ 170 / (4.07 * π/180) ≈ 2390). Use a touch lower
 * for stroke/ring breathing room.
 */
const MAP_SCALE = 2350;

type StateFc = FeatureCollection<Geometry, { st_nm: string; st_code?: string }>;

export function NewsMapAnimation() {
  const [geo, setGeo] = useState<StateFc | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(GEO_URL)
      .then((r) => r.json())
      .then((fc: StateFc) => {
        if (!cancelled) setGeo(fc);
      })
      .catch((err) => console.error('SS news map failed to load', err));
    return () => {
      cancelled = true;
    };
  }, []);

  const hasGeo = useMemo(() => Boolean(geo?.features?.length), [geo]);

  return (
    <div className="ss-media-hero__anim ss-news-map" aria-hidden>
      <div className="ss-news-map__glow" />
      <div className="ss-news-map__frame">
        {hasGeo && geo ? (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: MAP_SCALE, center: TG_CENTER }}
            width={MAP_W}
            height={MAP_H}
            className="ss-news-map__svg"
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies geography={geo}>
              {({ geographies }) =>
                geographies.map((g) => (
                  <Geography
                    key={g.rsmKey}
                    geography={g}
                    fill="rgba(184, 149, 90, 0.88)"
                    stroke="rgba(255, 232, 192, 0.95)"
                    strokeWidth={1}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                    className="ss-news-map__state is-focus"
                  />
                ))
              }
            </Geographies>
            <Marker coordinates={HYD}>
              <g className="ss-news-map__marker">
                <circle className="ss-news-map__ring ss-news-map__ring--1" r="8" />
                <circle className="ss-news-map__ring ss-news-map__ring--2" r="13" />
                <circle className="ss-news-map__dot" r="3.5" />
              </g>
            </Marker>
          </ComposableMap>
        ) : (
          <div className="ss-news-map__skeleton" />
        )}
      </div>
      <p className="ss-news-map__caption">Hyderabad · Telangana</p>
    </div>
  );
}
