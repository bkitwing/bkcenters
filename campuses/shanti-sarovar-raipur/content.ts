import { generateOgImageUrl } from '@/lib/ogUtils';
import { Center } from '@/lib/types';

/**
 * Shanti Sarovar Raipur micro-site.
 * Copy is translated from shanti-sarovar-raipur/ at the repo root (crawled from
 * https://www.brahmakumaris.com/raipur/shanti-sarovar/).
 * Image `src` stays null until Strapi replaces the placeholders.
 *
 * Theme color: teal #22816F.
 */

export const SRP_SLUG = 'shanti-sarovar-raipur';
export const SRP_CANONICAL = 'https://www.brahmakumaris.com/centers/shanti-sarovar-raipur';
export const SRP_RETREAT_NAME = 'Shanti Sarovar Retreat Center, Raipur';

/**
 * Featured / Open Graph images. Generated cards until the Strapi assets
 * arrive — swap each value for its Strapi CDN link.
 */
const ogCard = (title: string) =>
  generateOgImageUrl({ title, subtitle: 'Shanti Sarovar · Raipur', type: 'home' });
export const SRP_OG_IMAGES = {
  home: ogCard('Shanti Sarovar Retreat Center'),
  contact: ogCard('Contact Shanti Sarovar'),
  galleries: ogCard('Shanti Sarovar Gallery'),
  news: ogCard('Shanti Sarovar News'),
};

export const SRP_SEO = {
  home: {
    title: 'Shanti Sarovar Retreat Center | Brahma Kumaris Raipur',
    description:
      'Shanti Sarovar on Vidhan Sabha Marg, Raipur — the Brahma Kumaris spiritual retreat centre for retreats, value education and Rajyoga meditation in Chhattisgarh.',
    keywords: [
      'Shanti Sarovar Raipur',
      'Shanti Sarovar Retreat Center',
      'Brahma Kumaris Raipur',
      'Vidhan Sabha Marg Raipur',
      'Rajyoga meditation Raipur',
      'Retreat centre Chhattisgarh',
    ],
    ogAlt: 'Shanti Sarovar Retreat Center — Vidhan Sabha Marg, Raipur',
  },
  galleries: {
    title: 'Gallery | Shanti Sarovar Retreat Center Raipur',
    description:
      'Photo gallery of Shanti Sarovar, Raipur — Yoga Day, seva, celebrations, retreats and visits to the campus.',
    keywords: ['Shanti Sarovar Raipur gallery', 'Raipur retreat photos', 'Shanti Sarovar campus'],
    ogAlt: 'Gallery — Shanti Sarovar Retreat Center, Raipur',
  },
  news: {
    title: 'News | Shanti Sarovar Retreat Center Raipur',
    description:
      'News and campus highlights from Shanti Sarovar Retreat Center, Vidhan Sabha Marg, Raipur.',
    keywords: ['Shanti Sarovar Raipur news', 'Raipur Brahma Kumaris', 'Shanti Sarovar highlights'],
    ogAlt: 'News from Shanti Sarovar Retreat Center, Raipur',
  },
  contact: {
    title: 'Contact Us | Shanti Sarovar Retreat Center Raipur',
    description:
      'Contact Shanti Sarovar on Vidhan Sabha Marg, Raipur — address, phone, email and enquiry.',
    keywords: [
      'Contact Shanti Sarovar Raipur',
      'Brahma Kumaris Raipur address',
      'Shanti Sarovar Raipur phone',
    ],
    ogAlt: 'Contact Shanti Sarovar Retreat Center, Vidhan Sabha Marg, Raipur',
  },
} as const;

/** Directory center RAIPUR SHANTI SAROVAR (00346). */
export const SRP_CENTER: Center = {
  name: 'RAIPUR SHANTI SAROVAR',
  slug: 'raipur-shanti-sarovar',
  branch_code: '00346',
  address: {
    line1: 'Shanti Sarovar',
    line2: 'Khasra No. 486/1, 487, 488/1, 490/1',
    line3: 'Baloda Bazar Road, Vidhan Sabha Bhawan Marg',
    city: 'RAIPUR',
    pincode: '493221',
  },
  email: 'shantisarovar.ryp@bkivv.org',
  contact: '',
  mobile: '9425054040, 9425502255',
  country: 'INDIA',
  district: 'Raipur',
  state: 'CHHATTISGARH',
  zone: 'INDORE',
  sub_zone: 'IOP',
  section: '00346',
  region: 'INDIA',
  district_id: '2297',
  state_id: '35',
  country_id: '1',
  coords: ['21.2755648', '81.6976382'],
};

export const SRP_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=21.2755648,81.6976382';

export const SRP_MAP_EMBED_URL =
  'https://maps.google.com/maps?q=21.2755648,81.6976382&z=16&hl=en&output=embed';

export const SRP_YOUTUBE_HREF = 'https://www.youtube.com/@shantisarovarbrahmakumaris8283/featured';
export const SRP_MEDITATION_HREF = 'https://www.brahmakumaris.com/meditation/';

export type SrpImage = {
  id: string;
  /** Null until a Strapi asset is wired in. */
  src: string | null;
  alt: string;
  label: string;
};

/** Photo collections listed on the source page, in order. */
export const SRP_GALLERY_TITLES = [
  'International Yoga Day',
  'President Speech 2023 Theme Launch',
  'Swachh Bharat Mission',
  'Good Vibes, Good Life — BK Shivani Didi',
  'Art Work: Controlling Senses through Rajyoga',
  'Campus Visit by NCC Cadets',
  'Janmashtami Celebration',
  'Rajyoga Shivir — BK Deepa Didi',
  'World Environment Day Plantation',
  'Ruhani Sindhi Sammelan',
] as const;

export const SRP_CONTENT = {
  brand: 'Shanti Sarovar',
  brandEn: 'Shanti Sarovar',
  tagline: 'Spiritual Retreat Centre · Raipur',
  eyebrow: 'Brahma Kumaris · Raipur',
  location: 'Vidhan Sabha Marg, Raipur, Chhattisgarh',
  hero: {
    headline: 'Peace, balance and new energy',
    support:
      'Spiritual experience, retreats and Rajyoga meditation on Vidhan Sabha Marg, Raipur.',
    ctaPrimary: 'Contact us',
    ctaSecondary: 'Learn Rajyoga',
    media: {
      id: 'hero',
      src: null,
      alt: 'Shanti Sarovar campus, Raipur',
      label: 'Shanti Sarovar campus',
    } satisfies SrpImage,
  },
  about: {
    eyebrow: 'About Shanti Sarovar',
    title: 'A retreat centre with a history of its own',
    paragraphs: [
      'Shanti Sarovar is the spiritual retreat centre of the Prajapita Brahma Kumaris Ishwariya Vishwa Vidyalaya on Vidhan Sabha Marg in Raipur — the capital of Chhattisgarh, known at home and abroad as the “rice bowl” of India. For many reasons, it holds a special place in history.',
      'It has the honour of being the first retreat centre. Its foundation stone was laid by Rajyogini Dadi Janki Ji, then Joint Chief Administrator, and by senior brother Brahma Kumar Jagdish Chander Ji, the chief spokesperson.',
      'The Chhattisgarh Legislative Assembly stands right beside it. The Ministry of Human Resource Development, Government of India, recognises Shanti Sarovar as the authorised Resource Centre for central India, for teaching moral and spiritual values to teachers and students.',
      'It is the only retreat centre where, on the first day of the budget session, the ministers, MLAs and senior officers come to accept pure, sattvic Brahma Bhojan — and, through Rajyoga meditation, experience the calm and purity of this place.',
    ],
    chapters: ['The place', 'Its beginnings', 'A resource centre', 'A tradition of peace'],
    stats: [
      { value: 'Raipur', label: 'Vidhan Sabha Marg' },
      { value: 'First', label: 'Retreat centre' },
      { value: 'MHRD', label: 'Resource Centre' },
    ],
    media: {
      id: 'about',
      src: null,
      alt: 'Shanti Sarovar retreat centre, Raipur',
      label: 'A view of the campus',
    } satisfies SrpImage,
  },
  programmes: {
    eyebrow: 'Upcoming programmes',
    title: 'Retreats and programmes at Shanti Sarovar',
    text: 'Spiritual experience, retreats and Rajyoga meditation — bring peace, balance and new energy into your life. Get in touch for the dates of upcoming programmes.',
    cta: 'Ask about programmes',
  },
  services: {
    eyebrow: 'Courses and workshops',
    title: 'Services',
    intro:
      'Courses and workshops at Shanti Sarovar draw on Rajyoga meditation and spiritual values, for a calmer, stronger and more balanced life.',
    /** Card titles for the "Courses offered Section" images, keyed by filename. */
    labels: {
      'rajyoga-meditation': { title: 'Rajyoga Meditation', blurb: '' },
      'self-esteem': { title: 'Self Esteem', blurb: '' },
      'harmony-in-relations': { title: 'Harmony in Relations', blurb: '' },
      'stress-free-living': { title: 'Stress Free Living', blurb: '' },
      'self-managing-skills': { title: 'Self Managing Skills', blurb: '' },
      'conquering-anger': { title: 'Conquering Anger', blurb: '' },
      'living-values': { title: 'Living Values', blurb: '' },
      'leadership-attitudes': { title: 'Leadership Attitudes', blurb: '' },
      'positive-thinking': { title: 'Positive Thinking', blurb: '' },
    } as Record<string, { title: string; blurb: string }>,
    items: [
      { id: 'rajyoga-meditation', title: 'Rajyoga Meditation', text: '' },
      { id: 'self-esteem', title: 'Self Esteem', text: '' },
      { id: 'harmony-in-relations', title: 'Harmony in Relations', text: '' },
      { id: 'stress-free-living', title: 'Stress Free Living', text: '' },
      { id: 'self-managing-skills', title: 'Self Managing Skills', text: '' },
      { id: 'conquering-anger', title: 'Conquering Anger', text: '' },
      { id: 'living-values', title: 'Living Values', text: '' },
      { id: 'leadership-attitudes', title: 'Leadership Attitudes', text: '' },
      { id: 'positive-thinking', title: 'Positive Thinking', text: '' },
    ],
  },
  videos: {
    eyebrow: 'Video collection',
    title: 'Shanti Sarovar on YouTube',
    text: 'Join us on the Shanti Sarovar Retreat Centre YouTube channel, on a journey of self-realisation and spiritual progress. In our video collection you will find glimpses of inner peace, positivity and mindfulness.',
    cta: 'Watch now',
    href: SRP_YOUTUBE_HREF,
  },
  gallery: {
    eyebrow: 'Photo collection',
    title: 'Campus in pictures',
    intro:
      'Every picture of Shanti Sarovar tells a story — of service, dedication and spiritual peace. From the visits of the Dadis to leaders, teachers and students, this place gives everyone an experience of divine peace.',
    cta: 'Photo gallery of Shanti Sarovar',
    items: SRP_GALLERY_TITLES.map(
      (title, index): SrpImage => ({
        id: `gallery-${index + 1}`,
        src: null,
        alt: title,
        label: title,
      })
    ),
  },
  city: {
    eyebrow: 'Be with us',
    title: 'Raipur',
    subtitle: 'The capital of Chhattisgarh',
    welcome: 'You are welcome at Shanti Sarovar. Please use the details below to be in touch.',
  },
  visit: {
    title: 'Contact us',
    addressLabel: 'Address',
    address:
      'Brahma Kumaris Shanti Sarovar, Baloda Bazar Road, Vidhan Sabha Bhawan Marg, Raipur, Chhattisgarh',
    phones: ['+91 94250 54040', '+91 94255 02255'],
    emails: [
      {
        label: 'Shanti Sarovar, Raipur',
        href: 'mailto:shantisarovar.ryp@bkivv.org',
        text: 'shantisarovar.ryp@bkivv.org',
      },
    ],
    website: { href: 'https://www.brahmakumaris.com', text: 'www.brahmakumaris.com' },
    cta: 'Contact the centre',
    meditationCta: 'Begin your Rajyoga journey',
    footerNote: 'Brahma Kumaris — serving humanity through purity, peace and love.',
  },
} as const;
