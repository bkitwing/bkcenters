import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Brahma Kumaris Meditation Center Locator',
  description: 'Find the nearest Brahma Kumaris meditation center in your area across India',
  keywords: 'Brahma Kumaris, meditation, center locator, spiritual centers, India',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-white shadow-md">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <a href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-primary">Brahma Kumaris</h1>
              <span className="ml-2 text-gray-600">Center Locator</span>
            </a>
            <nav>
              <ul className="flex space-x-6">
                <li><a href="/" className="text-gray-700 hover:text-primary">Home</a></li>
                <li><a href="/centers" className="text-gray-700 hover:text-primary">Centers</a></li>
              </ul>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="bg-gray-100 mt-8">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-gray-600">
              <p>© {new Date().getFullYear()} Brahma Kumaris. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
