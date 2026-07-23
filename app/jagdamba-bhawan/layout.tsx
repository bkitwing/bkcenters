import { loadCampusLayout } from '@/lib/campuses/pages';

export const revalidate = 86400;

export default async function JagdambaBhawanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mod = await loadCampusLayout('jagdamba-bhawan');
  const Layout = mod.default;
  return <Layout>{children}</Layout>;
}
