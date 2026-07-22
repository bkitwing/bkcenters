import { loadCampusLayout } from '@/lib/campuses/pages';

export const revalidate = 86400;

export default async function ShantiSarovarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mod = await loadCampusLayout('shantisarovar');
  const Layout = mod.default;
  return <Layout>{children}</Layout>;
}
