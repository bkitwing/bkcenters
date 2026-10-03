import { loadCampusLayout } from '@/lib/campuses/pages';

export const revalidate = 86400;

export default async function SonipatRetreatCenterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mod = await loadCampusLayout('sonipat-retreat-center');
  const Layout = mod.default;
  return <Layout>{children}</Layout>;
}
