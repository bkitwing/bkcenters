import { campusPageMetadata, loadCampusPage } from '@/lib/campuses/pages';

export async function generateMetadata() {
  return campusPageMetadata('shantisarovar', 'csr');
}

export const revalidate = 86400;

export default async function ShantiSarovarCsrRoutePage() {
  const mod = await loadCampusPage('shantisarovar', 'csr');
  const Page = mod.default;
  return <Page />;
}
