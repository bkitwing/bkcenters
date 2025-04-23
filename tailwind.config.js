/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary spiritual colors
        'primary': '#7E57C2', // Spiritual purple - represents enlightenment and higher consciousness
        'secondary': '#4FC3F7', // Celestial blue - represents peace and tranquility
        'accent': '#FFD54F', // Golden light - represents divine energy
        
        // Spiritual color palette
        'spirit': {
          'purple': {
            50: '#F3E5F5',
            100: '#E1BEE7',
            200: '#CE93D8',
            300: '#BA68C8',
            400: '#AB47BC',
            500: '#9C27B0', // Spiritual purple - divine wisdom
            600: '#8E24AA',
            700: '#7B1FA2',
            800: '#6A1B9A',
            900: '#4A148C',
          },
          'blue': {
            50: '#E1F5FE',
            100: '#B3E5FC',
            200: '#81D4FA',
            300: '#4FC3F7',
            400: '#29B6F6',
            500: '#03A9F4', // Peaceful blue - higher communication
            600: '#039BE5',
            700: '#0288D1',
            800: '#0277BD',
            900: '#01579B',
          },
          'teal': { 
            50: '#E0F2F1',
            100: '#B2DFDB',
            200: '#80CBC4',
            300: '#4DB6AC',
            400: '#26A69A',
            500: '#009688', // Healing teal - healing energy
            600: '#00897B',
            700: '#00796B',
            800: '#00695C',
            900: '#004D40',
          },
          'gold': {
            50: '#FFF8E1',
            100: '#FFECB3',
            200: '#FFE082',
            300: '#FFD54F',
            400: '#FFCA28',
            500: '#FFC107', // Divine gold - spiritual enlightenment
            600: '#FFB300',
            700: '#FFA000',
            800: '#FF8F00',
            900: '#FF6F00',
          },
          'rose': {
            50: '#FCE4EC',
            100: '#F8BBD0',
            200: '#F48FB1',
            300: '#F06292',
            400: '#EC407A',
            500: '#E91E63', // Rose - unconditional love
            600: '#D81B60',
            700: '#C2185B',
            800: '#AD1457',
            900: '#880E4F',
          }
        },
        
        // Neutral colors for balance
        'neutral': {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        },
        
        // Semantic colors
        'success': '#66BB6A', // Nature green - growth and abundance
        'warning': '#FFA726', // Amber - awareness and caution 
        'error': '#EF5350', // Soft red - grounding but not harsh
        'info': '#42A5F5', // Gentle blue - intuition
        
        // Light and dark modes
        'light': '#FFFFFF',
        'dark': '#212121',
      },
    },
  },
  plugins: [],
} 