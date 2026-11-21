import { Metadata } from 'next';
import {
  MapPin,
  Phone,
  Mail,
  Navigation,
  MessageCircle,
  BookOpen,
  Headphones,
  Map,
  HelpCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { BreadcrumbSchema, FAQPageSchema } from '@/components/StructuredData';
import ContactForm from '@/components/ContactForm';
import SoulSustenance from '@/components/SoulSustenance';
import { getCenterByCode } from '@/lib/serverCenterData';
import { getLocalizedFaqs } from '@/lib/centerContent';
import type { Center } from '@/lib/types';
import { ContactAuraAnimation } from '../contact/ContactAuraAnimation';
import { ContactSectionNav } from '../contact/ContactSectionNav';
import { SrpCourseStory } from '../contact/SrpCourseStory';
import { SrpFaqSection } from '../contact/SrpFaqSection';
import { SrpHowToReach } from '../contact/SrpHowToReach';
import { SrpMeditationStory } from '../contact/SrpMeditationStory';
import {
  SRP_CANONICAL,
  SRP_CENTER,
  SRP_CONTENT,
  SRP_MAP_EMBED_URL,
  SRP_MAPS_URL,
  SRP_OG_IMAGES,
  SRP_RETREAT_NAME,
  SRP_SEO,
} from '../content';
import { SrpMediaHero } from '../SrpMediaHero';

export const revalidate = 86400;

const pageUrl = `${SRP_CANONICAL}/contact`;
const { title, description, keywords, ogAlt } = SRP_SEO.contact;
const ogImage = SRP_OG_IMAGES.contact;

function mergeCenter(live: Center | null): Center {
  if (!live) return SRP_CENTER;
  return {
    ...SRP_CENTER,
    ...live,
    name: SRP_CENTER.name,
    address: {
      line1: live.address?.line1 || SRP_CENTER.address.line1,
      line2: live.address?.line2 || SRP_CENTER.address.line2,
      line3: live.address?.line3 || SRP_CENTER.address.line3,
      city: live.address?.city || SRP_CENTER.address.city,
      pincode: live.address?.pincode || SRP_CENTER.address.pincode,
    },
    email: live.email || SRP_CENTER.email,
    contact: live.contact || SRP_CENTER.contact,
    mobile: live.mobile || SRP_CENTER.mobile,
    coords: SRP_CENTER.coords,
  };
}

export function generateMetadata(): Metadata {
  return {
    title,
    description,
    keywords: [...keywords],
    robots: { index: true, follow: true },
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      type: 'website',
      url: pageUrl,
      siteName: 'Brahma Kumaris Centers',
      locale: 'en_IN',
      images: [{ url: ogImage, width: 1200, height: 630, alt: ogAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function ShantiSarovarRaipurContactPage() {
  let live: Center | null = null;
  try {
    live = (await getCenterByCode(SRP_CENTER.branch_code)) ?? null;
  } catch {
    live = null;
  }
  const center = mergeCenter(live);
  const phones = [...SRP_CONTENT.visit.phones];
  const localizedFaqs = getLocalizedFaqs(center, { omitTimings: true });
  const faqSchema = [
    ...localizedFaqs,
    {
      question: 'How do I visit Shanti Sarovar, Raipur?',
      answer: `Visit us at ${SRP_CONTENT.visit.address}. Call ${phones[0]}. You can also use the enquiry form on this page.`,
    },
  ];

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Centers', url: 'https://www.brahmakumaris.com/centers' },
          { name: 'Retreat Centers', url: 'https://www.brahmakumaris.com/centers/retreat' },
          { name: SRP_RETREAT_NAME, url: SRP_CANONICAL },
          { name: 'Contact Us', url: pageUrl },
        ]}
      />
      <FAQPageSchema faqs={faqSchema} />

      <div className="srp-contact-page">
        <SrpMediaHero
          eyebrow={
            <>
              <MessageCircle className="h-4 w-4" aria-hidden /> Visit
            </>
          }
          title="Come to campus"
          lede="Directions, courses and enquire — in one place."
          animation={<ContactAuraAnimation />}
          actions={
            <a href="#srp-enquire" className="srp-media-hero__btn srp-media-hero__btn--ghost">
              Enquire
            </a>
          }
        />

        <div className="srp-contact-journey srp-container">
          <ContactSectionNav />

          <section id="srp-contact-main" className="srp-contact-block pb-2">
            <div className="srp-contact-main__grid">
              <aside className="srp-contact-main__aside">
                <div className="srp-panel space-y-3">
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-[var(--srp-gold)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm leading-relaxed">{SRP_CONTENT.visit.address}</p>
                      <p className="text-sm leading-relaxed">
                        {center.address.city} — {center.address.pincode}
                      </p>
                    </div>
                  </div>
                  <a
                    href={SRP_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="srp-btn srp-btn--primary !min-h-10 !text-sm w-full sm:w-auto"
                  >
                    <Navigation className="w-4 h-4" />
                    Open in Maps
                  </a>
                </div>

                <div className="srp-panel space-y-2">
                  {phones.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-2 text-sm hover:text-[var(--srp-gold-text)]"
                    >
                      <Phone className="w-4 h-4 text-[var(--srp-gold)]" />
                      {phone}
                    </a>
                  ))}
                  {SRP_CONTENT.visit.emails.map((email) => (
                    <a
                      key={email.href}
                      href={email.href}
                      className="flex items-center gap-2 text-sm hover:text-[var(--srp-gold-text)] pt-2 border-t border-[var(--border)]"
                    >
                      <Mail className="w-4 h-4 text-[var(--srp-gold)]" />
                      <span>
                        <span className="block text-xs text-[var(--srp-muted)]">{email.label}</span>
                        {email.text}
                      </span>
                    </a>
                  ))}
                </div>
              </aside>

              <div id="srp-enquire" className="srp-contact-main__enquire">
                <div className="srp-panel srp-panel--enquire">
                  <h2 className="text-xl font-bold mb-1 inline-flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[var(--srp-gold)]" />
                    Enquire
                  </h2>
                  <p className="text-sm text-[var(--srp-muted)] mb-4">
                    Share your details — we&apos;ll call or write back.
                  </p>
                  <ContactForm
                    center={center}
                    pageUrl={pageUrl}
                    hidePreferredTime
                    embedded
                    defaultMessage="I'd like to visit Shanti Sarovar, Raipur. Please share course or visit details."
                  />
                </div>
              </div>

              <div className="srp-contact-main__map srp-media aspect-[16/10]">
                <iframe
                  title="Shanti Sarovar, Raipur map"
                  src={SRP_MAP_EMBED_URL}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </section>

          <div className="srp-contact-support">
            <section id="srp-reach" className="srp-contact-block">
              <header className="srp-contact-block__head">
                <p className="srp-eyebrow">
                  <Navigation className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Reach
                </p>
                <h2 className="srp-heading !mb-0">How to reach</h2>
                <span className="srp-rule" />
              </header>
              <SrpHowToReach mapsUrl={SRP_MAPS_URL} />
            </section>

            <section id="srp-course" className="srp-contact-block">
              <header className="srp-contact-block__head">
                <p className="srp-eyebrow">
                  <BookOpen className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Learn
                </p>
                <h2 className="srp-heading !mb-0">Free 7-day Rajyoga</h2>
                <span className="srp-rule" />
              </header>
              <SrpCourseStory />
            </section>

            <section id="srp-meditation" className="srp-contact-block">
              <header className="srp-contact-block__head">
                <p className="srp-eyebrow">
                  <Headphones className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Practice
                </p>
                <h2 className="srp-heading !mb-0">Guided meditation</h2>
                <span className="srp-rule" />
              </header>
              <SrpMeditationStory />
            </section>

            <section id="srp-nearby" className="srp-contact-block srp-contact-block--centres">
              <div className="srp-centres-banner">
                <div>
                  <p className="srp-eyebrow !mb-1">
                    <Map className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Centres
                  </p>
                  <h2 className="srp-heading !mb-0 !text-xl md:!text-2xl">Looking for another centre?</h2>
                </div>
                <a href="/centers" className="srp-btn srp-btn--primary !min-h-10 !text-sm shrink-0">
                  Find a Center
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </section>

            <section id="srp-faq" className="srp-contact-block">
              <header className="srp-contact-block__head">
                <p className="srp-eyebrow">
                  <HelpCircle className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> FAQ
                </p>
                <h2 className="srp-heading !mb-0">Quick answers</h2>
                <span className="srp-rule" />
              </header>
              <SrpFaqSection center={center} />
            </section>

            <section id="srp-soul" className="srp-contact-block">
              <div className="srp-soul-wrap">
                <SoulSustenance title="Daily Wisdom" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
