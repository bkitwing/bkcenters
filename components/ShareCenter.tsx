'use client';

import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { Center } from '@/lib/types';

interface ShareCenterProps {
  center: Center;
  pageUrl: string;
}

export default function ShareCenter({ center, pageUrl }: ShareCenterProps) {
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [fullImageUrl, setFullImageUrl] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const qrCardRef = useRef<HTMLDivElement>(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Generate QR code
  const generateQRCode = async () => {
    try {
      const qrDataUrl = await QRCode.toDataURL(pageUrl, {
        width: 800, // Increased from 400 for higher quality
        margin: 2,
        color: {
          dark: '#553C9A', // Deeper purple color for QR code
          light: '#FFFFFF' // Background color
        },
        errorCorrectionLevel: 'H' // Highest error correction level for better scanning
      });
      setQrCodeUrl(qrDataUrl);
      setShowQRModal(true);
      // Add body class to prevent scrolling
      document.body.classList.add('overflow-hidden');
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  };

  // Generate full image with center details
  useEffect(() => {
    if (showQRModal && qrCodeUrl && qrCardRef.current) {
      // Allow time for the DOM to update
      setTimeout(() => {
        captureVisibleQrCard();
      }, 300);
    }
  }, [showQRModal, qrCodeUrl]);

  const captureVisibleQrCard = async () => {
    if (!qrCardRef.current) return;

    try {
      // Use only the definitively supported options
      const canvas = await html2canvas(qrCardRef.current, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        // The type definitions don't match the actual API in some cases
        // @ts-ignore
        backgroundColor: '#FFFFFF'
      });
      
      // Convert to data URL with high quality
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setFullImageUrl(dataUrl);
    } catch (err) {
      console.error('Error capturing QR card:', err);
      // Fallback to just the QR code if html2canvas fails
      setFullImageUrl(qrCodeUrl);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowQRModal(false);
    // Remove body class to allow scrolling again
    document.body.classList.remove('overflow-hidden');
  };

  // Handle click outside modal to close
  const handleOutsideClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      closeModal();
    }
  };

  // Generate formatted share text
  const getFormattedShareText = () => {
    const regionText = center.region ? `${center.region}, ` : '';
    return `✨ ${center.name} - Brahma Kumaris Rajyoga Meditation Center\n` +
           `📍 ${center.district}, ${center.state}, ${regionText}\n\n` +
           `Click Here to Visit Center\n` +
           `🔗 ${pageUrl}\n\n` +
           `To Find Nearby Centers, Kindly visit\n` +
           `https://www.brahmakumaris.com/centers\n\n` +
           `Om Shanti 🙏`;
  };

  // Share functionality
  const handleShare = async () => {
    const shareText = getFormattedShareText();
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${center.name} - Brahma Kumaris`,
          text: shareText,
          url: pageUrl
        });
      } else {
        // Fallback to copy to clipboard
        await navigator.clipboard.writeText(shareText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Copy to clipboard for desktop
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getFormattedShareText());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 1500);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
    }
  };

  // Download full image
  const downloadFullImage = () => {
    if (!fullImageUrl) return;
    
    const link = document.createElement('a');
    link.download = `${center.name.toLowerCase().replace(/\s+/g, '-')}-qr-code.png`;
    link.href = fullImageUrl;
    link.click();
  };

  // Share full image
  const shareFullImage = async () => {
    if (!fullImageUrl) return;
    
    try {
      // Convert data URL to blob
      const fetchResponse = await fetch(fullImageUrl);
      const blob = await fetchResponse.blob();
      
      const imageFile = new File([blob], `${center.name.toLowerCase().replace(/\s+/g, '-')}-qr-code.png`, { 
        type: 'image/png' 
      });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        // Share the image file
        await navigator.share({
          title: `${center.name} - QR Code`,
          text: getFormattedShareText(),
          files: [imageFile]
        });
      } else {
        // Fallback for browsers that don't support file sharing
        alert('Right-click on the QR code and select "Save image" or use the Download button.');
      }
    } catch (err) {
      console.error('Error sharing QR code image:', err);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-3 text-spirit-blue-700">Share Center</h2>
      <div className="flex items-center gap-4">
        {isMobile ? (
          <button
            onClick={handleShare}
            className="bg-primary text-white p-3 rounded-full hover:bg-primary-dark transition-colors shadow-md"
            aria-label="Share Center"
            title="Share Center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleCopy}
            className={`relative p-3 rounded-full shadow-md transition-all duration-300 ${
              isCopied 
                ? 'bg-green-500 scale-110' 
                : 'bg-primary hover:bg-primary-dark'
            }`}
            aria-label="Copy Center Info"
            title="Copy Center Info"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-6 w-6 text-white transition-all duration-300 ${isCopied ? 'scale-110' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {isCopied ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              )}
            </svg>
          </button>
        )}
        <button
          onClick={generateQRCode}
          className="bg-spirit-purple-600 text-white p-3 rounded-full hover:bg-spirit-purple-700 transition-colors shadow-md"
          aria-label="Generate QR Code"
          title="Generate QR Code"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </button>
      </div>

      {/* Modern QR Code Modal */}
      {showQRModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={handleOutsideClick}
        >
          <div 
            ref={modalRef}
            className="bg-white rounded-xl p-6 max-w-sm w-full mx-auto shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                onClick={closeModal}
                className="text-neutral-500 hover:text-neutral-700 focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex flex-col items-center text-center">
              {/* This div contains the content that will be captured as an image */}
              <div ref={qrCardRef} className="bg-white p-6 w-full rounded-lg">
                <h3 className="text-xl font-bold text-spirit-purple-700">{center.name}</h3>
                <p className="text-sm text-neutral-600 mb-6">Brahma Kumaris Meditation Center</p>
                
                {qrCodeUrl && (
                  <div className="border border-neutral-200 p-3 rounded-lg bg-white mb-6 mx-auto shadow-md" style={{ width: '264px', height: '264px' }}>
                    <img src={qrCodeUrl} alt="Center QR Code" className="w-full h-full" />
                  </div>
                )}
                
                <div className="flex items-center justify-center mb-4">
                  <span className="inline-block w-2 h-2 rounded-full bg-spirit-purple-600 mr-2"></span>
                  <p className="text-neutral-700">
                    <span className="font-medium">{center.district}</span>, {center.state}
                  </p>
                </div>
                
                <p className="text-spirit-purple-600 italic text-sm mt-4">Om Shanti</p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3 w-full mt-6">
                <button
                  onClick={downloadFullImage}
                  className="inline-flex items-center justify-center px-4 py-3 bg-spirit-blue-600 text-white rounded-md hover:bg-spirit-blue-700 transition-colors flex-1 shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={shareFullImage}
                  className="inline-flex items-center justify-center px-4 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex-1 shadow-md"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 