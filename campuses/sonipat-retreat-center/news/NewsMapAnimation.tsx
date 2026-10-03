'use client';

import { useEffect, useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import type { FeatureCollection, Geometry } from 'geojson';

/**
 * Haryana map for the campus news hero.
 * Center and scale follow the state bbox so the outline fits the frame.
 */
const GEO_URL = '/centers/campuses/sonipat-retreat-center/haryana.json';
/** Geographic center of the Haryana bbox */
const HR_CENTER: [number, number] = [76.04, 29.29];
/** Sonipat Retreat Center, Bahalgarh */
const SONIPAT: [number, number] = [77.083, 29.01];

const MAP_W = 200;
const MAP_H = 220;
/** ~3.3° span into the SVG, with room for the marker rings. */
const MAP_SCALE = 2480;

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
      .catch((err) => console.error('Sonipat news map failed to load', err));
    return () => {
      cancelled = true;
    };
  }, []);

  const hasGeo = useMemo(() => Boolean(geo?.features?.length), [geo]);

  return (
    <div className="sp-media-hero__anim sp-news-map" aria-hidden>
      <div className="sp-news-map__glow" />
      <div className="sp-news-map__frame">
        {hasGeo && geo ? (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: MAP_SCALE, center: HR_CENTER }}
            width={MAP_W}
            height={MAP_H}
            className="sp-news-map__svg"
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies geography={geo}>
              {({ geographies }) =>
                geographies.map((g) => (
                  <Geography
                    key={g.rsmKey}
                    geography={g}
                    fill="rgba(122, 69, 143, 0.88)"
                    stroke="rgba(251, 236, 255, 0.95)"
                    strokeWidth={1}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none' },
                      pressed: { outline: 'none' },
                    }}
                    className="sp-news-map__state is-focus"
                  />
                ))
              }
            </Geographies>
            <Marker coordinates={SONIPAT}>
              <g className="sp-news-map__marker">
                <circle className="sp-news-map__ring sp-news-map__ring--1" r="8" />
                <circle className="sp-news-map__ring sp-news-map__ring--2" r="13" />
                <circle className="sp-news-map__dot" r="3.5" />
              </g>
            </Marker>
          </ComposableMap>
        ) : (
          <div className="sp-news-map__skeleton" />
        )}
      </div>
      <p className="sp-news-map__caption">Sonipat · Haryana</p>
    </div>
  );
}
