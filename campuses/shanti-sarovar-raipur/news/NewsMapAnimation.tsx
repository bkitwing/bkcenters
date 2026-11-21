'use client';

import { useEffect, useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import type { FeatureCollection, Geometry } from 'geojson';

/**
 * Chhattisgarh map for the campus news hero.
 * Center and scale follow the state bbox so the outline fits the frame.
 */
const GEO_URL = '/centers/campuses/shanti-shikhar/chhattisgarh.json';
/** Geographic center of the Chhattisgarh bbox */
const HR_CENTER: [number, number] = [82.15, 21.05];
/** Shanti Sarovar, Vidhan Sabha Marg, Raipur */
const CAMPUS: [number, number] = [81.6976382, 21.2755648];

const MAP_W = 200;
const MAP_H = 220;
/** ~3.3° span into the SVG, with room for the marker rings. */
const MAP_SCALE = 1180;

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
      .catch((err) => console.error('Raipur news map failed to load', err));
    return () => {
      cancelled = true;
    };
  }, []);

  const hasGeo = useMemo(() => Boolean(geo?.features?.length), [geo]);

  return (
    <div className="srp-media-hero__anim srp-news-map" aria-hidden>
      <div className="srp-news-map__glow" />
      <div className="srp-news-map__frame">
        {hasGeo && geo ? (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: MAP_SCALE, center: HR_CENTER }}
            width={MAP_W}
            height={MAP_H}
            className="srp-news-map__svg"
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies geography={geo}>
              {({ geographies }) =>
                geographies.map((g) => (
                  <Geography
                    key={g.rsmKey}
                    geography={g}
                    fill="rgba(239, 163, 101, 0.88)"
                    stroke="rgba(255, 247, 239, 0.95)"
                    strokeWidth={1}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                    className="srp-news-map__state is-focus"
                  />
                ))
              }
            </Geographies>
            <Marker coordinates={CAMPUS}>
              <g className="srp-news-map__marker">
                <circle className="srp-news-map__ring srp-news-map__ring--1" r="8" />
                <circle className="srp-news-map__ring srp-news-map__ring--2" r="13" />
                <circle className="srp-news-map__dot" r="3.5" />
              </g>
            </Marker>
          </ComposableMap>
        ) : (
          <div className="srp-news-map__skeleton" />
        )}
      </div>
      <p className="srp-news-map__caption">Raipur · Chhattisgarh</p>
    </div>
  );
}
