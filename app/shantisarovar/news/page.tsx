import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('shantisarovar', 'news');
}

export const revalidate = 14400;

export default async function ShantiSarovarNewsPage() {
  const mod = await loadCampusPage('shantisarovar', 'news');
  const Page = mod.default;
  return <Page />;
}
