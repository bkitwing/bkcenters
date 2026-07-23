import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('jagdamba-bhawan', 'news');
}

export const revalidate = 14400;

export default async function ShantiSarovarNewsPage() {
  const mod = await loadCampusPage('jagdamba-bhawan', 'news');
  const Page = mod.default;
  return <Page />;
}
