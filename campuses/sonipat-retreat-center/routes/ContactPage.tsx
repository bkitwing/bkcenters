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
import { SP_CANONICAL, SP_CENTER, SP_SEO } from '../content';
import { spOg } from '../og';
import { SpMediaHero } from '../SpMediaHero';
import { ContactSectionNav } from '../contact/ContactSectionNav';
import { SpCourseStory } from '../contact/SpCourseStory';
import { SpMeditationStory } from '../contact/SpMeditationStory';
import { SpHowToReach } from '../contact/SpHowToReach';
import { SpFaqSection } from '../contact/SpFaqSection';
import { ContactAuraAnimation } from '../contact/ContactAuraAnimation';

export const revalidate = 86400;

const pageUrl = `${SP_CANONICAL}/contact`;
const { title, description, keywords, ogAlt } = SP_SEO.contact;
const ogImage = spOg('contact');

function mergeCenter(live: Center | null): Center {
  if (!live) return SP_CENTER;
  return {
    ...SP_CENTER,
    ...live,
    address: {
      line1: live.address?.line1 || SP_CENTER.address.line1,
      line2: live.address?.line2 || SP_CENTER.address.line2,
      line3: live.address?.line3 || SP_CENTER.address.line3,
      city: live.address?.city || SP_CENTER.address.city,
      pincode: live.address?.pincode || SP_CENTER.address.pincode,
    },
    email: live.email || SP_CENTER.email,
    contact: live.contact || SP_CENTER.contact,
    mobile: live.mobile || SP_CENTER.mobile,
    coords:
      live.coords?.[0] && live.coords?.[1] ? live.coords : SP_CENTER.coords,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title,
    description,
    keywords,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'website',
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

export default async function SonipatRetreatContactPage() {
  const live = await getCenterByCode(SP_CENTER.branch_code);
  const center = mergeCenter(live ?? null);

  const addressLines = [
    center.address.line1,
    center.address.line2,
    center.address.line3,
    [center.address.city, center.address.pincode].filter(Boolean).join(' — '),
  ].filter(Boolean);

  const phones = [center.contact, center.mobile]
    .flatMap((value) => String(value || '').split(','))
    .map((p) => p.trim())
    .filter(Boolean)
    .reduce<string[]>((list, part) => {
      const prev = list[list.length - 1];
      const std = prev?.includes('-') ? prev.split('-')[0] : '';
      const next = std && !part.includes('-') && /^\d{5,8}$/.test(part) ? `${std}-${part}` : part;
      if (!list.includes(next)) list.push(next);
      return list;
    }, []);

  const mapsUrl = `https://www.google.com/maps?q=${center.coords[0]},${center.coords[1]}`;

  const localizedFaqs = getLocalizedFaqs(center, { omitTimings: true });
  const faqSchema = [
    ...localizedFaqs,
    {
      question: `How do I visit ${center.name}?`,
      answer: `Visit us at ${addressLines.join(', ')}. ${phones[0] ? `Call ${phones[0]}.` : ''} You can also use the enquiry form on this page.`,
    },
    {
      question: 'Can anyone visit a Brahma Kumaris center and try Rajyoga meditation?',
      answer:
        'Yes. Every soul is welcome. Whether young or old, student, professional, or homemaker — the doors are open for all.',
    },
    {
      question: 'Do you ask for any money or donation?',
      answer:
        'No, there are no fees for any of the courses or services. As a voluntary organization, everything is offered as a service to the community.',
    },
    {
      question: 'Do I have to become a full member to attend classes?',
      answer:
        'Not at all. Every soul is welcome to attend classes freely, without any formal joining or commitment.',
    },
  ];

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: 'Centers', url: 'https://www.brahmakumaris.com/centers' },
          { name: 'Retreat Centers', url: 'https://www.brahmakumaris.com/centers/retreat' },
          { name: 'Sonipat Retreat Center', url: SP_CANONICAL },
          { name: 'Contact Us', url: pageUrl },
        ]}
      />
      {/* FAQ only here — LocalBusiness/Course live on the campus home URL to avoid duplicate entities */}
      <FAQPageSchema faqs={faqSchema} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            '@id': `${pageUrl}#webpage`,
            name: title,
            description,
            url: pageUrl,
            keywords: keywords.join(', '),
            isPartOf: { '@id': `${SP_CANONICAL}#webpage` },
            about: {
              '@type': 'Place',
              name: 'Sonipat Retreat Center',
              url: SP_CANONICAL,
              telephone: phones[0] || undefined,
              email: center.email || undefined,
              address: {
                '@type': 'PostalAddress',
                streetAddress: addressLines.slice(0, -1).join(', '),
                addressLocality: center.address.city,
                addressRegion: center.state,
                postalCode: center.address.pincode,
                addressCountry: 'IN',
              },
            },
            primaryImageOfPage: {
              '@type': 'ImageObject',
              url: ogImage,
              width: 1200,
              height: 630,
              caption: ogAlt,
            },
            inLanguage: 'en-IN',
          }),
        }}
      />

      <div className="sp-contact-page">
        <SpMediaHero
          eyebrow={
            <>
              <MessageCircle className="h-4 w-4" aria-hidden /> Visit
            </>
          }
          title="Come to campus"
          lede="Directions, courses and enquire — in one place."
          animation={<ContactAuraAnimation />}
          actions={
            <a href="#sp-enquire" className="sp-media-hero__btn sp-media-hero__btn--ghost">
              Enquire
            </a>
          }
        />

        <div className="sp-contact-journey sp-container">
          <ContactSectionNav />

          <section id="sp-contact-main" className="sp-contact-block pb-2">
            <div className="sp-contact-main__grid">
              <aside className="sp-contact-main__aside">
                <div className="sp-panel space-y-3">
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-[var(--sp-gold)] shrink-0 mt-0.5" />
                    <div>
                      {addressLines.map((line) => (
                        <p key={line} className="text-sm leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sp-btn sp-btn--primary !min-h-10 !text-sm w-full sm:w-auto"
                  >
                    <Navigation className="w-4 h-4" />
                    Open in Maps
                  </a>
                </div>

                <div className="sp-panel space-y-2">
                  {phones.slice(0, 4).map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-2 text-sm hover:text-[var(--sp-gold)]"
                    >
                      <Phone className="w-4 h-4 text-[var(--sp-gold)]" />
                      {phone}
                    </a>
                  ))}
                  {center.email ? (
                    <a
                      href={`mailto:${center.email}`}
                      className="flex items-center gap-2 text-sm hover:text-[var(--sp-gold)] pt-2 border-t border-[var(--border)]"
                    >
                      <Mail className="w-4 h-4 text-[var(--sp-gold)]" />
                      {center.email}
                    </a>
                  ) : null}
                </div>
              </aside>

              <div id="sp-enquire" className="sp-contact-main__enquire">
                <div className="sp-panel sp-panel--enquire">
                  <h2 className="text-xl font-bold mb-1 inline-flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[var(--sp-gold)]" />
                    Enquire
                  </h2>
                  <p className="text-sm text-[var(--sp-muted)] mb-4">
                    Share your details — we&apos;ll call or write back.
                  </p>
                  <ContactForm
                    center={center}
                    pageUrl={pageUrl}
                    hidePreferredTime
                    embedded
                    defaultMessage="I'd like to visit Sonipat Retreat Center. Please share course or visit details."
                  />
                </div>
              </div>

              <div className="sp-contact-main__map sp-media aspect-[16/10]">
                <iframe
                  title="Sonipat Retreat Center map"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    'Sonipat Retreat Centre, Bahalgarh, Sonipat'
                  )}&t=m&z=15&output=embed&iwloc=near`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </section>

          <div className="sp-contact-support">
            <section id="sp-reach" className="sp-contact-block">
              <header className="sp-contact-block__head">
                <p className="sp-eyebrow">
                  <Navigation className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Reach
                </p>
                <h2 className="sp-heading !mb-0">How to reach</h2>
                <span className="sp-rule" />
              </header>
              <SpHowToReach mapsUrl={mapsUrl} />
            </section>

            <section id="sp-course" className="sp-contact-block">
              <header className="sp-contact-block__head">
                <p className="sp-eyebrow">
                  <BookOpen className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Learn
                </p>
                <h2 className="sp-heading !mb-0">Free 7-day Rajyoga</h2>
                <span className="sp-rule" />
              </header>
              <SpCourseStory />
            </section>

            <section id="sp-meditation" className="sp-contact-block">
              <header className="sp-contact-block__head">
                <p className="sp-eyebrow">
                  <Headphones className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Practice
                </p>
                <h2 className="sp-heading !mb-0">Guided meditation</h2>
                <span className="sp-rule" />
              </header>
              <SpMeditationStory />
            </section>

            <section id="sp-nearby" className="sp-contact-block sp-contact-block--centres">
              <div className="sp-centres-banner">
                <div>
                  <p className="sp-eyebrow !mb-1">
                    <Map className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Centres
                  </p>
                  <h2 className="sp-heading !mb-0 !text-xl md:!text-2xl">Looking for another centre?</h2>
                </div>
                <a href="/centers" className="sp-btn sp-btn--primary !min-h-10 !text-sm shrink-0">
                  Find a Center
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </section>

            <section id="sp-faq" className="sp-contact-block">
              <header className="sp-contact-block__head">
                <p className="sp-eyebrow">
                  <HelpCircle className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> FAQ
                </p>
                <h2 className="sp-heading !mb-0">Quick answers</h2>
                <span className="sp-rule" />
              </header>
              <SpFaqSection center={center} />
            </section>

            <section id="sp-soul" className="sp-contact-block">
              <div className="sp-soul-wrap">
                <SoulSustenance title="Daily Wisdom" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
