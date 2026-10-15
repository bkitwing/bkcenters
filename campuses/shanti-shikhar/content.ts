import { Center } from '@/lib/types';

/**
 * Shanti Shikhar micro-site.
 * Copy is taken from content/ (crawled from
 * https://www.brahmakumaris.com/raipur/shanti-shikhar/).
 * Image `src` stays null until Strapi replaces the placeholders.
 *
 * Theme colors from that page: purple #7f5bd5 and gold #f2c66d.
 */

export const SHK_SLUG = 'shanti-shikhar';
export const SHK_CANONICAL = 'https://www.brahmakumaris.com/centers/shanti-shikhar';
export const SHK_RETREAT_NAME = 'Shanti Shikhar Retreat Center';

export const SHK_OG_IMAGE =
  'https://www.brahmakumaris.com/centers/brahma-kumaris-logo.webp';

export const SHK_SEO = {
  home: {
    title: 'Shanti Shikhar Retreat Center | Brahma Kumaris Nava Raipur',
    description:
      'Shanti Shikhar in Nava Raipur, Atal Nagar — the Brahma Kumaris academy for a new peaceful world, for retreats, courses, workshops and Rajyoga meditation.',
    keywords: [
      'Shanti Shikhar',
      'Shanti Shikhar Retreat Center',
      'Brahma Kumaris Nava Raipur',
      'Nava Raipur Atal Nagar',
      'Rajyoga meditation Raipur',
      'Academy for a New Peaceful World',
    ],
    ogAlt: 'Shanti Shikhar Retreat Center — Nava Raipur, Atal Nagar',
  },
  galleries: {
    title: 'Gallery | Shanti Shikhar Retreat Center Nava Raipur',
    description:
      'Photo gallery of Shanti Shikhar — the campus, inauguration and facilities in Nava Raipur, Atal Nagar.',
    keywords: [
      'Shanti Shikhar gallery',
      'Nava Raipur retreat photos',
      'Shanti Shikhar campus',
    ],
    ogAlt: 'Gallery — Shanti Shikhar Retreat Center, Nava Raipur',
  },
  news: {
    title: 'News | Shanti Shikhar Retreat Center Nava Raipur',
    description:
      'News and campus highlights from Shanti Shikhar Retreat Center, Nava Raipur, Atal Nagar.',
    keywords: [
      'Shanti Shikhar news',
      'Nava Raipur Brahma Kumaris',
      'Shanti Shikhar highlights',
    ],
    ogAlt: 'News from Shanti Shikhar Retreat Center, Nava Raipur',
  },
  contact: {
    title: 'Contact Us | Shanti Shikhar Retreat Center Nava Raipur',
    description:
      'Contact Shanti Shikhar in Sector 20, Nava Raipur, Atal Nagar — address, phone, email and enquiry.',
    keywords: [
      'Contact Shanti Shikhar',
      'Nava Raipur Brahma Kumaris address',
      'Shanti Shikhar phone',
    ],
    ogAlt: 'Contact Shanti Shikhar Retreat Center, Sector 20, Nava Raipur',
  },
} as const;

/**
 * Directory center NAYA RAIPUR (04376) matches this campus.
 * Phones and shantisarovar.ryp@bkivv.org are the contact block in content/07.
 * nayaraipur@bkivv.org and 7489946997 are the Shanti Shikhar line on the same source page
 * and the directory mobile for this address — the enquiry form uses that email.
 */
export const SHK_CENTER: Center = {
  name: 'NAYA RAIPUR',
  slug: 'naya-raipur',
  branch_code: '04376',
  address: {
    line1: 'Brahma Kumaris Shanti Shikhar',
    line2: 'Kaya Bandha, Sector 20',
    line3: 'Nava Raipur Atal Nagar',
    city: 'NAYA RAIPUR',
    pincode: '492002',
  },
  email: 'nayaraipur@bkivv.org',
  contact: '9425054040, 9425502255, 7000173217',
  mobile: '7489946997',
  country: 'INDIA',
  district: 'Raipur',
  state: 'CHHATTISGARH',
  zone: 'INDORE',
  sub_zone: 'IOP',
  section: '04376',
  region: 'INDIA',
  district_id: '2297',
  state_id: '35',
  country_id: '1',
  coords: ['21.1680018', '81.7865411'],
};

export const SHK_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=21.1680018,81.7865411';

export const SHK_MAP_EMBED_URL =
  'https://maps.google.com/maps?q=21.1680018,81.7865411&z=16&hl=en&output=embed';

export const SHK_MEDITATION_HREF = 'https://www.brahmakumaris.com/meditation/';
export const SHK_INAUGURATION_HREF =
  'https://www.youtube.com/live/ND8twQVtplw?si=g7IfTa6zXRYEriIk';

export type ShkImage = {
  id: string;
  /** Null until a Strapi asset is wired in. */
  src: string | null;
  alt: string;
  label: string;
};

export const SHK_CONTENT = {
  brand: 'Shanti Shikhar',
  brandEn: 'Shanti Shikhar',
  tagline: 'An Academy for a New Peaceful World',
  eyebrow: 'Brahma Kumaris · Nava Raipur',
  location: 'Nava Raipur, Atal Nagar, Chhattisgarh',
  hero: {
    ctaPrimary: 'Contact us',
    ctaSecondary: 'Learn Rajyoga',
    media: {
      id: 'hero',
      src: null,
      alt: 'Shanti Shikhar campus',
      label: 'Shanti Shikhar campus',
    } satisfies ShkImage,
  },
  about: {
    eyebrow: 'About Shanti Shikhar',
    title: 'A centre for spiritual learning',
    paragraphs: [
      'Shanti Shikhar, the Academy for a New Peaceful World, was established by the Brahma Kumaris in the living city of Nava Raipur. It offers a pleasant, peaceful setting where the mind can grow calm and stable, and the soul can recharge.',
      'In this atmosphere of peace and spirituality, retreats, courses, workshops and seminars will be offered to nurture values and inner strength.',
      'Clean, quiet surroundings, natural beauty and a distinctive setting make this a fine place of learning. The centre will help souls develop spiritual power and inner awareness, so that, with the power of the Supreme, thousands may grow into people of good character — capable, balanced and ready to serve.',
    ],
    stats: [
      { value: 'Nava Raipur', label: 'Atal Nagar' },
      { value: '1,500', label: 'Auditorium seats' },
      { value: '200', label: 'Seminar seats' },
    ],
    media: {
      id: 'about',
      src: null,
      alt: 'Shanti Shikhar — a wide green campus',
      label: 'A view of the campus',
    } satisfies ShkImage,
  },
  inauguration: {
    eyebrow: 'A historic moment',
    title: 'A divine campus dedicated to world peace',
    subtitle: 'Inaugurated by the Hon’ble Prime Minister',
    cta: 'Watch the full programme',
    href: SHK_INAUGURATION_HREF,
    slides: [
      {
        id: 'in-1',
        src: null,
        alt: 'Shanti Shikhar inauguration',
        label: 'Inauguration',
      },
      {
        id: 'in-2',
        src: null,
        alt: 'Shanti Shikhar inauguration',
        label: 'Inauguration',
      },
      {
        id: 'in-3',
        src: null,
        alt: 'Shanti Shikhar inauguration',
        label: 'Inauguration',
      },
      {
        id: 'in-4',
        src: null,
        alt: 'Shanti Shikhar inauguration',
        label: 'Inauguration',
      },
      {
        id: 'in-5',
        src: null,
        alt: 'Shanti Shikhar inauguration',
        label: 'Inauguration',
      },
      {
        id: 'in-6',
        src: null,
        alt: 'Shanti Shikhar auditorium',
        label: 'Auditorium',
      },
      {
        id: 'in-7',
        src: null,
        alt: 'Shanti Shikhar campus',
        label: 'Campus',
      },
    ] satisfies ShkImage[],
  },
  facilities: {
    eyebrow: 'Spaces for learning and silence',
    title: 'Facilities at Shanti Shikhar',
    galleryCta: 'Photo gallery of Shanti Shikhar',
    items: [
      {
        id: 'auditorium',
        title: 'Auditorium',
        text: 'The main auditorium for large conferences, cultural programmes and spiritual sessions.',
        tags: ['1,500 seats', 'Modern AV system', 'Fully air-conditioned'],
        media: {
          id: 'fac-auditorium',
          src: null,
          alt: 'Shanti Shikhar auditorium',
          label: 'Auditorium',
        } satisfies ShkImage,
      },
      {
        id: 'seminar',
        title: 'Seminar hall',
        text: 'A separate hall for workshops, training and focused group sessions.',
        tags: ['200 seats', 'Presentation facilities', 'Air-conditioned'],
        media: {
          id: 'fac-seminar',
          src: null,
          alt: 'Shanti Shikhar seminar hall',
          label: 'Seminar hall',
        } satisfies ShkImage,
      },
      {
        id: 'meditation',
        title: 'Rajyoga meditation room',
        text: 'Quiet rooms, specially prepared, for a deep spiritual experience through Rajyoga.',
        tags: ['Soft, gentle light', 'A silent zone', 'Prepared for Rajyoga practice'],
        media: {
          id: 'fac-meditation',
          src: null,
          alt: 'Rajyoga meditation room',
          label: 'Meditation room',
        } satisfies ShkImage,
      },
    ],
  },
  services: {
    eyebrow: 'Join in service',
    title: 'Services offered',
    intro:
      'This academy shares spiritual knowledge and Rajyoga with every section of society, and guides souls towards a more aware, empowered and balanced life.',
    /** Card titles for the "Services offered Section" images, keyed by filename. */
    labels: {
      'self-managing-skills': {
        title: 'Meditational retreat',
        blurb:
          'Retreats for every section of society — for a positive life, a finer personality and the art of managing stress.',
      },
      'living-values': {
        title: 'Value based education',
        blurb:
          'Residential and non-residential values-education programmes for government and private institutions.',
      },
      'empowerment-services': {
        title: 'Empowerment',
        blurb: 'Programmes of empowerment for farmers, women, youth and children.',
      },
      'community-services': {
        title: 'Community service',
        blurb: 'Community service and village outreach, to encourage spirituality and inner strength.',
      },
      'environmental-awareness': {
        title: 'Care for nature',
        blurb: 'Programmes that awaken care for the environment.',
      },
      'health-camp': {
        title: 'Health camps',
        blurb:
          'Holistic health camps for those living with diabetes, heart conditions and other illnesses, and support for freedom from addiction.',
      },
    },
    items: [
      {
        id: 'retreat',
        title: 'Meditational retreat',
        text: 'Retreats for every section of society — for a positive life, a finer personality and the art of managing stress.',
      },
      {
        id: 'values',
        title: 'Value based education',
        text: 'Residential and non-residential values-education programmes for government and private institutions.',
      },
      {
        id: 'empowerment',
        title: 'Empowerment',
        text: 'Programmes of empowerment for farmers, women, youth and children.',
      },
      {
        id: 'community',
        title: 'Community service',
        text: 'Community service and village outreach, to encourage spirituality and inner strength.',
      },
      {
        id: 'environment',
        title: 'Care for nature',
        text: 'Programmes that awaken care for the environment.',
      },
      {
        id: 'health',
        title: 'Health camps',
        text: 'Holistic health camps for those living with diabetes, heart conditions and other illnesses, and support for freedom from addiction.',
      },
    ],
  },
  city: {
    eyebrow: 'Be with us',
    title: 'Nava Raipur Atal Nagar',
    subtitle: 'A modern, emerging city of Chhattisgarh',
    welcome: 'You are welcome at Shanti Shikhar. Please use the details below to be in touch.',
  },
  visit: {
    title: 'Contact us',
    addressLabel: 'Address',
    address:
      'Brahma Kumaris Shanti Shikhar, Kaya Bandha, Sector 20, Nava Raipur Atal Nagar, Chhattisgarh',
    phones: ['+91 94250 54040', '+91 94255 02255', '+91 70001 73217', '+91 74899 46997'],
    emails: [
      { label: 'Shanti Shikhar', href: 'mailto:nayaraipur@bkivv.org', text: 'nayaraipur@bkivv.org' },
      {
        label: 'Raipur',
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
