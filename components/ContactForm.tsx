'use client';

import React, { useState, useEffect } from 'react';
import { Center } from '@/lib/types';
import { CenterLocatorAnalytics } from './GoogleAnalytics';
import CallNowButton from './CallNowButton';
import { Clock, Navigation } from 'lucide-react';

interface ContactFormProps {
  center: Center;
  pageUrl: string;
  /** Hide preferred-time select (e.g. retreat campuses that avoid fixed hours). */
  hidePreferredTime?: boolean;
  defaultMessage?: string;
  /** Plain form without nested card / heavy intro (for campus enquire panels). */
  embedded?: boolean;
  /** When set, Learn Meditation is a walk-in path — not a form to fill. */
  walkIn?: {
    morning: string;
    evening: string;
    custom?: string;
    directionsUrl: string;
    contact?: string;
    mobile?: string;
  };
}

type ContactType = 'LearnMeditation' | 'Query' | 'AttendEvent' | 'Feedback' | 'Others';

// Helper function to get the correct API base URL
const getApiUrl = () => {
  // basePath is always /centers in next.config.js, so all API routes
  // are served under /centers/api/... in both dev and production
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/centers`;
  }
  
  // Server-side fallback (should not be reached in client components)
  return 'https://www.brahmakumaris.com/centers';
};

const DEFAULT_MESSAGE =
  "I'm interested in learning meditation. Please provide information about your classes and timings.";

const ContactForm: React.FC<ContactFormProps> = ({
  center,
  pageUrl,
  hidePreferredTime = false,
  defaultMessage = DEFAULT_MESSAGE,
  embedded = false,
  walkIn,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(walkIn ? '' : defaultMessage);
  const [preferredTime, setPreferredTime] = useState('');
  const [contactType, setContactType] = useState<ContactType>(walkIn ? 'Query' : 'LearnMeditation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userAgent, setUserAgent] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setUserAgent(window.navigator.userAgent);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // A visitor must give us at least one way to reach them.
    if (!phone && !email) {
      setError('Please provide a phone number or email so the center can reach you.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const fullMessage =
      !hidePreferredTime && preferredTime
        ? `${message}\n\nPreferred time to attend: ${preferredTime}`
        : message;

    try {
      // Use the full API URL including the base path
      const apiBaseUrl = getApiUrl();
      // Next.js will automatically handle the basePath configuration
      const apiUrl = `${apiBaseUrl}/api/send-email`;
      console.log('Sending email using API endpoint:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          message: fullMessage,
          contactType,
          centerEmail: center.email,
          centerName: center.name,
          centerAddress: center.address,
          centerContact: center.contact,
          centerMobile: center.mobile,
          centerState: center.state,
          centerDistrict: center.district,
          centerRegion: center.region,
          userAgent,
          pageUrl,
        }),
      });

      if (!response.ok) {
        // Try to parse the error message from the response
        let errorMessage = 'Failed to send email';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          // Handle non-JSON error responses (like HTML)
          if (response.status === 404) {
            errorMessage = 'Email service not found. Please try again later.';
          } else {
            errorMessage = `Server error (${response.status}). Please try again later.`;
          }
        }
        throw new Error(errorMessage);
      }

      // Parse the response data
      const data = await response.json();

      // Track successful form submission
      CenterLocatorAnalytics.contactCenter(center);
      
      // Success
      setIsSubmitted(true);
      // Clear form
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setPreferredTime('');
    } catch (err: any) {
      console.error('Email submission error:', err);
      setError(err.message || 'An error occurred while sending your message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactTypeChange = (type: ContactType) => {
    setContactType(type);
    
    // Track contact type selection
    CenterLocatorAnalytics.useFilter('contact_type', type);
    
    // Set default message templates based on contact type
    if (type === 'LearnMeditation') {
      setMessage(
        walkIn
          ? ''
          : hidePreferredTime
            ? defaultMessage
            : "I'm interested in learning meditation. Please provide information about your classes and timings."
      );
    } else if (type === 'AttendEvent') {
      setMessage("I would like to attend an event. Please provide more information about upcoming events.");
    } else if (type === 'Query') {
      setMessage('');
    } else {
      setMessage('');
    }
  };

  const showWalkInInsteadOfForm =
    Boolean(walkIn) && contactType === 'LearnMeditation';

  // If the message was successfully submitted, show a success message
  if (isSubmitted) {
    return (
      <div
        className={
          embedded
            ? 'text-center py-4'
            : 'bg-light dark:bg-neutral-800 rounded-lg shadow-md p-6 border border-spirit-blue-200 dark:border-spirit-blue-800 text-center'
        }
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-spirit-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-2xl font-bold mb-4 spiritual-text-gradient">Thank You!</h3>
        <p className="text-neutral-700 dark:text-neutral-300 mb-4">
          Your message has been sent to {center.name}.
        </p>
        <button
          onClick={() => setIsSubmitted(false)}
          className="btn-primary"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  const topics: { type: ContactType; label: string }[] = [
    { type: 'LearnMeditation', label: 'Learn Meditation' },
    { type: 'Query', label: 'Question' },
    { type: 'AttendEvent', label: 'Attend Event' },
    { type: 'Feedback', label: 'Feedback' },
    { type: 'Others', label: 'Others' },
  ];
  // With walk-in classes, a preferred class time no longer fits any topic
  const showPreferredTime = !hidePreferredTime && !walkIn;
  const fieldClass =
    'w-full rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50/70 dark:bg-neutral-700 px-3.5 py-2.5 text-base text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 transition-colors hover:border-neutral-300 focus:bg-white dark:focus:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';
  const labelClass = embedded ? 'sr-only' : 'block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5';

  return (
    <div
      className={
        embedded
          ? ''
          : 'rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm p-4 sm:p-6 lg:p-8'
      }
    >
      {/* With walkIn the page section already introduces the form */}
      {!embedded && !walkIn ? (
        <>
          <h2 className="text-2xl font-bold mb-4 spiritual-text-gradient">Send a Message</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Have a question, want to join the free 7-day course, or need help finding timings? Share your details and we&apos;ll get back to you.
          </p>
        </>
      ) : null}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <fieldset className={embedded ? 'mb-3' : 'mb-5'}>
          <legend className={embedded ? 'sr-only' : 'mb-2 text-sm font-medium text-neutral-700 dark:text-neutral-300'}>
            What is it about?
          </legend>
          <div className="flex flex-wrap gap-2">
            {topics.map((topic) => (
              <button
                key={topic.type}
                type="button"
                aria-pressed={contactType === topic.type}
                onClick={() => handleContactTypeChange(topic.type)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  contactType === topic.type
                    ? 'border-transparent bg-primary text-white'
                    : 'border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-spirit-purple-300 dark:hover:border-spirit-purple-600'
                }`}
              >
                {topic.label}
              </button>
            ))}
          </div>
        </fieldset>

        {showWalkInInsteadOfForm && walkIn ? (
          <div className="rounded-xl border border-spirit-gold-200 dark:border-spirit-gold-800 bg-spirit-gold-50/70 dark:bg-spirit-gold-900/15 p-4 sm:p-5">
            <p className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
              Kindly call the center first
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed">
              Class hours are approximate. Please call to confirm today&apos;s timing, then visit — no form needed.
            </p>
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-4 flex items-start gap-2">
              <Clock className="w-4 h-4 mt-0.5 shrink-0 text-spirit-gold-600" />
              {walkIn.custom || `Morning ${walkIn.morning} · Evening ${walkIn.evening} · daily`}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              {(walkIn.contact || walkIn.mobile) && (
                <CallNowButton
                  contact={walkIn.contact}
                  mobile={walkIn.mobile}
                  region={center.region}
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Call to confirm
                </CallNowButton>
              )}
              <a
                href={walkIn.directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-white dark:hover:bg-neutral-700 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                Get Directions
              </a>
            </div>
            <button
              type="button"
              onClick={() => handleContactTypeChange('Query')}
              className="mt-4 text-xs text-neutral-500 dark:text-neutral-400 underline underline-offset-2 hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              I need technical help or another question
            </button>
          </div>
        ) : (
          <>
            {/* Name, phone and email share a row on desktop (two on tablets) */}
            <div className={`grid gap-3 sm:grid-cols-2 lg:grid-cols-3 ${embedded ? 'mb-3' : 'mb-4 sm:gap-4'}`}>
              <div>
                <label htmlFor="name" className={labelClass}>
                  Name <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  autoComplete="name"
                  className={fieldClass}
                  placeholder={embedded ? 'Name *' : 'Your name'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Phone Number <span className="text-primary">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  autoComplete="tel"
                  className={fieldClass}
                  placeholder={embedded ? 'Phone *' : 'Your phone number'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <label htmlFor="email" className={labelClass}>
                  Email <span className="text-neutral-400 font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  id="email"
                  autoComplete="email"
                  className={fieldClass}
                  placeholder={embedded ? 'Email (optional)' : 'Your email address'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {showPreferredTime ? (
              <div className="mb-4">
                <label htmlFor="preferredTime" className={labelClass}>
                  Preferred time to attend
                </label>
                <select
                  id="preferredTime"
                  className={fieldClass}
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                >
                  <option value="">No preference</option>
                  <option value="Morning (7:00 – 9:00 AM)">Morning (7:00 – 9:00 AM)</option>
                  <option value="Evening (5:00 – 8:00 PM)">Evening (5:00 – 8:00 PM)</option>
                  <option value="Either morning or evening">Either morning or evening</option>
                  <option value="Weekends only">Weekends only</option>
                </select>
              </div>
            ) : null}

            <div className={embedded ? 'mb-4' : 'mb-5'}>
              <label htmlFor="message" className={labelClass}>
                Message <span className="text-primary">*</span>
              </label>
              <textarea
                id="message"
                className={fieldClass}
                placeholder={embedded ? 'Message *' : 'How can we help?'}
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className={`btn-primary py-3 flex justify-center items-center ${embedded ? 'w-full' : 'w-full sm:w-auto sm:px-10'}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Sending...</span>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </>
              ) : (
                'Send Message'
              )}
            </button>
          </>
        )}
      </form>
    </div>
  );
};

export default ContactForm;