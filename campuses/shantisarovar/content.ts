import { Center } from '@/lib/types';

/**
 * Shanti Sarovar micro-site content — copy from crawl, CMS-ready section keys.
 * Gallery full set is loaded from Strapi website-section 59 (see ss-gallery-data.ts).
 * Home hero / courses / gallery teaser: website-section 60 (see ss-home-data.ts).
 * Hero Section = desktop/tablet; Hero Mobile = phones.
 */
export const SS_SLUG = 'shantisarovar';
export const SS_CANONICAL = 'https://www.brahmakumaris.com/centers/shantisarovar';

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
    title: 'Plan your visit',
    support: 'Come for a retreat, a course, or a quiet day on campus.',
    addressLines: [
      'Brahma Kumaris – Shanti Sarovar',
      'Academy for a Better World',
      'Gachibowli, Hyderabad – 500032',
    ],
    landmark:
      'Landmark: behind Pullela Gopichand Badminton Academy, near ISB–Infosys Road.',
    cta: 'Directions & enquire',
  },
  contactCta: {
    title: 'Contact us',
    support:
      'Address, phones, map, course info and enquiry — everything you need to visit Shanti Sarovar.',
    phones: ['040-23001234', '040-23005983', '040-23006749', '9396503335'],
    email: 'shantisarovar@bkivv.org',
    socials: [
      { label: 'Facebook', href: 'https://www.facebook.com/shantisarovarhyd/' },
      { label: 'X / Twitter', href: 'https://twitter.com/ShantiSarovar' },
      { label: 'YouTube', href: 'https://www.youtube.com/channel/UCE6BPK4rrmuIQ-D1_YcQCKQ' },
    ],
  },
} as const;
