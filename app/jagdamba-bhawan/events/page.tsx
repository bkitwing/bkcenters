import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('jagdamba-bhawan', 'events');
}

export const revalidate = 14400;

export default async function ShantiSarovarEventsPage() {
  const mod = await loadCampusPage('jagdamba-bhawan', 'events');
  const Page = mod.default;
  return <Page />;
}
