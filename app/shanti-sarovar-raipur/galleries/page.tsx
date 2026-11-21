import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('shanti-sarovar-raipur', 'galleries');
}

export const revalidate = 86400;

export default async function ShantiSarovarRaipurGalleriesPage() {
  const mod = await loadCampusPage('shanti-sarovar-raipur', 'galleries');
  const Page = mod.default;
  return <Page />;
}
