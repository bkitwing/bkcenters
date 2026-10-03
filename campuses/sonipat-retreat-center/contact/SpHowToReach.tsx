'use client';

import { useState } from 'react';
import {
  Plane,
  TrainFront,
  Bus,
  MapPinned,
  Navigation,
  Landmark,
  type LucideIcon,
} from 'lucide-react';

type ReachMode = 'airport' | 'rail' | 'bus' | 'local';

type ReachStop = {
  title: string;
  meta: string;
  tip: string;
};

const LANDMARK =
  'Behind Jurasik Park Inn, Nangal Khurd, GT Road, Bahalgarh, Sonipat.';

const MODES: {
  id: ReachMode;
  label: string;
  icon: LucideIcon;
  stops: ReachStop[];
}[] = [
  {
    id: 'airport',
    label: 'Airport',
    icon: Plane,
    stops: [
      {
        title: 'Indira Gandhi International Airport',
        meta: 'New Delhi',
        tip: 'Take a cab toward Sonipat on GT Road (NH-44). Continue to Bahalgarh, then Nangal Khurd. The campus is behind Jurasik Park Inn.',
      },
    ],
  },
  {
    id: 'rail',
    label: 'Train',
    icon: TrainFront,
    stops: [
      {
        title: 'Sonipat Junction',
        meta: 'City railhead',
        tip: 'From the station, take a cab or auto toward Bahalgarh and Nangal Khurd on GT Road. Ask for Jurasik Park Inn — the retreat centre is behind it.',
      },
    ],
  },
  {
    id: 'bus',
    label: 'Bus',
    icon: Bus,
    stops: [
      {
        title: 'Sonipat bus stand',
        meta: 'Then local transport',
        tip: 'From the bus stand, continue toward Bahalgarh on GT Road and get down at Nangal Khurd. The campus sits behind Jurasik Park Inn.',
      },
    ],
  },
  {
    id: 'local',
    label: 'Nearby',
    icon: MapPinned,
    stops: [
      {
        title: 'Bahalgarh · Nangal Khurd',
        meta: 'GT Road',
        tip: 'Tell the driver: behind Jurasik Park Inn, Nangal Khurd, Kamasapur, via Bahalgarh.',
      },
    ],
  },
];

export function SpHowToReach({ mapsUrl }: { mapsUrl: string }) {
  const [mode, setMode] = useState<ReachMode>('airport');
  const active = MODES.find((m) => m.id === mode) ?? MODES[0];

  return (
    <div className="sp-reach">
      <div className="sp-reach__landmark">
        <span className="sp-reach__landmark-icon" aria-hidden>
          <Landmark className="w-5 h-5" />
        </span>
        <div className="sp-reach__landmark-body">
          <p className="sp-reach__landmark-label">Tell the driver</p>
          <p className="sp-reach__landmark-text">{LANDMARK}</p>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="sp-reach__maps"
        >
          <Navigation className="w-4 h-4" />
          Maps
        </a>
      </div>

      <div className="sp-reach__tabs" role="tablist" aria-label="How to arrive">
        {MODES.map((m) => {
          const Icon = m.icon;
          const selected = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`sp-reach__tab${selected ? ' is-active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              <Icon className="w-4 h-4" aria-hidden />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="sp-reach__panel" role="tabpanel">
        {active.stops.map((stop) => (
          <article key={stop.title} className="sp-reach__card">
            <h3 className="sp-reach__card-title">{stop.title}</h3>
            <p className="sp-reach__card-meta">{stop.meta}</p>
            <p className="sp-reach__card-tip">{stop.tip}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
