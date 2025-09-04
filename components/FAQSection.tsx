'use client';

import React, { useState } from 'react';
import { Center } from '@/lib/types';

interface FAQSectionProps {
  center: Center;
}

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

export default function FAQSection({ center }: FAQSectionProps) {
  // State to track which FAQ item is expanded (only one at a time)
  const [expandedItem, setExpandedItem] = useState<number | null>(0); // First item expanded by default

  // Toggle FAQ item expansion (accordion style - only one open at a time)
  const toggleItem = (index: number) => {
    setExpandedItem(prev => prev === index ? null : index);
  };

  // Format address like the main page
  const formatAddress = () => {
    const { line1, line2, line3, city, pincode } = center.address || {};
    let parts = [];
    
    if (line1) parts.push(line1);
    if (line2) parts.push(line2);
    if (line3) parts.push(line3);
    if (city) parts.push(city);
    if (pincode) parts.push(pincode);
    if (center.state) parts.push(center.state);
    if (center.region) parts.push(center.region);
    
    return parts.join(', ');
  };

  // Dynamic FAQ about visiting this specific center
  const centerSpecificFAQ = {
    question: `How to Visit Meditation Center - ${center.name}?`,
    answer: (
      <div className="space-y-3">
        <p className="text-gray-700">
          You can visit our center located at:
        </p>
        <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-spirit-purple-400">
           <p className="font-medium text-gray-800 mb-2">{formatAddress()}</p>
           <div className="flex flex-wrap gap-3 text-sm">
             {(center.mobile || center.contact) && (
               <a 
                 href={`tel:${center.mobile || center.contact}`}
                 className="inline-flex items-center gap-1 text-spirit-purple-600 hover:text-spirit-purple-800 font-medium transition-colors"
               >
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                   <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                 </svg>
                 {center.mobile || center.contact}
               </a>
             )}
             {center.email && center.email.includes('@') && (
               <a 
                 href={`mailto:${center.email}`}
                 className="inline-flex items-center gap-1 text-spirit-purple-600 hover:text-spirit-purple-800 font-medium transition-colors"
               >
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                   <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                   <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                 </svg>
                 {center.email}
               </a>
             )}
             <a 
               href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formatAddress())}`}
               target="_blank"
               rel="noopener noreferrer"
               className="inline-flex items-center gap-1 text-spirit-purple-600 hover:text-spirit-purple-800 font-medium transition-colors"
             >
               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
               </svg>
               Get Directions
             </a>
           </div>
         </div>
        <p className="text-gray-600 text-sm">
          Feel free to contact us if you need any assistance or have questions about visiting our center.
        </p>
      </div>
    )
  };

  // Static FAQs with the center-specific one inserted at position 2
  const faqs: FAQItem[] = [
    {
      question: "What is the Brahma Kumaris?",
      answer: "Brahma Kumaris is a worldwide spiritual movement led by women, dedicated to personal transformation and world renewal through Rajyoga Meditation. Founded in India in 1937, Brahma Kumaris has spread to over 110 countries on all continents and has had an extensive impact in many sectors as an international NGO."
    },
    centerSpecificFAQ,
    {
      question: "Can anyone visit a Brahma Kumaris center and try Rajyoga meditation?",
      answer: "Yes. Every soul is welcome. Whether young or old, student, professional, or homemaker — the doors are open for all. You can sit in silence, experience God's love, and learn meditation in a pure and peaceful atmosphere."
    },
    {
      question: "What do you teach in the meditation course?",
      answer: "In the introductory 7-day Rajyoga course, you learn about the soul, the Supreme Soul (Shiv Baba), the law of karma, the cycle of time, and the power of purity. Along with knowledge, you also practice connecting with God through meditation, which fills you with peace and strength."
    },
    {
      question: "Do I need to wear any special dress when I come?",
      answer: "There is no special dress required. We lovingly suggest wearing clean, simple, and modest clothing that reflects purity and helps maintain the peaceful atmosphere of the center. What matters most is your intention to connect with God."
    },
    {
      question: "Do I have to become a full member to attend classes?",
      answer: "Not at all. At the Brahma Kumaris, every soul is welcome to attend classes freely, without any formal joining or commitment. This is a spiritual university of God, where you may come, listen, reflect, and take benefit as much as you wish, in your own time and comfort. Everything is offered with love and humility."
    },
    {
      question: "Do you ask for any money or donation?",
      answer: "No, there are no fees for any of the courses or services. As a voluntary organization, everything is offered as a service to the community. If someone wishes, they may contribute voluntarily to support the continuation of this spiritual work."
    },
    {
      question: "Is Brahma Kumaris connected to any one religion?",
      answer: "No. This is a spiritual path. God belongs to everyone, and all souls are His children. People of every background and faith come together here to experience peace, purity, and God's love."
    },
    {
      question: "What will I feel in the meditation class?",
      answer: "You may feel deep peace, lightness, or a sweet connection with God. Some feel God's love, others find clarity or strength to face challenges. Each soul's experience is unique, but always uplifting."
    },
    {
      question: "In which languages is the knowledge available?",
      answer: "Spiritual knowledge is available in many languages — Hindi, English, Tamil, Telugu, Gujarati, Marathi, Bengali, and more. Centers usually teach in the local language so that everyone can understand with ease."
    },
    {
      question: "If I visit the center, do I have to change my life?",
      answer: "There is no compulsion. You can practice at your own pace. Many souls naturally feel inspired to live peacefully, wake up early, speak sweetly, or adopt pure vegetarian food."
    },
    {
      question: "Is the Brahma Kumaris only for women?",
      answer: "No. The Brahma Kumaris is open to all — men, women, youth, and elders. Both brothers and sisters walk this spiritual path together, as equal souls and children of the one Supreme Father."
    }
  ];

  return (
    <div>
      
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 bg-white"
            itemScope 
            itemType="https://schema.org/Question"
          >
            <button
              onClick={() => toggleItem(index)}
              className={`w-full text-left px-5 py-4 flex justify-between items-center transition-all duration-200 group ${
                expandedItem === index 
                  ? 'bg-gradient-to-r from-spirit-purple-50 to-spirit-blue-50 text-spirit-purple-700' 
                  : index % 2 === 0 
                    ? 'bg-gradient-to-r from-spirit-blue-50/30 to-spirit-purple-50/30 hover:from-spirit-purple-50 hover:to-spirit-blue-50 text-gray-800'
                    : 'bg-gradient-to-r from-spirit-purple-50/30 to-spirit-blue-50/30 hover:from-spirit-blue-50 hover:to-spirit-purple-50 text-gray-800'
              }`}
              aria-expanded={expandedItem === index}
              aria-controls={`faq-answer-${index}`}
            >
              <span className="font-semibold text-left pr-4 leading-relaxed" itemProp="name">{faq.question}</span>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                 expandedItem === index 
                   ? 'bg-spirit-purple-100 text-spirit-purple-600 rotate-180' 
                   : 'bg-gray-100 text-gray-500 group-hover:bg-spirit-purple-100 group-hover:text-spirit-purple-600'
               }`}>
                <svg 
                  className="w-4 h-4 transition-transform duration-200" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            <div 
              id={`faq-answer-${index}`}
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                 expandedItem === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
               }`}
              itemScope 
              itemProp="acceptedAnswer" 
              itemType="https://schema.org/Answer"
            >
              <div className="px-5 pb-5 pt-1 bg-gradient-to-b from-white to-gray-50" itemProp="text">
                <div className="text-gray-700 leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}