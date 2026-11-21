import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('shanti-sarovar-raipur', 'home');
}

export const revalidate = 14400;

export default async function ShantiSarovarRaipurHomePage() {
  const mod = await loadCampusPage('shanti-sarovar-raipur', 'home');
  const Page = mod.default;
  return <Page />;
}
