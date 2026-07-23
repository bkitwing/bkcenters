import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('jagdamba-bhawan', 'galleries');
}

export const revalidate = 86400;

export default async function ShantiSarovarGalleriesPage() {
  const mod = await loadCampusPage('jagdamba-bhawan', 'galleries');
  const Page = mod.default;
  return <Page />;
}
