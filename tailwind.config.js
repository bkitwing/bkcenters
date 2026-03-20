/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary — Deep Golden (aligned with wisdom-app)
        'primary': '#B8860B',
        'primary-dark': '#8B6914',
        // Secondary — Warm Gold
        'secondary': '#D4A84B',
        // Accent — Light Gold
        'accent': '#E6C87A',
        
        // Spiritual color palette — wisdom-app golden family
        'spirit': {
          'purple': {
            // Remapped to golden shades (primary golden accent)
            50: '#FBF5E6',
            100: '#F5E6CC',
            200: '#ECCE8E',
            300: '#E0B85C',
            400: '#D4A84B',
            500: '#B8860B',
            600: '#A67C00',
            700: '#8B6914',
            800: '#705410',
            900: '#4A3609',
          },
          'blue': {
            // Remapped to warm earth shades (secondary warm accent)
            50: '#FAF7F2',
            100: '#F5F0E6',
            200: '#E8E2D6',
            300: '#D6CCBC',
            400: '#C0B49E',
            500: '#A09080',
            600: '#857766',
            700: '#6B6050',
            800: '#504840',
            900: '#352F28',
          },
          'teal': {
            // Warm olive-green accent
            50: '#F5F7F0',
            100: '#E8EDDB',
            200: '#D1DBC0',
            300: '#B5C49A',
            400: '#96AA72',
            500: '#7A9050',
            600: '#627840',
            700: '#4A5C30',
            800: '#384828',
            900: '#263018',
          },
          'gold': {
            // Bright amber-gold (complementary accent)
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706',
            700: '#B45309',
            800: '#92400E',
            900: '#78350F',
          },
          'rose': {
            // Warm terracotta-rose
            50: '#FDF2F0',
            100: '#F9DDD8',
            200: '#F0BAB0',
            300: '#E49585',
            400: '#D47663',
            500: '#C05E45',
            600: '#A44D38',
            700: '#863E2E',
            800: '#6B3225',
            900: '#4D231A',
          }
        },
        
        // Neutral colors — warm neutrals (aligned with wisdom-app)
        'neutral': {
          50: '#FDFBF7',
          100: '#FAF7F2',
          200: '#F0EBE1',
          300: '#E8E2D6',
          400: '#A09890',
          500: '#6B6560',
          600: '#504840',
          700: '#3D3835',
          800: '#2D2A26',
          900: '#1A1815',
        },
        
        // Semantic colors
        'success': '#66BB6A',
        'warning': '#F59E0B',
        'error': '#EF5350',
        'info': '#D4A84B',
        
        // Light and dark modes
        'light': '#FFFFFF',
        'dark': '#1A1815',
      },
    },
  },
  plugins: [],
} 