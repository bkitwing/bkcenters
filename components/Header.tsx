"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaHome, FaBars, FaTimes, FaSearch } from "react-icons/fa";
import { MdMyLocation } from "react-icons/md";
import { useRouter } from "next/navigation";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Navigate to results page with query params
          router.push(
            `/?lat=${latitude}&lng=${longitude}&address=${encodeURIComponent(
              "Current Location"
            )}`
          );
        } catch (error) {
          console.error("Error handling location:", error);
          alert("Could not determine your location");
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Failed to get your location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Please allow location access in your browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }

        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="https://www.brahmakumaris.com/"
          className="flex items-center"
        >
          <Image
            src="/centers/brahma-kumaris-logo.webp"
            alt="Brahma Kumaris"
            width={80}
            height={80}
            className="h-10 w-auto"
            unoptimized
          />
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:block">
          <ul className="flex space-x-8 items-center">
            <li>
              <button
                onClick={handleUseMyLocation}
                className="flex items-center transition-colors focus:outline-none nearby-button"
              >
                <div className="flex items-center text-[#CF3891] font-bold">
                  <span>Nearby Me</span>
                </div>
              </button>
            </li>
            <li>
              <Link
                href="/retreat"
                className="flex items-center text-neutral-700 hover:text-primary transition-colors"
              >
                <span className="text-gray-600 font-medium">
                  Retreat Centers
                </span>
              </Link>
            </li>
            <li>
              <Link
                href="/"
                className="flex items-center text-neutral-700 hover:text-primary transition-colors"
                aria-label="Search Centers" 
              >
                <FaSearch size={20} className="text-gray-600" />
              </Link>
            </li>
          </ul>
        </nav>

        {/* Mobile Menu and Search Button */}
        <div className="md:hidden flex items-center space-x-4">
          <Link
            href="/"
            className="text-neutral-700 hover:text-primary transition-colors"
            aria-label="Search Centers"
          >
            <FaSearch size={20} className="text-gray-600" />
          </Link>
          <button
            className="text-neutral-700 focus:outline-none"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <nav className="container mx-auto px-4 py-3">
            <ul className="space-y-4">
              <li>
                <button
                  onClick={() => {
                    toggleMenu();
                    handleUseMyLocation();
                  }}
                  className="flex items-center transition-colors focus:outline-none"
                >
                  <div className="flex items-center text-[#CF3891] font-medium">
                    <span>Nearby Me</span>
                  </div>
                </button>
              </li>
              <li>
                <Link
                  href="/retreat"
                  className="flex items-center text-neutral-700 hover:text-primary transition-colors"
                  onClick={toggleMenu}
                >
                  <span className="text-gray-600 font-medium">
                    Retreat Centers
                  </span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}

      <style jsx global>{`
        .nearby-button {
          animation: subtle-pulse 3s ease-in-out infinite;
        }

        @keyframes subtle-pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </header>
  );
};

export default Header;
