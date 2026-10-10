import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('shanti-shikhar', 'news');
}

export const revalidate = 14400;

export default async function ShantiShikharNewsPage() {
  const mod = await loadCampusPage('shanti-shikhar', 'news');
  const Page = mod.default;
  return <Page />;
}
