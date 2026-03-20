'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Phone } from 'lucide-react';

interface CallNowButtonProps {
  mobile?: string;
  contact?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function CallNowButton({ mobile, contact, className, children }: CallNowButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const getAllPhoneNumbers = useCallback(() => {
    const numbers: string[] = [];
    if (mobile) {
      numbers.push(...mobile.split(',').map(num => num.trim()));
    }
    if (contact) {
      numbers.push(...contact.split(',').map(num => num.trim()));
    }
    return Array.from(new Set(numbers)).filter(num => {
      const cleanNum = num.replace(/\D/g, '');
      return cleanNum.length >= 10;
    });
  }, [mobile, contact]);

  // Close modal on Escape key
  useEffect(() => {
    if (!showModal) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [showModal]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showModal]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const allNumbers = getAllPhoneNumbers();
    if (allNumbers.length > 1) {
      setShowModal(true);
    } else if (allNumbers.length === 1) {
      const cleanNum = allNumbers[0].replace(/\D/g, '');
      window.location.href = `tel:+91${cleanNum}`;
    }
  };

  const handlePhoneSelect = (phoneNumber: string) => {
    const cleanNum = phoneNumber.replace(/\D/g, '');
    window.location.href = `tel:+91${cleanNum}`;
    setShowModal(false);
  };

  const allNumbers = getAllPhoneNumbers();
  if (allNumbers.length === 0) return null;

  return (
    <>
      <button
        onClick={handleClick}
        className={className || "inline-flex items-center gap-2 bg-white text-spirit-purple-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"}
      >
        {children || (
          <>
            <Phone className="w-4 h-4" />
            Call Now
          </>
        )}
      </button>

      {/* Phone Selection Modal — portaled to body to escape all stacking contexts */}
      {showModal && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70" />

          {/* Modal — bottom sheet on mobile, centered card on desktop */}
          <div
            className="relative w-full max-w-md mx-auto md:mx-auto bg-white dark:bg-neutral-800 rounded-t-2xl md:rounded-2xl shadow-2xl animate-slide-up md:animate-none overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-spirit-purple-100 dark:bg-spirit-purple-900/30 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-spirit-purple-600 dark:text-spirit-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Call Center</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Select a number to call</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-full transition-colors text-neutral-500 dark:text-neutral-400"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Phone Numbers */}
            <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
              {allNumbers.map((phoneNumber, index) => (
                <button
                  key={index}
                  onClick={() => handlePhoneSelect(phoneNumber)}
                  className="w-full flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-700/50 hover:bg-spirit-purple-50 dark:hover:bg-neutral-700 rounded-xl transition-colors border border-neutral-200 dark:border-neutral-600 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-spirit-gold-100 dark:bg-spirit-gold-900/30 flex items-center justify-center group-hover:bg-spirit-gold-200 dark:group-hover:bg-spirit-gold-900/50 transition-colors">
                      <svg className="w-5 h-5 text-spirit-gold-600 dark:text-spirit-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <span className="text-neutral-900 dark:text-neutral-100 font-medium block">{phoneNumber}</span>
                      <span className="text-xs text-neutral-400 dark:text-neutral-500">
                        {phoneNumber.replace(/\D/g, '').length === 10 ? 'Mobile' : 'Landline'}
                      </span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-neutral-300 dark:text-neutral-600 group-hover:text-spirit-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-3 text-center text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
