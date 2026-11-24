import {
  Sparkles,
  Newspaper,
  CalendarDays,
  MapPin,
  BookOpen,
  Music,
  Images,
  Users,
  Gamepad2,
  Languages,
  FolderOpen,
  Calendar,
  Radio,
  GraduationCap,
  Tag,
  Home,
  LayoutGrid,
  Building2,
  Map,
  PenSquare,
  Navigation,
  Compass,
  Building,
  Flower2,
  Baby,
  User,
  UserRound,
  Info,
  Route,
  Crown,
  Award,
  Handshake,
  MessageCircle,
  Film,
  Clapperboard,
  Leaf,
  BookHeart,
  Heart,
  ShieldCheck,
  Droplets,
  LifeBuoy,
  HelpCircle,
  HeartHandshake,
  Globe,
  Earth,
  Brain,
  Lightbulb,
  Puzzle,
  Smartphone,
  BatteryLow,
  Clock,
  CloudRain,
  Feather,
  Flame,
  HeartCrack,
  Moon,
  Mountain,
  Smile,
  Sunrise,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type AppId =
  | "meditation"
  | "courses"
  | "centers"
  | "wisdom"
  | "updates" // Events + News combined (keeps the desktop pill compact)
  | "aboutus"
  | "initiative"
  | "contact";

export interface NavSubChild {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Monthly live session: menus show a pulsing LIVE marker next to it. */
  live?: boolean;
}

export interface NavSubItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Stable React key when multiple items share the same href. */
  id?: string;
  children?: NavSubChild[];
  /** Non-clickable group header rendered above this item as a visual separator. */
  group?: string;
  /** Monthly live session: menus show a pulsing LIVE marker next to it. */
  live?: boolean;
  /** Highlighted as a full-width section in menus that support it (e.g. Activities). */
  featured?: boolean;
}

export interface NavSection {
  id: AppId;
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  accentColor: string; // tailwind color name e.g. "violet"
  subItems: NavSubItem[];
}

// All hrefs are FULL paths (with basePath prefix) so cross-app links work as <a> tags
// Order: Meditation, Centers, Wisdom, Events, News, About Us
// Shared menu: keep this NAVIGATION array identical in every app that uses the header.
// Links into the current app open with Next navigation; others are full-page links.
export const NAVIGATION: NavSection[] = [
  {
    id: "meditation",
    label: "Meditation",
    href: "/meditation",
    icon: Flower2,
    description: "Guided meditations for every feeling and need",
    accentColor: "sky",
    subItems: [
      {
        label: "Explore",
        href: "/meditation/explore",
        icon: Compass,
        children: [
          { label: "All meditations", href: "/meditation/explore", icon: LayoutGrid },
          { label: "By theme", href: "/meditation/topics", icon: Tag },
          { label: "By teacher", href: "/meditation/teacher", icon: Users },
          { label: "Learn Rajyoga (7 days)", href: "/meditation/rajyoga-course", icon: GraduationCap },
        ],
      },
      {
        label: "How you want to feel",
        href: "/meditation/experience",
        icon: Heart,
        children: [
          { label: "Peace", href: "/meditation/experience/peace", icon: Feather },
          { label: "Love", href: "/meditation/experience/love", icon: Heart },
          { label: "Happiness", href: "/meditation/experience/happiness", icon: Smile },
          { label: "Power", href: "/meditation/experience/power", icon: Mountain },
          { label: "Soul Awareness", href: "/meditation/experience/soul-awareness", icon: Sparkles },
          { label: "All feelings", href: "/meditation/experience", icon: LayoutGrid },
        ],
      },
      {
        label: "By life stage",
        href: "/meditation/age",
        icon: Users,
        children: [
          { label: "Children", href: "/meditation/age/children", icon: Baby },
          { label: "Youth", href: "/meditation/age/youth", icon: GraduationCap },
          { label: "Young Adults", href: "/meditation/age/young-adults", icon: User },
          { label: "Middle Age", href: "/meditation/age/middle-age", icon: User },
          { label: "Elderly", href: "/meditation/age/elderly", icon: UserRound },
        ],
      },
      {
        label: "Meditation music",
        href: "/meditation/meditation-music",
        icon: Music,
        children: [
          { label: "All music", href: "/meditation/meditation-music", icon: Music },
          { label: "Amritvela music", href: "/meditation/meditation-music/category/amritvela-music", icon: Sunrise },
          { label: "Long duration", href: "/meditation/meditation-music/category/long-duration", icon: Clock },
        ],
      },
      {
        label: "Meditation for",
        href: "/meditation",
        icon: Leaf,
        featured: true,
        children: [
          { label: "Stress", href: "/meditation/for/stress", icon: Waves },
          { label: "Anxiety", href: "/meditation/for/anxiety", icon: Wind },
          { label: "Sleep", href: "/meditation/for/sleep", icon: Moon },
          { label: "Overthinking", href: "/meditation/for/overthinking", icon: Brain },
          { label: "Anger", href: "/meditation/for/anger", icon: Flame },
          { label: "Worry", href: "/meditation/for/worry", icon: CloudRain },
          { label: "Burnout", href: "/meditation/for/burnout", icon: BatteryLow },
          { label: "Grief", href: "/meditation/for/grief", icon: HeartCrack },
          { label: "Loneliness", href: "/meditation/for/loneliness", icon: UserRound },
          { label: "Motivation", href: "/meditation/for/motivation", icon: Zap },
        ],
      },
    ],
  },
  {
    id: "courses",
    label: "Courses",
    href: "https://courses.brahmakumaris.com/",
    icon: GraduationCap,
    description: "Rajyoga meditation courses",
    accentColor: "indigo",
    subItems: [
      { id: "courses-home", label: "All courses", href: "https://courses.brahmakumaris.com/", icon: Home, group: "Learn online" },
      { id: "courses-explore", label: "Explore", href: "https://courses.brahmakumaris.com/explore", icon: Compass },
      { id: "courses-categories", label: "Categories", href: "https://courses.brahmakumaris.com/categories", icon: LayoutGrid },
      { id: "courses-7day-hi", label: "7 Day Course (Hindi)", href: "https://courses.brahmakumaris.com/sahaj-rajyog", icon: Languages, group: "Start here" },
      { id: "courses-7day-en", label: "7 Day Course (English)", href: "https://courses.brahmakumaris.com/a-personal-journey-for-transformation", icon: Languages },
    ],
  },
  {
    id: "centers",
    label: "Centers",
    href: "/centers",
    icon: MapPin,
    description: "Find a meditation center near you",
    accentColor: "emerald",
    subItems: [
      { id: "centers-search", label: "Search", href: "/centers", icon: Home, group: "Find a Center" },
      { id: "centers-nearby", label: "Nearby", href: "/centers?nearby=true", icon: Navigation },
      { id: "centers-india", label: "India", href: "/centers/india", icon: Compass, group: "Browse by Country" },
      { id: "centers-retreat", label: "HQ Campuses", href: "/centers/retreat", icon: Building },
      { id: "centers-nepal", label: "Nepal", href: "/centers/nepal", icon: Map },
      {
        id: "centers-international",
        label: "International Centres",
        href: "https://www.brahmakumaris.org/centre-locator/centres",
        icon: Globe,
        group: "Worldwide",
      },
    ],
  },
  {
    id: "wisdom",
    label: "Wisdom",
    href: "/wisdom",
    icon: Sparkles,
    description: "Daily messages, blogs & spiritual insights",
    accentColor: "violet",
    subItems: [
      {
        label: "Soul Sustenance",
        href: "/wisdom/soul-sustenance",
        icon: Sparkles,
        children: [
          { label: "English", href: "/wisdom/soul-sustenance/eng", icon: Languages },
          { label: "Hindi", href: "/wisdom/soul-sustenance/hin", icon: Languages },
          { label: "Categories", href: "/wisdom/soul-sustenance/categories", icon: FolderOpen },
          { label: "Archive", href: "/wisdom/soul-sustenance/archive", icon: Calendar },
          { label: "LIVE · monthly conversation", href: "/wisdom/soul-sustenance/live", icon: CalendarDays, live: true },
          { label: "Questions & answers", href: "/wisdom/soul-sustenance/questions", icon: FolderOpen },
        ],
      },
      { label: "Soul Sustenance LIVE", href: "/wisdom/soul-sustenance/live", icon: CalendarDays, live: true },
      {
        label: "Blogs",
        href: "/wisdom/blog",
        icon: BookOpen,
        children: [
          { label: "Categories", href: "/wisdom/blog/categories", icon: FolderOpen },
          { label: "English", href: "/wisdom/blog/eng", icon: Languages },
          { label: "Hindi", href: "/wisdom/blog/hin", icon: Languages },
          { label: "Archive", href: "/wisdom/blog/archive", icon: Calendar },
        ],
      },
      {
        label: "Audio",
        href: "/wisdom/audio",
        icon: Music,
        children: [
          { label: "Songs", href: "/wisdom/audio/songs", icon: Music },
          { label: "Podcast", href: "/wisdom/audio/podcast", icon: Radio },
          { label: "Classes", href: "/wisdom/audio/classes", icon: GraduationCap },
        ],
      },
      {
        label: "Activities",
        href: "/wisdom/activities",
        icon: Gamepad2,
        featured: true,
        children: [
          { label: "Inner Compass", href: "/wisdom/activities/inner-compass", icon: Compass },
          { label: "8 Powers Puzzle", href: "/wisdom/activities/eight-powers", icon: Puzzle },
          { label: "Memory Match", href: "/wisdom/activities/virtue-match", icon: Brain },
          { label: "Belief Clarity", href: "/wisdom/activities/belief-clarity", icon: Lightbulb },
          { label: "Digital Wellness", href: "/wisdom/activities/digital-wellness-assessment", icon: Smartphone },
        ],
      },
      {
        label: "Galleries",
        href: "/wisdom/galleries",
        icon: Images,
        children: [
          { label: "All Categories", href: "/wisdom/galleries", icon: FolderOpen },
          { label: "Browse by Tag", href: "/wisdom/galleries/tags", icon: Tag },
        ],
      },
      {
        label: "Testimonials",
        href: "/wisdom/testimonials",
        icon: MessageCircle,
        children: [
          { label: "Moments & Memories", href: "/wisdom/testimonials/moments-memories", icon: Images },
          { label: "Categories", href: "/wisdom/testimonials/categories", icon: FolderOpen },
          { label: "Archive", href: "/wisdom/testimonials/archive", icon: Calendar },
        ],
      },
      {
        label: "Movies & Documentaries",
        href: "/wisdom/movies",
        icon: Film,
        children: [
          { label: "Movies", href: "/wisdom/movies?type=movies", icon: Film },
          { label: "Short Movies", href: "/wisdom/movies?type=short-films", icon: Clapperboard },
          { label: "Documentaries", href: "/wisdom/movies?type=documentaries", icon: Clapperboard },
        ],
      },
      {
        label: "Anubhavgatha",
        href: "/wisdom/anubhavgatha",
        icon: BookOpen,
        children: [
          { label: "Categories", href: "/wisdom/anubhavgatha/categories", icon: FolderOpen },
        ],
      },
    ],
  },
  {
    // Events + News share one pill slot so the desktop header stays readable
    // across 8 ecosystem sections. Dropdown groups keep both destinations clear.
    id: "updates",
    label: "News & Events",
    href: "/events",
    icon: CalendarDays,
    description: "Events, gatherings & latest news",
    accentColor: "rose",
    subItems: [
      { id: "all-events", label: "All Events", href: "/events", icon: Home, group: "Events" },
      { id: "ss-live", label: "Soul Sustenance LIVE", href: "/wisdom/soul-sustenance/live", icon: CalendarDays, live: true },
      { id: "event-venues", label: "Venues", href: "/events/venues", icon: MapPin },
      { id: "event-organizers", label: "Organizers", href: "/events/organizers", icon: Users },
      { id: "event-categories", label: "Categories", href: "/events/categories", icon: Tag },
      { id: "news-home", label: "Latest News", href: "/news", icon: Newspaper, group: "News" },
      { id: "news-categories", label: "Categories", href: "/news/category", icon: LayoutGrid },
      { id: "news-cities", label: "Cities", href: "/news/city", icon: Building2 },
      { id: "news-states", label: "States", href: "/news/state", icon: Map },
      { id: "news-occasions", label: "Occasions", href: "/news/occasion", icon: Calendar },
      { id: "news-tags", label: "Tags", href: "/news/tag", icon: Tag },
      { id: "news-submit", label: "Submit News", href: "/news/submit-news", icon: PenSquare },
    ],
  },
  {
    id: "aboutus",
    label: "About",
    href: "/about",
    icon: Info,
    description: "Our story, journey & guiding lights",
    accentColor: "slate",
    subItems: [
      { label: "About Us", href: "/about/about-us", icon: Info },
      { label: "Our Journey", href: "/about/journey", icon: Route },
      { label: "Founder & Instruments", href: "/about/founder-and-instruments", icon: Crown },
      { label: "Wings", href: "/about/wings", icon: Award },
      { label: "Current Leaders", href: "/about/current-leaders", icon: Users },
    ],
  },
  {
    id: "initiative",
    label: "Initiatives",
    href: "/initiatives",
    icon: Leaf,
    description: "Seva across environment, education, health & society",
    accentColor: "emerald",
    subItems: [
      { id: "environment", label: "Environment", href: "/initiatives/environment", icon: Leaf },
      { id: "education", label: "Education", href: "/initiatives/education", icon: BookHeart },
      { id: "social", label: "Social", href: "/initiatives/social", icon: Handshake },
      { id: "health", label: "Health", href: "/initiatives/health", icon: Heart },
      {
        id: "nmba",
        label: "Nasha Mukt Bharat Abhiyaan",
        href: "/initiatives/nmba",
        icon: ShieldCheck,
        group: "Projects",
      },
      {
        id: "blood-donation",
        label: "Blood Donation Drive",
        href: "/initiatives/blood-donation",
        icon: Droplets,
        group: "Projects",
      },
      {
        id: "globalsummit",
        label: "Global Summit",
        href: "/initiatives/globalsummit",
        icon: Globe,
        group: "Mega Events",
      },
      {
        id: "cop",
        label: "COP – UN Climate Conferences",
        href: "/initiatives/cop",
        icon: Earth,
        group: "Global Engagement",
      },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    href: "/contact",
    icon: LifeBuoy,
    description: "Get answers and reach the Brahma Kumaris",
    accentColor: "sky",
    subItems: [
      { id: "faq", label: "FAQ", href: "/contact/faq", icon: HelpCircle },
      { id: "contribution", label: "Contribution", href: "/contact/contribution", icon: HeartHandshake },
    ],
  },
];

export const BK_LOGO_URL =
  "https://media.brahmakumaris.com/assets/BK_Logo_c6ca9ac104.png";

export const ACCENT_COLORS: Record<string, { bg: string; text: string; border: string; bgSubtle: string }> = {
  sky: {
    bg: "bg-sky-600",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-500",
    bgSubtle: "bg-sky-50 dark:bg-sky-950/40",
  },
  emerald: {
    bg: "bg-emerald-600",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500",
    bgSubtle: "bg-emerald-50 dark:bg-emerald-950/40",
  },
  violet: {
    bg: "bg-violet-600",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500",
    bgSubtle: "bg-violet-50 dark:bg-violet-950/40",
  },
  rose: {
    bg: "bg-rose-600",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-500",
    bgSubtle: "bg-rose-50 dark:bg-rose-950/40",
  },
  amber: {
    bg: "bg-amber-600",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500",
    bgSubtle: "bg-amber-50 dark:bg-amber-950/40",
  },
  indigo: {
    bg: "bg-indigo-600",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "border-indigo-500",
    bgSubtle: "bg-indigo-50 dark:bg-indigo-950/40",
  },
  slate: {
    bg: "bg-slate-600",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-500",
    bgSubtle: "bg-slate-100 dark:bg-slate-900/40",
  },
};
