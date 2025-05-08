import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "../components/Header";
import { getMetadataBase, generateOgImageUrl } from "@/lib/ogUtils";
import { getAllCenters, getStatesSummary } from "@/lib/centerData";

const inter = Inter({ subsets: ["latin"] });

async function getHomeMetadata() {
  // Get all centers and state summary
  const allCenters = await getAllCenters();
  const statesSummary = await getStatesSummary();
  
  // Count total centers
  const totalCenters = allCenters.length;
  
  // Count unique states/UTs
  const uniqueStates = new Set(allCenters.map(center => center.state));
  const totalStates = uniqueStates.size;
  
  // Count total districts from state summary
  const totalDistricts = statesSummary.reduce((sum, state) => sum + state.districtCount, 0);
  
  return {
    totalCenters,
    totalStates,
    totalDistricts
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const stats = await getHomeMetadata();
  const title = "Brahma Kumaris - Rajyog Meditation Center Locator";
  const description = `Find the nearest Brahma Kumaris meditation center in your area across India. ${stats.totalCenters} centers in ${stats.totalStates} States/UTs and ${stats.totalDistricts} Districts.`;

  return {
    metadataBase: getMetadataBase(),
    title,
    description,
    keywords:
      "Brahma Kumaris, meditation, center locator, Nearby Meditation Centers, Brahma Kumaris Rajyog Meditation Centers, Learn Meditation, Om Shanti, Seva Kendra, 7 day courses, meditation retreats",
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
      images: ['/centers/brahma-kumaris-logo.webp'],
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-neutral-50`}>
        <Header />
        <main>{children}</main>
        <footer className="bg-spirit-purple-50 mt-8 border-t border-spirit-purple-100">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-neutral-600">
              <p>
                © {new Date().getFullYear()} Brahma Kumaris. All rights
                reserved.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
