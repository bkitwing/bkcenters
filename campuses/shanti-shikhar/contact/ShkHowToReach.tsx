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
  'Brahma Kumaris Shanti Shikhar, Kaya Bandha, Sector 20, Nava Raipur Atal Nagar, Chhattisgarh — 492002.';

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
        title: 'Nava Raipur Atal Nagar',
        meta: 'Then a cab to the campus',
        tip: 'Ask for Shanti Shikhar, Kaya Bandha, Sector 20, Nava Raipur Atal Nagar. The map pin is the campus.',
      },
    ],
  },
  {
    id: 'rail',
    label: 'Train',
    icon: TrainFront,
    stops: [
      {
        title: 'Raipur',
        meta: 'Then a cab to Sector 20',
        tip: 'From Raipur, continue to Kaya Bandha, Sector 20, Nava Raipur Atal Nagar. Tell the driver: Brahma Kumaris Shanti Shikhar.',
      },
    ],
  },
  {
    id: 'bus',
    label: 'Bus',
    icon: Bus,
    stops: [
      {
        title: 'Nava Raipur',
        meta: 'Local transport',
        tip: 'Ask to be dropped at Sector 20, Kaya Bandha, Nava Raipur Atal Nagar, pin 492002.',
      },
    ],
  },
  {
    id: 'local',
    label: 'Nearby',
    icon: MapPinned,
    stops: [
      {
        title: 'Sector 20 · Kaya Bandha',
        meta: 'Nava Raipur Atal Nagar',
        tip: 'The campus is at Kaya Bandha, Sector 20. Use the map pin if the driver needs the exact point.',
      },
    ],
  },
];

export function ShkHowToReach({ mapsUrl }: { mapsUrl: string }) {
  const [mode, setMode] = useState<ReachMode>('airport');
  const active = MODES.find((m) => m.id === mode) ?? MODES[0];

  return (
    <div className="shk-reach">
      <div className="shk-reach__landmark">
        <span className="shk-reach__landmark-icon" aria-hidden>
          <Landmark className="w-5 h-5" />
        </span>
        <div className="shk-reach__landmark-body">
          <p className="shk-reach__landmark-label">Tell the driver</p>
          <p className="shk-reach__landmark-text">{LANDMARK}</p>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shk-reach__maps"
        >
          <Navigation className="w-4 h-4" />
          Maps
        </a>
      </div>

      <div className="shk-reach__tabs" role="tablist" aria-label="How to arrive">
        {MODES.map((m) => {
          const Icon = m.icon;
          const selected = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`shk-reach__tab${selected ? ' is-active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              <Icon className="w-4 h-4" aria-hidden />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="shk-reach__panel" role="tabpanel">
        {active.stops.map((stop) => (
          <article key={stop.title} className="shk-reach__card">
            <h3 className="shk-reach__card-title">{stop.title}</h3>
            <p className="shk-reach__card-meta">{stop.meta}</p>
            <p className="shk-reach__card-tip">{stop.tip}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
