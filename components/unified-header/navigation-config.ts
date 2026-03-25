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
  type LucideIcon,
} from "lucide-react";

export type AppId = "meditation" | "courses" | "centers" | "wisdom" | "events" | "news" | "aboutus";

export interface NavSubChild {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSubItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavSubChild[];
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

// All hrefs are FULL paths (with basePath prefix) so cross-app links work as <a> tags
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
      {
        label: "Soul Sustenance",
        href: "/wisdom/soul-sustenance",
        icon: Sparkles,
        children: [
          { label: "English", href: "/wisdom/soul-sustenance/eng", icon: Languages },
          { label: "Hindi", href: "/wisdom/soul-sustenance/hin", icon: Languages },
          { label: "Categories", href: "/wisdom/soul-sustenance/categories", icon: FolderOpen },
          { label: "Archive", href: "/wisdom/soul-sustenance/archive", icon: Calendar },
        ],
      },
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
          { label: "Categories", href: "/wisdom/testimonials/categories", icon: FolderOpen },
          { label: "Archive", href: "/wisdom/testimonials/archive", icon: Calendar },
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
      { label: "Activities", href: "/wisdom/activities", icon: Gamepad2 },
    ],
  },
  {
    id: "events",
    label: "Events",
    href: "/events",
    icon: CalendarDays,
    description: "Spiritual events & gatherings",
    accentColor: "rose",
    subItems: [
      { label: "All Events", href: "/events", icon: Home },
      { label: "Venues", href: "/events/venues", icon: MapPin },
      { label: "Organizers", href: "/events/organizers", icon: Users },
      { label: "Categories", href: "/events/categories", icon: Tag },
    ],
  },
  {
    id: "news",
    label: "News",
    href: "/news",
    icon: Newspaper,
    description: "Latest news from Brahma Kumaris",
    accentColor: "amber",
    subItems: [
      { label: "Home", href: "/news", icon: Home },
      { label: "Categories", href: "/news/category", icon: LayoutGrid },
      { label: "Cities", href: "/news/city", icon: Building2 },
      { label: "States", href: "/news/state", icon: Map },
      { label: "Occasions", href: "/news/occasion", icon: Calendar },
      { label: "Tags", href: "/news/tag", icon: Tag },
      { label: "Submit News", href: "/news/submit-news", icon: PenSquare },
    ],
  },
  {
    id: "aboutus",
    label: "About Us",
    href: "/about-us",
    icon: Info,
    description: "Our journey, leaders & contributions",
    accentColor: "slate",
    subItems: [
      { label: "Journey", href: "/journey", icon: Route },
      { label: "Founder & Instruments", href: "/founder-and-instruments", icon: Crown },
      { label: "Wings", href: "/about-us/wings", icon: Award },
      { label: "Current Leaders", href: "/current-leaders", icon: Users },
      { label: "Contributions", href: "/contributions", icon: Handshake },
    ],
  },
];

export const BK_LOGO_URL =
  "https://bkstrapiapp.blob.core.windows.net/strapi-uploads/assets/BK_Logo_c6ca9ac104.png";

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
