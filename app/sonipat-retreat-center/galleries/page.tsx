import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('sonipat-retreat-center', 'galleries');
}

export const revalidate = 86400;

export default async function SonipatRetreatCenterGalleriesPage() {
  const mod = await loadCampusPage('sonipat-retreat-center', 'galleries');
  const Page = mod.default;
  return <Page />;
}
