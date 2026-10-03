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
export function SpMeditationStory() {
  return (
    <div className="sp-story-card sp-story-card--med">
      <p className="sp-story-lede">Free Rajyoga commentaries — listen anywhere.</p>
      <div className="sp-story-linkgrid">
        {LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className="sp-story-link"
          >
            <l.icon className="w-5 h-5 text-[var(--sp-gold)]" aria-hidden />
            <span>
              <span className="sp-story-link__label">{l.label}</span>
              <span className="sp-story-link__sub">{l.sub}</span>
            </span>
            <ArrowRight className="w-4 h-4 opacity-40" aria-hidden />
          </a>
        ))}
      </div>
    </div>
  );
}
