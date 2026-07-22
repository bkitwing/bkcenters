import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('shantisarovar', 'home');
}

export const revalidate = 3600;

export default async function ShantiSarovarHomePage() {
  const mod = await loadCampusPage('shantisarovar', 'home');
  const Page = mod.default;
  return <Page />;
}
