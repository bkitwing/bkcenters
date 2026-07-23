'use client';

import { useEffect, useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import type { FeatureCollection, Geometry } from 'geojson';

/**
 * Maharashtra-only map for the campus news hero.
 * Scale/center tuned from the GeoJSON bbox so the full state fits
 * inside the SVG (with padding) — same pattern as Shanti Sarovar / Telangana.
 */
const GEO_URL = '/centers/campuses/jagdamba-bhawan/maharashtra.json';
/** Geographic center of Maharashtra bbox */
const MH_CENTER: [number, number] = [76.82, 18.82];
/** Jagdamba Bhawan / Pune (lng, lat) */
const PUNE: [number, number] = [73.909236, 18.433709];

/** SVG canvas — slightly taller so marker rings clear the edge */
const MAP_W = 200;
const MAP_H = 220;
/**
 * Mercator scale that fits ~8.2° lon span into ~170px usable area
 * with padding (scale ≈ 170 / (8.16 * π/180) ≈ 1194). Use a touch lower
 * for stroke/ring breathing room.
 */
const MAP_SCALE = 1120;

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
      .catch((err) => console.error('JB news map failed to load', err));
    return () => {
      cancelled = true;
    };
  }, []);

  const hasGeo = useMemo(() => Boolean(geo?.features?.length), [geo]);

  return (
    <div className="jb-media-hero__anim jb-news-map" aria-hidden>
      <div className="jb-news-map__glow" />
      <div className="jb-news-map__frame">
        {hasGeo && geo ? (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: MAP_SCALE, center: MH_CENTER }}
            width={MAP_W}
            height={MAP_H}
            className="jb-news-map__svg"
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies geography={geo}>
              {({ geographies }) =>
                geographies.map((g) => (
                  <Geography
                    key={g.rsmKey}
                    geography={g}
                    fill="rgba(112, 188, 211, 0.88)"
                    stroke="rgba(232, 244, 248, 0.95)"
                    strokeWidth={1}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                    className="jb-news-map__state is-focus"
                  />
                ))
              }
            </Geographies>
            <Marker coordinates={PUNE}>
              <g className="jb-news-map__marker">
                <circle className="jb-news-map__ring jb-news-map__ring--1" r="8" />
                <circle className="jb-news-map__ring jb-news-map__ring--2" r="13" />
                <circle className="jb-news-map__dot" r="3.5" />
              </g>
            </Marker>
          </ComposableMap>
        ) : (
          <div className="jb-news-map__skeleton" />
        )}
      </div>
      <p className="jb-news-map__caption">Pune · Maharashtra</p>
    </div>
  );
}
