import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('sonipat-retreat-center', 'contact');
}

export const revalidate = 86400;

export default async function SonipatRetreatCenterContactPage() {
  const mod = await loadCampusPage('sonipat-retreat-center', 'contact');
  const Page = mod.default;
  return <Page />;
}
