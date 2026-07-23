import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('jagdamba-bhawan', 'home');
}

export const revalidate = 14400;

export default async function JagdambaBhawanHomePage() {
  const mod = await loadCampusPage('jagdamba-bhawan', 'home');
  const Page = mod.default;
  return <Page />;
}
