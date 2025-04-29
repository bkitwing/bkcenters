'use client';

interface DirectionsLinkProps {
  url: string;
}

const DirectionsLink: React.FC<DirectionsLinkProps> = ({ url }) => {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-spirit-purple-600 text-white px-3 py-2 rounded-md text-sm hover:bg-spirit-purple-700 transition-colors flex items-center w-fit"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      </svg>
      Get Directions
    </a>
  );
};

export default DirectionsLink; 