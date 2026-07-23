import { Center } from '@/lib/types';

/**
 * Jagdamba Bhawan micro-site content — CMS-ready section keys.
 * Home hero / about / courses / gallery teaser: website-section 62 (see jb-home-data.ts).
 * Hero Section = desktop/tablet; Hero Mobile = phones.
 */
export const JB_SLUG = 'jagdamba-bhawan';
export const JB_CANONICAL = 'https://www.brahmakumaris.com/centers/jagdamba-bhawan';
/** Canonical public name — used in titles, breadcrumbs and JSON-LD. */
export const JB_RETREAT_NAME = 'Jagdamba Bhawan Retreat Center';

/** Featured / Open Graph images (Strapi CDN). */
export const JB_OG_IMAGES = {
  home: 'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/Featured_Image_Home_page_11a9b7016b.webp',
  contact:
    'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/Contact_us_Jabdamba_Bhawan_Retreat_Center_afcf6b3213.jpg',
  news: 'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/Featured_Image_Service_news_Jagdamba_Bhawan_974ea42b5a.webp',
  events:
    'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/Events_At_Jagdamba_Bhawan_Reterat_Center_9842fa3744.webp',
  galleries:
    'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/Galleries_Jagdamba_Bhawan_Retreat_Center_Images_f96cc92709.webp',
  about:
    'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/About_us_Jagdamaba_Bhawan_Retreat_Center_f982133d0e.webp',
} as const;

/**
 * Per-page SEO — titles keep “Jagdamba Bhawan Retreat Center” + page intent
 * within ~50–60 chars; descriptions/keywords align with JSON-LD
 * (same pattern as Shanti Sarovar Retreat Center).
 */
export const JB_SEO = {
  home: {
    title: 'Jagdamba Bhawan Retreat Center | Brahma Kumaris Pune',
    description:
      'Jagdamba Bhawan Retreat Center in Pisoli, Pune — a 3.5-acre Brahma Kumaris campus for Rajyoga meditation, courses, retreats and workshops, opened in honour of Mamma.',
    keywords: [
      'Jagdamba Bhawan Retreat Center',
      'Brahma Kumaris Pune',
      'Pisoli retreat',
      'Rajyoga meditation Pune',
      'Mateshwari Jagdamba Saraswati',
      'meditation retreat Maharashtra',
      'Brahma Kumaris Retreat Center Pune',
    ] as string[],
    ogAlt:
      'Jagdamba Bhawan Retreat Center — aerial view of the Brahma Kumaris campus in Pisoli, Pune',
  },
  events: {
    title: 'Events | Jagdamba Bhawan Retreat Center Pune',
    description:
      'Upcoming and past events at Jagdamba Bhawan Retreat Center, Pune — retreats, workshops, conferences and campus programmes.',
    keywords: [
      'Jagdamba Bhawan Retreat Center events',
      'Pune retreat events',
      'Brahma Kumaris workshops Pune',
      'spiritual programmes Pisoli',
      'meditation retreat programmes',
    ] as string[],
    ogAlt:
      'Events at Jagdamba Bhawan Retreat Center — programmes and gatherings in Pune',
  },
  news: {
    title: 'Service News | Jagdamba Bhawan Retreat Center',
    description:
      'Service news from Jagdamba Bhawan Retreat Center, Pune — campus highlights, seva, conferences and community programmes.',
    keywords: [
      'Jagdamba Bhawan Retreat Center news',
      'Service News Brahma Kumaris',
      'Pune campus news',
      'Brahma Kumaris seva',
      'Jagdamba Bhawan highlights',
    ] as string[],
    ogAlt:
      'Service News from Jagdamba Bhawan Retreat Center — community service and campus programmes',
  },
  galleries: {
    title: 'Galleries | Jagdamba Bhawan Retreat Center Pune',
    description:
      'Photo galleries from Jagdamba Bhawan Retreat Center — campus moments, retreats, events, culture and service in Pune.',
    keywords: [
      'Jagdamba Bhawan Retreat Center gallery',
      'Pune retreat photos',
      'Brahma Kumaris campus photos',
      'Jagdamba Bhawan moments',
      'meditation campus gallery',
    ] as string[],
    ogAlt:
      'Galleries — photo collections from Jagdamba Bhawan Retreat Center in Pisoli, Pune',
  },
  about: {
    title: 'About | Jagdamba Bhawan Retreat Center Pune',
    description:
      'About Jagdamba Bhawan Retreat Center in Pisoli, Pune — vision, faculty, and a walk through meditation halls, Mamma’s Melody, silent zones and campus architecture.',
    keywords: [
      'About Jagdamba Bhawan Retreat Center',
      'Jagdamba Bhawan campus',
      'Gyan Veena Hall Pune',
      'Mamma Melody Brahma Kumaris',
      'Pisoli meditation retreat',
    ] as string[],
    ogAlt: 'About Us — Jagdamba Bhawan Retreat Center in Pisoli, Pune',
  },
  contact: {
    title: 'Contact Us | Jagdamba Bhawan Retreat Center Pune',
    description:
      'Contact Jagdamba Bhawan Retreat Center in Pisoli, Pune — address, phone, directions, Rajyoga course and enquiry.',
    keywords: [
      'Contact Jagdamba Bhawan Retreat Center',
      'Jagdamba Bhawan Pisoli address',
      'visit Brahma Kumaris Pune',
      'Rajyoga course Pune',
      'Jagdamba Bhawan phone email',
    ] as string[],
    ogAlt:
      'Contact Us — Jagdamba Bhawan Retreat Center in Pisoli, Pune with location, phone and email',
  },
};

export const JB_CENTER: Center = {
  name: 'PUNE JAGDAMBA BHAWAN',
  slug: 'pune-jagdamba-bhawan',
  branch_code: '04543',
  address: {
    line1: 'SURVEY NO: 20/B,  JAGDAMBA BHAWAN',
    line2: "NEAR SMEF'S SCHOOL OF ARCHITECTURE",
    line3: 'JAGDAMBA BHAWAN MARG, PISOLI, TAL: HAVELI',
    city: 'PUNE',
    pincode: '411060',
  },
  email: 'jagdambabhawan.pun@bkivv.org',
  contact: '7568040767',
  mobile: '7568040767',
  country: 'INDIA',
  district: 'PUNE',
  state: 'MAHARASHTRA',
  zone: '',
  sub_zone: '',
  section: '',
  region: 'INDIA',
  district_id: '',
  state_id: '',
  country_id: '',
  /** Lat, lng — Google Maps place pin for Jagdamba Bhawan Meditation & Retreat Centre */
  coords: ['18.433823', '73.906126'],
};

/** Official Google Maps embed for home + contact (exact campus pin). */
export const JB_MAP_EMBED_URL =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4839.800670526627!2d73.9061261761336!3d18.43382258264306!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2ebb7984e7293%3A0xda939dac61ce3a49!2sJagdamba%20Bhawan%20Meditation%20%26%20Retreat%20Centre!5e1!3m2!1sen!2sin!4v1784802949175!5m2!1sen!2sin';

/** Opens the same place in Google Maps (external). */
export const JB_MAPS_URL =
  'https://www.google.com/maps/place/Jagdamba+Bhawan+Meditation+%26+Retreat+Centre/@18.4338226,73.9061262,17z';

export type MediaSlot = {
  id: string;
  src: string | null;
  alt: string;
  label?: string;
};

export type CourseItem = {
  id: string;
  title: string;
  blurb: string;
  media: MediaSlot;
};

export const JB_CONTENT = {
  brand: 'Jagdamba Bhawan',
  tagline: 'A Heaven of Peace and Tranquility',
  hero: {
    support:
      'A 3.5-acre Brahma Kumaris Retreat Center in Pisoli, Pune — opened 28 Jan 2018 in honour of Mateshwari Jagdamba Saraswati (Mamma).',
    ctaPrimary: 'Know more',
    ctaSecondary: 'Plan your visit',
    media: {
      id: 'hero',
      src: null,
      alt: 'Jagdamba Bhawan Retreat Center — Pisoli, Pune',
      label: 'Campus dawn',
    } satisfies MediaSlot,
  },
  about: {
    eyebrow: 'A Heaven of Peace and Tranquility',
    title: 'Jagdamba Bhawan',
    body: `Welcome to Jagdamba Bhawan Retreat Center, a spiritual retreat and educational training centre in the serene city of Pune, Maharashtra. Opened on 28th January 2018, it honours Mateshwari Jagdamba Saraswati (Mamma), the first Administrative Head of Prajapita Brahma Kumaris Ishwariya Vishwa Vidyalaya.`,
    body2: `Nestled in Pune, the 'Oxford of the East,' Jagdamba Bhawan embodies the wisdom of Goddess Saraswati, fostering knowledge, peace, and self-transformation. Spread across 3.5 acres of tranquil land in a serene locality, it is designed to offer transformative training and spiritual learning. Managed by the Brahma Kumaris, it welcomes all, regardless of background, providing a peaceful space for self-discovery and inner exploration through Rajyoga Meditation.`,
    stats: [
      { label: 'Acres of campus', value: '3.5' },
      { label: 'Opened', value: '2018' },
      { label: 'City', value: 'Pune' },
    ],
    media: {
      id: 'about',
      src: null,
      alt: 'Jagdamba Bhawan Retreat Center grounds in Pisoli, Pune',
      label: 'Campus',
    } satisfies MediaSlot,
  },
  experience: {
    title: 'Walk the grounds',
    support:
      'Feel the campus before you arrive — quiet spaces for reflection and learning.',
    moments: [
      {
        id: 'gardens',
        title: 'Serene grounds',
        text: 'Tranquil outdoor spaces that settle the mind.',
        media: {
          id: 'exp-gardens',
          src: null,
          alt: 'Campus grounds',
          label: 'Grounds',
        } satisfies MediaSlot,
      },
      {
        id: 'meditation',
        title: 'Meditation spaces',
        text: 'Quiet rooms and corners for Rajyoga practice.',
        media: {
          id: 'exp-meditation',
          src: null,
          alt: 'Meditation space',
          label: 'Meditation',
        } satisfies MediaSlot,
      },
      {
        id: 'academy',
        title: 'Learning halls',
        text: 'Spaces for workshops, courses and collective silence.',
        media: {
          id: 'exp-academy',
          src: null,
          alt: 'Learning hall',
          label: 'Halls',
        } satisfies MediaSlot,
      },
      {
        id: 'stay',
        title: 'Stay & stillness',
        text: 'A peaceful setting designed for retreat and renewal.',
        media: {
          id: 'exp-stay',
          src: null,
          alt: 'Retreat stay',
          label: 'Stay',
        } satisfies MediaSlot,
      },
    ],
  },
  courses: {
    title: 'Courses offered',
    support: 'Values, meditation and life skills — free to all.',
    items: [
      {
        id: 'deaddiction',
        title: 'Deaddiction',
        blurb: 'Tools to release habits and reclaim inner freedom.',
        media: { id: 'c-deaddiction', src: null, alt: 'Deaddiction', label: 'Deaddiction' },
      },
      {
        id: 'harmony',
        title: 'Harmony In Relationships',
        blurb: 'Build peace and understanding in every bond.',
        media: { id: 'c-harmony', src: null, alt: 'Harmony In Relationships', label: 'Harmony' },
      },
      {
        id: 'holistic-health',
        title: 'Holistic Health',
        blurb: 'Nurture body, mind and spirit as one.',
        media: { id: 'c-health', src: null, alt: 'Holistic Health', label: 'Health' },
      },
      {
        id: 'positive',
        title: 'Positive Thinking',
        blurb: 'Train the mind toward light and clarity.',
        media: { id: 'c-positive', src: null, alt: 'Positive Thinking', label: 'Positive' },
      },
      {
        id: 'stress',
        title: 'Stress Free Living',
        blurb: 'Stay light and steady under pressure.',
        media: { id: 'c-stress', src: null, alt: 'Stress Free Living', label: 'Stress Free' },
      },
      {
        id: 'summer-camp',
        title: 'Summer Camp',
        blurb: 'Values and fun for young minds in vacation time.',
        media: { id: 'c-summer', src: null, alt: 'Summer Camp', label: 'Summer Camp' },
      },
      {
        id: 'women-empowerment',
        title: 'Women Empowerment',
        blurb: 'Strength, dignity and spiritual confidence.',
        media: { id: 'c-women', src: null, alt: 'Women Empowerment', label: 'Women' },
      },
      {
        id: 'youth-upliftment',
        title: 'Youth Upliftment',
        blurb: 'Purpose, character and leadership for the young.',
        media: { id: 'c-youth', src: null, alt: 'Youth Upliftment', label: 'Youth' },
      },
    ] satisfies CourseItem[],
  },
  galleryGlimpse: {
    title: 'Photo gallery',
    support: 'Campus moments, service and quiet scenes.',
    cta: 'Explore all galleries',
    href: '/jagdamba-bhawan/galleries',
    categories: [
      'Campus Life',
      'Courses & Workshops',
      'Meditation',
      'With Seniors',
      'Service',
    ],
    /** Home teaser only — full galleries page in a later phase */
    thumbs: [
      { id: 't1', src: null, alt: 'Jagdamba Bhawan campus', label: 'Campus' },
      { id: 't2', src: null, alt: 'Meditation at Jagdamba Bhawan', label: 'Meditation' },
      { id: 't3', src: null, alt: 'Courses and workshops', label: 'Courses' },
      { id: 't4', src: null, alt: 'Campus grounds', label: 'Grounds' },
      { id: 't5', src: null, alt: 'Community at Jagdamba Bhawan', label: 'Community' },
      { id: 't6', src: null, alt: 'Peaceful moments', label: 'Moments' },
    ] satisfies MediaSlot[],
  },
  videos: {
    title: 'Video gallery',
    support: 'Talks, retreat glimpses and meditation from our channel.',
    cta: 'Watch Now',
    href: 'https://www.youtube.com/@JagdambaBhawan',
    media: {
      id: 'videos',
      src: null,
      alt: 'Jagdamba Bhawan video gallery',
      label: 'Watch',
    } satisfies MediaSlot,
  },
  visit: {
    title: 'Come to campus',
    support:
      'Need directions, course timings, or help planning a day at Jagdamba Bhawan Retreat Center? Contact us — we\'ll share what you need and guide you to our Pisoli campus in Pune.',
    addressLines: [
      'Brahma Kumaris – Jagdamba Bhawan Retreat Center',
      'Near SMEF\'s School of Architecture, Jagdamba Bhawan Marg',
      'Pisoli, Pune – 411060',
    ],
    landmark:
      'Landmark: Near SMEF\'s School of Architecture, Jagdamba Bhawan Marg, Pisoli, Tal. Haveli, Pune.',
    cta: 'Visit & enquire',
  },
  contactCta: {
    title: 'Contact us',
    support:
      'Address, phone, map, course info and enquiry — everything you need to visit Jagdamba Bhawan Retreat Center.',
    phones: ['7568040767'],
    email: 'jagdambabhawan.pun@bkivv.org',
    socials: [
      { label: 'Instagram', href: 'https://www.instagram.com/jagdambabhawan/', icon: 'instagram' as const },
      { label: 'Facebook', href: 'https://www.facebook.com/jagdambabhawan/', icon: 'facebook' as const },
      { label: 'YouTube', href: 'https://www.youtube.com/@JagdambaBhawan', icon: 'youtube' as const },
    ],
  },
} as const;
