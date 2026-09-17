import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('jagdamba-bhawan', 'events');
}

/** Keep in sync with EVENTS_REVALIDATE in jb-media-data (new events show within ~5 min). */
export const revalidate = 300;

export default async function JagdambaBhawanEventsPage() {
  const mod = await loadCampusPage('jagdamba-bhawan', 'events');
  const Page = mod.default;
  return <Page />;
}
