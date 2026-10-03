import { Center } from '@/lib/types';

/**
 * Sonipat Retreat Center micro-site copy.
 * Text is taken from the crawled WordPress export in public/sonipat-retreat-center.
 * Images stay empty until the campus Strapi section is connected (same pattern as
 * Shanti Sarovar home / galleries).
 */
export const SP_SLUG = 'sonipat-retreat-center';
export const SP_CANONICAL = 'https://www.brahmakumaris.com/centers/sonipat-retreat-center';
export const SP_RETREAT_NAME = 'Sonipat Retreat Center';

export const SP_SEO = {
  home: {
    title: 'Sonipat Retreat Center | Brahma Kumaris Haryana',
    description:
      'Sonipat Retreat Center in Haryana — a Brahma Kumaris campus for Rajyoga meditation, courses, retreats and inner growth.',
    keywords: [
      'Sonipat Retreat Center',
      'Brahma Kumaris Sonipat',
      'Rajyoga meditation Haryana',
      'Sonipat retreat',
      'meditation retreat Sonipat',
      'SRC Brahma Kumaris',
    ] as string[],
    ogAlt: 'Sonipat Retreat Center — a Brahma Kumaris campus for meditation and retreats in Haryana',
  },
  about: {
    title: 'About | Sonipat Retreat Center',
    description:
      'The story of Sonipat Retreat Center — inaugurated in 2013, its faculty, serenity cells, auditorium, museum and yogic farming campus.',
    keywords: [
      'About Sonipat Retreat Center',
      'SRC journey',
      'Dadi Janki Sonipat',
      'Sonipat Retreat Centre campus',
      'Brahma Kumaris Haryana retreat',
    ] as string[],
    ogAlt: 'About Sonipat Retreat Center — journey, faculty and campus in Sonipat, Haryana',
  },
  news: {
    title: 'Service News | Sonipat Retreat Center',
    description:
      'Service news from Sonipat Retreat Center — campus highlights, seva, retreats and community programmes in Haryana.',
    keywords: [
      'Sonipat Retreat Center news',
      'Service News Brahma Kumaris',
      'Sonipat campus news',
      'Haryana retreat highlights',
    ] as string[],
    ogAlt: 'Service News from Sonipat Retreat Center in Haryana',
  },
  galleries: {
    title: 'Galleries | Sonipat Retreat Center',
    description:
      'Photo galleries from Sonipat Retreat Center — campus, workshops, trainings, seniors, celebrations and the grounds.',
    keywords: [
      'Sonipat Retreat Center gallery',
      'SRC photos',
      'Brahma Kumaris Sonipat photos',
      'retreat centre gallery Haryana',
    ] as string[],
    ogAlt: 'Photo galleries from Sonipat Retreat Center — campus life and celebrations',
  },
  contact: {
    title: 'Contact Us | Sonipat Retreat Center',
    description:
      'Contact Sonipat Retreat Center — address behind Jurasik Park Inn, Bahalgarh, phone, directions and enquiry.',
    keywords: [
      'Contact Sonipat Retreat Center',
      'Sonipat Retreat Centre address',
      'Bahalgarh Brahma Kumaris',
      'SRC phone email',
      'visit Sonipat retreat',
    ] as string[],
    ogAlt: 'Contact Sonipat Retreat Center — Bahalgarh, Sonipat, Haryana',
  },
};

export const SP_CENTER: Center = {
  name: 'SONIPAT RETREAT CENTRE',
  slug: 'sonipat-retreat-centre',
  branch_code: '04159',
  address: {
    line1: 'BEHIND JURASIK PARK INN',
    line2: 'AT: NANGAL KHURD, GT ROAD',
    line3: 'KAMASPUR, VIA: BAHALGARH',
    city: 'SONIPAT',
    pincode: '131021',
  },
  email: 'src@bkivv.org',
  contact: '0130-2482901, 2482902',
  mobile: '9466008066, 7988130748',
  country: 'INDIA',
  district: 'Sonipat',
  state: 'HARYANA',
  zone: 'PUNJAB',
  sub_zone: 'CHANDIGARH',
  section: '04159',
  region: 'INDIA',
  district_id: '136',
  state_id: '6',
  country_id: '1',
  coords: ['29.0099193000', '77.0830054000'],
};

export type MediaSlot = {
  id: string;
  src: string | null;
  alt: string;
  label?: string;
  href?: string;
};

export type CourseItem = {
  id: string;
  title: string;
  blurb: string;
  media: MediaSlot;
};

const ph = (id: string, alt: string, label?: string): MediaSlot => ({
  id,
  src: null,
  alt,
  label: label || alt,
});

export const SP_CONTENT = {
  brand: 'Sonipat Retreat Center',
  tagline: 'A sanctuary of peace',
  hero: {
    headline: 'Let your journey to inner harmony begin here.',
    support:
      'A calm Brahma Kumaris campus in Sonipat for Rajyoga meditation, courses and retreats.',
    ctaPrimary: 'Know more',
    ctaSecondary: 'Plan your visit',
    media: ph('hero', 'Sonipat Retreat Center campus', 'Campus'),
  },
  about: {
    eyebrow: 'Sonipat, Haryana',
    title: 'Sonipat Retreat Center',
    body: 'Welcome to the Sonipat Retreat Center, a peaceful spiritual haven dedicated to self-reflection, meditation, and inner growth. Nestled in the serene surroundings of Sonipat, the center offers a calm and supportive environment for your journey toward self-realization.',
    body2:
      'At the core of our work is Rajyoga Meditation — a method that brings harmony to the mind, body, and soul. More than a place to learn, the retreat center is a welcoming community where people from all backgrounds grow through programmes, workshops and retreats.',
    stats: [
      { label: 'Inaugurated', value: '2013' },
      { label: 'Auditorium seats', value: '1,000+' },
      { label: 'Serenity Cells', value: '8' },
    ],
    media: ph('about', 'Inauguration of Sonipat Retreat Center', 'Inauguration'),
  },
  courses: {
    title: 'Courses offered',
    support: 'Practical courses for daily life — offered as service.',
    items: [
      {
        id: 'deaddiction',
        title: 'Deaddiction',
        blurb: 'Support to leave habits and begin again.',
        media: ph('c-deaddiction', 'Deaddiction', 'Deaddiction'),
      },
      {
        id: 'harmony',
        title: 'Harmony In Relationships',
        blurb: 'Build peace in family and friendship.',
        media: ph('c-harmony', 'Harmony In Relationships', 'Harmony'),
      },
      {
        id: 'health',
        title: 'Holistic Health',
        blurb: 'Care for mind, body and soul together.',
        media: ph('c-health', 'Holistic Health', 'Health'),
      },
      {
        id: 'positive',
        title: 'Positive Thinking',
        blurb: 'Train the mind toward light.',
        media: ph('c-positive', 'Positive Thinking', 'Positive'),
      },
      {
        id: 'stress',
        title: 'Stress Free Living',
        blurb: 'Tools to stay light under pressure.',
        media: ph('c-stress', 'Stress Free Living', 'Stress Free'),
      },
      {
        id: 'summer',
        title: 'Summer Camp',
        blurb: 'A joyful pause of learning and play.',
        media: ph('c-summer', 'Summer Camp', 'Summer Camp'),
      },
      {
        id: 'women',
        title: 'Women Empowerment',
        blurb: 'Strength, values and self-respect.',
        media: ph('c-women', 'Women Empowerment', 'Women'),
      },
      {
        id: 'youth',
        title: 'Youth Upliftment',
        blurb: 'Clarity and purpose for young souls.',
        media: ph('c-youth', 'Youth Upliftment', 'Youth'),
      },
    ] satisfies CourseItem[],
  },
  galleryGlimpse: {
    title: 'Photo gallery',
    support:
      'Events, celebrations, moments with seniors, and peaceful views of the campus.',
    cta: 'Explore all galleries',
    href: '/sonipat-retreat-center/galleries',
    categories: [
      'Campus',
      'Workshops',
      'Trainings & Retreats',
      'With Seniors',
      'Health & Environment',
      'Celebration',
    ],
    thumbs: [
      {
        ...ph('t1', 'Tapasya Dhaam', 'Campus'),
        href: '/sonipat-retreat-center/galleries#campus',
      },
      {
        ...ph('t2', 'Workshops and meetings', 'Workshops'),
        href: '/sonipat-retreat-center/galleries#workshops',
      },
      {
        ...ph('t3', 'Trainings and retreats', 'Trainings'),
        href: '/sonipat-retreat-center/galleries#trainings-retreats',
      },
      {
        ...ph('t4', 'Moments with senior teachers', 'Seniors'),
        href: '/sonipat-retreat-center/galleries#with-seniors',
      },
      {
        ...ph('t5', 'Yoga and tree plantation', 'Nature'),
        href: '/sonipat-retreat-center/galleries#health-environment',
      },
      {
        ...ph('t6', 'Shivratri and celebrations', 'Celebration'),
        href: '/sonipat-retreat-center/galleries#celebration',
      },
    ] satisfies MediaSlot[],
  },
  videos: {
    title: 'Video gallery',
    support:
      'Simple, practical ways to find inner peace, stay positive, and live with mindfulness — on the Sonipat Retreat Center YouTube channel.',
    cta: 'Watch now',
    href: 'https://www.youtube.com/@srcbrahmakumaris',
    media: ph('videos', 'Sonipat Retreat Center video gallery', 'Watch'),
  },
  visit: {
    title: 'Come to campus',
    support:
      'Behind Jurasik Park Inn, Nangal Khurd, on GT Road via Bahalgarh. Call or write and we will help you plan a visit.',
    addressLines: [
      'Brahma Kumaris – Sonipat Retreat Center',
      'Behind Jurasik Park Inn, Nangal Khurd',
      'GT Road, Bahalgarh, Sonipat – 131021',
    ],
    landmark: 'Landmark: behind Jurasik Park Inn, Nangal Khurd, GT Road, Bahalgarh.',
    cta: 'Visit & enquire',
  },
  contactCta: {
    title: 'Contact us',
    support: 'Address, phones, map and enquiry — everything you need to visit the campus.',
    phones: ['0130-2482901', '0130-2482902', '9466008066', '7988130748'],
    email: 'src@bkivv.org',
    socials: [
      {
        label: 'YouTube',
        href: 'https://www.youtube.com/@srcbrahmakumaris',
        icon: 'youtube' as const,
      },
    ],
  },
} as const;

export const SP_ABOUT = {
  journey: {
    eyebrow: 'Since 2013',
    title: 'SRC journey',
    paragraphs: [
      'The Sonipat Retreat Centre, inaugurated on 9th December 2013 in the divine presence of Dadi Janki Ji, is a vibrant sanctuary of peace, self-discovery, and transformation. Dadi Ji’s blessings and words have guided the centre’s journey ever since.',
      'The idea was envisioned by Brother Jagdish Ji, a respected spiritual thinker whose understanding of Rajyoga shaped the dream of a serene space for inner growth.',
      'This vision took form under the leadership of Brother Amirchand Ji, zonal head of the Punjab zone, who turned limited resources into a beautiful, functional centre with simplicity and spiritual depth.',
      'With the love and service of volunteers from across the country, the accommodation and training wings were completed and inaugurated by Dadi Janki Ji and Hon. CM Sh. Manohar Lal Khattar in 2018.',
      'Today, the centre continues to thrive — living the original vision of self-empowerment and holistic growth.',
    ],
    media: ph('journey', 'Inauguration by Dadi Janki Ji', 'Inauguration'),
  },
  faculty: {
    eyebrow: 'Teachers',
    title: 'Esteemed faculty',
    paragraphs: [
      'Our dedicated teachers are the heart of spiritual growth and well-being at the centre. Each teacher lives by deep values and the teachings of Rajyoga, serving as a role model of spiritual living.',
      'More than instructors, they are compassionate mentors and friends, helping each soul unlock their highest potential. At SRC, you will find not just teachings — but a loving, spiritual family dedicated to your growth and fulfillment.',
    ],
    media: ph('faculty', 'Esteemed faculty at Sonipat Retreat Center', 'Faculty'),
  },
  campusIntro:
    'The Sonipat Retreat Centre has been designed for a fulfilling and tranquil retreat, with what is needed to rejuvenate the mind, body and soul. Aligned with sustainable living, the campus uses solar energy and organic farming in its daily operations.',
  spaces: [
    {
      id: 'serenity-cells',
      title: 'Serenity Cells',
      text: 'A unique set of eight air-conditioned huts. Each hut offers peaceful seating and guided meditation — quiet spaces for inner peace and spiritual connection. Many describe the experience as calming and life-changing.',
      media: ph('space-cells', 'Serenity Cells', 'Serenity Cells'),
    },
    {
      id: 'theatre',
      title: '3D Theatre',
      text: 'A soundproof theatre for spiritual 3D films, also used as a recording studio and programme hall — a creative space for learning and reflection.',
      media: ph('space-theatre', '3D Theatre', '3D Theatre'),
    },
    {
      id: 'auditorium',
      title: 'Auditorium',
      text: 'A large hall that seats over 1,000 people, used for spiritual talks, conferences and cultural events.',
      media: ph('space-auditorium', 'Auditorium', 'Auditorium'),
    },
    {
      id: 'museum',
      title: 'Museum',
      text: 'The museum showcases a model of the coming Golden Age — a world of peace, purity and unity — and shares spiritual ideas in a simple, visual way. The Mateshwari Jagadamba room is part of this journey.',
      media: ph('space-museum', 'Museum and Mateshwari Jagadamba room', 'Museum'),
    },
    {
      id: 'tapasya',
      title: 'Tapasya Dham',
      text: 'A peaceful space surrounded by green gardens, for silent meditation and inner reflection, with soothing nature sounds and calm surroundings.',
      media: ph('space-tapasya', 'Tapasya Dham', 'Tapasya Dham'),
    },
    {
      id: 'training',
      title: 'Training Centre',
      text: 'Two training halls and a round-table conference area for lectures, group activities and discussions, with a dynamic screen for presentations, workshops and meditation visuals.',
      media: ph('space-training', 'Training Centre and conference hall', 'Training'),
    },
    {
      id: 'farming',
      title: 'Yogic farming and lawns',
      text: 'The Sustainable Yogic Farming Model combines meditation and organic farming to grow healthy crops. Lush lawns with fruit trees offer a quiet place to walk and be with nature.',
      media: ph('space-lawns', 'Lawns and yogic farming', 'Lawns'),
    },
    {
      id: 'history',
      title: 'History Hall',
      text: 'A hall dedicated to the legacy of the founders and visionaries of Brahma Kumaris, and to the organisation’s spiritual journey.',
      media: ph('space-history', 'History Hall', 'History Hall'),
    },
  ],
} as const;
