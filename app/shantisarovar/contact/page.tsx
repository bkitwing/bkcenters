import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('shantisarovar', 'contact');
}

export const revalidate = 3600;

export default async function ShantiSarovarContactPage() {
  const mod = await loadCampusPage('shantisarovar', 'contact');
  const Page = mod.default;
  return <Page />;
}
