import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('sonipat-retreat-center', 'news');
}

export const revalidate = 14400;

export default async function SonipatRetreatCenterNewsPage() {
  const mod = await loadCampusPage('sonipat-retreat-center', 'news');
  const Page = mod.default;
  return <Page />;
}
