import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('shanti-shikhar', 'home');
}

export const revalidate = 14400;

export default async function ShantiShikharHomePage() {
  const mod = await loadCampusPage('shanti-shikhar', 'home');
  const Page = mod.default;
  return <Page />;
}
