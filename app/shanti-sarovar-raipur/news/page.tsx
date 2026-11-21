import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('shanti-sarovar-raipur', 'news');
}

export const revalidate = 14400;

export default async function ShantiSarovarRaipurNewsPage() {
  const mod = await loadCampusPage('shanti-sarovar-raipur', 'news');
  const Page = mod.default;
  return <Page />;
}
