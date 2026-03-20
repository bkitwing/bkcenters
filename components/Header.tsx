"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CenterLocatorAnalytics } from './GoogleAnalytics';
import { ThemeToggle } from './ThemeToggle';
import { Home, MapPin, Search, Menu, X, Building2, Compass } from 'lucide-react';

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
          
          CenterLocatorAnalytics.locationPermission(true);
          CenterLocatorAnalytics.searchCenters('Current Location', 0, 'location');

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
        
        if (error.code === error.PERMISSION_DENIED) {
          CenterLocatorAnalytics.locationPermission(false);
        }

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
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  };

  return (
    <header className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200/60 dark:border-neutral-800/60 sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 h-14 flex justify-between items-center">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center shrink-0"
        >
          <Image
            src="/centers/brahma-kumaris-logo.webp"
            alt="Brahma Kumaris"
            width={80}
            height={80}
            className="h-9 w-auto"
            unoptimized
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-spirit-purple-600 dark:hover:text-spirit-purple-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>
          <button
            onClick={handleUseMyLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-spirit-purple-600 dark:text-spirit-purple-400 hover:bg-spirit-purple-50 dark:hover:bg-spirit-purple-900/20 transition-colors text-sm font-semibold"
          >
            <MapPin className="w-3.5 h-3.5" />
            Nearby
          </button>
          <Link
            href="/india"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-spirit-purple-600 dark:hover:text-spirit-purple-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
          >
            <Compass className="w-3.5 h-3.5" />
            All States
          </Link>
          <Link
            href="/retreat"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-spirit-purple-600 dark:hover:text-spirit-purple-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
          >
            <Building2 className="w-3.5 h-3.5" />
            HQ Campuses
          </Link>
          <div className="w-px h-5 bg-neutral-200 dark:bg-neutral-700 mx-1" />
          <Link
            href="/"
            className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-spirit-purple-600 dark:hover:text-spirit-purple-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Search centers"
          >
            <Search className="w-4 h-4" />
          </Link>
          <ThemeToggle />
        </nav>

        {/* Mobile: Home + Search outside menu, then hamburger */}
        <div className="md:hidden flex items-center gap-0.5">
          <Link
            href="/"
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Home"
          >
            <Home className="w-5 h-5" />
          </Link>
          <Link
            href="/"
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </Link>
          <button
            className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <nav className="container mx-auto px-4 py-2">
            <ul className="space-y-0.5">
              <li>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleUseMyLocation();
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-spirit-purple-600 dark:text-spirit-purple-400 hover:bg-spirit-purple-50 dark:hover:bg-spirit-purple-900/20 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-semibold">Nearby Centers</span>
                </button>
              </li>
              <li>
                <Link
                  href="/india"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  onClick={toggleMenu}
                >
                  <Compass className="w-4 h-4" />
                  <span className="text-sm font-medium">All States</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/retreat"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  onClick={toggleMenu}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="text-sm font-medium">HQ Campuses</span>
                </Link>
              </li>
              <li className="pt-2 mt-1 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Dark Mode</span>
                  <ThemeToggle />
                </div>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
