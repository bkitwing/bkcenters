import Link from "next/link";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Compass,
  Sparkles,
  MapPin,
  Info,
  Leaf,
  LifeBuoy,
} from "lucide-react";

// Cross-app ecosystem links use plain <a> with root-relative paths. Next <Link>
// would prepend this app's /centers basePath and break routing.
/* eslint-disable @next/next/no-html-link-for-pages */


const centersLinks = [
  { href: "/", label: "Find a Center" },
  { href: "/india", label: "All States" },
  { href: "/retreat", label: "HQ Campuses" },
];

const aboutLinks = [
  { href: "/about/about-us", label: "About Us" },
  { href: "/about/journey", label: "Our Journey" },
  { href: "/about/founder-and-instruments", label: "Founder & Instruments" },
  { href: "/about/wings", label: "Wings" },
  { href: "/about/current-leaders", label: "Current Leaders" },
];

const initiativeLinks = [
  { href: "/initiatives/environment", label: "Environment" },
  { href: "/initiatives/education", label: "Education" },
  { href: "/initiatives/social", label: "Social" },
  { href: "/initiatives/health", label: "Health" },
  { href: "/initiatives/nmba", label: "Nasha Mukt Bharat Abhiyaan" },
];

const contactLinks = [
  { href: "/contact/faq", label: "FAQ" },
  { href: "/contact/contribution", label: "Contribution" },
  { href: "/contact/legal", label: "Legal & Policies" },
];

const exploreLinks: { href: string; label: string; external?: boolean }[] = [
  { href: "/wisdom", label: "Wisdom" },
  { href: "/meditation", label: "Meditation" },
  { href: "/events", label: "Events" },
  { href: "/news", label: "News" },
  { href: "https://courses.brahmakumaris.com/", label: "Courses", external: true },
];

const socialLinks = [
  { href: "https://www.facebook.com/BrahmaKumaris", label: "Facebook", icon: Facebook },
  { href: "https://twitter.com/BrahmaKumaris", label: "Twitter", icon: Twitter },
  { href: "https://www.instagram.com/brahmakumaris/", label: "Instagram", icon: Instagram },
  { href: "https://www.youtube.com/brahmakumaris", label: "YouTube", icon: Youtube },
];

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-gradient-to-b from-neutral-50 to-neutral-100/50 dark:from-neutral-900 dark:to-neutral-950/50 mt-8">
      <div className="container mx-auto max-w-7xl px-4 py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,3.2fr)]">
          <div className="space-y-5">
            <a href="https://www.brahmakumaris.com" target="_blank" rel="noopener noreferrer" className="inline-block">
              <img
                src="https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/BK_Logo_c6ca9ac104.png"
                alt="Brahma Kumaris"
                width={200}
                height={50}
                className="h-12 w-auto object-contain"
              />
            </a>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm">
              A worldwide spiritual movement dedicated to personal transformation and world renewal.
            </p>
            <div className="flex items-center gap-1.5">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-8 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                <Link href="/" className="flex items-center gap-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Centers
                </Link>
              </h3>
              <nav className="flex flex-col gap-1.5" aria-label="Centers">
                {centersLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                <a href="/about" className="flex items-center gap-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                  <Info className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  About
                </a>
              </h3>
              <nav className="flex flex-col gap-1.5" aria-label="About">
                {aboutLinks.map((link) => (
                  <a key={link.href} href={link.href} className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">{link.label}</a>
                ))}
              </nav>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                <a href="/initiatives" className="flex items-center gap-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  <Leaf className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  Initiatives
                </a>
              </h3>
              <nav className="flex flex-col gap-1.5" aria-label="Initiatives">
                {initiativeLinks.map((link) => (
                  <a key={link.href} href={link.href} className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">{link.label}</a>
                ))}
              </nav>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                <a href="/contact" className="flex items-center gap-2 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
                  <LifeBuoy className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                  Contact
                </a>
              </h3>
              <nav className="flex flex-col gap-1.5" aria-label="Contact">
                {contactLinks.map((link) => (
                  <a key={link.href} href={link.href} className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors">{link.label}</a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-neutral-200/70 dark:border-neutral-800/70">
          <div className="grid gap-8 grid-cols-2 md:grid-cols-4">
            <div className="space-y-3">
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                Explore
              </h3>
              <nav className="flex flex-col gap-1.5" aria-label="Explore">
                {exploreLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-neutral-200/70 dark:border-neutral-800/70 grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50/50 dark:bg-green-950/20 border border-green-200/30 dark:border-green-800/20">
            <div className="p-2.5 rounded-lg bg-green-500/10 text-green-600 shrink-0">
              <WhatsAppIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100">Daily Wisdom on WhatsApp</p>
              <div className="flex gap-2 mt-1.5">
                <a href="https://www.brahmakumaris.com/join-sse/" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-green-600 hover:text-green-700 transition-colors">English</a>
                <span className="text-neutral-400">•</span>
                <a href="https://www.brahmakumaris.com/join-ssh/" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-green-600 hover:text-green-700 transition-colors">हिन्दी</a>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/30 dark:border-emerald-800/20">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Compass className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100">Begin Your Spiritual Journey</p>
              <div className="flex gap-2 mt-1.5">
                <a href="https://www.brahmakumaris.com/m" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">Learn Meditation</a>
                <span className="text-neutral-400">•</span>
                <a href="/wisdom/soul-sustenance" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors">Soul Sustenance</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-100/50 dark:bg-neutral-950/30">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm text-neutral-500 dark:text-neutral-400">
              <p>© {currentYear} Brahma Kumaris</p>
              <span className="hidden sm:inline">•</span>
              <p>All rights reserved</p>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-neutral-500 dark:text-neutral-400" aria-label="Legal">
              <a href="/contact/legal/privacy-policy" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Privacy</a>
              <a href="/contact/legal/terms-and-conditions" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Terms</a>
              <a href="/contact/legal" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Policies</a>
              <a href="https://www.brahmakumaris.com" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">brahmakumaris.com</a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
