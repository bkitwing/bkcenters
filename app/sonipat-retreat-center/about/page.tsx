import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('sonipat-retreat-center', 'about');
}

export const revalidate = 86400;

export default async function SonipatRetreatCenterAboutPage() {
  const mod = await loadCampusPage('sonipat-retreat-center', 'about');
  const Page = mod.default;
  return <Page />;
}
