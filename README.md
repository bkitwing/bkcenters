# Brahma Kumaris Meditation Center Locator

A Next.js Progressive Web App to locate Brahma Kumaris Rajyog meditation centers across India.

## Features

- **Instant Location Search**: Find centers near your location using Google Maps API
- **Browse by State and District**: Hierarchical navigation of centers
- **Individual Center Pages**: Detailed information about each center with map and directions
- **Mobile-First Design**: Fully responsive for all device sizes
- **SEO Optimized**: Each center, district, and state has SEO-friendly metadata
- **Contact Form**: Direct contact with meditation centers via email

## Getting Started

### Prerequisites

- Node.js 14.x or later
- NPM or Yarn
- Google Maps API key
- Gmail account with app password (for the contact form)

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

3. Create a `.env.local` file in the root directory and add your API keys
```
# Google Maps API key for map display
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Gmail credentials for contact form (optional)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_app_password_here
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Setting up Gmail App Password for Contact Form

To enable the contact form functionality, you need to create an app password for Gmail:

1. Go to your Google Account settings at [myaccount.google.com](https://myaccount.google.com/)
2. Navigate to Security > 2-Step Verification (enable if not already enabled)
3. At the bottom of the page, find "App passwords"
4. Select "Mail" as the app and "Other" as the device (you can name it "Brahma Kumaris Website")
5. Click "Generate" to get your 16-character app password
6. Copy this password (with no spaces) and add it to your `.env.local` file as `GMAIL_APP_PASSWORD`
7. Use your full Gmail address as the `GMAIL_USER` in the `.env.local` file

This method is much simpler than using OAuth and doesn't require setting up a Google Cloud project.

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
- [Nodemailer](https://nodemailer.com/) - For sending emails
- [TypeScript](https://www.typescriptlang.org/) - Type checking

## Project Structure

```
/app                   # Next.js app directory
  /api                 # API routes
    /send-email        # Email API endpoint
  /centers             # Centers directory (base URL)
    /[region]          # Region pages
      /[state]         # State pages
        /[district]    # District pages
          /[branchCode]# Individual center pages
/components            # Reusable components
/lib                   # Utility functions and data processing
/public                # Static assets
``` 

## Data Files

The application requires a `Center-Processed.json` file which contains all the center data. This file can be placed in either:

1. The project root directory (for development and processing)
2. The `public` directory (for production deployment)

The application will first check the `public` directory and then fall back to the root directory, using whichever file it finds first.

### Generating the Data File

To generate or update the centers data file:

1. Copy content from the API to `Centers_Raw.json`
2. Run `python3 compare_json_files.py`
3. Change madhuban concern to INDIA if needed
4. Run `node process-centers.js` to generate the processed file in the root directory

For production deployment, you may need to copy this file to the public directory:
```bash
cp Center-Processed.json public/
```




Local Run :

./build.sh local
npm run start-local