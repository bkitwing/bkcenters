import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-spirit-purple-800">Find a Brahma Kumaris Meditation Center Near You</h1>
        <p className="text-xl text-neutral-600 mb-8">
          Explore over 6,000 centers across India and find your path to inner peace
        </p>
        <Link href="/centers" className="btn-primary">
          Find Centers
        </Link>
      </section>
      
      <section className="bg-spirit-blue-50 p-8 rounded-lg mb-12 border border-spirit-blue-100">
        <h2 className="text-2xl font-semibold mb-4 text-spirit-blue-700">Search by Location</h2>
        <p className="mb-4 text-neutral-700">Enter your location to find the nearest Brahma Kumaris center:</p>
        <div className="flex justify-center">
          <Link href="/centers" className="btn-secondary">
            Go to Search
          </Link>
        </div>
      </section>
      
      <section className="grid md:grid-cols-2 gap-8 mb-12">
        <div className="card border-spirit-purple-200">
          <h3 className="text-xl font-semibold mb-3 text-primary">About Brahma Kumaris</h3>
          <p className="text-neutral-600">
            Brahma Kumaris is a spiritual movement dedicated to personal transformation and world renewal.
            Founded in India in 1937, we bring a spiritual dimension to the work of individuals, communities,
            and organizations.
          </p>
        </div>
        <div className="card border-spirit-teal-200">
          <h3 className="text-xl font-semibold mb-3 text-spirit-teal-600">Our Centers</h3>
          <p className="text-neutral-600">
            With over 6,000 centers across India, we offer a welcoming environment for meditation, 
            spiritual study, and self-development. Our centers are open to people of all backgrounds 
            and beliefs.
          </p>
        </div>
      </section>
      
      <section className="text-center mb-12">
        <div className="spiritual-gradient h-1 w-32 mx-auto mb-8 rounded-full"></div>
        <h2 className="text-3xl font-bold mb-4 text-spirit-gold-600">Begin Your Spiritual Journey</h2>
        <p className="text-xl text-neutral-600 mb-6">
          Discover inner peace and spiritual growth with Brahma Kumaris
        </p>
        <Link href="/centers" className="btn-accent">
          Find a Center Today
        </Link>
      </section>
    </div>
  );
}
