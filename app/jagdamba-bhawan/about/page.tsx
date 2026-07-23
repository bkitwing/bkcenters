import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('jagdamba-bhawan', 'about');
}

export const revalidate = 86400;

export default async function JagdambaBhawanAboutAppPage() {
  const mod = await loadCampusPage('jagdamba-bhawan', 'about');
  const Page = mod.default;
  return <Page />;
}
