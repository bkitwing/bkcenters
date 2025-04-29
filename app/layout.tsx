import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "../components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Brahma Kumaris - Rajyog Meditation Center Locator",
  description:
    "Find the nearest Brahma Kumaris meditation center in your area across India",
  keywords:
    "Brahma Kumaris, meditation, center locator, Nearby Meditation Centers, Brahma Kumaris Rajyog Meditation Centers, Learn Meditation, Om Shanti, Seva Kendra, 7 day courses, meditation retreats",
};

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
