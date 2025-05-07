import { Metadata } from 'next';

interface SearchPageProps {
  searchParams: { q?: string };
}

// Return empty metadata to use default from layout
export async function generateMetadata(): Promise<Metadata> {
  return {};
} 