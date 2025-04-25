# Brahma Kumaris Meditation Center Locator

A Next.js Progressive Web App to locate Brahma Kumaris meditation centers across India.

## Features

- **Instant Location Search**: Find centers near your location using Google Maps API
- **Browse by State and District**: Hierarchical navigation of centers
- **Individual Center Pages**: Detailed information about each center with map and directions
- **Mobile-First Design**: Fully responsive for all device sizes
- **SEO Optimized**: Each center, district, and state has SEO-friendly metadata

## Getting Started

### Prerequisites

- Node.js 14.x or later
- NPM or Yarn
- Google Maps API key

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/brahma-kumaris-center-locator.git
cd brahma-kumaris-center-locator
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory and add your Google Maps API key
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

This application can be deployed to Vercel with minimal configuration:

```bash
npm install -g vercel
vercel
```

## Built With

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Google Maps API](https://developers.google.com/maps) - For maps and location search
- [TypeScript](https://www.typescriptlang.org/) - Type checking

## Project Structure

```
/app                   # Next.js app directory
  /centers             # Centers directory (base URL)
    /[state]           # State pages
      /[district]      # District pages
        /[branchCode]  # Individual center pages
/components            # Reusable components
/lib                   # Utility functions and data processing
/public                # Static assets
``` 



Copy Content from api to Centers_Raw.json
Run python3 compare_json_files.py
change madhuban concern to INDIA
node process-centers.js