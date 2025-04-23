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
      <body className={`${inter.className} bg-neutral-50`}>
        <header className="bg-light shadow-md border-b border-neutral-200">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <a href="/" className="flex items-center">
              <h1 className="text-2xl font-bold spiritual-text-gradient">Brahma Kumaris</h1>
              <span className="ml-2 text-neutral-600">Center Locator</span>
            </a>
            <nav>
              <ul className="flex space-x-6">
                <li><a href="/" className="text-neutral-700 hover:text-primary transition-colors">Home</a></li>
                <li><a href="/centers" className="text-neutral-700 hover:text-primary transition-colors">Centers</a></li>
              </ul>
            </nav>
          </div>
        </header>
        <main>{children}</main>
        <footer className="bg-spirit-purple-50 mt-8 border-t border-spirit-purple-100">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-neutral-600">
              <p>© {new Date().getFullYear()} Brahma Kumaris. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
