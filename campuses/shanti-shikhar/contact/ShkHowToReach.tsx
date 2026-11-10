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
        title: 'Swami Vivekananda Airport, Raipur',
        meta: 'RPR · about 10 km east of Nava Raipur',
        tip: 'This is the airport for Raipur and Nava Raipur. It was formerly called Mana Airport. A cab from the terminal reaches Kaya Bandha, Sector 20. Ask for Brahma Kumaris Shanti Shikhar.',
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
        meta: 'About 25 km from Nava Raipur',
        tip: 'Most long-distance trains stop here, on the Howrah–Nagpur–Mumbai line. From the station, a cab along the Raipur–Nava Raipur road continues to Sector 20.',
      },
      {
        title: 'CBD Naya Raipur',
        meta: 'Nava Raipur–Atal Nagar station · Sector 22',
        tip: 'The local station for Nava Raipur is in nearby Sector 22. Passenger trains have been running since 2025. A short cab from there reaches Kaya Bandha, Sector 20.',
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
        meta: 'Main stand for Raipur · about 30 km from Sector 19–20',
        tip: 'Inter-state and intra-state buses use the stand at Bhatagaon. From there, take a cab or the Tatpar bus towards Nava Raipur, then continue to Sector 20.',
      },
      {
        title: 'Tatpar · Ekatm Path',
        meta: 'Bus link between Raipur and Nava Raipur',
        tip: 'Tatpar BRTS connects Raipur city with Nava Raipur. The nearest listed stop for Sector 20 is on Ekatm Path, within a kilometre of Kaya Bandha.',
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
        meta: 'Nava Raipur Atal Nagar · 492002',
        tip: 'The campus is in Kaya Bandha, Sector 20. Capitol Square, the garden in the same sector, is a nearby landmark. Use the map pin for the exact gate.',
      },
      {
        title: 'Sector 19',
        meta: 'Capital offices, beside Sector 20',
        tip: 'The capital complex and public offices of Sector 19 sit next to Sector 20. From there, Kaya Bandha is a short local ride.',
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
