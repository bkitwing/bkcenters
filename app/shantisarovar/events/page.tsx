import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('shantisarovar', 'events');
}

/** Keep in sync with EVENTS_REVALIDATE in ss-media-data (new events show within ~5 min). */
export const revalidate = 300;

export default async function ShantiSarovarEventsPage() {
  const mod = await loadCampusPage('shantisarovar', 'events');
  const Page = mod.default;
  return <Page />;
}
