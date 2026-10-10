import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('shanti-shikhar', 'galleries');
}

export const revalidate = 86400;

export default async function ShantiShikharGalleriesPage() {
  const mod = await loadCampusPage('shanti-shikhar', 'galleries');
  const Page = mod.default;
  return <Page />;
}
