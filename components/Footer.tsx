import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube, MapPin, Compass, Building2, Sparkles, BookOpen, Heart } from "lucide-react";

const quickLinks = [
  { href: "/", label: "Find a Center", icon: MapPin },
  { href: "/india", label: "All States", icon: Compass },
  { href: "/retreat", label: "HQ Campuses", icon: Building2 },
];

const resourceLinks = [
  { href: "https://www.brahmakumaris.com/wisdom", label: "Daily Wisdom", icon: Sparkles },
  { href: "https://www.brahmakumaris.com/wisdom/blog", label: "Blogs", icon: BookOpen },
  { href: "https://www.brahmakumaris.com/wisdom/soul-sustenance", label: "Soul Sustenance", icon: Heart },
  { href: "https://www.brahmakumaris.com/m", label: "Learn Meditation", icon: Sparkles },
];

const socialLinks = [
  { href: "https://www.facebook.com/BrahmaKumaris", label: "Facebook", icon: Facebook },
  { href: "https://twitter.com/BrahmaKumaris", label: "Twitter", icon: Twitter },
  { href: "https://www.instagram.com/brahmakumaris/", label: "Instagram", icon: Instagram },
  { href: "https://www.youtube.com/brahmakumaris", label: "YouTube", icon: Youtube },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800 bg-gradient-to-b from-neutral-50 to-neutral-100/50 dark:from-neutral-900 dark:to-neutral-950/50 mt-8">
      <div className="container mx-auto max-w-6xl px-4 py-10 lg:py-12">
        <div className="grid gap-8 grid-cols-2 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <a href="https://www.brahmakumaris.com" target="_blank" rel="noopener noreferrer" className="inline-block">
              <img
                src="https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/BK_Logo_c6ca9ac104.png"
                alt="Brahma Kumaris"
                width={160}
                height={40}
                className="h-10 w-auto object-contain"
              />
            </a>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              A worldwide spiritual movement dedicated to personal transformation and world renewal.
            </p>
            <div className="flex items-center gap-1.5">
              {socialLinks.map((social) => (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 w-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:bg-spirit-purple-50 hover:text-spirit-purple-600 dark:hover:bg-spirit-purple-900/30 dark:hover:text-spirit-purple-400 transition-all"
                  aria-label={social.label}
                >
                  <social.icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-spirit-purple-600 dark:text-spirit-purple-400" />
              Centers
            </h3>
            <nav className="flex flex-col gap-1.5">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-spirit-purple-600 dark:hover:text-spirit-purple-400 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5 text-spirit-purple-600 dark:text-spirit-purple-400" />
              Resources
            </h3>
            <nav className="flex flex-col gap-1.5">
              {resourceLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-spirit-purple-600 dark:hover:text-spirit-purple-400 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-spirit-purple-600 dark:text-spirit-purple-400" />
              Legal
            </h3>
            <nav className="flex flex-col gap-1.5">
              <Link href="/privacy-policy" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-spirit-purple-600 dark:hover:text-spirit-purple-400 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms-and-conditions" className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-spirit-purple-600 dark:hover:text-spirit-purple-400 transition-colors">
                Terms &amp; Conditions
              </Link>
            </nav>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-neutral-200/60 dark:border-neutral-800/60 bg-neutral-100/50 dark:bg-neutral-950/30">
        <div className="container mx-auto max-w-6xl px-4 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-2">
              <span>&copy; {currentYear} Brahma Kumaris</span>
              <span className="hidden sm:inline">&middot;</span>
              <span className="hidden sm:inline">All rights reserved</span>
            </div>
            <a
              href="https://www.brahmakumaris.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-spirit-purple-600 dark:hover:text-spirit-purple-400 transition-colors"
            >
              brahmakumaris.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
