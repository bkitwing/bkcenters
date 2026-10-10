import { loadCampusLayout } from '@/lib/campuses/pages';

export const revalidate = 86400;

export default async function ShantiShikharLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mod = await loadCampusLayout('shanti-shikhar');
  const Layout = mod.default;
  return <Layout>{children}</Layout>;
}
