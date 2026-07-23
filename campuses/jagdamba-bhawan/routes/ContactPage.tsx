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
import { JB_CANONICAL, JB_CENTER, JB_MAP_EMBED_URL, JB_MAPS_URL, JB_OG_IMAGES, JB_RETREAT_NAME, JB_SEO } from '../content';
import { JbMediaHero } from '../JbMediaHero';
import { ContactSectionNav } from '../contact/ContactSectionNav';
import { JbCourseStory } from '../contact/JbCourseStory';
import { JbMeditationStory } from '../contact/JbMeditationStory';
import { JbHowToReach } from '../contact/JbHowToReach';
import { JbFaqSection } from '../contact/JbFaqSection';
import { ContactAuraAnimation } from '../contact/ContactAuraAnimation';

export const revalidate = 86400;

const pageUrl = `${JB_CANONICAL}/contact`;
const { title, description, keywords, ogAlt } = JB_SEO.contact;
const ogImage = JB_OG_IMAGES.contact;

function mergeCenter(live: Center | null): Center {
  if (!live) return JB_CENTER;
  return {
    ...JB_CENTER,
    ...live,
    address: {
      line1: live.address?.line1 || JB_CENTER.address.line1,
      line2: live.address?.line2 || JB_CENTER.address.line2,
      line3: live.address?.line3 || JB_CENTER.address.line3,
      city: live.address?.city || JB_CENTER.address.city,
      pincode: live.address?.pincode || JB_CENTER.address.pincode,
    },
    email: live.email || JB_CENTER.email,
    contact: live.contact || JB_CENTER.contact,
    mobile: live.mobile || JB_CENTER.mobile,
    coords: JB_CENTER.coords,
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

export default async function JagdambaBhawanContactPage() {
  const live = await getCenterByCode(JB_CENTER.branch_code);
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

  const mapsUrl = JB_MAPS_URL;

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
          { name: JB_RETREAT_NAME, url: JB_CANONICAL },
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
            isPartOf: { '@id': `${JB_CANONICAL}#webpage` },
            about: {
              '@type': 'Place',
              name: JB_RETREAT_NAME,
              url: JB_CANONICAL,
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

      <div className="jb-contact-page">
        <JbMediaHero
          eyebrow={
            <>
              <MessageCircle className="h-4 w-4" aria-hidden /> Visit
            </>
          }
          title="Come to campus"
          lede="Directions, courses and enquire — in one place."
          animation={<ContactAuraAnimation />}
          actions={
            <a href="#jb-enquire" className="jb-media-hero__btn jb-media-hero__btn--ghost">
              Enquire
            </a>
          }
        />

        <div className="jb-contact-journey jb-container">
          <ContactSectionNav />

          <section id="jb-contact-main" className="jb-contact-block pb-2">
            <div className="jb-contact-main__grid">
              <aside className="jb-contact-main__aside">
                <div className="jb-panel space-y-3">
                  <div className="flex gap-3">
                    <MapPin className="w-5 h-5 text-[var(--jb-gold)] shrink-0 mt-0.5" />
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
                    className="jb-btn jb-btn--primary !min-h-10 !text-sm w-full sm:w-auto"
                  >
                    <Navigation className="w-4 h-4" />
                    Open in Maps
                  </a>
                </div>

                <div className="jb-panel space-y-2">
                  {phones.slice(0, 4).map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/\s/g, '')}`}
                      className="flex items-center gap-2 text-sm hover:text-[var(--jb-gold)]"
                    >
                      <Phone className="w-4 h-4 text-[var(--jb-gold)]" />
                      {phone}
                    </a>
                  ))}
                  {center.email ? (
                    <a
                      href={`mailto:${center.email}`}
                      className="flex items-center gap-2 text-sm hover:text-[var(--jb-gold)] pt-2 border-t border-[var(--border)]"
                    >
                      <Mail className="w-4 h-4 text-[var(--jb-gold)]" />
                      {center.email}
                    </a>
                  ) : null}
                </div>
              </aside>

              <div id="jb-enquire" className="jb-contact-main__enquire">
                <div className="jb-panel jb-panel--enquire">
                  <h2 className="text-xl font-bold mb-1 inline-flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[var(--jb-gold)]" />
                    Enquire
                  </h2>
                  <p className="text-sm text-[var(--jb-muted)] mb-4">
                    Share your details — we&apos;ll call or write back.
                  </p>
                  <ContactForm
                    center={center}
                    pageUrl={pageUrl}
                    hidePreferredTime
                    embedded
                    defaultMessage="I'd like to visit Jagdamba Bhawan. Please share course or visit details."
                  />
                </div>
              </div>

              <div className="jb-contact-main__map jb-media aspect-[16/10]">
                <iframe
                  title="Jagdamba Bhawan map"
                  src={JB_MAP_EMBED_URL}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          </section>

          <div className="jb-contact-support">
            <section id="jb-reach" className="jb-contact-block">
              <header className="jb-contact-block__head">
                <p className="jb-eyebrow">
                  <Navigation className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Reach
                </p>
                <h2 className="jb-heading !mb-0">How to reach</h2>
                <span className="jb-rule" />
              </header>
              <JbHowToReach mapsUrl={mapsUrl} />
            </section>

            <section id="jb-course" className="jb-contact-block">
              <header className="jb-contact-block__head">
                <p className="jb-eyebrow">
                  <BookOpen className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Learn
                </p>
                <h2 className="jb-heading !mb-0">Free 7-day Rajyoga</h2>
                <span className="jb-rule" />
              </header>
              <JbCourseStory />
            </section>

            <section id="jb-meditation" className="jb-contact-block">
              <header className="jb-contact-block__head">
                <p className="jb-eyebrow">
                  <Headphones className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Practice
                </p>
                <h2 className="jb-heading !mb-0">Guided meditation</h2>
                <span className="jb-rule" />
              </header>
              <JbMeditationStory />
            </section>

            <section id="jb-nearby" className="jb-contact-block jb-contact-block--centres">
              <div className="jb-centres-banner">
                <div>
                  <p className="jb-eyebrow !mb-1">
                    <Map className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> Centres
                  </p>
                  <h2 className="jb-heading !mb-0 !text-xl md:!text-2xl">Looking for another centre?</h2>
                </div>
                <a href="/centers" className="jb-btn jb-btn--primary !min-h-10 !text-sm shrink-0">
                  Find a Center
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </section>

            <section id="jb-faq" className="jb-contact-block">
              <header className="jb-contact-block__head">
                <p className="jb-eyebrow">
                  <HelpCircle className="inline h-3.5 w-3.5 -translate-y-px" aria-hidden /> FAQ
                </p>
                <h2 className="jb-heading !mb-0">Quick answers</h2>
                <span className="jb-rule" />
              </header>
              <JbFaqSection center={center} />
            </section>

            <section id="jb-soul" className="jb-contact-block">
              <div className="jb-soul-wrap">
                <SoulSustenance title="Daily Wisdom" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
