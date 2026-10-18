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
import { ShkCourseStory } from '../contact/ShkCourseStory';
import { ShkFaqSection } from '../contact/ShkFaqSection';
import { ShkHowToReach } from '../contact/ShkHowToReach';
import { ShkMeditationStory } from '../contact/ShkMeditationStory';
import {
  SHK_CANONICAL,
  SHK_CENTER,
  SHK_CONTENT,
  SHK_MAP_EMBED_URL,
  SHK_MAPS_URL,
  SHK_OG_IMAGES,
  SHK_RETREAT_NAME,
  SHK_SEO,
} from '../content';
import { ShkMediaHero } from '../ShkMediaHero';

export const revalidate = 86400;

const pageUrl = `${SHK_CANONICAL}/contact`;
const { title, description, keywords, ogAlt } = SHK_SEO.contact;
const ogImage = SHK_OG_IMAGES.contact;

function mergeCenter(live: Center | null): Center {
  if (!live) return SHK_CENTER;
  return {
    ...SHK_CENTER,
    ...live,
    name: SHK_CENTER.name,
    address: {
      line1: live.address?.line1 || SHK_CENTER.address.line1,
      line2: live.address?.line2 || SHK_CENTER.address.line2,
      line3: live.address?.line3 || SHK_CENTER.address.line3,
      city: live.address?.city || SHK_CENTER.address.city,
      pincode: live.address?.pincode || SHK_CENTER.address.pincode,
    },
    email: live.email || SHK_CENTER.email,
    contact: live.contact || SHK_CENTER.contact,
    mobile: live.mobile || SHK_CENTER.mobile,
    coords: SHK_CENTER.coords,
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

export default async function ShantiShikharContactPage() {
  let live: Center | null = null;
  try {
    live = (await getCenterByCode(SHK_CENTER.branch_code)) ?? null;
  } catch {
    live = null;
  }
  const center = mergeCenter(live);
  const phones = [...SHK_CONTENT.visit.phones];
  const localizedFaqs = getLocalizedFaqs(center, { omitTimings: true });
  const faqSchema = [
    ...localizedFaqs,
    {
      question: 'How do I visit Shanti Shikhar?',
      answer: `Visit us at ${SHK_CONTENT.visit.address}. Call ${phones[0]}. You can also use the enquiry form on this page.`,
    },
  ];

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Centers', url: 'https://www.brahmakumaris.com/centers' },
          { name: 'Retreat Centers', url: 'https://www.brahmakumaris.com/centers/retreat' },
          { name: SHK_RETREAT_NAME, url: SHK_CANONICAL },
          { name: 'Contact Us', url: pageUrl },
        ]}
      />
      <FAQPageSchema faqs={faqSchema} />

      <div className="shk-contact-page">
        <ShkMediaHero
          eyebrow={
            <>
              <MessageCircle className="h-4 w-4" aria-hidden /> Visit
            </>
          }
          title="Come to campus"
          lede="Directions, courses and enquire — in one place."
          animation={<ContactAuraAnimation />}
          actions={
            <a href="#shk-enquire" className="shk-media-hero__btn shk-media-hero__btn--ghost">
              Enquire
            </a>
          }
        />

        <div className="shk-contact-journey shk-container">
          <ContactSectionNav />

          <section id="shk-contact-main" className="shk-contact-block pb-2">
            <div className="shk-contact-main__grid">
              <aside className="shk-contact-main__aside">
                <div className="shk-panel space-y-3">
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-[var(--shk-gold)] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm leading-relaxed">{SHK_CONTENT.visit.address}</p>
                      <p className="text-sm leading-relaxed">
                        {center.address.city} — {center.address.pincode}
                      </p>
                    </div>
                  </div>
                  <a
                    href={SHK_MAPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shk-btn shk-btn--primary !min-h-10 !text-sm w-full sm:w-auto"
                  >
                    <Navigation className="w-4 h-4" />
                    Open in Maps
                  </a>
                </div>

                <div className="shk-panel space-y-2">
                  {phones.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-2 text-sm hover:text-[var(--shk-gold)]"
                    >
                      <Phone className="w-4 h-4 text-[var(--shk-gold)]" />
                      {phone}
                    </a>
                  ))}
                  {SHK_CONTENT.visit.emails.map((email) => (
                    <a
                      key={email.href}
                      href={email.href}
                      className="flex items-center gap-2 text-sm hover:text-[var(--shk-gold)] pt-2 border-t border-[var(--border)]"
                    >
                      <Mail className="w-4 h-4 text-[var(--shk-gold)]" />
                      <span>
                        <span className="block text-xs text-[var(--shk-muted)]">{email.label}</span>
                        {email.text}
                      </span>
                    </a>
                  ))}
                </div>
              </aside>

              <div id="shk-enquire" className="shk-contact-main__enquire">
                <div className="shk-panel shk-panel--enquire">
                  <h2 className="text-xl font-bold mb-1 inline-flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[var(--shk-gold)]" />
                    Enquire
                  </h2>
                  <p className="text-sm text-[var(--shk-muted)] mb-4">
                    Share your details — we&apos;ll call or write back.
                  </p>
                  <ContactForm
                    center={center}
                    pageUrl={pageUrl}
                    hidePreferredTime
                    embedded
                    defaultMessage="I'd like to visit Shanti Shikhar, Nava Raipur. Please share course or visit details."
                  />
                </div>
              </div>

              <div className="shk-contact-main__map shk-media aspect-[16/10]">
                <iframe
                  title="Shanti Shikhar map"
                  src={SHK_MAP_EMBED_URL}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </section>

          <div className="shk-contact-support">
            <section id="shk-reach" className="shk-contact-block">
              <header className="shk-contact-block__head">
                <p className="shk-eyebrow">
                  <Navigation className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Reach
                </p>
                <h2 className="shk-heading !mb-0">How to reach</h2>
                <span className="shk-rule" />
              </header>
              <ShkHowToReach mapsUrl={SHK_MAPS_URL} />
            </section>

            <section id="shk-course" className="shk-contact-block">
              <header className="shk-contact-block__head">
                <p className="shk-eyebrow">
                  <BookOpen className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Learn
                </p>
                <h2 className="shk-heading !mb-0">Free 7-day Rajyoga</h2>
                <span className="shk-rule" />
              </header>
              <ShkCourseStory />
            </section>

            <section id="shk-meditation" className="shk-contact-block">
              <header className="shk-contact-block__head">
                <p className="shk-eyebrow">
                  <Headphones className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Practice
                </p>
                <h2 className="shk-heading !mb-0">Guided meditation</h2>
                <span className="shk-rule" />
              </header>
              <ShkMeditationStory />
            </section>

            <section id="shk-nearby" className="shk-contact-block shk-contact-block--centres">
              <div className="shk-centres-banner">
                <div>
                  <p className="shk-eyebrow !mb-1">
                    <Map className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Centres
                  </p>
                  <h2 className="shk-heading !mb-0 !text-xl md:!text-2xl">Looking for another centre?</h2>
                </div>
                <a href="/centers" className="shk-btn shk-btn--primary !min-h-10 !text-sm shrink-0">
                  Find a Center
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </section>

            <section id="shk-faq" className="shk-contact-block">
              <header className="shk-contact-block__head">
                <p className="shk-eyebrow">
                  <HelpCircle className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> FAQ
                </p>
                <h2 className="shk-heading !mb-0">Quick answers</h2>
                <span className="shk-rule" />
              </header>
              <ShkFaqSection center={center} />
            </section>

            <section id="shk-soul" className="shk-contact-block">
              <div className="shk-soul-wrap">
                <SoulSustenance title="Daily Wisdom" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
