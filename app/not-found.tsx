import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center">
      <h1 className="text-4xl font-bold mb-6 text-center">Page Not Found</h1>
      <p className="text-xl text-gray-600 mb-8 text-center">
        Sorry, the page you are looking for does not exist.
      </p>
      <div className="flex gap-4">
        <Link href="/" className="bg-primary text-white py-2 px-4 rounded-md hover:opacity-90 transition-opacity">
          Go to Home
        </Link>
        <Link href="/centers" className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors">
          Find Centers
        </Link>
      </div>
    </div>
  );
} 