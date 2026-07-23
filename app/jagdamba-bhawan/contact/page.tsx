import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('jagdamba-bhawan', 'contact');
}

export const revalidate = 86400;

export default async function JagdambaBhawanContactPage() {
  const mod = await loadCampusPage('jagdamba-bhawan', 'contact');
  const Page = mod.default;
  return <Page />;
}
