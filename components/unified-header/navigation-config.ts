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
  LifeBuoy,
  HelpCircle,
  HeartHandshake,
  type LucideIcon,
} from "lucide-react";

export type AppId =
  | "meditation"
  | "courses"
  | "centers"
  | "wisdom"
  | "updates"
  | "aboutus"
  | "initiative"
  | "contact";

export interface NavSubChild {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSubItem {
  label: string;
  href: string;
  icon: LucideIcon;
  id?: string;
  children?: NavSubChild[];
  group?: string;
}

export interface NavSection {
  id: AppId;
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  accentColor: string;
  subItems: NavSubItem[];
}

export const NAVIGATION: NavSection[] = [
  {
    id: "meditation",
    label: "Meditation",
    href: "/meditation",
    icon: Flower2,
    description: "Learn and practice Rajyoga meditation",
    accentColor: "sky",
    subItems: [
      { label: "Children", href: "/meditation/age/children", icon: Baby },
      { label: "Youth", href: "/meditation/age/youth", icon: GraduationCap },
      { label: "Young Adults", href: "/meditation/age/young-adults", icon: User },
      { label: "Middle Age", href: "/meditation/age/middle-age", icon: User },
      { label: "Elderly", href: "/meditation/age/elderly", icon: UserRound },
      { label: "Topics", href: "/meditation/topics", icon: LayoutGrid },
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
      { label: "7 Day Course (Hindi)", href: "https://courses.brahmakumaris.com/sahaj-rajyog", icon: Languages },
      { label: "7 Day Course (English)", href: "https://courses.brahmakumaris.com/a-personal-journey-for-transformation", icon: Languages },
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
      { label: "Search", href: "/centers", icon: Home },
      { label: "Nearby", href: "/centers?nearby=true", icon: Navigation },
      { label: "All States", href: "/centers/india", icon: Compass },
      { label: "HQ Campuses", href: "/centers/retreat", icon: Building },
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
      { label: "Soul Sustenance", href: "/wisdom/soul-sustenance", icon: Sparkles },
      { label: "Blogs", href: "/wisdom/blog", icon: BookOpen },
      { label: "Audio", href: "/wisdom/audio", icon: Music },
      { label: "Galleries", href: "/wisdom/galleries", icon: Images },
      { label: "Testimonials", href: "/wisdom/testimonials", icon: MessageCircle },
      { label: "Movies & Documentaries", href: "/wisdom/movies", icon: Film },
      { label: "Activities", href: "/wisdom/activities", icon: Gamepad2 },
    ],
  },
  {
    id: "updates",
    label: "News & Events",
    href: "/events",
    icon: CalendarDays,
    description: "Events, gatherings & latest news",
    accentColor: "rose",
    subItems: [
      { id: "all-events", label: "All Events", href: "/events", icon: Home, group: "Events" },
      { id: "event-venues", label: "Venues", href: "/events/venues", icon: MapPin },
      { id: "event-organizers", label: "Organizers", href: "/events/organizers", icon: Users },
      { id: "event-categories", label: "Categories", href: "/events/categories", icon: Tag },
      { id: "news-home", label: "Latest News", href: "/news", icon: Newspaper, group: "News" },
      { id: "news-categories", label: "Categories", href: "/news/category", icon: LayoutGrid },
      { id: "news-cities", label: "Cities", href: "/news/city", icon: Building2 },
      { id: "news-states", label: "States", href: "/news/state", icon: Map },
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
      { id: "nmba", label: "Nasha Mukt Bharat Abhiyaan", href: "/initiatives/nmba", icon: ShieldCheck, group: "Projects" },
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
  "https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/BK_Logo_c6ca9ac104.png";

export const ACCENT_COLORS: Record<string, { bg: string; text: string; border: string; bgSubtle: string }> = {
  sky: { bg: "bg-sky-600", text: "text-sky-600 dark:text-sky-400", border: "border-sky-500", bgSubtle: "bg-sky-50 dark:bg-sky-950/40" },
  emerald: { bg: "bg-emerald-600", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500", bgSubtle: "bg-emerald-50 dark:bg-emerald-950/40" },
  violet: { bg: "bg-violet-600", text: "text-violet-600 dark:text-violet-400", border: "border-violet-500", bgSubtle: "bg-violet-50 dark:bg-violet-950/40" },
  rose: { bg: "bg-rose-600", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500", bgSubtle: "bg-rose-50 dark:bg-rose-950/40" },
  amber: { bg: "bg-amber-600", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500", bgSubtle: "bg-amber-50 dark:bg-amber-950/40" },
  indigo: { bg: "bg-indigo-600", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500", bgSubtle: "bg-indigo-50 dark:bg-indigo-950/40" },
  slate: { bg: "bg-slate-600", text: "text-slate-600 dark:text-slate-400", border: "border-slate-500", bgSubtle: "bg-slate-100 dark:bg-slate-900/40" },
};
