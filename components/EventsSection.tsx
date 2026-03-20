'use client';

import { useState, useMemo } from 'react';
import { EventPost } from '@/lib/types';
import { Calendar, Clock, ExternalLink, ArrowRight } from 'lucide-react';

type EventTab = 'ongoing' | 'upcoming' | 'past';

interface EventsSectionProps {
  initialEvents: EventPost[];
  totalCount: number;
  email: string;
}

function getEventStatus(event: EventPost): EventTab {
  const now = new Date();
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);

  if (now >= start && now <= end) return 'ongoing';
  if (now < start) return 'upcoming';
  return 'past';
}

function formatEventDate(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatEventTime(dateStr: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function getEventDateRange(event: EventPost) {
  const startDate = formatEventDate(event.start_date);
  const endDate = formatEventDate(event.end_date);
  const startTime = formatEventTime(event.start_date);
  const endTime = formatEventTime(event.end_date);

  if (startDate === endDate) {
    return `${startDate} • ${startTime} – ${endTime}`;
  }
  return `${startDate} – ${endDate}`;
}

function isValidUrl(str: string | null): boolean {
  if (!str) return false;
  return str.startsWith('http://') || str.startsWith('https://');
}

function EventCard({ event }: { event: EventPost }) {
  const status = getEventStatus(event);
  const imageUrl =
    event.featuredImage?.formats?.miniHD?.url ||
    event.featuredImage?.formats?.HD?.url ||
    event.featuredImage?.formats?.FullHD?.url ||
    event.featuredImage?.url ||
    null;
  const altText = event.featuredImage?.alternativeText || event.title;
  const eventUrl = isValidUrl(event.more_infor) ? event.more_infor! : `https://www.brahmakumaris.com/events/${event.slug}`;

  return (
    <div className="group rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col">
      {/* Image */}
      <div className="relative aspect-[16/9] bg-neutral-100 dark:bg-neutral-700 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={altText}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-spirit-purple-50 to-spirit-blue-50 dark:from-spirit-purple-900/20 dark:to-spirit-blue-900/20">
            <Calendar className="h-12 w-12 text-spirit-purple-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Date/Time */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-2">
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{getEventDateRange(event)}</span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 leading-snug line-clamp-2 mb-3 group-hover:text-spirit-purple-700 dark:group-hover:text-spirit-purple-400 transition-colors duration-200">
          {event.title}
        </h3>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
          <a
            href={eventUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-spirit-purple-600 dark:text-spirit-purple-400 hover:text-spirit-purple-800 dark:hover:text-spirit-purple-300 transition-colors"
          >
            View Details
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {event.registration_link && status !== 'past' && (
            <a
              href={event.registration_link}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold bg-spirit-purple-600 hover:bg-spirit-purple-700 text-white px-3 py-1.5 rounded-full transition-colors"
            >
              Register
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

const TABS: { key: EventTab; label: string }[] = [
  { key: 'ongoing', label: 'Ongoing' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];

export default function EventsSection({ initialEvents, totalCount, email }: EventsSectionProps) {
  const categorized = useMemo(() => {
    const groups: Record<EventTab, EventPost[]> = { ongoing: [], upcoming: [], past: [] };
    for (const event of initialEvents) {
      groups[getEventStatus(event)].push(event);
    }
    // Sort upcoming by nearest first
    groups.upcoming.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    // Sort past by most recent first
    groups.past.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
    return groups;
  }, [initialEvents]);

  // Default tab: ongoing if available, else upcoming, else past
  const defaultTab: EventTab = categorized.ongoing.length > 0
    ? 'ongoing'
    : categorized.upcoming.length > 0
      ? 'upcoming'
      : 'past';

  const [activeTab, setActiveTab] = useState<EventTab>(defaultTab);

  const activeEvents = categorized[activeTab];

  if (initialEvents.length === 0) return null;

  return (
    <div className="mt-10 pt-10">
      {/* Section Divider */}
      <div className="flex items-center mb-8">
        <div className="flex-grow h-px bg-gradient-to-r from-transparent via-spirit-purple-300 dark:via-spirit-purple-700 to-transparent"></div>
        <div className="px-4">
          <h2 className="text-2xl font-bold text-spirit-purple-700 dark:text-spirit-purple-400 bg-white dark:bg-neutral-900 px-2">Events</h2>
        </div>
        <div className="flex-grow h-px bg-gradient-to-r from-transparent via-spirit-purple-300 dark:via-spirit-purple-700 to-transparent"></div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-1 mb-8">
        {TABS.map((tab) => {
          const count = categorized[tab.key].length;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-spirit-purple-600 text-white shadow-md shadow-spirit-purple-200 dark:shadow-spirit-purple-900/40'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Events Grid */}
      {activeEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
          <Calendar className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            {activeTab === 'ongoing' && 'No ongoing events at the moment.'}
            {activeTab === 'upcoming' && 'No upcoming events scheduled.'}
            {activeTab === 'past' && 'No past events to show.'}
          </p>
        </div>
      )}
    </div>
  );
}
