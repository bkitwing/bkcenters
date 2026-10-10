import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('shanti-shikhar', 'contact');
}

export const revalidate = 86400;

export default async function ShantiShikharContactPage() {
  const mod = await loadCampusPage('shanti-shikhar', 'contact');
  const Page = mod.default;
  return <Page />;
}
