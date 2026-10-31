'use client';

import React, { useState } from 'react';
import { Phone } from 'lucide-react';
import { callableNumbers } from '@/lib/phone';
import {
  ContactSheet,
  PhoneOptions,
  PHONE_HINT,
  type ContactAnalyticsType,
  type ContactCenterInfo,
} from './ContactSheet';

interface CallNowButtonProps {
  mobile?: string;
  contact?: string;
  className?: string;
  children?: React.ReactNode;
  /** The center's region — picks the country code (+91 India, +977 Nepal) */
  region?: string;
  /** For the sheet subtitle and contact analytics */
  center?: ContactCenterInfo;
  analyticsType?: ContactAnalyticsType;
}

/**
 * "Call" button: opens a sheet listing the center's numbers, each with a real
 * Call link and Copy (works in in-app browsers that block calling).
 */
export default function CallNowButton({
  mobile,
  contact,
  className,
  children,
  region,
  center,
  analyticsType,
}: CallNowButtonProps) {
  const [showSheet, setShowSheet] = useState(false);

  const allNumbers = callableNumbers(mobile, contact, region);
  if (allNumbers.length === 0) return null;

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={(e) => {
          // Often sits inside a clickable card
          e.preventDefault();
          e.stopPropagation();
          setShowSheet(true);
        }}
        className={className || "inline-flex items-center gap-2 bg-white text-spirit-purple-700 px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"}
      >
        {children || (
          <>
            <Phone className="w-4 h-4" />
            Call Now
          </>
        )}
      </button>

      {showSheet && (
        <ContactSheet
          title="Call the center"
          subtitle={center?.name ?? (allNumbers.length > 1 ? 'Choose a number' : undefined)}
          icon={<Phone className="h-5 w-5" />}
          hint={PHONE_HINT}
          onClose={() => setShowSheet(false)}
        >
          <PhoneOptions numbers={allNumbers} region={region} center={center} analyticsType={analyticsType} />
        </ContactSheet>
      )}
    </>
  );
}
