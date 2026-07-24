/**
 * Shanti Sarovar CSR publications — structured config for the /csr page.
 * Downloads use direct Azure fetch + blob Save-as (BKAudio ringtone pattern).
 */

export const CSR_PAGE_PATH = '/shantisarovar/csr';
export const CSR_CONTACT_HREF = '/shantisarovar/contact';

export type CsrStat = {
  value: string;
  label: string;
  icon: 'layers' | 'sun' | 'recycle' | 'droplet' | 'presentation' | 'clock' | 'users' | 'solar';
};

export type CsrPublication = {
  id: 'portfolio' | 'overview';
  slug: 'csr-partnership-portfolio' | 'csr-impact-overview';
  badge: string;
  title: string;
  hook: string;
  subheading: string;
  description: string;
  pageCount: number;
  pdfUrl: string;
  downloadFilename: string;
  /** Strapi CDN cover preview. */
  coverImage: string;
  coverAlt: string;
  statistics: CsrStat[];
  topics: string[];
  microcopy: string;
  supportingLine: string;
  primaryCta: string;
  theme: 'navy' | 'ivory';
  analyticsName: string;
  analyticsType: 'detailed_portfolio' | 'quick_overview';
  readinessLine?: string;
};

export const CSR_PUBLICATIONS: CsrPublication[] = [
  {
    id: 'portfolio',
    slug: 'csr-partnership-portfolio',
    badge: 'DETAILED PORTFOLIO · 34 PAGES',
    title: 'Brahma Kumaris CSR Partnership Portfolio 2026',
    hook: 'Six Pathways. One Shared Purpose.',
    subheading:
      'Creating sustainable social impact through values, partnerships and purposeful action.',
    description:
      'Explore partnership-ready initiatives across renewable energy, circular waste management, water restoration, inclusive mobility, rural sustainability and human-values empowerment.',
    pageCount: 34,
    pdfUrl:
      'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/brahma_kumaris_shanti_sarovar_csr_partnership_portfolio_2026_076b600b03.pdf',
    downloadFilename: 'brahma-kumaris-shanti-sarovar-csr-partnership-portfolio-2026.pdf',
    coverImage:
      'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/brahma_kumaris_shanti_sarovar_csr_partnership_portfolio_2026_cf24664a3a.webp',
    coverAlt: 'Cover of the Brahma Kumaris CSR Partnership Portfolio 2026',
    statistics: [
      { value: '6', label: 'CSR Partnership Initiatives', icon: 'layers' },
      { value: 'Approx. 1 MW', label: 'Planned Solar Capacity', icon: 'sun' },
      { value: '750 kg/day', label: 'Organic Waste Processing', icon: 'recycle' },
      { value: '1 Crore Litres', label: 'Water Storage Vision', icon: 'droplet' },
    ],
    topics: [
      'Solar Energy',
      'Biogas & Circular Economy',
      'Water Restoration',
      'Electric Mobility',
      'Rural Sustainability',
      'Skill & Human Values Development',
    ],
    microcopy:
      'For CSR teams, foundations, institutions and long-term implementation partners.',
    supportingLine:
      'Includes project objectives, projected outcomes, beneficiaries, implementation phases, governance, CSR Schedule VII alignment and relevant UN Sustainable Development Goals.',
    primaryCta: 'Download Detailed Portfolio',
    theme: 'navy',
    analyticsName: 'csr_partnership_portfolio_2026',
    analyticsType: 'detailed_portfolio',
  },
  {
    id: 'overview',
    slug: 'csr-impact-overview',
    badge: 'QUICK OVERVIEW · 4 PAGES',
    title: 'Shanti Sarovar CSR Impact Overview & 2027 Vision',
    hook: 'Building Stronger Communities Through Inner Wellbeing',
    subheading: 'A concise snapshot of service, scale and future possibilities.',
    description:
      'Discover how Shanti Sarovar combines inner wellbeing with practical community action across mental wellbeing, values-based education, healthcare, environmental sustainability and rural development.',
    pageCount: 4,
    pdfUrl:
      'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/shanti_sarovar_hyderabad_csr_impact_overview_2027_575ff80326.pdf',
    downloadFilename: 'shanti-sarovar-hyderabad-csr-impact-overview-2027.pdf',
    coverImage:
      'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/shanti_sarovar_csr_impact_overview_2027_cover_a1e983d445.webp',
    coverAlt: 'Cover of the Shanti Sarovar CSR Impact Overview and 2027 Vision',
    statistics: [
      { value: '120+', label: 'Workshops Every Month', icon: 'presentation' },
      { value: '10,800+', label: 'Learning Hours Every Month', icon: 'clock' },
      { value: '1.5 Lakh+', label: 'Annual Beneficiaries', icon: 'users' },
      { value: '300 kW', label: 'Solar Power Initiative', icon: 'solar' },
    ],
    topics: [],
    microcopy: 'Ideal for a quick introduction to Shanti Sarovar’s work and CSR readiness.',
    supportingLine:
      'Also highlights 12,000+ saplings planted, healthcare and community outreach, environmental initiatives, CSR readiness and the proposed 2027 collaboration vision.',
    primaryCta: 'Download Impact Overview',
    theme: 'ivory',
    analyticsName: 'shanti_sarovar_impact_overview_2027',
    analyticsType: 'quick_overview',
    readinessLine:
      '12A Registration · 80G Certification · CSR Form-1 · Audited Accounts · Benevity Listed',
  },
];

export const CSR_WHY_PARTNER = [
  {
    title: 'Trusted Implementation',
    description:
      'Established experience in community-centred initiatives and institutional partnerships.',
    icon: 'shield' as const,
  },
  {
    title: 'Sustainable Solutions',
    description:
      'Projects designed around environmental responsibility, wellbeing and long-term value.',
    icon: 'leaf' as const,
  },
  {
    title: 'Transparent Approach',
    description:
      'Structured planning, monitoring, utilisation reporting and impact documentation.',
    icon: 'eye' as const,
  },
  {
    title: 'Purposeful Partnerships',
    description:
      'Collaboration that brings together organisational resources, human values and community participation.',
    icon: 'handshake' as const,
  },
] as const;

export const CSR_IMPACT_THEMES = [
  {
    title: 'Community Wellbeing',
    description: 'Inner strength programmes that nurture resilient, values-led communities.',
    icon: 'heart' as const,
  },
  {
    title: 'Renewable Energy',
    description: 'Solar and green-energy pathways for cleaner campus and community operations.',
    icon: 'sun' as const,
  },
  {
    title: 'Water Conservation',
    description: 'Restoration and storage initiatives that protect a vital shared resource.',
    icon: 'droplet' as const,
  },
  {
    title: 'Healthcare Awareness',
    description: 'Outreach that supports dignity, prevention and community health literacy.',
    icon: 'cross' as const,
  },
  {
    title: 'Rural Development',
    description: 'Practical support for livelihoods, villages and lasting local capacity.',
    icon: 'home' as const,
  },
  {
    title: 'Skills & Human Values',
    description: 'Learning that builds capability alongside character and service ethos.',
    icon: 'spark' as const,
  },
] as const;

/** Ambient MP4 hero — replace URL later when a final cut is ready. */
export const CSR_HERO_VIDEO_MP4 =
  'https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/Short_Video_Solar_lq_14caf99502.mp4';

export const CSR_INITIATIVES = [
  {
    id: 'environment',
    title: 'Environment Initiatives',
    description:
      'It is our responsibility to maintain and serve the environment as much as we benefit from it. Learn how Brahma Kumaris are achieving this and join hands in these initiatives, in your own way.',
    href: 'https://www.brahmakumaris.com/initiatives/environment',
    icon: 'leaf' as const,
  },
  {
    id: 'education',
    title: 'Education Initiatives',
    description:
      'Learn more about what we do for holistic development of individuals at all levels through various self-developmental programs and courses which enable individuals deepen their understanding of universal spiritual principles, to cope up with the challenges of day-to-day life.',
    href: 'https://www.brahmakumaris.com/initiatives/education',
    icon: 'book' as const,
  },
  {
    id: 'social',
    title: 'Social Initiatives',
    description:
      'Right from the grassroot initiatives to national projects and campaigns, our initiatives have served the villages, slums, children, women, youth, senior citizens, disaster affected individuals and societies, in the various areas. Explore more here.',
    href: 'https://www.brahmakumaris.com/initiatives/social',
    icon: 'handshake' as const,
  },
  {
    id: 'health',
    title: 'Health Initiatives',
    description:
      'Learn more about the initiatives in the various areas related to health, integrating modern lifestyle with healthy habits, curing diseases with medication and meditation, generating awareness, research projects and providing community services in the field of healthcare.',
    href: 'https://www.brahmakumaris.com/initiatives/health',
    icon: 'heart' as const,
  },
] as const;

export const CSR_CONTACT_DETAILS = {
  phones: [
    { display: '9394 333 364', tel: '+919394333364' },
    { display: '8985 932 062', tel: '+918985932062' },
    { display: '9396 503 335', tel: '+919396503335' },
    { display: '8143 466 670', tel: '+918143466670' },
  ],
  email: 'shantisarovar@bkivv.org',
  website: {
    label: 'www.shantisarovar.org',
    href: 'https://www.shantisarovar.org',
  },
  globalWebsites: [
    {
      label: 'www.brahmakumaris.com',
      href: 'https://www.brahmakumaris.com',
    },
    {
      label: 'www.brahmakumaris.org',
      href: 'https://www.brahmakumaris.org',
    },
  ],
} as const;
