import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import Header from "../components/Header";
import GoogleAnalytics from "../components/GoogleAnalytics";
import GlobalStickyBottomNav from "../components/GlobalStickyBottomNav";
import { OrganizationSchema, WebSiteSchema, DatasetSchema } from "../components/StructuredData";
import { getMetadataBase, generateOgImageUrl } from "@/lib/ogUtils";
// Lightweight Strapi queries — only fetch counts, not all 5612 centers
import { fetchCenterCount, fetchStatAndDistrictCounts } from "@/lib/strapiClient";
import Link from "next/link";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Footer } from "@/components/Footer";


const inter = Inter({ subsets: ["latin"] });

async function getHomeMetadata() {
  // 3 tiny API calls instead of loading all centers
  const [totalCenters, { stateCount: totalStates, districtCount: totalDistricts }] = await Promise.all([
    fetchCenterCount(),
    fetchStatAndDistrictCounts(),
  ]);
  
  return {
    totalCenters,
    totalStates,
    totalDistricts
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getHomeMetadata();
  const title = "Brahma Kumaris - Rajyog Meditation Center Locator";
  const description = `Find the nearest Brahma Kumaris Rajyog Meditation Center. ${stats.totalCenters} centers across ${stats.totalStates} states and ${stats.totalDistricts} districts in India & Nepal. Free meditation classes available.`;

  return {
    metadataBase: getMetadataBase(),
    title,
    description,
    keywords: `Brahma Kumaris, meditation, center locator, ${stats.totalCenters} meditation centers, ${stats.totalStates} states, ${stats.totalDistricts} districts, Nearby Meditation Centers, Brahma Kumaris Rajyog Meditation Centers, Learn Meditation, Om Shanti, Seva Kendra, 7 day courses, meditation retreats, India, Nepal`,
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: 'https://www.brahmakumaris.com/centers',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: 'https://www.brahmakumaris.com/centers',
      siteName: 'Brahma Kumaris Centers',
      title,
      description,
      images: [
        {
          url: generateOgImageUrl({
            title: 'Brahma Kumaris Centers',
            description: `${stats.totalCenters} Centers in ${stats.totalStates} States/UTs & ${stats.totalDistricts} Districts`,
            type: 'home'
          }),
          width: 1200,
          height: 630,
          alt: 'Brahma Kumaris Centers',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [generateOgImageUrl({
        title: 'Brahma Kumaris Centers',
        description: `${stats.totalCenters} Centers in ${stats.totalStates} States/UTs & ${stats.totalDistricts} Districts`,
        type: 'home'
      })],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { totalCenters } = await getHomeMetadata();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="anonymous" />
        <OrganizationSchema />
        <WebSiteSchema />
        <DatasetSchema totalCenters={totalCenters} />
      </head>
      <body className={`${inter.className} bg-neutral-50 dark:bg-neutral-900 transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
          <Suspense fallback={null}>
            <GoogleAnalytics />
          </Suspense>
          <Header />
          <main>{children}</main>
          <GlobalStickyBottomNav />
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
