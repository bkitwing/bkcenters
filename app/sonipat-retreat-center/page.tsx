import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('sonipat-retreat-center', 'home');
}

export const revalidate = 14400;

export default async function SonipatRetreatCenterHomePage() {
  const mod = await loadCampusPage('sonipat-retreat-center', 'home');
  const Page = mod.default;
  return <Page />;
}
