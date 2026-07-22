import { Globe, Smartphone, ArrowRight, Headphones } from 'lucide-react';

const LINKS = [
  {
    href: 'https://www.brahmakumaris.com/meditation',
    label: 'Listen online',
    sub: 'Web portal',
    icon: Globe,
  },
  {
    href: 'https://play.google.com/store/apps/details?id=com.official.brahmakumaris',
    label: 'Android',
    sub: 'Google Play',
    icon: Smartphone,
  },
  {
    href: 'https://apps.apple.com/us/app/time-for-meditation/id6759336524',
    label: 'iOS',
    sub: 'App Store',
    icon: Headphones,
  },
] as const;

/** Slim meditation CTAs — no repeated section title inside. */
export function SsMeditationStory() {
  return (
    <div className="ss-story-card ss-story-card--med">
      <p className="ss-story-lede">Free Rajyoga commentaries — listen anywhere.</p>
      <div className="ss-story-linkgrid">
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="ss-story-link"
          >
            <l.icon className="w-5 h-5 text-[var(--ss-gold)]" aria-hidden />
            <span>
              <span className="ss-story-link__label">{l.label}</span>
              <span className="ss-story-link__sub">{l.sub}</span>
            </span>
            <ArrowRight className="w-4 h-4 opacity-40" aria-hidden />
          </a>
        ))}
      </div>
    </div>
  );
}
