export const metadata = {
  title: "NaijaGrill CMS",
  robots: { index: false, follow: false },
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-screen">{children}</div>;
}
