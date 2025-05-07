import { Metadata } from 'next';

interface LocationPageProps {
  searchParams: { location?: string };
}

// Return empty metadata to use default from layout
export async function generateMetadata(): Promise<Metadata> {
  return {};
} 