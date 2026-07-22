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
import { generateOgImageUrl } from '@/lib/ogUtils';
import { getCenterByCode } from '@/lib/serverCenterData';
import { getLocalizedFaqs } from '@/lib/centerContent';
import type { Center } from '@/lib/types';
import { SS_CANONICAL, SS_CENTER } from '../content';
import { SsMediaHero } from '../SsMediaHero';
import { ContactSectionNav } from '../contact/ContactSectionNav';
import { SsCourseStory } from '../contact/SsCourseStory';
import { SsMeditationStory } from '../contact/SsMeditationStory';
import { SsHowToReach } from '../contact/SsHowToReach';
import { SsFaqSection } from '../contact/SsFaqSection';
import { ContactAuraAnimation } from '../contact/ContactAuraAnimation';

export const revalidate = 86400;

const pageUrl = `${SS_CANONICAL}/contact`;
const title = 'Visit & Contact — Shanti Sarovar | Brahma Kumaris Hyderabad';
const description =
  'Visit Shanti Sarovar, Gachibowli. Directions, free 7-day Rajyoga course, guided meditation, FAQ and enquiry.';

function mergeCenter(live: Center | null): Center {
  if (!live) return SS_CENTER;
  return {
    ...SS_CENTER,
    ...live,
    address: {
      line1: live.address?.line1 || SS_CENTER.address.line1,
      line2: live.address?.line2 || SS_CENTER.address.line2,
      line3: live.address?.line3 || SS_CENTER.address.line3,
      city: live.address?.city || SS_CENTER.address.city,
      pincode: live.address?.pincode || SS_CENTER.address.pincode,
    },
    email: live.email || SS_CENTER.email,
    contact: live.contact || SS_CENTER.contact,
    mobile: live.mobile || SS_CENTER.mobile,
    coords:
      live.coords?.[0] && live.coords?.[1] ? live.coords : SS_CENTER.coords,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const ogImage = generateOgImageUrl({
    title: 'Visit Shanti Sarovar',
    description: 'Gachibowli · Directions, courses & enquire',
    type: 'retreat',
    location: 'Hyderabad, Telangana',
  });

  return {
    title,
    description,
    keywords: [],
    robots: { index: true, follow: true },
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: 'website',
      siteName: 'Brahma Kumaris Centers',
      locale: 'en_IN',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

export default async function ShantiSarovarContactPage() {
  const live = await getCenterByCode(SS_CENTER.branch_code);
  const center = mergeCenter(live ?? null);

  const addressLines = [
    center.address.line1,
    center.address.line2,
    center.address.line3,
    [center.address.city, center.address.pincode].filter(Boolean).join(' — '),
  ].filter(Boolean);

  const phones = [
    ...String(center.contact || '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean),
    ...(center.mobile ? [center.mobile] : []),
  ].filter((p, i, arr) => arr.indexOf(p) === i);

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
          { name: 'Shanti Sarovar', url: SS_CANONICAL },
          { name: 'Visit & Contact', url: pageUrl },
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
            isPartOf: { '@id': `${SS_CANONICAL}#webpage` },
            about: { '@id': SS_CANONICAL },
            inLanguage: 'en-IN',
          }),
        }}
      />

      <div className="ss-contact-page">
        <SsMediaHero
          eyebrow={
            <>
              <MessageCircle className="h-4 w-4" aria-hidden /> Visit
            </>
          }
          title="Come to campus"
          lede="Directions, courses and enquire — in one place."
          animation={<ContactAuraAnimation />}
          actions={
            <a href="#ss-enquire" className="ss-media-hero__btn ss-media-hero__btn--ghost">
              Enquire
            </a>
          }
        />

        <div className="ss-contact-journey ss-container">
          <ContactSectionNav />

          <section id="ss-contact-main" className="ss-contact-block pb-2">
            <div className="ss-contact-main__grid">
              <aside className="ss-contact-main__aside">
                <div className="ss-panel space-y-3">
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-[var(--ss-gold)] shrink-0 mt-0.5" />
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
                    className="ss-btn ss-btn--primary !min-h-10 !text-sm w-full sm:w-auto"
                  >
                    <Navigation className="w-4 h-4" />
                    Open in Maps
                  </a>
                </div>

                <div className="ss-panel space-y-2">
                  {phones.slice(0, 4).map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-2 text-sm hover:text-[var(--ss-gold)]"
                    >
                      <Phone className="w-4 h-4 text-[var(--ss-gold)]" />
                      {phone}
                    </a>
                  ))}
                  {center.email ? (
                    <a
                      href={`mailto:${center.email}`}
                      className="flex items-center gap-2 text-sm hover:text-[var(--ss-gold)] pt-2 border-t border-[var(--border)]"
                    >
                      <Mail className="w-4 h-4 text-[var(--ss-gold)]" />
                      {center.email}
                    </a>
                  ) : null}
                </div>
              </aside>

              <div id="ss-enquire" className="ss-contact-main__enquire">
                <div className="ss-panel ss-panel--enquire">
                  <h2 className="text-xl font-bold mb-1 inline-flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[var(--ss-gold)]" />
                    Enquire
                  </h2>
                  <p className="text-sm text-[var(--ss-muted)] mb-4">
                    Share your details — we&apos;ll call or write back.
                  </p>
                  <ContactForm
                    center={center}
                    pageUrl={pageUrl}
                    hidePreferredTime
                    embedded
                    defaultMessage="I'd like to visit Shanti Sarovar. Please share course or visit details."
                  />
                </div>
              </div>

              <div className="ss-contact-main__map ss-media aspect-[16/10]">
                <iframe
                  title="Shanti Sarovar map"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(
                    `${center.name} Gachibowli Hyderabad`
                  )}&t=m&z=15&output=embed&iwloc=near`}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </section>

          <div className="ss-contact-support">
            <section id="ss-reach" className="ss-contact-block">
              <header className="ss-contact-block__head">
                <p className="ss-eyebrow">
                  <Navigation className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Reach
                </p>
                <h2 className="ss-heading !mb-0">How to reach</h2>
                <span className="ss-rule" />
              </header>
              <SsHowToReach mapsUrl={mapsUrl} />
            </section>

            <section id="ss-course" className="ss-contact-block">
              <header className="ss-contact-block__head">
                <p className="ss-eyebrow">
                  <BookOpen className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Learn
                </p>
                <h2 className="ss-heading !mb-0">Free 7-day Rajyoga</h2>
                <span className="ss-rule" />
              </header>
              <SsCourseStory />
            </section>

            <section id="ss-meditation" className="ss-contact-block">
              <header className="ss-contact-block__head">
                <p className="ss-eyebrow">
                  <Headphones className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Practice
                </p>
                <h2 className="ss-heading !mb-0">Guided meditation</h2>
                <span className="ss-rule" />
              </header>
              <SsMeditationStory />
            </section>

            <section id="ss-nearby" className="ss-contact-block ss-contact-block--centres">
              <div className="ss-centres-banner">
                <div>
                  <p className="ss-eyebrow !mb-1">
                    <Map className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Centres
                  </p>
                  <h2 className="ss-heading !mb-0 !text-xl md:!text-2xl">Looking for another centre?</h2>
                </div>
                <a href="/centers" className="ss-btn ss-btn--primary !min-h-10 !text-sm shrink-0">
                  Find a Center
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </section>

            <section id="ss-faq" className="ss-contact-block">
              <header className="ss-contact-block__head">
                <p className="ss-eyebrow">
                  <HelpCircle className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> FAQ
                </p>
                <h2 className="ss-heading !mb-0">Quick answers</h2>
                <span className="ss-rule" />
              </header>
              <SsFaqSection center={center} />
            </section>

            <section id="ss-soul" className="ss-contact-block">
              <div className="ss-soul-wrap">
                <SoulSustenance title="Daily Wisdom" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
