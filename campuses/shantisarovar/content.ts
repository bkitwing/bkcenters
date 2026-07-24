import { Center } from '@/lib/types';

/**
 * Shanti Sarovar micro-site content — copy from crawl, CMS-ready section keys.
 * Gallery full set is loaded from Strapi website-section 59 (see ss-gallery-data.ts).
 * Home hero / about / courses / gallery teaser: website-section 60 (see ss-home-data.ts).
 * Hero Section = desktop/tablet; Hero Mobile = phones.
 */
export const SS_SLUG = 'shantisarovar';
export const SS_CANONICAL = 'https://www.brahmakumaris.com/centers/shantisarovar';

/** Featured / Open Graph images (Strapi CDN) — one per campus page. */
export const SS_OG_IMAGES = {
  home: 'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/Shanti_Sarovar_Retreat_center_Fetured_Image_188f4da1c5.jpg',
  events:
    'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/Shanti_Sarovar_Retreat_Center_Events_page_featured_image_213df8b407.jpg',
  news: 'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/Service_news_Shanti_Sarovar_Retreat_Center_84cf2e8720.jpg',
  galleries:
    'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/Shanti_Sarovar_Galleries_Featured_Image_442c6070d8.jpg',
  contact:
    'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/Contact_Us_Shanti_sarovar_Retreat_Center_98575aafb6.jpg',
  csr: 'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/Shanti_Sarovar_Retreat_center_Fetured_Image_188f4da1c5.jpg',
} as const;

/**
 * Per-page SEO — titles keep “Shanti Sarovar Retreat Center” + page intent
 * within ~50–60 chars; descriptions/keywords align with JSON-LD.
 */
export const SS_SEO = {
  home: {
    title: 'Shanti Sarovar Retreat Center | Brahma Kumaris Hyderabad',
    description:
      'Shanti Sarovar Retreat Center in Gachibowli, Hyderabad — a 34-acre Brahma Kumaris campus for Rajyoga meditation, courses, retreats and workshops.',
    keywords: [
      'Shanti Sarovar Retreat Center',
      'Brahma Kumaris Hyderabad',
      'Gachibowli retreat',
      'Rajyoga meditation Hyderabad',
      'Academy for a Better World',
      'meditation retreat Telangana',
    ] as string[],
    ogAlt:
      'Shanti Sarovar Retreat Center in Gachibowli featuring the Global Peace Auditorium, seminar halls and cultural events',
  },
  events: {
    title: 'Events | Shanti Sarovar Retreat Center Hyderabad',
    description:
      'Upcoming and past events at Shanti Sarovar Retreat Center, Hyderabad — retreats, workshops, conferences and campus programmes.',
    keywords: [
      'Shanti Sarovar Retreat Center events',
      'Hyderabad retreat events',
      'Brahma Kumaris workshops Hyderabad',
      'spiritual conferences Gachibowli',
      'meditation retreat programmes',
    ] as string[],
    ogAlt:
      'Events at Shanti Sarovar Retreat Center — programmes, dignitaries and cultural activities in Hyderabad',
  },
  news: {
    title: 'Service News | Shanti Sarovar Retreat Center',
    description:
      'Service news from Shanti Sarovar Retreat Center, Hyderabad — campus highlights, seva, conferences and community programmes.',
    keywords: [
      'Shanti Sarovar Retreat Center news',
      'Service News Brahma Kumaris',
      'Hyderabad campus news',
      'Brahma Kumaris seva',
      'Shanti Sarovar highlights',
    ] as string[],
    ogAlt:
      'Service News from Shanti Sarovar Retreat Center — community service, guests and cultural programmes',
  },
  galleries: {
    title: 'Galleries | Shanti Sarovar Retreat Center Hyderabad',
    description:
      'Photo galleries from Shanti Sarovar Retreat Center — campus moments, retreats, conferences, culture and service in Hyderabad.',
    keywords: [
      'Shanti Sarovar Retreat Center gallery',
      'Hyderabad retreat photos',
      'Brahma Kumaris campus photos',
      'Moments Captured Shanti Sarovar',
      'meditation campus gallery',
    ] as string[],
    ogAlt:
      'Moments Captured — photo galleries from Shanti Sarovar Retreat Center in Hyderabad',
  },
  contact: {
    title: 'Contact Us | Shanti Sarovar Retreat Center Hyderabad',
    description:
      'Contact Shanti Sarovar Retreat Center in Gachibowli, Hyderabad — address, phone, directions, Rajyoga course and enquiry.',
    keywords: [
      'Contact Shanti Sarovar Retreat Center',
      'Shanti Sarovar Gachibowli address',
      'visit Brahma Kumaris Hyderabad',
      'Rajyoga course Hyderabad',
      'Shanti Sarovar phone email',
    ] as string[],
    ogAlt:
      'Contact Us — Shanti Sarovar Retreat Center entrance in Gachibowli with location, phone and email',
  },
  csr: {
    title: 'CSR Partnerships & Social Impact | Shanti Sarovar',
    description:
      'Explore the Brahma Kumaris Shanti Sarovar CSR Partnership Portfolio and Impact Overview, featuring opportunities in renewable energy, water conservation, community wellbeing, rural development and human empowerment.',
    keywords: [
      'Shanti Sarovar CSR',
      'Brahma Kumaris CSR partnerships',
      'CSR Hyderabad',
      'Shanti Sarovar social impact',
      'renewable energy CSR India',
      'water conservation CSR',
    ] as string[],
    ogAlt:
      'CSR partnerships at Shanti Sarovar Retreat Center — community wellbeing, sustainability and social impact',
  },
};

export const SS_CENTER: Center = {
  name: 'HYDERABAD SHANTI SAROVAR',
  slug: 'hyderabad-shanti-sarovar',
  branch_code: '02284',
  address: {
    line1: 'SHANTI SAROVAR, ACADEMY FOR A BETTER WORLD',
    line2: 'BEHIND P.GOPICHAND BADMINTON ACADEMY',
    line3: 'NEAR ISB-INFOSYS RD, SY.NO: 91, GACHIBOWLI',
    city: 'HYDERABAD',
    pincode: '500032',
  },
  email: 'shantisarovar@bkivv.org',
  contact: '040-23001234, 23005983, 23006749',
  mobile: '9396503335',
  country: 'INDIA',
  district: 'RANGAREDDY',
  state: 'TELANGANA',
  zone: '',
  sub_zone: '',
  section: '',
  region: 'INDIA',
  district_id: '',
  state_id: '',
  country_id: '',
  coords: ['17.4376553000', '78.3529623000'],
};

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

export const SS_CONTENT = {
  brand: 'Shanti Sarovar',
  tagline: 'An Oasis of Peace',
  hero: {
    headline: 'Relax. Refresh. Recharge the inner self.',
    support: '34 acres of stillness in Gachibowli — the largest Brahma Kumaris campus in South India.',
    ctaPrimary: 'Know more',
    ctaSecondary: 'Plan your visit',
    media: {
      id: 'hero',
      src: null,
      alt: 'Shanti Sarovar campus — Academy for a Better World',
      label: 'Campus dawn',
    } satisfies MediaSlot,
  },
  about: {
    eyebrow: 'An Oasis of Peace',
    title: 'Shanti Sarovar',
    body: `An oasis of peace established by the global organization – Brahma Kumaris, is situated in the happening city of Hyderabad and is spread over sprawling 34 acres of land. It is the largest campus of the organisation in South India. Shanti Sarovar is a perfect place to relax, refresh and recharge the inner-self. As an academy for higher learning of values and inner skills, it conducts a wide spectrum of courses, retreats, seminars and workshops amidst a pleasant atmosphere reverberating with waves of peace and spiritual power.`,
    body2: `The calm and serene atmosphere along with the delightful landscaping, greenery, waterfalls, fountains and rock formations compliments the campus’ purpose of creating better people for a better tomorrow. As a place of inner reflection and self-development, it has helped to nurture the spirits of thousands of people by enabling them to draw power from the Supreme Being.`,
    stats: [
      { label: 'Acres of campus', value: '34' },
      { label: 'South India', value: 'Largest' },
      { label: 'City', value: 'Hyderabad' },
    ],
    media: {
      id: 'about',
      src: null,
      alt: 'Landscaped gardens, waterfalls and rock formations at Shanti Sarovar',
      label: 'Gardens & water',
    } satisfies MediaSlot,
  },
  experience: {
    title: 'Walk the grounds',
    support:
      'Feel the campus before you arrive — gardens, halls, and quiet corners for reflection.',
    moments: [
      {
        id: 'gardens',
        title: 'Gardens & water',
        text: 'Greenery, waterfalls and fountains that settle the mind.',
        media: {
          id: 'exp-gardens',
          src: null,
          alt: 'Central garden Brindavan',
          label: 'Central garden',
        } satisfies MediaSlot,
      },
      {
        id: 'meditation',
        title: 'Meditation spaces',
        text: 'Quiet rooms and open-air corners for Rajyoga practice.',
        media: {
          id: 'exp-meditation',
          src: null,
          alt: 'Meditation hut and cliff meditation room',
          label: 'Meditation hut',
        } satisfies MediaSlot,
      },
      {
        id: 'academy',
        title: 'Academy halls',
        text: 'Spaces for workshops, seminars and collective silence.',
        media: {
          id: 'exp-academy',
          src: null,
          alt: 'Global Peace Auditorium',
          label: 'Auditorium',
        } satisfies MediaSlot,
      },
      {
        id: 'stay',
        title: 'Stay & stillness',
        text: 'Accommodation nestled in green — designed for retreat.',
        media: {
          id: 'exp-stay',
          src: null,
          alt: 'Accommodation block garden view',
          label: 'Accommodation',
        } satisfies MediaSlot,
      },
    ],
  },
  courses: {
    title: 'Courses offered',
    support: 'Values, meditation and life skills — free to all.',
    items: [
      {
        id: 'rajyoga',
        title: 'Rajyoga Meditation',
        blurb: 'The heart of the academy — stillness with the Supreme.',
        media: { id: 'c-rajyoga', src: null, alt: 'Rajyoga Meditation', label: 'Rajyoga' },
      },
      {
        id: 'self-esteem',
        title: 'Self Esteem',
        blurb: 'Remember who you are beyond roles and labels.',
        media: { id: 'c-esteem', src: null, alt: 'Self Esteem course', label: 'Self Esteem' },
      },
      {
        id: 'harmony',
        title: 'Harmony In Relations',
        blurb: 'Build peace in every relationship.',
        media: { id: 'c-harmony', src: null, alt: 'Harmony In Relations', label: 'Harmony' },
      },
      {
        id: 'stress',
        title: 'Stress Free Living',
        blurb: 'Tools to stay light under pressure.',
        media: { id: 'c-stress', src: null, alt: 'Stress Free Living', label: 'Stress Free' },
      },
      {
        id: 'self-manage',
        title: 'Self Managing Skills',
        blurb: 'Lead your mind with clarity.',
        media: { id: 'c-manage', src: null, alt: 'Self Managing Skills', label: 'Self Managing' },
      },
      {
        id: 'anger',
        title: 'Conquering Anger',
        blurb: 'Transform heat into understanding.',
        media: { id: 'c-anger', src: null, alt: 'Conquering Anger', label: 'Anger' },
      },
      {
        id: 'values',
        title: 'Living Values',
        blurb: 'Make virtues a daily practice.',
        media: { id: 'c-values', src: null, alt: 'Living Values', label: 'Values' },
      },
      {
        id: 'leadership',
        title: 'Leadership Attitudes',
        blurb: 'Lead from soul-conscious strength.',
        media: { id: 'c-lead', src: null, alt: 'Leadership Attitudes', label: 'Leadership' },
      },
      {
        id: 'positive',
        title: 'Positive Thinking',
        blurb: 'Train the mind toward light.',
        media: { id: 'c-positive', src: null, alt: 'Positive Thinking', label: 'Positive' },
      },
    ] satisfies CourseItem[],
  },
  galleryGlimpse: {
    title: 'Photo gallery',
    support: 'Landscapes, service and quiet moments on campus.',
    cta: 'Explore all galleries',
    href: '/shantisarovar/galleries',
    categories: [
      'Art & Culture',
      'Conference & Workshops',
      'Serving The Environment',
      'Meditation Retreats',
      'Serving The Nation',
      'With Eminent Personalities',
      'With Seniors',
    ],
    /** Home teaser only — full set on /galleries */
    thumbs: [
      { id: 't1', src: null, alt: 'Central Garden Brindavan', label: 'Campus' },
      { id: 't2', src: null, alt: 'Meditation Retreats', label: 'Retreats' },
      { id: 't3', src: null, alt: 'Global Peace Auditorium Night View', label: 'Auditorium' },
      { id: 't4', src: null, alt: 'Spiritual Workshops in Garden', label: 'Workshops' },
      { id: 't5', src: null, alt: 'Water Fountain', label: 'Gardens' },
      { id: 't6', src: null, alt: 'Sunrise at Shanti Sarovar', label: 'Sunrise' },
    ] satisfies MediaSlot[],
  },
  videos: {
    title: 'Video gallery',
    support: 'Talks, retreat glimpses and meditation from our channel.',
    cta: 'Watch Now',
    href: 'https://www.brahmakumaris.com/bktube/ch/UCE6BPK4rrmuIQ-D1_YcQCKQ',
    media: {
      id: 'videos',
      src: null,
      alt: 'Shanti Sarovar video gallery',
      label: 'Watch',
    } satisfies MediaSlot,
  },
  visit: {
    title: 'Come to campus',
    support:
      'Need directions, course timings, or help planning a day at Shanti Sarovar? Contact us — we\'ll share what you need and guide you to our Gachibowli campus.',
    addressLines: [
      'Brahma Kumaris – Shanti Sarovar',
      'Academy for a Better World',
      'Gachibowli, Hyderabad – 500032',
    ],
    landmark:
      'Landmark: behind Pullela Gopichand Badminton Academy, near ISB–Infosys Road.',
    cta: 'Visit & enquire',
  },
  contactCta: {
    title: 'Contact us',
    support:
      'Address, phones, map, course info and enquiry — everything you need to visit Shanti Sarovar.',
    phones: ['040-23001234', '040-23005983', '040-23006749', '9396503335'],
    email: 'shantisarovar@bkivv.org',
    socials: [
      { label: 'Facebook', href: 'https://www.facebook.com/shantisarovarhyd/', icon: 'facebook' as const },
      { label: 'X', href: 'https://x.com/ShantiSarovar', icon: 'twitter' as const },
      { label: 'YouTube', href: 'https://www.youtube.com/channel/UCE6BPK4rrmuIQ-D1_YcQCKQ', icon: 'youtube' as const },
    ],
  },
} as const;
