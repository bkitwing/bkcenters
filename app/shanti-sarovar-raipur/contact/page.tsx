import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('shanti-sarovar-raipur', 'contact');
}

export const revalidate = 86400;

export default async function ShantiSarovarRaipurContactPage() {
  const mod = await loadCampusPage('shanti-sarovar-raipur', 'contact');
  const Page = mod.default;
  return <Page />;
}
