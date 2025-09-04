'use client';

import React, { useState, useEffect } from 'react';
import { Center } from '@/lib/types';
import CenterCard from './CenterCard';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  sectionId?: string;
  previewData?: Center[]; // For showing preview when collapsed
  faqPreviewData?: { question: string; answer: string | React.ReactNode; }[]; // For FAQ previews
}

export default function CollapsibleSection({ 
  title, 
  children, 
  defaultExpanded = false,
  sectionId,
  previewData,
  faqPreviewData
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Toggle expansion state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Auto-expand when a center card is highlighted (for nearby centers section)
  useEffect(() => {
    if (sectionId === 'nearby-centers') {
      const handleHighlight = (event: Event) => {
        // If a center card is highlighted and the section is collapsed, expand it
        if (event.type === 'DOMNodeInserted' && !isExpanded) {
          const target = event.target as HTMLElement;
          if (target.classList.contains('highlight-card')) {
            setIsExpanded(true);
          }
        }
      };
      
      // Listen for highlight class being added to any element
      document.addEventListener('DOMNodeInserted', handleHighlight);
      
      return () => {
        document.removeEventListener('DOMNodeInserted', handleHighlight);
      };
    }
  }, [isExpanded, sectionId]);

  // Show preview for nearby centers when collapsed
  const shouldShowCentersPreview = sectionId === 'nearby-centers' && !isExpanded && previewData && previewData.length > 0;
  const previewCenters = previewData?.slice(0, 3) || [];
  
  // Show preview for FAQ when collapsed
  const shouldShowFAQPreview = sectionId === 'faq' && !isExpanded && faqPreviewData && faqPreviewData.length > 0;
  const previewFAQs = faqPreviewData?.slice(0, 3) || [];

  return (
    <div className="mt-10 pt-10">
      <div>
        {/* Modern Section Divider */}
        <div className="flex items-center mb-8">
          <div className="flex-grow h-px bg-gradient-to-r from-transparent via-spirit-purple-300 to-transparent"></div>
          <div className="px-4">
            <button
              onClick={toggleExpand}
              className="flex items-center space-x-2 text-2xl font-bold text-spirit-purple-700 bg-white px-2 transition-colors hover:text-spirit-purple-800"
              aria-expanded={isExpanded}
              aria-controls={`${sectionId || 'section'}-content`}
            >
              <span>{title}</span>
              {previewData && previewData.length > 0 && (
                <span className="text-sm font-normal text-spirit-purple-500 ml-2">
                  ({previewData.length})
                </span>
              )}
              {faqPreviewData && faqPreviewData.length > 0 && (
                <span className="text-sm font-normal text-spirit-purple-500 ml-2">
                  ({faqPreviewData.length} Questions)
                </span>
              )}
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-6 w-6 text-spirit-purple-600 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          <div className="flex-grow h-px bg-gradient-to-r from-transparent via-spirit-purple-300 to-transparent"></div>
        </div>
        
        {/* Preview Section for Nearby Centers */}
        {shouldShowCentersPreview && (
          <div className="relative mb-6">
            {/* Preview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {previewCenters.map((center, index) => (
                <div 
                  key={center.branch_code}
                  className={`block h-full transition-all duration-200 rounded-lg border border-neutral-200 hover:shadow-md ${
                    index === 2 ? 'lg:block hidden' : ''
                  } ${
                    index === 1 ? 'md:block hidden' : ''
                  }`}
                >
                  <CenterCard 
                    center={center} 
                    distance={center.distance} 
                    showDistance={true} 
                  />
                </div>
              ))}
            </div>
            
            {/* Glass Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90 pointer-events-none"></div>
            
            {/* Load More Button */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4">
              <button
                onClick={toggleExpand}
                className="bg-white/80 backdrop-blur-sm border border-spirit-purple-200 text-spirit-purple-700 px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
              >
                <span>View All {previewData?.length} Centers</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
         )}
         
         {/* Preview Section for FAQ */}
         {shouldShowFAQPreview && (
           <div className="relative mb-6">
             {/* Preview FAQ Items */}
             <div className="space-y-3">
               {previewFAQs.map((faq, index) => (
                 <div 
                   key={index}
                   className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm bg-white"
                 >
                   <div className={`px-5 py-4 ${
                     index % 2 === 0 
                       ? 'bg-gradient-to-r from-spirit-blue-50/30 to-spirit-purple-50/30'
                       : 'bg-gradient-to-r from-spirit-purple-50/30 to-spirit-blue-50/30'
                   }`}>
                     <div className="flex justify-between items-center">
                       <span className="font-semibold text-gray-800 pr-4 leading-relaxed">
                         {faq.question}
                       </span>
                       <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-500">
                         <svg 
                           className="w-4 h-4" 
                           fill="none" 
                           viewBox="0 0 24 24" 
                           stroke="currentColor"
                           strokeWidth={2.5}
                         >
                           <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                         </svg>
                       </div>
                     </div>
                   </div>
                 </div>
               ))}
             </div>
             
             {/* Glass Effect Overlay */}
             <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90 pointer-events-none"></div>
             
             {/* Load More Button */}
             <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4">
               <button
                 onClick={toggleExpand}
                 className="bg-white/80 backdrop-blur-sm border border-spirit-purple-200 text-spirit-purple-700 px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
               >
                 <span>View All {faqPreviewData?.length} Questions</span>
                 <svg 
                   xmlns="http://www.w3.org/2000/svg" 
                   className="h-5 w-5" 
                   fill="none" 
                   viewBox="0 0 24 24" 
                   stroke="currentColor"
                 >
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                 </svg>
               </button>
             </div>
           </div>
         )}
         
         {/* Full Content */}
        <div 
          id={`${sectionId || 'section'}-content`}
          className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-[2000px]' : 'max-h-0'}`}
        >
          <div className="pt-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}