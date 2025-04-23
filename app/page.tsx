import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Find a Brahma Kumaris Meditation Center Near You</h1>
        <p className="text-xl text-gray-600 mb-8">
          Explore over 6,000 centers across India and find your path to inner peace
        </p>
        <Link href="/centers" className="btn-primary">
          Find Centers
        </Link>
      </section>
      
      <section className="bg-gray-50 p-8 rounded-lg mb-12">
        <h2 className="text-2xl font-semibold mb-4">Search by Location</h2>
        <p className="mb-4">Enter your location to find the nearest Brahma Kumaris center:</p>
        <div className="flex justify-center">
          <Link href="/centers" className="btn-primary">
            Go to Search
          </Link>
        </div>
      </section>
      
      <section className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="card">
          <h3 className="text-xl font-semibold mb-3">About Brahma Kumaris</h3>
          <p className="text-gray-600">
            Brahma Kumaris is a spiritual movement dedicated to personal transformation and world renewal.
            Founded in India in 1937, we bring a spiritual dimension to the work of individuals, communities,
            and organizations.
          </p>
        </div>
        <div className="card">
          <h3 className="text-xl font-semibold mb-3">Our Centers</h3>
          <p className="text-gray-600">
            With over 6,000 centers across India, we offer a welcoming environment for meditation, 
            spiritual study, and self-development. Our centers are open to people of all backgrounds 
            and beliefs.
          </p>
        </div>
      </section>
    </div>
  );
}
