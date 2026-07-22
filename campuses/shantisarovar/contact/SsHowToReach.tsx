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
  'Beside Pullela Gopichand Badminton Academy, ISB Road, Gachibowli.';

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
        title: 'Rajiv Gandhi International Airport',
        meta: 'Shamshabad · ~30–32 km · 45–70 min',
        tip: 'Cab or airport bus to Gachibowli / Financial District → ISB–Infosys Road → lane near Pullela Gopichand Academy.',
      },
    ],
  },
  {
    id: 'rail',
    label: 'Train',
    icon: TrainFront,
    stops: [
      {
        title: 'Lingampalli',
        meta: '~6–8 km · 20–35 min',
        tip: 'Nearest rail hub. Auto or cab to Gachibowli → ISB Road → Pullela Gopichand Academy.',
      },
      {
        title: 'Secunderabad',
        meta: '~20–22 km · 45–75 min',
        tip: 'Direct cab, or Metro to Raidurg then auto/cab to campus.',
      },
      {
        title: 'Hyderabad Deccan (Nampally)',
        meta: '~16–18 km · 35–60 min',
        tip: 'Cab toward Gachibowli – ISB Road, then the academy lane.',
      },
    ],
  },
  {
    id: 'bus',
    label: 'Bus',
    icon: Bus,
    stops: [
      {
        title: 'MGBS / Imlibun',
        meta: '~18–19 km · 45–70 min',
        tip: 'Cab or city bus to Gachibowli → ISB–Infosys Road → academy lane.',
      },
      {
        title: 'Jubilee Bus Station (JBS)',
        meta: '~20–22 km · 45–75 min',
        tip: 'Direct cab, or travel to Raidurg / Gachibowli then auto/cab.',
      },
    ],
  },
  {
    id: 'local',
    label: 'Nearby',
    icon: MapPinned,
    stops: [
      {
        title: 'Landmark hubs',
        meta: 'Wipro · Infosys · IIIT · Gachibowli · Raidurg Metro',
        tip: 'Nearest listed bus stop: Wipro. Routes include 113M, 156, 16A, 195W, 217, 224G, 300H.',
      },
      {
        title: 'Last stretch',
        meta: 'From Gachibowli',
        tip: 'Follow ISB–Infosys Road → Pullela Gopichand Badminton Academy → lane beside / behind the academy.',
      },
    ],
  },
];

export function SsHowToReach({ mapsUrl }: { mapsUrl: string }) {
  const [mode, setMode] = useState<ReachMode>('airport');
  const active = MODES.find((m) => m.id === mode) ?? MODES[0];

  return (
    <div className="ss-reach">
      <div className="ss-reach__landmark">
        <span className="ss-reach__landmark-icon" aria-hidden>
          <Landmark className="w-5 h-5" />
        </span>
        <div className="ss-reach__landmark-body">
          <p className="ss-reach__landmark-label">Tell the driver</p>
          <p className="ss-reach__landmark-text">{LANDMARK}</p>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ss-reach__maps"
        >
          <Navigation className="w-4 h-4" />
          Maps
        </a>
      </div>

      <div className="ss-reach__tabs" role="tablist" aria-label="How to arrive">
        {MODES.map((m) => {
          const Icon = m.icon;
          const selected = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`ss-reach__tab${selected ? ' is-active' : ''}`}
              onClick={() => setMode(m.id)}
            >
              <Icon className="w-4 h-4" aria-hidden />
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="ss-reach__panel" role="tabpanel">
        {active.stops.map((stop) => (
          <article key={stop.title} className="ss-reach__card">
            <h3 className="ss-reach__card-title">{stop.title}</h3>
            <p className="ss-reach__card-meta">{stop.meta}</p>
            <p className="ss-reach__card-tip">{stop.tip}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
