'use client';

import React, { useState, useEffect } from 'react';
import { Center } from '@/lib/types';

interface ContactFormProps {
  center: Center;
  pageUrl: string;
}

type ContactType = 'LearnMeditation' | 'Query' | 'AttendEvent' | 'Feedback' | 'Others';

// Helper function to get the correct API base URL
const getApiUrl = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 
    process.env.NODE_ENV === 'production' ? 'https://www.brahmakumaris.com' : 'http://localhost:3000';
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${origin}${basePath}`;
};

const ContactForm: React.FC<ContactFormProps> = ({ center, pageUrl }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [contactType, setContactType] = useState<ContactType>('LearnMeditation');
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
    setIsSubmitting(true);
    setError(null);

    try {
      // Use the full API URL including the base path
      const apiBaseUrl = getApiUrl();
      console.log('Sending email using API endpoint:', `${apiBaseUrl}/api/send-email`);
      
      const response = await fetch(`${apiBaseUrl}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          contactType,
          centerEmail: center.email,
          centerName: center.name,
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

      // Success
      setIsSubmitted(true);
      // Clear form
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err: any) {
      console.error('Email submission error:', err);
      setError(err.message || 'An error occurred while sending your message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactTypeChange = (type: ContactType) => {
    setContactType(type);
    // Set default message templates based on contact type
    if (type === 'LearnMeditation') {
      setMessage("I'm interested in learning meditation. Please provide information about your classes and timings.");
    } else if (type === 'AttendEvent') {
      setMessage("I would like to attend an event. Please provide more information about upcoming events.");
    } else if (type === 'Query') {
      setMessage('');
    } else {
      setMessage('');
    }
  };

  // If the message was successfully submitted, show a success message
  if (isSubmitted) {
    return (
      <div className="bg-light rounded-lg shadow-md p-6 border border-spirit-blue-200 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-spirit-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-2xl font-bold mb-4 spiritual-text-gradient">Thank You!</h3>
        <p className="text-neutral-700 mb-4">
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

  return (
    <div className="bg-light rounded-lg shadow-md p-6 border border-neutral-200">
      <h2 className="text-2xl font-bold mb-4 spiritual-text-gradient">Contact Us</h2>
      <p className="text-neutral-600 mb-4">
        Send a message to the meditation center. We'll do our best to respond to your query.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="contactType" className="block text-neutral-700 font-medium mb-2">
            How can we help you?
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`py-2 px-4 rounded-md transition-colors ${
                contactType === 'LearnMeditation'
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
              onClick={() => handleContactTypeChange('LearnMeditation')}
            >
              Learn Meditation
            </button>
            <button
              type="button"
              className={`py-2 px-4 rounded-md transition-colors ${
                contactType === 'Query'
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
              onClick={() => handleContactTypeChange('Query')}
            >
              Query
            </button>
            <button
              type="button"
              className={`py-2 px-4 rounded-md transition-colors ${
                contactType === 'AttendEvent'
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
              onClick={() => handleContactTypeChange('AttendEvent')}
            >
              Attend Event
            </button>
            <button
              type="button"
              className={`py-2 px-4 rounded-md transition-colors ${
                contactType === 'Feedback'
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
              onClick={() => handleContactTypeChange('Feedback')}
            >
              Feedback
            </button>
            <button
              type="button"
              className={`py-2 px-4 rounded-md transition-colors ${
                contactType === 'Others'
                  ? 'bg-primary text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
              onClick={() => handleContactTypeChange('Others')}
            >
              Others
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="name" className="block text-neutral-700 font-medium mb-2">
            Name <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            id="name"
            className="w-full p-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block text-neutral-700 font-medium mb-2">
            Email <span className="text-primary">*</span>
          </label>
          <input
            type="email"
            id="email"
            className="w-full p-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="phone" className="block text-neutral-700 font-medium mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            className="w-full p-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Your phone number (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="message" className="block text-neutral-700 font-medium mb-2">
            Message <span className="text-primary">*</span>
          </label>
          <textarea
            id="message"
            className="w-full p-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Your message"
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          ></textarea>
        </div>

        <button
          type="submit"
          className="btn-primary w-full py-3 flex justify-center items-center"
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
      </form>
    </div>
  );
};

export default ContactForm; 