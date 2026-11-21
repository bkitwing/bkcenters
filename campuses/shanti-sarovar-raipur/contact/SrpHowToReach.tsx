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
  'Brahma Kumaris Shanti Sarovar, Baloda Bazar Road, Vidhan Sabha Bhawan Marg, Raipur, Chhattisgarh — 493221.';

/** Distances are approximate road distances from the campus map pin. */
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
        title: 'Swami Vivekananda Airport, Raipur',
        meta: 'RPR · about 15 km by road',
        tip: 'From the terminal, take a cab to Vidhan Sabha Marg. Ask for Brahma Kumaris Shanti Sarovar, beside the Chhattisgarh Vidhan Sabha.',
      },
    ],
  },
  {
    id: 'rail',
    label: 'Train',
    icon: TrainFront,
    stops: [
      {
        title: 'Raipur Junction',
        meta: 'About 9 km from the campus',
        tip: 'Most long-distance trains stop here. From the station, take a cab or auto towards Vidhan Sabha Marg.',
      },
    ],
  },
  {
    id: 'bus',
    label: 'Bus',
    icon: Bus,
    stops: [
      {
        title: 'Bhatagaon bus stand',
        meta: 'Main stand for Raipur · about 13 km',
        tip: 'Inter-state and intra-state buses use the stand at Bhatagaon. From there, take a cab or auto to Vidhan Sabha Marg.',
      },
    ],
  },
  {
    id: 'local',
    label: 'Nearby',
    icon: MapPinned,
    stops: [
      {
        title: 'Chhattisgarh Vidhan Sabha',
        meta: 'Right beside the campus',
        tip: 'The State Legislative Assembly stands next to Shanti Sarovar on Vidhan Sabha Marg. Use the map pin for the exact gate.',
      },
    ],
  },
];

export function SrpHowToReach({ mapsUrl }: { mapsUrl: string }) {
  const [mode, setMode] = useState<ReachMode>('airport');
  const active = MODES.find((m) => m.id === mode) ?? MODES[0];

  return (
    <div className="srp-reach">
      <div className="srp-reach__landmark">
        <span className="srp-reach__landmark-icon" aria-hidden>
          <Landmark className="w-5 h-5" />
        </span>
        <div className="srp-reach__landmark-body">
          <p className="srp-reach__landmark-label">Tell the driver</p>
          <p className="srp-reach__landmark-text">{LANDMARK}</p>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="srp-reach__maps"
        >
          <Navigation className="w-4 h-4" />
          Maps
        </a>
      </div>

      <div className="srp-reach__tabs" role="tablist" aria-label="How to arrive">
        {MODES.map((m) => {
          const Icon = m.icon;
          const selected = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`srp-reach__tab${selected ? ' is-active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              <Icon className="w-4 h-4" aria-hidden />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="srp-reach__panel" role="tabpanel">
        {active.stops.map((stop) => (
          <article key={stop.title} className="srp-reach__card">
            <h3 className="srp-reach__card-title">{stop.title}</h3>
            <p className="srp-reach__card-meta">{stop.meta}</p>
            <p className="srp-reach__card-tip">{stop.tip}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
