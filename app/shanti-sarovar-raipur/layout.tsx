import { loadCampusLayout } from '@/lib/campuses/pages';

export const revalidate = 86400;

export default async function ShantiSarovarRaipurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mod = await loadCampusLayout('shanti-sarovar-raipur');
  const Layout = mod.default;
  return <Layout>{children}</Layout>;
}
