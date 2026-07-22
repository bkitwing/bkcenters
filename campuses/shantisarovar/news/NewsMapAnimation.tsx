'use client';

import { useEffect, useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import type { FeatureCollection, Geometry } from 'geojson';

/**
 * Telangana-only map for the campus news hero.
 * Hyderabad / Shanti Sarovar pulse marker.
 */
const GEO_URL = '/centers/campuses/shantisarovar/telangana.json';
/** Rough visual center of Telangana */
const TG_CENTER: [number, number] = [79.05, 17.95];
/** Shanti Sarovar / Gachibowli */
const HYD: [number, number] = [78.35, 17.44];

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
      {hasGeo && geo ? (
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 5200, center: TG_CENTER }}
          width={280}
          height={280}
          className="ss-news-map__svg"
        >
          <Geographies geography={geo}>
            {({ geographies }) =>
              geographies.map((g) => (
                <Geography
                  key={g.rsmKey}
                  geography={g}
                  fill="rgba(184, 149, 90, 0.88)"
                  stroke="rgba(255, 232, 192, 0.95)"
                  strokeWidth={1.1}
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
              <circle className="ss-news-map__ring ss-news-map__ring--1" r="16" />
              <circle className="ss-news-map__ring ss-news-map__ring--2" r="26" />
              <circle className="ss-news-map__dot" r="5" />
            </g>
          </Marker>
        </ComposableMap>
      ) : (
        <div className="ss-news-map__skeleton" />
      )}
      <p className="ss-news-map__caption">Hyderabad · Telangana</p>
    </div>
  );
}
