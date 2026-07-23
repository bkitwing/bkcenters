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
  "Near SMEF's School of Architecture, Jagdamba Bhawan Marg, Pisoli, Tal. Haveli, Pune.";

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
        title: 'Pune International Airport (Lohegaon)',
        meta: '~18–25 km',
        tip: 'Cab or app taxi toward Kondhwa / Pisoli → Jagdamba Bhawan Marg near SMEF School of Architecture.',
      },
    ],
  },
  {
    id: 'rail',
    label: 'Train',
    icon: TrainFront,
    stops: [
      {
        title: 'Pune Junction',
        meta: '~12–15 km',
        tip: 'Cab or auto toward Kondhwa / Pisoli → Jagdamba Bhawan Marg.',
      },
      {
        title: 'Hadapsar',
        meta: '~8–10 km',
        tip: 'Nearest suburban rail hub. Cab or auto to Pisoli → SMEF Architecture landmark.',
      },
    ],
  },
  {
    id: 'bus',
    label: 'Bus',
    icon: Bus,
    stops: [
      {
        title: 'Swargate / Pune Station area',
        meta: 'City bus hubs',
        tip: 'Travel toward Pisoli / Kondhwa side, then cab or auto to Jagdamba Bhawan Marg.',
      },
    ],
  },
  {
    id: 'local',
    label: 'Nearby',
    icon: MapPinned,
    stops: [
      {
        title: 'Landmark',
        meta: "SMEF's School of Architecture · Pisoli",
        tip: 'Ask for Jagdamba Bhawan Marg, near SMEF School of Architecture in Pisoli.',
      },
      {
        title: 'Last stretch',
        meta: 'From Pisoli / Kondhwa',
        tip: 'Use Google Maps for “Jagdamba Bhawan” — the campus sits on Jagdamba Bhawan Marg.',
      },
    ],
  },
];

export function JbHowToReach({ mapsUrl }: { mapsUrl: string }) {
  const [mode, setMode] = useState<ReachMode>('airport');
  const active = MODES.find((m) => m.id === mode) ?? MODES[0];

  return (
    <div className="jb-reach">
      <div className="jb-reach__landmark">
        <span className="jb-reach__landmark-icon" aria-hidden>
          <Landmark className="w-5 h-5" />
        </span>
        <div className="jb-reach__landmark-body">
          <p className="jb-reach__landmark-label">Tell the driver</p>
          <p className="jb-reach__landmark-text">{LANDMARK}</p>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="jb-reach__maps"
        >
          <Navigation className="w-4 h-4" />
          Maps
        </a>
      </div>

      <div className="jb-reach__tabs" role="tablist" aria-label="How to arrive">
        {MODES.map((m) => {
          const Icon = m.icon;
          const selected = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`jb-reach__tab${selected ? ' is-active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              <Icon className="w-4 h-4" aria-hidden />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="jb-reach__panel" role="tabpanel">
        {active.stops.map((stop) => (
          <article key={stop.title} className="jb-reach__card">
            <h3 className="jb-reach__card-title">{stop.title}</h3>
            <p className="jb-reach__card-meta">{stop.meta}</p>
            <p className="jb-reach__card-tip">{stop.tip}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
